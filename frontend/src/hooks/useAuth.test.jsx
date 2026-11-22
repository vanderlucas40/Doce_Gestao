import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth, parsePayload } from './useAuth'
import { fakeJwt, fakeJwtComCaracteresUrl } from '../test/jwt'

vi.mock('../api/auth', () => ({ authApi: { login: vi.fn() } }))
import { authApi } from '../api/auth'

const futuro  = () => Math.floor(Date.now() / 1000) + 3600
const passado = () => Math.floor(Date.now() / 1000) - 60
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('sessão (useAuth, RF01)', () => {
  beforeEach(() => localStorage.clear())

  it('CT-FE-13: lê perfil e loja do token', () => {
    const u = parsePayload(fakeJwt({ sub: 'operador.centro', role: 'OPERATOR', storeId: 1, exp: futuro() }))
    expect(u).toEqual({ username: 'operador.centro', role: 'OPERATOR', storeId: 1 })
  })

  it('CT-FE-14: token base64url com - ou _ e nome acentuado é lido corretamente (DEF-10)', () => {
    const token = fakeJwtComCaracteresUrl({ sub: 'joão.confeitaria', role: 'ADMIN', storeId: '', exp: futuro() })
    expect(token.split('.')[1]).toMatch(/[-_]/)
    expect(parsePayload(token)).toEqual({ username: 'joão.confeitaria', role: 'ADMIN', storeId: null })
  })

  it('CT-FE-15: token expirado ou malformado não abre sessão', () => {
    expect(parsePayload(fakeJwt({ sub: 'x', role: 'ADMIN', exp: passado() }))).toBeNull()
    expect(parsePayload('lixo')).toBeNull()
  })

  it('CT-FE-16: login guarda o token e expõe o perfil; logout limpa', async () => {
    const token = fakeJwt({ sub: 'admin', role: 'ADMIN', storeId: '', exp: futuro() })
    authApi.login.mockResolvedValue({ token })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(() => result.current.login('admin', 'admin123'))
    expect(localStorage.getItem('dg_token')).toBe(token)
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.session.username).toBe('admin')

    act(() => result.current.logout())
    expect(result.current.session).toBeNull()
    expect(localStorage.getItem('dg_token')).toBeNull()
  })

  it('CT-FE-17: sessão é restaurada ao recarregar a página; expirada é descartada', () => {
    localStorage.setItem('dg_token', fakeJwt({ sub: 'op', role: 'OPERATOR', storeId: 2, exp: futuro() }))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.session).toMatchObject({ username: 'op', storeId: 2 })

    localStorage.setItem('dg_token', fakeJwt({ sub: 'op', role: 'OPERATOR', exp: passado() }))
    const r2 = renderHook(() => useAuth(), { wrapper })
    expect(r2.result.current.session).toBeNull()
    expect(localStorage.getItem('dg_token')).toBeNull()
  })
})
