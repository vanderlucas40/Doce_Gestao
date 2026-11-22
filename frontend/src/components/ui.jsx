import { useState, useCallback } from 'react'

// ── Ícone Material ────────────────────────────────────────────
export function Icon({ name, fill = false, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" } : undefined}
    >
      {name}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 32, label = '' }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="border-2 border-primary-container border-t-primary rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
      {label && <p className="text-sm text-on-surface-variant">{label}</p>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ children, onClose, maxWidth = 'max-w-md' }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-on-background/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div className={`bg-surface rounded-[2rem] w-full ${maxWidth} p-8 shadow-[0_24px_48px_rgba(43,22,19,0.12)] relative overflow-hidden`}>
        {children}
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
export function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-28 md:bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white text-sm font-bold z-[70] shadow-lg whitespace-nowrap transition-all ${
      type === 'error' ? 'bg-error' : 'bg-secondary'
    }`}>
      {msg}
    </div>
  )
}

// ── Badge de status ───────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = {
    OK:  { label: 'Estável', cls: 'bg-secondary-container text-on-secondary-container' },
    LOW: { label: 'Alerta',  cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
    OUT: { label: 'Crítico', cls: 'bg-primary-fixed text-on-primary-fixed-variant' },
  }
  const s = cfg[status] || cfg.OK
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${s.cls}`}>
      {s.label}
    </span>
  )
}

// ── Barra de estoque ──────────────────────────────────────────
export function StockBar({ quantity, maxQuantity, className = '' }) {
  const pct   = maxQuantity > 0 ? Math.min(100, Math.round((quantity / maxQuantity) * 100)) : 0
  const color = pct === 0 ? 'bg-error' : pct < 30 ? 'bg-primary-container' : 'bg-secondary'
  return (
    <div className={`h-1.5 w-full bg-stone-200 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div className={`bg-surface-container-lowest rounded-3xl ${padding} shadow-[0_2px_12px_rgba(43,22,19,0.06)] border border-outline-variant/10 ${className}`}>
      {children}
    </div>
  )
}

// ── Formatadores ──────────────────────────────────────────────
export const fmtBRL  = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
/** Quantidade em pt-BR: vírgula decimal, até 3 casas, sem zeros à direita (8,5 · 0,35 · 24) — DEF-16 */
export const fmtQty  = v => Number(v ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
/** Data completa dd/mm/aaaa (RNF10), usada no CSV — DEF-20 */
export const fmtDateFull = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const fmtDate = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
export const fmtTime = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

// ── Hook de toast ─────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }, [])
  return { toast, show }
}
