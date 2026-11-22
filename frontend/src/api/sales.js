import { api } from './client'

export const salesApi = {
  /** Registra uma venda (desconta estoque atomicamente) */
  register:  (storeId, data) => api.post(`/stores/${storeId}/sales`, data).then(r => r.data),

  /** Todas as vendas da loja (uso interno/dashboard) */
  list:      storeId         => api.get(`/stores/${storeId}/sales`).then(r => r.data),

  /** Vendas de um dia específico */
  byDate:    (storeId, date) => api.get(`/stores/${storeId}/sales/by-date`, { params: { date } }).then(r => r.data),

  /**
   * Vendas de um intervalo de datas — 1 request em vez de N.
   * O backend valida máximo de 366 dias.
   */
  byRange:   (storeId, from, to) => api.get(`/stores/${storeId}/sales/by-range`, { params: { from, to } }).then(r => r.data),

  /** Resumo do dia (métricas + alertas) */
  dashboard: storeId         => api.get(`/stores/${storeId}/dashboard`).then(r => r.data),
}
