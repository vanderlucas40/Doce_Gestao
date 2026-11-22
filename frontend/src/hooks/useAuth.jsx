import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import { setToken, getToken, clearToken } from '../api/client'

const AuthContext = createContext(null)

/** Decodifica o payload do JWT sem biblioteca externa */
function parsePayload(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
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
