import { Icon } from '../components/ui'
import { useAuth }  from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import { useState } from 'react'


// Atalhos para telas fora da barra inferior (antes eram itens sem ação — DEF-19)
const MENU_ITEMS = [
  { tab: 'estoque',    icon: 'inventory_2', label: 'Estoque',    sub: 'Produtos e insumos da loja', color: 'bg-primary/10 text-primary' },
  { tab: 'relatorios', icon: 'analytics',   label: 'Relatórios', sub: 'Vendas por período e CSV',   color: 'bg-secondary/10 text-secondary' },
  { tab: 'cadastros',  icon: 'menu_book',   label: 'Cadastros',  sub: 'Produtos, insumos e fichas', color: 'bg-primary/10 text-primary',     admin: true },
  { tab: 'equipe',     icon: 'group',       label: 'Equipe',     sub: 'Usuários e acessos',         color: 'bg-tertiary-fixed text-tertiary', admin: true },
]

export function Menu({ onTabChange = () => {} }) {
  const { session, logout, isAdmin } = useAuth()
  const { stores, currentStore, setCurrentStore } = useStore()
  const [storeOpen, setStoreOpen] = useState(false)

  return (
    <div className="pt-20 pb-32 md:pt-8 md:pb-8 md:pl-72 px-6 max-w-2xl mx-auto">

      {/* ── Perfil do usuário ─────────────────────────────── */}
      <section className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-surface-container-high border-4 border-surface-container flex items-center justify-center shadow-xl">
            <span className="font-serif text-4xl text-primary">
              {session?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <button className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full text-white shadow-lg border-2 border-surface">
            <Icon name="edit" className="text-sm" />
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-serif text-on-surface">{session?.username}</h2>
          <p className="text-sm uppercase tracking-widest text-on-surface-variant opacity-70 font-bold">
            {session?.role === 'ADMIN' ? 'Administrador' : 'Operador de Caixa'}
          </p>
          {currentStore && (
            <p className="text-sm text-on-surface-variant mt-1">{currentStore.name}</p>
          )}
        </div>
      </section>

      {/* ── Trocar loja (admin) ───────────────────────────── */}
      {isAdmin && stores.length > 1 && (
        <section className="mb-6">
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-outline px-2 mb-3 font-bold">
            Loja Ativa
          </h3>
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-card">
            <button
              onClick={() => setStoreOpen(o => !o)}
              className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="store" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{currentStore?.name || 'Selecionar loja'}</p>
                  <p className="text-xs text-on-surface-variant">{currentStore?.address}</p>
                </div>
              </div>
              <Icon name={storeOpen ? 'expand_less' : 'expand_more'} className="text-outline-variant" />
            </button>

            {storeOpen && (
              <div className="border-t border-outline-variant/10">
                {stores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setCurrentStore(s); setStoreOpen(false) }}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-container-low ${
                      s.id === currentStore?.id ? 'bg-primary-fixed/20' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      s.id === currentStore?.id ? 'bg-primary' : 'bg-outline-variant'
                    }`} />
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs text-on-surface-variant">{s.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Itens de menu ─────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-outline px-2 mb-3 font-bold">
            Telas
          </h3>
          <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-card">
            <nav className="flex flex-col">
              {MENU_ITEMS.filter(item => !item.admin || isAdmin).map((item, i, items) => (
                <button
                  key={item.label}
                  onClick={() => onTabChange(item.tab)}
                  className={`flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors group ${
                    i < items.length - 1 ? 'border-b border-outline-variant/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl ${item.color}`}>
                      <Icon name={item.icon} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-on-surface text-sm">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.sub}</p>
                    </div>
                  </div>
                  <Icon
                    name="chevron_right"
                    className="text-outline-variant group-hover:translate-x-1 transition-transform"
                  />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Sessão */}
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-outline px-2 mb-3 font-bold">
            Sessão
          </h3>
          <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-card">
            <button
              onClick={logout}
              className="w-full flex items-center gap-4 p-5 hover:bg-error-container/20 transition-colors group"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-error-container/30 text-error">
                <Icon name="logout" />
              </div>
              <span className="font-medium text-error">Sair</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="pt-10 text-center space-y-1 opacity-50">
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
          JM Bolos e Confeitaria v2.0
        </p>
        <p className="text-[11px] text-on-surface-variant">
          Desenvolvido com excelência artesanal © 2025
        </p>
      </footer>
    </div>
  )
}
