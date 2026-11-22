import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import { setToken, getToken, clearToken } from '../api/client'

const AuthContext = createContext(null)

/**
 * Decodifica o segmento base64url do JWT. O atob() puro falha com '-' e '_' (base64url)
 * e corrompe acentos (UTF-8), o que fazia a sessão perder perfil e loja em parte dos
 * logins, conforme o horário de expiração gerava esses caracteres (DEF-10).
 */
export function decodeBase64Url(segment) {
  const b64    = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bytes  = Uint8Array.from(atob(padded), c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

/** Decodifica o payload do JWT sem biblioteca externa; null se inválido ou expirado */
export function parsePayload(token) {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1]))
    // Verifica expiração (exp está em segundos)
    if (payload.exp && Date.now() / 1000 > payload.exp) return null
    return {
      username: payload.sub,
      role:     payload.role    || 'OPERATOR',
      storeId:  payload.storeId || null,
    }
  } catch {
    return null
  }
}

/** Lê sessão existente do localStorage ao carregar a página */
function restoreSession() {
  const token = getToken()
  if (!token) return null
  const user = parsePayload(token)
  if (!user) { clearToken(); return null }   // token expirado
  return { token, ...user }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(restoreSession)   // ← restaura no F5

  const login = useCallback(async (username, password) => {
    const data = await authApi.login({ username, password })
    setToken(data.token)
    const user = parsePayload(data.token)
    setSession({ token: data.token, ...user })
    return user
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      session,
      login,
      logout,
      isAdmin: session?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve estar dentro de AuthProvider')
  return ctx
}
