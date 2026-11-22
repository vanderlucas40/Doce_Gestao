import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { api, setToken, getToken } from './client'

/** Adaptador falso do Axios: devolve a resposta ou o erro HTTP informado, sem rede. */
function respond(status, data = {}) {
  api.defaults.adapter = config => {
    const response = { status, data, headers: {}, config }
    if (status >= 400) {
      const err = new Error(`HTTP ${status}`)
      err.response = response
      err.config = config
      return Promise.reject(err)
    }
    return Promise.resolve(response)
  }
}

describe('cliente HTTP (interceptors)', () => {
  const original = window.location

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, 'location', { configurable: true, value: { href: '/pdv' } })
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: original })
  })

  it('CT-FE-08: envia o token salvo no cabeçalho Authorization', async () => {
    setToken('abc')
    let enviado
    api.defaults.adapter = config => { enviado = config.headers.Authorization; return Promise.resolve({ status: 200, data: {}, headers: {}, config }) }
    await api.get('/stores')
    expect(enviado).toBe('Bearer abc')
  })

  it('CT-FE-09: 401 em rota protegida limpa a sessão e volta ao login (DEF-02)', async () => {
    setToken('expirado')
    respond(401, { message: 'Sessão expirada. Faça login novamente.' })
    await expect(api.get('/stores/1/inventory')).rejects.toThrow('Sessão expirada')
    expect(getToken()).toBeNull()
    expect(window.location.href).toBe('/')
  })

  it('CT-FE-10: 401 no próprio login não recarrega a página', async () => {
    respond(401, { message: 'Usuário ou senha inválidos' })
    await expect(api.post('/auth/login', {})).rejects.toThrow('Usuário ou senha inválidos')
    expect(window.location.href).toBe('/pdv')
  })

  it('CT-FE-11: erro de negócio vira Error com a mensagem do backend, o status e os campos (RNF05)', async () => {
    setToken('ok')
    respond(400, { message: 'Nome é obrigatório', fields: { name: 'Nome é obrigatório' } })
    const err = await api.post('/products', {}).catch(e => e)
    expect(err.message).toBe('Nome é obrigatório')
    expect(err.status).toBe(400)
    expect(err.fields).toEqual({ name: 'Nome é obrigatório' })
    expect(getToken()).toBe('ok')               // só 401 derruba a sessão
  })

  it('CT-FE-12: 403 não derruba a sessão', async () => {
    setToken('ok')
    respond(403, { message: 'Você não tem permissão para esta operação.' })
    await expect(api.get('/users')).rejects.toThrow('permissão')
    expect(getToken()).toBe('ok')
    expect(window.location.href).toBe('/pdv')
  })
})
