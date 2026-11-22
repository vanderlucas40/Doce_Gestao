import { useState, useCallback }                                    from 'react'
import { useStore }                                                  from '../hooks/useStore'
import { useFetch }                                                  from '../hooks/useFetch'
import { inventoryApi, salesApi }                                    from '../api'
import { Icon, Modal, Toast, StockBar, useToast, fmtBRL, fmtTime }  from '../components/ui'
import { addItem, changeQty as changeCartQty, removeItem, cartTotal, cartQty as countItems, toSaleRequest } from '../utils/cart'
import { todayISO }                                                  from '../utils/date'

export function PDV() {
  const { currentStore }           = useStore()
  const storeId                    = currentStore?.id
  const { toast, show: showToast } = useToast()

  const { data: inventory, loading, error, refetch: refetchInv } =
    useFetch(() => inventoryApi.listByStore(storeId), [storeId], { enabled: !!storeId })

  const { data: sales, refetch: refetchSales } =
    // Só as vendas de hoje, filtradas no servidor (antes baixava todas e filtrava no navegador — R06)
    useFetch(() => salesApi.byDate(storeId, todayISO()), [storeId], { enabled: !!storeId })

  const [cart,         setCart]         = useState([])
  const [modal,        setModal]        = useState(null)
  const [successModal, setSuccessModal] = useState(null)
  const [submitting,   setSubmitting]   = useState(false)


  // ── Carrinho (regras puras em utils/cart.js) ──────────────────
  const addToCart = useCallback((item, qty = 1) => {
    setCart(prev => addItem(prev, item, qty))
    setModal(null)
    showToast(`${item.productName} adicionado!`)
  }, [showToast])

  const changeQty = useCallback(
    (productId, delta) => setCart(prev => changeCartQty(prev, productId, delta)),
    []
  )

  const removeFromCart = useCallback(
    productId => setCart(prev => removeItem(prev, productId)),
    []
  )

  const total   = cartTotal(cart)
  const cartQty = countItems(cart)

  // ── Finalizar venda ───────────────────────────────────────────
  async function handleFinalize() {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const sale = await salesApi.register(storeId, toSaleRequest(cart))
      setSuccessModal({ total, itemCount: cartQty, sale })
      setCart([])
      refetchInv()
      refetchSales()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const todaySales = (sales || [])
    .slice(0, 5)
    .reverse()

  if (!storeId) return <PageState icon="store" msg="Selecione uma loja para começar." />
  if (loading)  return <PageState spinner msg="Carregando produtos..." />
  if (error)    return <PageState icon="error" msg={error} action={refetchInv} actionLabel="Tentar novamente" />

  return (
    <div className="pt-20 pb-28 md:pt-24 md:pb-8 md:pl-72 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Esquerda: Grid de produtos ─────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Grid de produtos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {(inventory || []).map(item => (
              <ProductCard
                key={item.inventoryId}
                item={item}
                onAdd={() => item.quantity > 0 && setModal(item)}
              />
            ))}
            <button className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-8 text-outline hover:border-primary hover:text-primary transition-all min-h-[180px]">
              <Icon name="add_circle" className="text-4xl mb-2" />
              <span className="text-sm font-bold uppercase tracking-widest">Novo Item</span>
            </button>
          </div>
        </div>

        {/* ── Direita: Pedido atual ──────────────────────────── */}
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(43,22,19,0.06)] border border-outline-variant/15 flex flex-col min-h-[520px] sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-2xl text-on-background">Pedido Atual</h2>
              <div className="flex items-center gap-2">
                {cartQty > 0 && (
                  <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartQty}
                  </span>
                )}
                <Icon name="shopping_bag" className="text-outline" />
              </div>
            </div>

            {/* Itens do carrinho */}
            <div className="flex-grow space-y-2 overflow-y-auto pr-1 mb-5 min-h-[140px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/40 gap-2 py-10">
                  <Icon name="shopping_cart" className="text-5xl" />
                  <p className="text-sm text-center">Toque nos produtos para adicionar</p>
                </div>
              ) : (
                cart.map(c => (
                  <CartItem
                    key={c.productId}
                    item={c}
                    onIncrease={() => changeQty(c.productId, +1)}
                    onDecrease={() => changeQty(c.productId, -1)}
                    onRemove={()  => removeFromCart(c.productId)}
                  />
                ))
              )}
            </div>

            {/* Totais */}
            <div className="pt-4 border-t border-outline-variant/20 space-y-2.5">
              <div className="flex justify-between text-on-surface-variant text-sm">
                <span>Subtotal</span><span>{fmtBRL(total)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-sm">
                <span>Taxa de entrega</span><span>R$ 0,00</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-serif text-xl">Total</span>
                <span className="font-serif text-3xl text-primary">{fmtBRL(total)}</span>
              </div>
              <button
                onClick={handleFinalize}
                disabled={!cart.length || submitting}
                className={`w-full mt-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                  !cart.length
                    ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                    : submitting
                      ? 'bg-primary/60 text-white cursor-not-allowed'
                      : 'bg-gradient-to-br from-primary to-primary-container text-white hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {submitting
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </span>
                  : 'Finalizar Pedido'
                }
              </button>
            </div>
          </div>

          {/* Vendas recentes */}
          {todaySales.length > 0 && (
            <div className="bg-surface-container-low rounded-3xl p-5 mt-4">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                Vendas Recentes
              </h3>
              <div className="space-y-3">
                {todaySales.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                      <span className="font-bold">#{s.id}</span>
                      <span className="text-on-surface-variant">{fmtTime(s.soldAt)}</span>
                    </div>
                    <span className="font-bold">{fmtBRL(s.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Modal: Adicionar produto ──────────────────────────── */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="w-16 h-16 bg-primary-fixed/40 rounded-2xl flex items-center justify-center">
              <Icon name="cake" fill className="text-primary text-3xl" />
            </div>
            <div>
              <h3 className="font-serif text-2xl">{modal.productName}</h3>
              <p className="text-on-surface-variant text-sm mt-1">
                {modal.quantity} unidade{modal.quantity !== 1 ? 's' : ''} disponível
              </p>
            </div>
            <div className="font-serif text-4xl text-primary">{fmtBRL(modal.productPrice)}</div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl bg-surface-container-highest text-on-surface font-bold text-sm hover:bg-surface-container transition-colors">
                Cancelar
              </button>
              <button onClick={() => addToCart(modal)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity">
                Adicionar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Venda confirmada ───────────────────────────── */}
      {successModal && (
        <Modal onClose={() => setSuccessModal(null)} maxWidth="max-w-md">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col items-center text-center space-y-6 relative z-10">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center">
              <Icon name="check_circle" fill className="text-4xl text-secondary" />
            </div>
            <div>
              <h2 className="font-serif text-3xl">Venda Confirmada!</h2>
              <p className="text-on-surface-variant text-sm px-4 mt-2">
                {successModal.itemCount} item{successModal.itemCount !== 1 ? 's' : ''} registrado
                {successModal.itemCount !== 1 ? 's' : ''} e estoque atualizado automaticamente.
              </p>
            </div>
            <div className="w-full bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/15">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                Total Recebido
              </span>
              <div className="font-serif text-4xl text-primary mt-1">{fmtBRL(successModal.total)}</div>
              <div className="mt-4 pt-4 border-t border-dashed border-outline-variant/30 flex justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <span>Pedido</span>
                <span className="text-on-surface">#{successModal.sale?.id}</span>
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setSuccessModal(null)}
                className="flex-1 py-3 rounded-xl bg-surface-container-highest text-on-surface font-bold text-sm hover:bg-surface-container transition-colors">
                Nova Venda
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ item, onAdd }) {
  const disabled = item.quantity === 0
  return (
    <div onClick={() => !disabled && onAdd()}
      className={`group bg-surface-container-low rounded-xl overflow-hidden transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      }`}>
      <div className="h-40 overflow-hidden relative bg-gradient-to-br from-primary-fixed to-surface-container-high">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="cake" fill className="text-primary opacity-[0.12]" style={{ fontSize: '80px' }} />
        </div>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-primary font-bold text-xs">
          {fmtBRL(item.productPrice)}
        </div>
        {disabled && (
          <div className="absolute inset-0 bg-on-background/20 flex items-center justify-center">
            <span className="bg-error text-white text-xs font-bold px-3 py-1 rounded-full">Esgotado</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-on-surface text-base leading-tight">{item.productName}</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            <span>Estoque</span><span>{item.quantity} un.</span>
          </div>
          <StockBar quantity={item.quantity} maxQuantity={item.maxQuantity} />
        </div>
      </div>
    </div>
  )
}

// ── Cart Item com controle +/- ────────────────────────────────
function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-outline-variant/10 last:border-0 group">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-on-surface leading-tight truncate">{item.name}</p>
        <p className="text-xs text-on-surface-variant">{fmtBRL(item.price)} cada</p>
      </div>

      {/* Controles +/- */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={onDecrease}
          className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors">
          <Icon name="remove" className="text-base" />
        </button>
        <span className="w-6 text-center font-bold text-sm text-on-surface">{item.qty}</span>
        <button onClick={onIncrease} disabled={item.qty >= item.maxQty}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            item.qty >= item.maxQty
              ? 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'
              : 'bg-surface-container text-primary hover:bg-primary-fixed'
          }`}>
          <Icon name="add" className="text-base" />
        </button>
      </div>

      {/* Subtotal + remover */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-bold text-sm text-on-surface w-16 text-right">
          {fmtBRL(item.price * item.qty)}
        </span>
        <button onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-error hover:text-error/80 p-0.5">
          <Icon name="delete_outline" className="text-base" />
        </button>
      </div>
    </div>
  )
}

// ── Estado de página ──────────────────────────────────────────
function PageState({ spinner, icon, msg, action, actionLabel }) {
  return (
    <div className="pt-20 md:pl-72 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant text-center px-8">
        {spinner
          ? <div className="w-10 h-10 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
          : <Icon name={icon || 'error'} className="text-5xl text-outline" />
        }
        <p className="text-sm">{msg}</p>
        {action && (
          <button onClick={action}
            className="px-6 py-2 border border-outline-variant rounded-xl text-sm hover:bg-surface-container transition-colors">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
