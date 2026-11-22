import { api } from './client'
export const storesApi = {
  list:       ()         => api.get('/stores').then(r => r.data),
  getById:    id         => api.get(`/stores/${id}`).then(r => r.data),
  create:     data       => api.post('/stores', data).then(r => r.data),
  update:     (id, data) => api.put(`/stores/${id}`, data).then(r => r.data),
  deactivate: id         => api.delete(`/stores/${id}`),
}
