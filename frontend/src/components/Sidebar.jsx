import { useAuth }  from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import { Icon }     from './ui'

export function Sidebar({ currentTab, onTabChange, mobileOpen = false, onClose = () => {} }) {
  const { isAdmin, logout, session } = useAuth()
  const { currentStore }             = useStore()

  const tabs = [
    { key: 'dashboard',  label: 'Dashboard',    icon: 'dashboard'   },
    { key: 'pdv',        label: 'Vendas (PDV)', icon: 'payments'    },
    { key: 'estoque',    label: 'Estoque',      icon: 'inventory_2' },
    { key: 'producao',   label: 'Fornada',      icon: 'oven_gen'    },
    { key: 'relatorios', label: 'Relatórios',   icon: 'bar_chart'   },
    ...(isAdmin ? [
      { key: 'cadastros', label: 'Cadastros',   icon: 'menu_book'   },
      { key: 'equipe',    label: 'Equipe',      icon: 'group'       },
    ] : []),
  ]

  // No celular a barra lateral vira gaveta aberta pelo ☰ (DEF-19); escolher uma tela fecha a gaveta
  const go = key => { onTabChange(key); onClose() }

  return (
    <>
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 bg-black/30 z-[55]" onClick={onClose} aria-hidden="true" />
    )}
    <aside className={`${mobileOpen ? 'flex z-[60]' : 'hidden'} md:flex fixed left-0 top-0 h-screen w-72 bg-stone-100 flex-col p-6 md:z-40 rounded-r-3xl overflow-y-auto`}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Icon name="cake" fill className="text-white" />
        </div>
        <div>
          <h2 className="font-serif text-lg text-orange-900 leading-tight">JM Confeitaria</h2>
          <p className="text-xs text-stone-500 uppercase tracking-tighter">Gestão Profissional</p>
        </div>
      </div>

      {currentStore && (
        <div className="mb-6 px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Loja ativa</p>
          <p className="font-bold text-sm text-on-surface">{currentStore.name}</p>
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {tabs.map(t => {
          const active = currentTab === t.key
          return (
            <button key={t.key} onClick={() => go(t.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:translate-x-1 ${
                active ? 'bg-orange-100/80 text-orange-900' : 'text-stone-500 hover:text-stone-700'
              }`}>
              <Icon name={t.icon} fill={active} />
              <span className="font-semibold tracking-wide text-sm">{t.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-outline-variant/20 pt-4 mt-4">
        <div className="flex items-center gap-3 px-4 mb-3">
          <div className="w-8 h-8 rounded-full bg-surface-dim flex items-center justify-center font-bold text-primary text-xs flex-shrink-0">
            {session?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-on-surface truncate">{session?.username}</p>
            <p className="text-xs text-on-surface-variant">{session?.role === 'ADMIN' ? 'Admin' : 'Operador'}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-stone-500 hover:bg-error-container/20 hover:text-error transition-colors">
          <Icon name="logout" />
          Sair
        </button>
      </div>
    </aside>
    </>
  )
}
