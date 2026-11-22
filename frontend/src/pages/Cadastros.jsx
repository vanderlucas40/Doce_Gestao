import { useState }                                              from 'react'
import { useFetch }                                              from '../hooks/useFetch'
import { productsApi, ingredientsApi, recipeApi }               from '../api'
import { Icon, Card, Modal, Toast, useToast, fmtBRL, fmtQty }           from '../components/ui'

export function Cadastros() {
  const { toast, show: showToast } = useToast()
  const [tab, setTab] = useState('products')   // 'products' | 'ingredients'

  // ── Dados ─────────────────────────────────────────────────────
  const { data: products,    loading: lp, refetch: rp } = useFetch(() => productsApi.list(),    [])
  const { data: ingredients, loading: li, refetch: ri } = useFetch(() => ingredientsApi.list(), [])

  // ── Product modal ─────────────────────────────────────────────
  const [productModal,    setProductModal]    = useState(null)  // null | 'new' | {id,...}
  const [ingredientModal, setIngredientModal] = useState(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [confirmDeact,    setConfirmDeact]    = useState(null)

  // ── Ficha Técnica: qual produto está aberto ───────────────────
  const [recipeProduct, setRecipeProduct] = useState(null) // produto com ficha aberta

  const blankProduct    = { name: '', description: '', price: '' }
  const blankIngredient = { name: '', unit: 'kg', minQuantity: '' }
  const [pForm, setPForm] = useState(blankProduct)
  const [iForm, setIForm] = useState(blankIngredient)

  function openProduct(item = null) {
    setPForm(item
      ? { name: item.name, description: item.description || '', price: String(item.price) }
      : blankProduct)
    setProductModal(item || 'new')
  }
  function openIngredient(item = null) {
    setIForm(item
      ? { name: item.name, unit: item.unit, minQuantity: String(item.minQuantity) }
      : blankIngredient)
    setIngredientModal(item || 'new')
  }

  async function saveProduct(e) {
    e.preventDefault(); setSubmitting(true)
    try {
      const payload = { name: pForm.name, description: pForm.description, price: Number(pForm.price) }
      if (productModal === 'new') { await productsApi.create(payload); showToast('Produto criado!') }
      else { await productsApi.update(productModal.id, payload); showToast('Produto atualizado!') }
      setProductModal(null); rp()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSubmitting(false) }
  }

  async function saveIngredient(e) {
    e.preventDefault(); setSubmitting(true)
    try {
      const payload = { name: iForm.name, unit: iForm.unit, minQuantity: Number(iForm.minQuantity) }
      if (ingredientModal === 'new') { await ingredientsApi.create(payload); showToast('Insumo criado!') }
      else { await ingredientsApi.update(ingredientModal.id, payload); showToast('Insumo atualizado!') }
      setIngredientModal(null); ri()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSubmitting(false) }
  }

  async function handleDeactivate() {
    if (!confirmDeact) return; setSubmitting(true)
    try {
      if (confirmDeact.type === 'product') await productsApi.deactivate(confirmDeact.id)
      else await ingredientsApi.deactivate(confirmDeact.id)
      showToast(`"${confirmDeact.name}" desativado.`)
      setConfirmDeact(null)
      confirmDeact.type === 'product' ? rp() : ri()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="pt-20 pb-28 md:pt-8 md:pb-8 md:pl-72 px-6 md:px-12 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 md:pt-8 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Administração</span>
          <h2 className="text-3xl font-serif text-on-surface mt-1">Cadastros</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Gerencie produtos, insumos e fichas técnicas para a produção.
          </p>
        </div>
        <button
          onClick={() => tab === 'products' ? openProduct() : openIngredient()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all self-start">
          <Icon name="add" />
          {tab === 'products' ? 'Novo Produto' : 'Novo Insumo'}
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex p-1 bg-surface-container rounded-2xl w-full md:w-auto mb-8">
        {[['products','Produtos'],['ingredients','Insumos']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-6 py-2 rounded-xl text-sm font-bold flex-1 md:flex-none transition-all ${
              tab === key
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Grid de cards ──────────────────────────────────── */}
      {tab === 'products' ? (
        lp ? <GridLoader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(products || []).map(p => (
              <ProductCatalogCard key={p.id} item={p}
                onEdit={() => openProduct(p)}
                onDeact={() => setConfirmDeact({ type: 'product', id: p.id, name: p.name })}
                onRecipe={() => setRecipeProduct(p)}
              />
            ))}
            <AddCard label="Novo Produto" onClick={() => openProduct()} />
          </div>
        )
      ) : (
        li ? <GridLoader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(ingredients || []).map(i => (
              <IngredientCatalogCard key={i.id} item={i}
                onEdit={() => openIngredient(i)}
                onDeact={() => setConfirmDeact({ type: 'ingredient', id: i.id, name: i.name })}
              />
            ))}
            <AddCard label="Novo Insumo" onClick={() => openIngredient()} />
          </div>
        )
      )}

      {/* ── Modal: Produto ─────────────────────────────────── */}
      {productModal && (
        <Modal onClose={() => !submitting && setProductModal(null)} maxWidth="max-w-md">
          <button onClick={() => setProductModal(null)} className="absolute top-5 right-5 text-on-surface-variant hover:text-primary"><Icon name="close" /></button>
          <h3 className="font-serif text-2xl text-primary mb-1">{productModal === 'new' ? 'Novo Produto' : 'Editar Produto'}</h3>
          <p className="text-sm text-on-surface-variant mb-6">{productModal === 'new' ? 'Preencha os dados do produto.' : `Editando: ${productModal.name}`}</p>
          <form onSubmit={saveProduct} className="space-y-4">
            <Field label="Nome *"><input required placeholder="ex: Bolo de Chocolate Belga" value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></Field>
            <Field label="Descrição"><input placeholder="ex: Massa fofinha com ganache" value={pForm.description} onChange={e => setPForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
            <Field label="Preço (R$) *"><input required type="number" step="0.01" min="0.01" placeholder="0,00" value={pForm.price} onChange={e => setPForm(f => ({ ...f, price: e.target.value }))} className={inputCls} /></Field>
            <ModalActions onCancel={() => setProductModal(null)} submitting={submitting} label={productModal === 'new' ? 'Criar Produto' : 'Salvar'} />
          </form>
        </Modal>
      )}

      {/* ── Modal: Insumo ──────────────────────────────────── */}
      {ingredientModal && (
        <Modal onClose={() => !submitting && setIngredientModal(null)} maxWidth="max-w-md">
          <button onClick={() => setIngredientModal(null)} className="absolute top-5 right-5 text-on-surface-variant hover:text-primary"><Icon name="close" /></button>
          <h3 className="font-serif text-2xl text-primary mb-1">{ingredientModal === 'new' ? 'Novo Insumo' : 'Editar Insumo'}</h3>
          <p className="text-sm text-on-surface-variant mb-6">{ingredientModal === 'new' ? 'Cadastre um insumo ou matéria-prima.' : `Editando: ${ingredientModal.name}`}</p>
          <form onSubmit={saveIngredient} className="space-y-4">
            <Field label="Nome *"><input required placeholder="ex: Farinha de Trigo Especial" value={iForm.name} onChange={e => setIForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Unidade *">
                <select required value={iForm.unit} onChange={e => setIForm(f => ({ ...f, unit: e.target.value }))} className={inputCls}>
                  {['kg','g','litro','ml','lata','dúzia','unidade','saco','caixa'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Qtd. mínima *"><input required type="number" step="0.01" min="0" value={iForm.minQuantity} onChange={e => setIForm(f => ({ ...f, minQuantity: e.target.value }))} className={inputCls} /></Field>
            </div>
            <ModalActions onCancel={() => setIngredientModal(null)} submitting={submitting} label={ingredientModal === 'new' ? 'Criar Insumo' : 'Salvar'} />
          </form>
        </Modal>
      )}

      {/* ── Modal: Confirmar desativação ────────────────────── */}
      {confirmDeact && (
        <Modal onClose={() => !submitting && setConfirmDeact(null)} maxWidth="max-w-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center">
              <Icon name="warning" fill className="text-error text-3xl" />
            </div>
            <div>
              <h3 className="font-serif text-xl">Desativar item?</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                <strong>"{confirmDeact.name}"</strong> não aparecerá mais no sistema,
                mas o histórico será preservado.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDeact(null)} disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors">Cancelar</button>
              <button onClick={handleDeactivate} disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-error text-white font-bold text-sm hover:opacity-90">
                {submitting ? 'Desativando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Ficha Técnica ────────────────────────────── */}
      {recipeProduct && (
        <RecipeModal
          product={recipeProduct}
          ingredients={ingredients || []}
          onClose={() => setRecipeProduct(null)}
          showToast={showToast}
        />
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Modal de Ficha Técnica (Recipe)
// ─────────────────────────────────────────────────────────────
function RecipeModal({ product, ingredients, onClose, showToast }) {
  const { data: recipe, loading, refetch } = useFetch(
    () => recipeApi.findByProduct(product.id), [product.id]
  )

  const [form,       setForm]       = useState({ ingredientId: '', quantity: '', unit: 'kg' })
  const [submitting, setSubmitting] = useState(false)
  const [deleting,   setDeleting]   = useState(null)

  // Insumos ainda não na ficha técnica
  const usedIds     = new Set((recipe || []).map(r => r.ingredientId))
  const available   = ingredients.filter(i => i.active && !usedIds.has(i.id))
  const selectedIng = ingredients.find(i => i.id === Number(form.ingredientId))

  // Preencher unidade automaticamente ao selecionar insumo
  function handleIngredientChange(e) {
    const id  = e.target.value
    const ing = ingredients.find(i => i.id === Number(id))
    setForm(f => ({ ...f, ingredientId: id, unit: ing?.unit || f.unit }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.ingredientId || !form.quantity) return
    setSubmitting(true)
    try {
      await recipeApi.upsert(product.id, Number(form.ingredientId), {
        ingredientId: Number(form.ingredientId),
        quantity:     Number(form.quantity),
        unit:         form.unit,
      })
      showToast('Ingrediente adicionado à ficha técnica!')
      setForm({ ingredientId: '', quantity: '', unit: 'kg' })
      refetch()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(recipeItemId, name) {
    setDeleting(recipeItemId)
    try {
      await recipeApi.delete(product.id, recipeItemId)
      showToast(`${name} removido da ficha técnica.`)
      refetch()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <button onClick={onClose} className="absolute top-5 right-5 text-on-surface-variant hover:text-primary">
        <Icon name="close" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Icon name="receipt_long" fill className="text-primary text-xl" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-primary">Ficha Técnica</h3>
          <p className="text-sm text-on-surface-variant">{product.name} — {fmtBRL(product.price)}</p>
        </div>
      </div>

      {/* Explicação */}
      <div className="bg-surface-container-low rounded-xl px-4 py-3 text-xs text-on-surface-variant mb-5 flex items-start gap-2">
        <Icon name="info" className="text-base text-outline flex-shrink-0 mt-0.5" />
        <span>
          Defina quanto de cada insumo é necessário para produzir <strong>1 unidade</strong> deste produto.
          O módulo de Fornada usará essas quantidades para calcular o consumo total.
        </span>
      </div>

      {/* Lista de ingredientes da ficha */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
          Ingredientes por unidade
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
          </div>
        ) : !recipe || recipe.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant">
            <Icon name="science" className="text-3xl text-outline mb-2 block mx-auto" />
            <p className="text-sm">Nenhum ingrediente cadastrado ainda.</p>
            <p className="text-xs mt-1">Adicione os insumos abaixo.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {recipe.map(item => (
              <div key={item.id}
                className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3 group">
                <div className="flex items-center gap-3">
                  <Icon name="science" className="text-secondary text-base opacity-60" />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{item.ingredientName}</p>
                    <p className="text-xs text-on-surface-variant">
                      {fmtQty(item.quantity)} {item.unit} por unidade
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id, item.ingredientName)}
                  disabled={deleting === item.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error/80 p-1">
                  {deleting === item.id
                    ? <span className="w-4 h-4 border-2 border-error/30 border-t-error rounded-full animate-spin block" />
                    : <Icon name="delete_outline" className="text-base" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de adição */}
      <div className="border-t border-outline-variant/10 pt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
          Adicionar ingrediente
        </p>

        {available.length === 0 && recipe && recipe.length > 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-3">
            Todos os insumos disponíveis já estão na ficha técnica.
          </p>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Insumo">
              <select required value={form.ingredientId} onChange={handleIngredientChange} className={inputCls}>
                <option value="">Selecionar insumo...</option>
                {available.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Qtd. por unidade${selectedIng ? ` (${selectedIng.unit})` : ''}`}>
                <input required type="number" step="0.0001" min="0.0001"
                  placeholder="ex: 0.5000"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Unidade">
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={inputCls}>
                  {['kg','g','litro','ml','lata','dúzia','unidade','saco','caixa'].map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>

            <button type="submit" disabled={submitting || !form.ingredientId || !form.quantity}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                submitting || !form.ingredientId || !form.quantity
                  ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                  : 'bg-primary text-white hover:opacity-90'
              }`}>
              {submitting ? 'Adicionando...' : '+ Adicionar à Ficha Técnica'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────
//  Cards de catálogo
// ─────────────────────────────────────────────────────────────
function ProductCatalogCard({ item, onEdit, onDeact, onRecipe }) {
  return (
    <div className="bg-surface-container-low rounded-3xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="h-28 bg-gradient-to-br from-primary-fixed to-surface-container-high flex items-center justify-center relative">
        <Icon name="cake" fill className="text-primary opacity-20" style={{ fontSize: '56px' }} />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-primary font-bold text-xs">
          {fmtBRL(item.price)}
        </div>
        {!item.active && (
          <div className="absolute top-2 left-2">
            <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Inativo</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-on-surface mb-1 leading-tight">{item.name}</h3>
        {item.description && <p className="text-xs text-on-surface-variant mb-3 line-clamp-1">{item.description}</p>}
        {/* Botões de ação */}
        <div className="flex gap-1.5 mt-2">
          <button onClick={onRecipe}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-secondary/10 text-secondary rounded-xl text-xs font-bold hover:bg-secondary/20 transition-colors">
            <Icon name="receipt_long" className="text-sm" /> Ficha Técnica
          </button>
          <button onClick={onEdit}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">
            <Icon name="edit" className="text-sm" />
          </button>
          {item.active && (
            <button onClick={onDeact}
              className="flex items-center justify-center px-2.5 py-2 bg-error/10 text-error rounded-xl text-xs font-bold hover:bg-error/20 transition-colors">
              <Icon name="delete" className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function IngredientCatalogCard({ item, onEdit, onDeact }) {
  return (
    <div className="bg-surface-container-low rounded-3xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="h-28 bg-gradient-to-br from-secondary-container to-surface-container-high flex items-center justify-center relative">
        <Icon name="grocery" fill className="text-secondary opacity-20" style={{ fontSize: '56px' }} />
        {!item.active && (
          <div className="absolute top-2 left-2">
            <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Inativo</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-on-surface mb-1 leading-tight">{item.name}</h3>
        <p className="text-xs text-on-surface-variant mb-3">
          Unidade: <strong>{item.unit}</strong> · Mín: <strong>{fmtQty(item.minQuantity)}</strong>
        </p>
        <div className="flex gap-1.5">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-secondary/10 text-secondary rounded-xl text-xs font-bold hover:bg-secondary/20 transition-colors">
            <Icon name="edit" className="text-sm" /> Editar
          </button>
          {item.active && (
            <button onClick={onDeact}
              className="flex items-center justify-center px-3 py-2 bg-error/10 text-error rounded-xl text-xs font-bold hover:bg-error/20 transition-colors">
              <Icon name="delete" className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AddCard({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="border-2 border-dashed border-outline-variant rounded-3xl flex flex-col items-center justify-center p-8 gap-3 text-outline hover:border-primary hover:text-primary transition-all min-h-[200px]">
      <Icon name="add_circle" className="text-4xl" />
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
//  Shared
// ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</label>
      {children}
    </div>
  )
}
function ModalActions({ onCancel, submitting, label }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} disabled={submitting}
        className="flex-1 py-3 rounded-xl bg-surface-container-highest text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={submitting}
        className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all ${
          submitting
            ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            : 'bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/20 hover:opacity-90'
        }`}>
        {submitting ? 'Salvando...' : label}
      </button>
    </div>
  )
}
function GridLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
    </div>
  )
}
const inputCls = 'w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20'
