import { describe, it, expect } from 'vitest'
import { todayISO } from './date'

describe('todayISO', () => {
  it('CT-FE-07: usa a data local, não a UTC (venda às 22h continua no mesmo dia — RNF10)', () => {
    expect(todayISO(new Date(2026, 10, 20, 22, 30))).toBe('2026-11-20')
    expect(todayISO(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
  })
})
