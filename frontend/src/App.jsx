import { useState }                         from 'react'
import { AuthProvider, useAuth }            from './hooks/useAuth'
import { StoreProvider, useStore }          from './hooks/useStore'
import { Topbar }                           from './components/Topbar'
import { Sidebar }                          from './components/Sidebar'
import { BottomNav }                        from './components/BottomNav'
import { EmptyState }                       from './components/EmptyState'
import { Login }                            from './pages/Login'
import { Dashboard }                        from './pages/Dashboard'
import { PDV }                              from './pages/PDV'
import { Estoque }                          from './pages/Estoque'
import { Relatorios }                       from './pages/Relatorios'
import { Cadastros }                        from './pages/Cadastros'
import { ProducaoLote }                     from './pages/ProducaoLote'
import { Users }                            from './pages/Users'
import { Menu }                             from './pages/Menu'

function FullPageSpinner({ label = 'Carregando...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant">
        <div className="w-12 h-12 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  )
}

function AppShell() {
  const { session, isAdmin } = useAuth()
  const { empty, loading }   = useStore()
  const [tab, setTab]        = useState('pdv')
  const [menuOpen, setMenuOpen] = useState(false)

  if (!session) return <Login />
  if (loading)  return <FullPageSpinner label="Carregando o sistema..." />

  if (empty) return (
    <div className="min-h-screen bg-background">
      <Topbar currentTab={tab} onTabChange={setTab} />
      <EmptyState />
    </div>
  )

  // ── Mapa de páginas — adicione novas features aqui ────────
  const pages = {
    dashboard:  <Dashboard onTabChange={setTab} />,
    pdv:        <PDV onTabChange={setTab} />,
    estoque:    <Estoque />,
    producao:   <ProducaoLote />,
    relatorios: <Relatorios />,
    cadastros:  isAdmin ? <Cadastros />  : <Dashboard />,
    equipe:     isAdmin ? <Users />      : <Menu onTabChange={setTab} />,
    menu:       <Menu onTabChange={setTab} />,
  }

  return (
    <div className="min-h-screen bg-background">
      <Topbar  currentTab={tab} onTabChange={setTab} onMenuClick={() => setMenuOpen(true)} />
      <Sidebar currentTab={tab} onTabChange={setTab} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>{pages[tab] ?? <PDV />}</main>
      <BottomNav currentTab={tab} onTabChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </AuthProvider>
  )
}
