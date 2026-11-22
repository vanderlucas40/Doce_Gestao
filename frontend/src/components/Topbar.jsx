import { useState }  from 'react'
import { useAuth }   from '../hooks/useAuth'
import { useStore }  from '../hooks/useStore'
import { Icon }      from './ui'

const STORE_COLORS = ['#924a3a','#516447','#635e53','#6b4f2b','#3a5a6a']

export function Topbar({ currentTab, onTabChange }) {
  const { session, logout, isAdmin }              = useAuth()
  const { stores, currentStore, setCurrentStore } = useStore()
  const [storeOpen, setStoreOpen] = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)

  const tabs = [
    { key: 'dashboard',  label: 'Dashboard'  },
    { key: 'pdv',        label: 'PDV'        },
    { key: 'estoque',    label: 'Estoque'    },
    { key: 'producao',   label: 'Fornada'    },
    { key: 'relatorios', label: 'Relatórios' },
    ...(isAdmin ? [
      { key: 'cadastros', label: 'Cadastros' },
      { key: 'equipe',    label: 'Equipe'    },
    ] : []),
  ]

  const storeIdx = stores.findIndex(s => s.id === currentStore?.id)
  const dotColor = STORE_COLORS[storeIdx % STORE_COLORS.length] || STORE_COLORS[0]

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-stone-50/80 backdrop-blur-lg shadow-[0_8px_24px_rgba(43,22,19,0.06)] flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Icon name="menu" className="text-orange-900 cursor-pointer" />
          <h1 className="font-serif italic text-xl text-orange-900">JM Bolos e Confeitaria</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Links desktop — overflow scroll se necessário */}
          <div className="hidden md:flex gap-4 mr-3 overflow-x-auto max-w-md">
            {tabs.map(t => (
              <button key={t.key} onClick={() => onTabChange(t.key)}
                className={`text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                  currentTab === t.key ? 'text-orange-800' : 'text-stone-500 hover:text-orange-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Seletor de loja — só admin */}
          {isAdmin && (
            <button onClick={() => setStoreOpen(true)}
              className="hidden md:flex items-center gap-2 bg-surface-container-low border border-outline-variant/30 rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="w-2 h-2 rounded-full" style={{ background: dotColor }} />
              <span className="max-w-[90px] truncate">{currentStore?.name || 'Loja'}</span>
              <Icon name="expand_more" className="text-sm text-outline flex-shrink-0" />
            </button>
          )}

          {/* Avatar + dropdown */}
          <div className="relative">
            <button onClick={() => setUserOpen(o => !o)}
              className="w-10 h-10 rounded-full bg-surface-dim border-2 border-primary-container flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
              {session?.username?.[0]?.toUpperCase() || 'U'}
            </button>

            {userOpen && (
              <div className="absolute right-0 top-12 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-2 w-56 shadow-[0_24px_48px_rgba(43,22,19,0.12)] z-50"
                onMouseLeave={() => setUserOpen(false)}>
                <div className="px-3 py-2 border-b border-outline-variant/10 mb-1">
                  <p className="font-bold text-sm text-on-surface">{session?.username}</p>
                  <p className="text-xs text-on-surface-variant">
                    {session?.role === 'ADMIN' ? 'Administrador' : 'Operador'}
                  </p>
                  {currentStore && (
                    <p className="text-xs text-on-surface-variant mt-0.5">{currentStore.name}</p>
                  )}
                </div>
                <button onClick={() => { setUserOpen(false); onTabChange('menu') }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  <Icon name="manage_accounts" className="text-base" /> Perfil
                </button>
                <button onClick={() => { setUserOpen(false); logout() }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-error hover:bg-error-container/20 transition-colors">
                  <Icon name="logout" className="text-base" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal seleção de loja */}
      {storeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-background/30 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setStoreOpen(false)}>
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-72 shadow-[0_24px_48px_rgba(43,22,19,0.12)] border border-outline-variant/15">
            <p className="font-serif text-lg mb-4">Selecionar Loja</p>
            {stores.map((s, i) => (
              <button key={s.id} onClick={() => { setCurrentStore(s); setStoreOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors text-left ${
                  s.id === currentStore?.id ? 'bg-primary-fixed/40' : 'hover:bg-surface-container-low'
                }`}>
                <span className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: STORE_COLORS[i % STORE_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{s.address}</p>
                </div>
                {s.id === currentStore?.id && <Icon name="check" className="text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
