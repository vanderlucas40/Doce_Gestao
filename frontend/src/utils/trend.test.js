import { describe, it, expect } from 'vitest'
import { variation } from './trend'

describe('variação do Dashboard em relação a ontem (RF11)', () => {
  it('CT-FE-18: alta, queda e estabilidade com percentual arredondado', () => {
    expect(variation(540, 450)).toEqual({ label: '+20%', up: true })
    expect(variation('95.00', '100.00')).toEqual({ label: '-5%', up: false })
    expect(variation(100, 100)).toEqual({ label: '0%', up: true })
    expect(variation(0, 80)).toEqual({ label: '-100%', up: false })
  })

  it('CT-FE-19: sem movimento ontem não há percentual (nada inventado na tela)', () => {
    expect(variation(300, 0)).toBeNull()
    expect(variation(300, null)).toBeNull()
    expect(variation(0, undefined)).toBeNull()
  })
})
