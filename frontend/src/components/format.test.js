import { describe, it, expect } from 'vitest'
import { fmtQty, fmtDateFull } from './ui'

describe('formatação pt-BR (RNF10)', () => {
  it('CT-FE-20: quantidades com vírgula, até 3 casas e sem arredondar para 1 casa (DEF-16)', () => {
    expect(fmtQty(1.05)).toBe('1,05')       // antes: "1.1" no Estoque
    expect(fmtQty('7.550')).toBe('7,55')    // antes: "7.5"
    expect(fmtQty(2.25)).toBe('2,25')       // antes: "2.3"
    expect(fmtQty(24)).toBe('24')           // antes: "24.000" (lido como vinte e quatro mil)
    expect(fmtQty(0.35)).toBe('0,35')
    expect(fmtQty(null)).toBe('0')
  })

  it('CT-FE-21: data completa dd/mm/aaaa para o CSV (DEF-20)', () => {
    expect(fmtDateFull('2026-11-22T17:13:00')).toBe('22/11/2026')
    expect(fmtDateFull('2025-12-31T23:59:00')).toBe('31/12/2025')
  })
})
