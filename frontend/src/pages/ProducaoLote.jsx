import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore }                                   from '../hooks/useStore'
import { useFetch }                                   from '../hooks/useFetch'
import { productsApi, productionApi }                 from '../api'
import {
  Icon, Card, Modal, Toast,
  useToast, fmtBRL, fmtTime
} from '../components/ui'

// ─────────────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────────────
const EMPTY_LINE = { id: Date.now(), productId: '', quantity: 1 }

// ─────────────────────────────────────────────────────────────
//  ProducaoLote — Módulo de Fornada
// ─────────────────────────────────────────────────────────────
export function ProducaoLote() {
  const { currentStore }           = useStore()
  const storeId                    = currentStore?.id
  const { toast, show: showToast } = useToast()

  // ── Catálogo de produtos ──────────────────────────────────
  const { data: products, loading: loadingProducts } =
    useFetch(() => productsApi.list(), [])

  // ── Grade de entrada (linhas da fornada) ──────────────────
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])

  // ── Preview consolidado (retorno do backend) ──────────────
  const [preview,        setPreview]        = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // ── Ajustes de desvio: ingredientId → qty real ───────────
  const [adjustments, setAdjustments] = useState({})

  // ── Notas / observações ───────────────────────────────────
  const [notes, setNotes] = useState('')

  // ── Modais e estado de submit ─────────────────────────────
  const [confirmModal, setConfirmModal] = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [successBatch, setSuccessBatch] = useState(null)
  const [historyModal, setHistoryModal] = useState(false)

  // ── Histórico de fornadas ─────────────────────────────────
  const { data: history, refetch: refetchHistory } =
    useFetch(() => productionApi.list(storeId), [storeId])

  // ── Linhas válidas (produto selecionado + qty > 0) ────────
  const validLines = useMemo(() =>
    lines.filter(l => l.productId && l.quantity > 0),
    [lines]
  )

  const totalItems = useMemo(() =>
    validLines.reduce((s, l) => s + Number(l.quantity), 0),
    [validLines]
  )

  const flavors = useMemo(() =>
    new Set(validLines.map(l => l.productId)).size,
    [validLines]
  )

  // ── Buscar preview sempre que as linhas válidas mudam ─────
  const fetchPreview = useCallback(async () => {
    if (!storeId || validLines.length === 0) {
      setPreview(null)
      return
    }
    setLoadingPreview(true)
    try {
      const data = await productionApi.preview(
        storeId,
        validLines.map(l => ({ productId: Number(l.productId), quantity: Number(l.quantity) }))
      )
      setPreview(data)
      // Resetar ajustes que não existem mais no preview
      setAdjustments(prev => {
        const validIds = new Set(data.ingredients.map(i => i.ingredientId))
        return Object.fromEntries(
          Object.entries(prev).filter(([id]) => validIds.has(Number(id)))
        )
      })
    } catch (err) {
      // Preview falha silenciosamente — só mostra erro crítico no submit
      setPreview(null)
    } finally {
      setLoadingPreview(false)
    }
  }, [storeId, validLines])

  useEffect(() => {
    // Debounce de 400ms para não bater na API em cada keystroke
    const timer = setTimeout(fetchPreview, 400)
    return () => clearTimeout(timer)
  }, [fetchPreview])

  // ─── Manipulação das linhas ───────────────────────────────

  function addLine() {
    setLines(prev => [...prev, { id: Date.now(), productId: '', quantity: 1 }])
  }

  function removeLine(id) {
    setLines(prev => prev.length === 1 ? prev : prev.filter(l => l.id !== id))
  }

  function updateLine(id, field, value) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  function setAdjustment(ingredientId, value) {
    setAdjustments(prev => ({
      ...prev,
      [ingredientId]: value === '' ? undefined : Number(value)
    }))
  }

  // ─── Submeter Fornada ─────────────────────────────────────

  async function handleRegister() {
    setSubmitting(true)
    try {
      const adjustmentsList = Object.entries(adjustments)
        .filter(([, qty]) => qty !== undefined && qty !== '')
        .map(([ingredientId, actualQty]) => ({
          ingredientId: Number(ingredientId),
          actualQty:    Number(actualQty)
        }))

      const batch = await productionApi.register(storeId, {
        items:       validLines.map(l => ({
          productId: Number(l.productId),
          quantity:  Number(l.quantity)
        })),
        adjustments: adjustmentsList.length > 0 ? adjustmentsList : null,
        notes:       notes.trim() || null,
      })

      setSuccessBatch(batch)
      setConfirmModal(false)
      // Limpar formulário
      setLines([{ ...EMPTY_LINE, id: Date.now() }])
      setAdjustments({})
      setNotes('')
      setPreview(null)
      refetchHistory()
    } catch (err) {
      setConfirmModal(false)
      // Erro de estoque insuficiente vem formatado pelo GlobalExceptionHandler
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Produto pelo id ──────────────────────────────────────
  const productMap = useMemo(() => {
    const m = {}
    ;(products || []).forEach(p => { m[p.id] = p })
    return m
  }, [products])

  if (!storeId) return <PageState icon="store" msg="Selecione uma loja para registrar uma fornada." />

  return (
    <div className="pt-20 pb-28 md:pt-8 md:pb-8 md:pl-72 px-4 md:px-8 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 md:pt-8 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
            Cozinha
          </span>
          <h2 className="text-3xl font-serif text-on-surface mt-1">Registrar Fornada</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Selecione os sabores e quantidades. O sistema consolida os insumos automaticamente.
          </p>
        </div>
        <button
          onClick={() => { setHistoryModal(true) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors self-start"
        >
          <Icon name="history" />
          Histórico
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Esquerda: Grade de entrada ──────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg">Sabores da Fornada</h3>
              <button onClick={addLine}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">
                <Icon name="add" className="text-base" />
                Adicionar Sabor
              </button>
            </div>

            {/* Header da grade */}
            <div className="grid grid-cols-12 gap-3 mb-2 px-1">
              <div className="col-span-7 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sabor</div>
              <div className="col-span-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">Qtd.</div>
              <div className="col-span-2" />
            </div>

            {/* Linhas */}
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <BatchLine
                  key={line.id}
                  line={line}
                  products={products || []}
                  usedProductIds={lines.filter(l => l.id !== line.id).map(l => l.productId)}
                  onUpdate={(field, val) => updateLine(line.id, field, val)}
                  onRemove={() => removeLine(line.id)}
                  canRemove={lines.length > 1}
                  productMap={productMap}
                />
              ))}
            </div>

            {/* Notas */}
            <div className="mt-6 pt-5 border-t border-outline-variant/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ex: Fornada de fim de semana, massa do Red Velvet com dobro de corante..."
                rows={2}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
              />
            </div>
          </Card>

          {/* Botão Finalizar */}
          <button
            onClick={() => validLines.length > 0 && !loadingPreview && setConfirmModal(true)}
            disabled={validLines.length === 0 || loadingPreview || submitting}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
              validLines.length === 0 || loadingPreview
                ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                : 'bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.99]'
            }`}
          >
            {loadingPreview ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculando insumos...
              </span>
            ) : validLines.length === 0 ? (
              'Adicione ao menos um sabor'
            ) : (
              `Registrar Fornada (${totalItems} ${totalItems === 1 ? 'item' : 'itens'} · ${flavors} ${flavors === 1 ? 'sabor' : 'sabores'})`
            )}
          </button>
        </div>

        {/* ── Direita: Painel de consolidação ─────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <ConsolidationPanel
            preview={preview}
            loading={loadingPreview}
            adjustments={adjustments}
            onAdjust={setAdjustment}
            validLines={validLines.length}
          />
        </div>
      </div>

      {/* ── Modal: Confirmar Fornada ──────────────────────── */}
      {confirmModal && preview && (
        <Modal onClose={() => !submitting && setConfirmModal(false)} maxWidth="max-w-lg">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Icon name="oven_gen" fill className="text-primary text-2xl" />
              </div>
              <div>
                <h3 className="font-serif text-2xl">Confirmar Fornada</h3>
                <p className="text-sm text-on-surface-variant">
                  {totalItems} {totalItems === 1 ? 'unidade' : 'unidades'} · {flavors} {flavors === 1 ? 'sabor' : 'sabores'}
                </p>
              </div>
            </div>

            {/* Resumo dos sabores */}
            <div className="bg-surface-container-low rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Sabores
              </p>
              <div className="space-y-2">
                {validLines.map(l => {
                  const p = productMap[l.productId]
                  return p ? (
                    <div key={l.id} className="flex justify-between text-sm">
                      <span className="text-on-surface font-medium">{p.name}</span>
                      <span className="font-bold text-primary">
                        {l.quantity} un. → +{fmtBRL(p.price * l.quantity)}
                      </span>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            {/* Resumo de insumos */}
            <div className="bg-surface-container-low rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Consumo de Insumos
              </p>
              <div className="space-y-1.5">
                {preview.ingredients.map(ing => {
                  const actual = adjustments[ing.ingredientId] ?? Number(ing.suggestedQty)
                  const hasAdj = adjustments[ing.ingredientId] !== undefined
                  return (
                    <div key={ing.ingredientId} className="flex justify-between text-sm">
                      <span className={`${ing.insufficient ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                        {ing.ingredientName}
                        {ing.insufficient && ' ⚠'}
                      </span>
                      <span className={`font-bold ${hasAdj ? 'text-tertiary' : 'text-on-surface'}`}>
                        {Number(actual).toFixed(3)} {ing.unit}
                        {hasAdj && <span className="text-xs text-on-surface-variant ml-1">(ajustado)</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Aviso de insuficiência */}
            {preview.ingredients.some(i => i.insufficient) && (
              <div className="flex items-start gap-2 bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm mb-4">
                <Icon name="warning" fill className="text-base flex-shrink-0 mt-0.5" />
                <span>
                  Alguns insumos estão com estoque insuficiente. O backend irá rejeitar a fornada.
                  Ajuste as quantidades ou reponha o estoque antes de continuar.
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(false)} disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors">
                Revisar
              </button>
              <button onClick={handleRegister} disabled={submitting}
                className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all ${
                  submitting
                    ? 'bg-primary/60 cursor-not-allowed'
                    : 'bg-gradient-to-br from-primary to-primary-container shadow-lg hover:opacity-90'
                }`}>
                {submitting
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </span>
                  : '🔥 Confirmar Fornada'
                }
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Fornada registrada com sucesso ─────────── */}
      {successBatch && (
        <Modal onClose={() => setSuccessBatch(null)} maxWidth="max-w-md">
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center">
              <Icon name="check_circle" fill className="text-4xl text-secondary" />
            </div>
            <div>
              <h2 className="font-serif text-3xl">Fornada Registrada!</h2>
              <p className="text-on-surface-variant text-sm mt-2">
                {successBatch.totalItems} unidades produzidas e adicionadas ao estoque.
              </p>
            </div>
            <div className="w-full bg-surface-container-low rounded-2xl p-5 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Resumo #{successBatch.id}
              </p>
              {(successBatch.items || []).map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-on-surface">{item.productName}</span>
                  <span className="font-bold text-secondary">+{item.quantity} un.</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSuccessBatch(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm hover:opacity-90">
              Nova Fornada
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Histórico de fornadas ─────────────────── */}
      {historyModal && (
        <Modal onClose={() => setHistoryModal(false)} maxWidth="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-2xl">Histórico de Fornadas</h3>
            <button onClick={() => setHistoryModal(false)} className="text-on-surface-variant hover:text-primary">
              <Icon name="close" />
            </button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {!history || history.length === 0 ? (
              <p className="text-center py-10 text-on-surface-variant text-sm">
                Nenhuma fornada registrada ainda.
              </p>
            ) : (
              history.map(batch => <BatchHistoryRow key={batch.id} batch={batch} />)
            )}
          </div>
        </Modal>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Linha da Grade de Entrada
// ─────────────────────────────────────────────────────────────
function BatchLine({ line, products, usedProductIds, onUpdate, onRemove, canRemove, productMap }) {
  const available = products.filter(
    p => p.active && (!usedProductIds.includes(String(p.id)) || line.productId === String(p.id))
  )

  return (
    <div className="grid grid-cols-12 gap-3 items-center bg-surface-container-low rounded-2xl px-4 py-3">
      {/* Seletor de sabor */}
      <div className="col-span-7">
        <select
          value={line.productId}
          onChange={e => onUpdate('productId', e.target.value)}
          className="w-full bg-white border-none rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 text-on-surface"
        >
          <option value="">Selecionar sabor...</option>
          {available.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Quantidade */}
      <div className="col-span-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onUpdate('quantity', Math.max(1, line.quantity - 1))}
            className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors flex-shrink-0">
            <Icon name="remove" className="text-sm" />
          </button>
          <input
            type="number" min="1" max="999"
            value={line.quantity}
            onChange={e => onUpdate('quantity', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full text-center text-sm font-bold bg-white border-none rounded-lg py-2 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button onClick={() => onUpdate('quantity', line.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors flex-shrink-0">
            <Icon name="add" className="text-sm" />
          </button>
        </div>
      </div>

      {/* Remover */}
      <div className="col-span-2 flex justify-end">
        {canRemove ? (
          <button onClick={onRemove}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors">
            <Icon name="delete_outline" className="text-base" />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Painel de Consolidação (tempo real)
// ─────────────────────────────────────────────────────────────
function ConsolidationPanel({ preview, loading, adjustments, onAdjust, validLines }) {
  if (validLines === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Icon name="science" className="text-5xl text-outline mb-4" />
        <p className="font-serif text-lg text-on-surface mb-2">Resumo de Insumos</p>
        <p className="text-sm text-on-surface-variant">
          Adicione sabores na grade para ver o consumo consolidado automaticamente.
        </p>
      </Card>
    )
  }

  if (loading && !preview) {
    return (
      <Card className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Calculando insumos...</p>
        </div>
      </Card>
    )
  }

  if (!preview) return null

  if (preview.missingRecipe) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <Icon name="warning" fill className="text-4xl text-amber-500" />
        <div>
          <p className="font-serif text-base text-on-surface mb-1">Ficha Técnica ausente</p>
          <p className="text-sm text-on-surface-variant">
            Nenhum produto selecionado possui ficha técnica cadastrada.
            Vá em <strong>Cadastros → Ficha Técnica</strong> para configurar os ingredientes de cada sabor.
          </p>
        </div>
      </Card>
    )
  }

  const hasShortage  = preview.ingredients.some(i => i.insufficient)
  const hasAdjusted  = Object.keys(adjustments).length > 0

  return (
    <div className="space-y-4">
      {/* Resumo numérico */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container-low rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Total</p>
          <p className="font-serif text-2xl text-on-surface">{preview.totalItems} un.</p>
        </div>
        <div className="bg-surface-container-low rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Sabores</p>
          <p className="font-serif text-2xl text-on-surface">{preview.flavors}</p>
        </div>
      </div>

      {/* Alerta de estoque insuficiente */}
      {hasShortage && (
        <div className="flex items-start gap-2 bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm">
          <Icon name="warning" fill className="text-base flex-shrink-0 mt-0.5" />
          <span>
            <strong>Estoque insuficiente</strong> para alguns insumos.
            Reponha o estoque ou reduza as quantidades.
          </span>
        </div>
      )}

      {/* Tabela de insumos consolidados */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <p className="font-serif text-base">Você vai precisar de:</p>
          {loading && (
            <div className="w-4 h-4 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
          )}
        </div>

        <div className="divide-y divide-outline-variant/8">
          {preview.ingredients.map(ing => {
            const adjVal   = adjustments[ing.ingredientId]
            const hasAdj   = adjVal !== undefined
            const actualQty = hasAdj ? adjVal : Number(ing.suggestedQty)
            const deviated  = hasAdj && Number(adjVal) !== Number(ing.suggestedQty)

            return (
              <div key={ing.ingredientId} className={`px-5 py-3 ${ing.insufficient ? 'bg-error-container/10' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {ing.insufficient
                      ? <Icon name="warning" fill className="text-error text-base" />
                      : <Icon name="check_circle" fill className="text-secondary text-base opacity-60" />
                    }
                    <span className={`text-sm font-semibold ${ing.insufficient ? 'text-error' : 'text-on-surface'}`}>
                      {ing.ingredientName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${deviated ? 'text-tertiary' : ing.insufficient ? 'text-error' : 'text-on-surface'}`}>
                      {Number(actualQty).toFixed(3)} {ing.unit}
                    </span>
                    {deviated && (
                      <span className="text-xs text-on-surface-variant block">
                        sugerido: {Number(ing.suggestedQty).toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estoque disponível */}
                <div className="flex items-center gap-2 ml-6">
                  <div className="flex-1 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ing.insufficient ? 'bg-error' : 'bg-secondary'}`}
                      style={{
                        width: `${Math.min(100, Math.round(
                          (Number(ing.stockAvailable) / Number(ing.suggestedQty)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    {Number(ing.stockAvailable).toFixed(3)} disponível
                  </span>
                </div>

                {/* Campo de ajuste de desvio */}
                <div className="mt-2 ml-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Qty real usada:</span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder={Number(ing.suggestedQty).toFixed(3)}
                      value={adjVal ?? ''}
                      onChange={e => onAdjust(ing.ingredientId, e.target.value)}
                      className="w-28 text-xs bg-surface-container-low border-none rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-tertiary/30 text-center"
                    />
                    <span className="text-xs text-on-surface-variant">{ing.unit}</span>
                    {hasAdj && (
                      <button onClick={() => onAdjust(ing.ingredientId, '')}
                        className="text-xs text-on-surface-variant hover:text-error transition-colors">
                        ↩
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {hasAdjusted && (
          <div className="px-5 py-3 bg-tertiary-fixed/30 border-t border-outline-variant/10">
            <p className="text-xs text-on-tertiary-fixed-variant">
              <Icon name="edit_note" className="text-base mr-1" />
              Ajustes aplicados — o consumo real registrado difere da ficha técnica.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Histórico: linha de uma fornada passada
// ─────────────────────────────────────────────────────────────
function BatchHistoryRow({ batch }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-surface-container-low rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="oven_gen" fill className="text-primary text-xl" />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">
              Fornada #{batch.id} — {batch.totalItems} unidades
            </p>
            <p className="text-xs text-on-surface-variant">
              {new Date(batch.producedAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-bold">
            {batch.items?.length} sabor{batch.items?.length !== 1 ? 'es' : ''}
          </span>
          <Icon name={open ? 'expand_less' : 'expand_more'} className="text-outline" />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 pt-2 border-t border-outline-variant/10">
          <div className="grid grid-cols-2 gap-4">
            {/* Sabores */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Sabores</p>
              <div className="space-y-1">
                {(batch.items || []).map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">{item.productName}</span>
                    <span className="font-bold text-on-surface">+{item.quantity} un.</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Insumos consumidos */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Insumos consumidos</p>
              <div className="space-y-1">
                {(batch.ingredientUsages || []).map(u => {
                  const deviated = Number(u.actualQty) !== Number(u.suggestedQty)
                  return (
                    <div key={u.ingredientId} className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">{u.ingredientName}</span>
                      <span className={`font-bold ${deviated ? 'text-tertiary' : 'text-on-surface'}`}>
                        {Number(u.actualQty).toFixed(3)} {u.unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          {batch.notes && (
            <div className="mt-3 text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg">
              {batch.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Estado de página genérico
// ─────────────────────────────────────────────────────────────
function PageState({ icon, msg }) {
  return (
    <div className="pt-20 md:pl-72 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant text-center px-8">
        <Icon name={icon} className="text-5xl text-outline" />
        <p className="text-sm">{msg}</p>
      </div>
    </div>
  )
}
