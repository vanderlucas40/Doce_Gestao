import { api } from './client'

// ── Ficha Técnica ─────────────────────────────────────────────
export const recipeApi = {
  /** Ingredientes necessários por unidade de um produto */
  findByProduct: productId =>
    api.get(`/products/${productId}/recipe`).then(r => r.data),

  /** Upsert de um item da ficha técnica */
  upsert: (productId, ingredientId, data) =>
    api.put(`/products/${productId}/recipe/${ingredientId}`, data).then(r => r.data),

  /** Remove um item da ficha técnica */
  delete: (productId, recipeItemId) =>
    api.delete(`/products/${productId}/recipe/${recipeItemId}`),
}

// ── Fornada (Produção em Lote) ────────────────────────────────
export const productionApi = {
  /** Histórico de fornadas da loja */
  list: storeId =>
    api.get(`/stores/${storeId}/production`).then(r => r.data),

  /** Detalhe de uma fornada */
  findById: (storeId, batchId) =>
    api.get(`/stores/${storeId}/production/${batchId}`).then(r => r.data),

  /**
   * Preview: consolida insumos em tempo real sem gravar.
   * items: [{ productId, quantity }]
   */
  preview: (storeId, items) =>
    api.post(`/stores/${storeId}/production/preview`, items).then(r => r.data),

  /**
   * Registra a fornada completa.
   * { items, adjustments?, notes? }
   */
  register: (storeId, data) =>
    api.post(`/stores/${storeId}/production`, data).then(r => r.data),
}
