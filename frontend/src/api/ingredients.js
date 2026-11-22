import { api } from './client'

export const ingredientsApi = {
  list:       ()             => api.get('/ingredients').then(r => r.data),
  getById:    id             => api.get(`/ingredients/${id}`).then(r => r.data),
  create:     data           => api.post('/ingredients', data).then(r => r.data),
  update:     (id, data)     => api.put(`/ingredients/${id}`, data).then(r => r.data),
  deactivate: id             => api.delete(`/ingredients/${id}`),
}
