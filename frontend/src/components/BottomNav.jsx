import { useAuth } from '../hooks/useAuth'
import { Icon }    from './ui'

export function BottomNav({ currentTab, onTabChange }) {
  const { isAdmin } = useAuth()

  const tabs = [
    { key: 'dashboard', label: 'Início',   icon: 'home'          },
    { key: 'pdv',       label: 'PDV',      icon: 'point_of_sale' },
    { key: 'producao',  label: 'Fornada',  icon: 'oven_gen'      },
    { key: isAdmin ? 'cadastros' : 'relatorios',
      label: isAdmin ? 'Cadastros' : 'Relatórios',
      icon:  isAdmin ? 'menu_book' : 'bar_chart'                },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-stone-50/80 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-8px_24px_rgba(43,22,19,0.06)]">
      {tabs.map(t => {
        const active = currentTab === t.key
        return (
          <button key={t.key} onClick={() => onTabChange(t.key)}
            className={`flex flex-col items-center justify-center px-4 py-2 transition-all duration-200 ${
              active
                ? 'bg-gradient-to-br from-orange-800 to-orange-400 text-white rounded-2xl px-5'
                : 'text-stone-500 hover:text-orange-700 scale-95'
            }`}>
            <Icon name={t.icon} fill={active} />
            <span className="text-[10px] uppercase tracking-widest font-bold mt-1">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
