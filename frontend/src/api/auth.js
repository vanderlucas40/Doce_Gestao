import { api } from './client'
export const authApi = {
  login:    data => api.post('/auth/login', data).then(r => r.data),
  register: data => api.post('/auth/register', data).then(r => r.data),
}
