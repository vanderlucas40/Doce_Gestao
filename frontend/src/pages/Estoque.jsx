import { useState }                                          from 'react'
import { useStore }                                          from '../hooks/useStore'
import { useFetch }                                          from '../hooks/useFetch'
import { inventoryApi, productionApi }                       from '../api'
import { Icon, Modal, Toast, StatusBadge, StockBar, useToast, fmtBRL, fmtQty, fmtDate, fmtTime } from '../components/ui'

const REASONS = ['Entrada de Produção', 'Venda Manual', 'Avaria / Perda', 'Inventário Periódico']

export function Estoque() {
  const { currentStore }           = useStore()
  const storeId                    = currentStore?.id
  const { toast, show: showToast } = useToast()

  const [tab,      setTab]      = useState('products')
  const [search,   setSearch]   = useState('')
  const [editItem, setEditItem] = useState(null)
  const [editQty,  setEditQty]  = useState('')
  const [editMax,  setEditMax]  = useState('')
  const [editReason, setEditReason] = useState(REASONS[0])
  const [submitting, setSubmitting] = useState(false)

  const { data: inventory,   loading: l1, refetch: r1 } = useFetch(() => inventoryApi.listByStore(storeId),   [storeId], { enabled: !!storeId })
  const { data: ingredients, loading: l2, refetch: r2 } = useFetch(() => inventoryApi.listIngredients(storeId), [storeId], { enabled: !!storeId })
  const { data: batches } = useFetch(() => productionApi.list(storeId), [storeId], { enabled: !!storeId })

  function openEdit(item, type) {
    setEditItem({ ...item, _type: type })
    // Sem toFixed(1): abrir e salvar sem mexer arredondava 1,05 para 1,1 (DEF-16)
    setEditQty(String(type === 'product' ? item.quantity : Number(item.quantity)))
    setEditMax(String(item.maxQuantity || ''))
    setEditReason(REASONS[0])
  }

  async function handleSave() {
    setSubmitting(true)
    try {
      if (editItem._type === 'product') {
        await inventoryApi.update(storeId, editItem.productId, {
          quantity: parseInt(editQty), maxQuantity: parseInt(editMax) || editItem.maxQuantity,
          reason: editReason,
        })
        r1()
      } else {
        await inventoryApi.updateIngredient(storeId, editItem.ingredientId, { quantity: parseFloat(editQty), reason: editReason })
        r2()
      }
      showToast('Estoque atualizado!')
      setEditItem(null)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!storeId)     return <PageState icon="store" msg="Selecione uma loja para ver o estoque." />
  if (l1 || l2)     return <PageState spinner msg="Carregando estoque..." />

  const totalItems = (inventory || []).reduce((s, i) => s + i.quantity, 0)
  const lowCount   = (inventory || []).filter(i => i.status !== 'OK').length
                   + (ingredients || []).filter(i => i.belowMinimum).length

  const filteredInv  = (inventory   || []).filter(i => i.productName?.toLowerCase().includes(search.toLowerCase()))
  const filteredIngr = (ingredients || []).filter(i => i.ingredientName?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="pt-20 pb-28 md:pt-8 md:pb-8 md:pl-72 px-6 md:px-12 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-6 md:pt-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Gerenciamento</span>
          <h2 className="text-3xl font-serif text-on-surface mt-1">Controle de Estoque</h2>
        </div>
        <div className="flex gap-4">
          <StatChip icon="inventory_2" bg="bg-secondary-container text-on-secondary-container" label="Total Itens" value={totalItems} />
          <StatChip icon="warning"     bg="bg-error-container text-on-error-container"         label="Em Falta"   value={lowCount} />
        </div>
      </div>

      {/* Tabs + Busca */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex p-1 bg-surface-container rounded-2xl w-full md:w-auto">
          {[['products','Produtos Acabados'],['ingredients','Insumos e Matéria-Prima']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === key
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface font-medium'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar no estoque..."
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tab === 'products'
          ? filteredInv.length
            ? filteredInv.map(item => <ProductStockCard key={item.inventoryId} item={item} onEdit={() => openEdit(item, 'product')} />)
            : <Empty msg="Nenhum produto encontrado" />
          : filteredIngr.length
            ? filteredIngr.map(item => <IngredientCard key={item.stockId} item={item} onEdit={() => openEdit(item, 'ingredient')} />)
            : <Empty msg="Nenhum insumo encontrado" />
        }
      </div>

      {/* Últimas fornadas da loja (antes: cronograma fictício fixo no código — DEF-21) */}
      <section className="mt-16">
        <h3 className="text-2xl font-serif mb-8">Últimas Fornadas</h3>
        {!(batches || []).length ? (
          <p className="text-sm text-on-surface-variant">Nenhuma fornada registrada nesta loja.</p>
        ) : (
          <div className="relative pl-8 space-y-10">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-secondary-fixed-dim" />
            {(batches || []).slice(0, 3).map(b => (
              <div key={b.id} className="relative">
                <div className="absolute -left-[30px] top-1 w-5 h-5 rounded-full bg-secondary border-4 border-background" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-secondary">Concluída</span>
                    <h4 className="text-lg font-bold text-on-surface mt-0.5">Fornada #{b.id} — {b.totalItems} {b.totalItems === 1 ? 'unidade' : 'unidades'}</h4>
                    <p className="text-sm text-on-surface-variant">
                      {(b.items || []).map(it => `${it.productName} +${it.quantity}`).join(' · ')}
                    </p>
                  </div>
                  <span className="text-xs text-on-surface-variant ml-4 whitespace-nowrap">
                    {fmtDate(b.producedAt)} {fmtTime(b.producedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de ajuste */}
      {editItem && (
        <Modal onClose={() => !submitting && setEditItem(null)} maxWidth="max-w-md">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-serif">Ajustar Estoque</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {editItem.productName || editItem.ingredientName}
              </p>
            </div>
            <button onClick={() => setEditItem(null)} className="text-on-surface-variant hover:text-primary transition-colors">
              <Icon name="close" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Quantidade Atual
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditQty(q => String(Math.max(0, Number(q) - 1)))}
                  className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors"
                >
                  <Icon name="remove" />
                </button>
                <input
                  type="number" min="0" value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  className="flex-1 text-center text-2xl font-bold bg-surface-container-low border-none rounded-xl py-3 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <button
                  onClick={() => setEditQty(q => String(Number(q) + 1))}
                  className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors"
                >
                  <Icon name="add" />
                </button>
              </div>
            </div>

            {editItem._type === 'product' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                  Capacidade Máxima
                </label>
                <input
                  type="number" min="0" value={editMax}
                  onChange={e => setEditMax(e.target.value)}
                  className="w-full text-center text-xl font-semibold bg-surface-container-low border-none rounded-xl py-3 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Motivo do Ajuste
              </label>
              {/* O motivo é gravado no histórico de movimentações (stock_movements) */}
              <select value={editReason} onChange={e => setEditReason(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20">
                {REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setEditItem(null)} disabled={submitting}
              className="flex-1 py-4 px-6 rounded-2xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave} disabled={submitting}
              className={`flex-1 py-4 px-6 rounded-2xl text-white font-bold transition-all ${
                submitting
                  ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                  : 'bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/20 hover:opacity-90'
              }`}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  )
}

// ── Product Stock Card ────────────────────────────────────────
function ProductStockCard({ item, onEdit }) {
  return (
    <div className="bg-surface-container-low p-5 rounded-3xl transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="flex gap-4 mb-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-fixed to-surface-container-high flex items-center justify-center flex-shrink-0">
          <Icon name="cake" fill className="text-primary opacity-40" style={{ fontSize: '40px' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-serif text-base leading-tight">{item.productName}</h3>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-on-surface-variant mt-1">{fmtBRL(item.productPrice)}</p>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase">QTD Atual</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${item.status === 'OUT' ? 'text-error' : item.status === 'LOW' ? 'text-on-tertiary-fixed-variant' : 'text-on-surface'}`}>
              {item.quantity}
            </span>
            <span className="text-xs text-on-surface-variant">unid.</span>
          </div>
        </div>
        <button onClick={onEdit} className="bg-surface-container-highest hover:bg-primary hover:text-white transition-all p-3 rounded-2xl flex items-center gap-2 text-on-surface-variant">
          <Icon name="edit" className="text-sm" />
          <span className="text-xs font-bold uppercase tracking-tighter">Ajustar</span>
        </button>
      </div>
      <StockBar quantity={item.quantity} maxQuantity={item.maxQuantity} className="mt-4" />
    </div>
  )
}

// ── Ingredient Card ───────────────────────────────────────────
function IngredientCard({ item, onEdit }) {
  return (
    <div className="bg-surface-container-low p-5 rounded-3xl transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="flex gap-4 mb-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary-container to-surface-container-high flex items-center justify-center flex-shrink-0">
          <Icon name="grocery" fill className="text-secondary opacity-40" style={{ fontSize: '40px' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-serif text-base leading-tight">{item.ingredientName}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap ${
              item.belowMinimum
                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                : 'bg-secondary-container text-on-secondary-container'
            }`}>
              {item.belowMinimum ? 'Repor' : 'Estável'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Mín: {fmtQty(item.minQuantity)} {item.unit}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase">QTD Atual</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${item.belowMinimum ? 'text-error' : 'text-on-surface'}`}>
              {fmtQty(item.quantity)}
            </span>
            <span className="text-xs text-on-surface-variant">{item.unit}</span>
          </div>
        </div>
        <button onClick={onEdit} className="bg-surface-container-highest hover:bg-primary hover:text-white transition-all p-3 rounded-2xl flex items-center gap-2 text-on-surface-variant">
          <Icon name="edit" className="text-sm" />
          <span className="text-xs font-bold uppercase tracking-tighter">Ajustar</span>
        </button>
      </div>
      <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div className={`h-full ${item.belowMinimum ? 'bg-error' : 'bg-secondary'} rounded-full`}
          style={{ width: `${Math.min(100, item.minQuantity > 0 ? Math.round((Number(item.quantity) / Number(item.minQuantity)) * 50) : 100)}%` }}
        />
      </div>
    </div>
  )
}

// ── Auxiliares ────────────────────────────────────────────────
function StatChip({ icon, bg, label, value }) {
  return (
    <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 min-w-[140px]">
      <div className={`p-2 rounded-lg ${bg}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant opacity-70 uppercase">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  )
}

function Empty({ msg }) {
  return <p className="col-span-3 text-center py-12 text-on-surface-variant text-sm">{msg}</p>
}

function PageState({ spinner, icon, msg, action, actionLabel }) {
  return (
    <div className="pt-20 md:pl-72 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant text-center px-8">
        {spinner
          ? <div className="w-10 h-10 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
          : <Icon name={icon} className="text-5xl text-outline" />}
        <p className="text-sm">{msg}</p>
        {action && <button onClick={action} className="px-6 py-2 border border-outline-variant rounded-xl text-sm hover:bg-surface-container">{actionLabel}</button>}
      </div>
    </div>
  )
}
