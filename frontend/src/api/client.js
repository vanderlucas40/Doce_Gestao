/**
 * Instância Axios centralizada — Doce Gestão v2
 *
 * Contratos de erro do GlobalExceptionHandler:
 *   { status, error, message, timestamp }              → maioria dos erros
 *   { status, error, message, fields: {campo: msg} }   → validação (@Valid)
 *   { status, error, message, timestamp }              → 409 DataIntegrity
 *
 * O interceptor sempre propaga err.message com o texto amigável do backend.
 * Para erros de validação com múltiplos campos, também expõe err.fields.
 */
import axios from 'axios'

const TOKEN_KEY = 'dg_token'

export const getToken   = ()      => localStorage.getItem(TOKEN_KEY)
export const setToken   = token   => token
  ? localStorage.setItem(TOKEN_KEY, token)
  : localStorage.removeItem(TOKEN_KEY)
export const clearToken = ()      => localStorage.removeItem(TOKEN_KEY)

// ── Instância base ────────────────────────────────────────────
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: injeta Bearer token ──────────────────
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Response interceptor: trata erros globalmente ─────────────
api.interceptors.response.use(
  response => response,
  error => {
    // 401 → sessão expirada ou inválida
    if (error.response?.status === 401) {
      clearToken()
      window.location.href = '/'
      return Promise.reject(new Error('Sessão expirada. Redirecionando...'))
    }

    const data = error.response?.data

    // Mensagem principal: vem sempre em data.message
    // Para validação, o GlobalExceptionHandler agora coloca o primeiro campo inválido em message
    const msg =
      data?.message      ||
      data?.error        ||
      error.message      ||
      'Erro desconhecido'

    // Cria o erro enriquecido
    const enriched     = new Error(msg)
    enriched.status    = error.response?.status
    enriched.fields    = data?.fields    || null   // { name: "Nome é obrigatório", ... }
    enriched.errorCode = data?.error     || null   // "Bad Request", "Conflict", etc.

    return Promise.reject(enriched)
  }
)
