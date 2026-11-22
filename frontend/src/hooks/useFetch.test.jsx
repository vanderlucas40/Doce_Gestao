import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch } from './useFetch'

describe('useFetch (DEF-15)', () => {
  it('CT-FE-22: com enabled=false não chama a API (loja ainda não carregada)', async () => {
    const fn = vi.fn().mockResolvedValue('x')
    const { result } = renderHook(() => useFetch(fn, [undefined], { enabled: false }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fn).not.toHaveBeenCalled()
    expect(result.current.data).toBeNull()
  })

  it('CT-FE-23: busca quando a loja chega e ignora resposta antiga que chega depois', async () => {
    let resolverLenta
    const lenta  = new Promise(r => { resolverLenta = r })
    const fn = vi.fn()
      .mockImplementationOnce(() => lenta)                      // loja 1 (demorada)
      .mockImplementationOnce(() => Promise.resolve('loja 2'))  // loja 2 (rápida)

    const { result, rerender } = renderHook(({ id }) => useFetch(fn, [id], { enabled: !!id }), {
      initialProps: { id: undefined },
    })
    expect(fn).not.toHaveBeenCalled()

    rerender({ id: 1 })
    rerender({ id: 2 })
    await waitFor(() => expect(result.current.data).toBe('loja 2'))

    resolverLenta('loja 1')                                     // chega atrasada
    await new Promise(r => setTimeout(r, 0))
    expect(result.current.data).toBe('loja 2')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
