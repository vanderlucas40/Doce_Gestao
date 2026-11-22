import { createContext, useContext, useState, useEffect } from 'react'
import { storesApi } from '../api'
import { useAuth } from './useAuth'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { session } = useAuth()
  const [stores,       setStores]       = useState([])
  const [currentStore, setCurrentStore] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [empty,        setEmpty]        = useState(false)

  const reload = () => {
    if (!session) { setLoading(false); return }
    setLoading(true)
    storesApi.list()
      .then(data => {
        setStores(data)
        setEmpty(data.length === 0)
        if (data.length === 0) return

        if (session.role === 'OPERATOR' && session.storeId) {
          const linked = data.find(s => s.id === Number(session.storeId))
          setCurrentStore(linked || data[0])
        } else {
          setCurrentStore(prev => prev ? data.find(s => s.id === prev.id) || data[0] : data[0])
        }
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [session])

  return (
    <StoreContext.Provider value={{ stores, currentStore, setCurrentStore, loading, empty, reload }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve estar dentro de StoreProvider')
  return ctx
}
