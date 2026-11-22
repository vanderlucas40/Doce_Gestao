/**
 * Regras puras do carrinho do PDV (sem React), testadas em cart.test.js.
 * Item do carrinho: { productId, name, price, qty, maxQty }.
 * Item de estoque (API): { productId, productName, productPrice, quantity }.
 */

/** Adiciona qty unidades; não passa do estoque disponível nem aceita item sem estoque. */
export function addItem(cart, stockItem, qty = 1) {
  if (qty <= 0) return cart
  const existing = cart.find(c => c.productId === stockItem.productId)
  if (existing) {
    const newQty = existing.qty + qty
    if (newQty > stockItem.quantity) return cart
    return cart.map(c => c.productId === stockItem.productId ? { ...c, qty: newQty, maxQty: stockItem.quantity } : c)
  }
  if (qty > stockItem.quantity) return cart   // antes era aceito e a venda só falhava no servidor
  return [...cart, {
    productId: stockItem.productId,
    name:      stockItem.productName,
    price:     Number(stockItem.productPrice),
    qty,
    maxQty:    stockItem.quantity,
  }]
}

/** Soma delta à quantidade; remove ao chegar a 0 e não passa do estoque. */
export function changeQty(cart, productId, delta) {
  return cart
    .map(c => {
      if (c.productId !== productId) return c
      const newQty = c.qty + delta
      if (newQty <= 0) return null
      if (newQty > c.maxQty) return c
      return { ...c, qty: newQty }
    })
    .filter(Boolean)
}

export const removeItem = (cart, productId) => cart.filter(c => c.productId !== productId)

/** Total em reais arredondado a centavos (evita 0.1 + 0.2 = 0.30000000000000004). */
export const cartTotal = cart => Math.round(cart.reduce((s, c) => s + c.price * c.qty, 0) * 100) / 100

export const cartQty = cart => cart.reduce((s, c) => s + c.qty, 0)

/** Corpo do POST /stores/{id}/sales: só id e quantidade (o preço vem do servidor — RN07). */
export const toSaleRequest = cart => ({ items: cart.map(c => ({ productId: c.productId, quantity: c.qty })) })
