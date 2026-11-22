import { describe, it, expect } from 'vitest'
import { addItem, changeQty, removeItem, cartTotal, cartQty, toSaleRequest } from './cart'

const bolo       = { productId: 1, productName: 'Bolo de Cenoura', productPrice: '45.00', quantity: 3 }
const brigadeiro = { productId: 2, productName: 'Brigadeiro (6un)', productPrice: 18.1, quantity: 10 }

describe('carrinho do PDV (RF09)', () => {
  it('CT-FE-01: adiciona item novo com preço numérico e limite do estoque', () => {
    const c = addItem([], bolo, 2)
    expect(c).toEqual([{ productId: 1, name: 'Bolo de Cenoura', price: 45, qty: 2, maxQty: 3 }])
  })

  it('CT-FE-02: adicionar o mesmo produto soma a quantidade, sem passar do estoque (RN06)', () => {
    let c = addItem([], bolo, 2)
    c = addItem(c, bolo, 1)
    expect(c[0].qty).toBe(3)
    expect(addItem(c, bolo, 1)).toBe(c)          // 4 > 3: ignora
  })

  it('CT-FE-03: produto sem estoque ou quantidade acima do saldo não entra no carrinho', () => {
    expect(addItem([], { ...bolo, quantity: 0 })).toEqual([])
    expect(addItem([], bolo, 4)).toEqual([])
    expect(addItem([], bolo, 0)).toEqual([])
  })

  it('CT-FE-04: alterar quantidade respeita o estoque e remove ao chegar a zero', () => {
    const c = addItem([], bolo, 1)
    expect(changeQty(c, 1, +2)[0].qty).toBe(3)
    expect(changeQty(c, 1, +5)).toEqual(c)
    expect(changeQty(c, 1, -1)).toEqual([])
  })

  it('CT-FE-05: total arredondado a centavos, contagem de itens e remoção', () => {
    let c = addItem([], bolo, 2)                 // 90,00
    c = addItem(c, brigadeiro, 3)                // 54,30 (18,1 x 3 em ponto flutuante dá 54,300000000000004)
    expect(cartTotal(c)).toBe(144.3)
    expect(cartQty(c)).toBe(5)
    expect(removeItem(c, 1)).toHaveLength(1)
  })

  it('CT-FE-06: pedido enviado só com id e quantidade; o preço é do servidor (RN07)', () => {
    const c = addItem(addItem([], bolo, 2), brigadeiro, 1)
    expect(toSaleRequest(c)).toEqual({ items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }] })
  })
})
