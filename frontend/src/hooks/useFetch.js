import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook genérico para buscar dados de uma função assíncrona.
 *
 * @param {Function} fetchFn         - função que retorna uma Promise
 * @param {Array}    deps            - dependências para re-executar (como useEffect)
 * @param {Object}   [options]
 * @param {boolean}  [options.enabled=true] - false não chama a API (ex.: loja ainda não carregada)
 *
 * Sem `enabled`, as telas chamavam /stores/undefined/... antes de a loja carregar,
 * e uma resposta antiga podia sobrescrever a nova (DEF-15).
 *
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(fetchFn, deps = [], { enabled = true } = {}) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error,   setError]   = useState(null)
  const lastCall = useRef(0)

  const run = useCallback(async () => {
    const call = ++lastCall.current
    if (!enabled) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      if (call === lastCall.current) setData(result)
    } catch (err) {
      if (call === lastCall.current) setError(err.message || 'Erro desconhecido')
    } finally {
      if (call === lastCall.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled])

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}
