import { api } from './client'
export const inventoryApi = {
  listByStore:      storeId                  => api.get(`/stores/${storeId}/inventory`).then(r => r.data),
  lowStock:         storeId                  => api.get(`/stores/${storeId}/inventory/low-stock`).then(r => r.data),
  update:           (storeId, productId, d)  => api.put(`/stores/${storeId}/inventory/${productId}`, d).then(r => r.data),
  listIngredients:  storeId                  => api.get(`/stores/${storeId}/ingredient-stock`).then(r => r.data),
  lowIngredients:   storeId                  => api.get(`/stores/${storeId}/ingredient-stock/low-stock`).then(r => r.data),
  updateIngredient: (storeId, ingredientId, d) => api.put(`/stores/${storeId}/ingredient-stock/${ingredientId}`, d).then(r => r.data),
  /** Histórico de ajustes manuais: { content, page, size, totalElements, totalPages } */
  movements:        (storeId, page = 0, size = 20) =>
    api.get(`/stores/${storeId}/stock-movements`, { params: { page, size } }).then(r => r.data),
}
