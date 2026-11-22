import { useStore }                                    from '../hooks/useStore'
import { useFetch }                                    from '../hooks/useFetch'
import { salesApi }                                    from '../api'
import { Icon, Card, fmtBRL, fmtTime }                from '../components/ui'
import { variation }                                   from '../utils/trend'

export function Dashboard() {
  const { currentStore } = useStore()
  const storeId = currentStore?.id

  const { data, loading, error, refetch } =
    useFetch(() => salesApi.dashboard(storeId), [storeId])

  if (!storeId) return <PageState icon="store" msg="Selecione uma loja para ver o dashboard." />
  if (loading)  return <PageState spinner msg="Carregando dashboard..." />
  if (error)    return <PageState icon="error" msg={error} action={refetch} actionLabel="Tentar novamente" />

  const {
    totalToday       = 0,
    salesCountToday  = 0,
    totalYesterday      = 0,
    salesCountYesterday = 0,
    lowStockProducts    = [],
    lowStockIngredients = [],
    recentSales      = [],
  } = data || {}

  const alertCount = lowStockProducts.length + lowStockIngredients.length
  // Variação real contra ontem (antes eram "+12%" e "+5%" fixos no código)
  const revenueTrend = variation(totalToday, totalYesterday)
  const salesTrend   = variation(salesCountToday, salesCountYesterday)
  const topProducts = buildTopProducts(recentSales).slice(0, 2)

  return (
    <div className="pt-20 pb-28 md:pt-8 md:pb-8 md:pl-72 px-6 md:px-12 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 md:pt-8">
        <div>
          <h2 className="text-3xl font-serif text-on-background mb-2">Painel de Controle</h2>
          <p className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
            Resumo do Dia &bull;{' '}
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-xl font-bold shadow-lg text-sm self-start md:self-auto hover:opacity-90 transition-opacity">
          <Icon name="add" />
          Nova Venda
        </button>
      </header>

      {/* ── Bento de métricas ──────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <MetricCard icon="payments"      label="Receita Total"      value={fmtBRL(totalToday)}                          trend={revenueTrend?.label} trendUp={revenueTrend?.up} />
        <MetricCard icon="shopping_bag"  label="Vendas Concluídas"  value={`${salesCountToday} Pedidos`}               trend={salesTrend?.label}   trendUp={salesTrend?.up} />
        <MetricCard icon="warning"       label="Alertas de Estoque" value={`${alertCount} ${alertCount === 1 ? 'Item' : 'Itens'}`} urgent={alertCount > 0} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Coluna principal ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Vendas Recentes */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-serif">Vendas Recentes</h3>
              <button className="text-primary font-bold text-sm hover:underline">Ver todas</button>
            </div>
            <div className="space-y-3">
              {recentSales.length === 0
                ? <Empty msg="Nenhuma venda registrada hoje" />
                : recentSales.slice(0, 5).map(sale => <SaleRow key={sale.id} sale={sale} />)
              }
            </div>
          </section>

          {/* Alertas de estoque */}
          {alertCount > 0 && (
            <section>
              <h3 className="text-2xl font-serif mb-6">Alertas de Estoque</h3>
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                <div className="space-y-6 relative z-10">
                  {[...lowStockProducts, ...lowStockIngredients].map((item, i) => {
                    const name = item.productName || item.ingredientName
                    const pct  = item.maxQuantity
                      ? Math.round((item.quantity / item.maxQuantity) * 100)
                      : 0
                    return (
                      <div key={i} className="flex items-center gap-6">
                        <div className="h-1.5 flex-1 bg-outline-variant/30 rounded-full overflow-hidden">
                          <div className="bg-error h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-44">
                          <p className="font-bold text-sm">{name}</p>
                          <p className="text-xs text-error font-semibold">
                            {item.status === 'OUT' ? 'Esgotado' : `${item.quantity} restantes`}
                          </p>
                        </div>
                        <button className="bg-white border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-colors whitespace-nowrap">
                          Repor
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </section>
          )}
        </div>

        {/* ── Sidebar: Mais Vendidos ─────────────────────────── */}
        <aside>
          <h3 className="text-2xl font-serif mb-6">Mais Vendidos</h3>
          {topProducts.length === 0
            ? <Empty msg="Sem dados de venda ainda" />
            : <div className="space-y-8">{topProducts.map((p, i) => <TopProductCard key={p.name} product={p} rank={i + 1} />)}</div>
          }

          <Card className="mt-8 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Resumo Rápido</h4>
            {[
              { label: 'Ticket médio', value: salesCountToday > 0 ? fmtBRL(totalToday / salesCountToday) : 'R$ 0,00' },
              { label: 'Loja',         value: currentStore?.name },
              { label: 'Estoque baixo', value: alertCount > 0 ? `${alertCount} itens` : 'Tudo OK', color: alertCount > 0 ? 'text-error' : 'text-secondary' },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{r.label}</span>
                <span className={`font-bold truncate max-w-[140px] ${r.color || ''}`}>{r.value}</span>
              </div>
            ))}
          </Card>
        </aside>
      </div>
    </div>
  )
}

// ── Metric Card ───────────────────────────────────────────────
function MetricCard({ icon, label, value, trend, trendUp, urgent }) {
  return (
    <div className={`p-6 rounded-[2rem] flex flex-col justify-between h-48 transition-colors ${
      urgent ? 'bg-error-container border border-error/5' : 'bg-surface-container-low hover:bg-surface-container'
    }`}>
      <div className="flex justify-between items-start">
        <span className="p-3 bg-white rounded-2xl shadow-sm">
          <Icon name={icon} fill className={urgent ? 'text-error' : 'text-primary'} />
        </span>
        {trend && !urgent && (
          <span title="Comparado a ontem" className={`${trendUp ? 'text-secondary' : 'text-error'} font-bold text-sm flex items-center gap-1`}>
            {trend} <Icon name={trendUp ? 'trending_up' : 'trending_down'} className="text-base" />
          </span>
        )}
        {urgent && <span className="bg-error text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Urgente</span>}
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${urgent ? 'text-on-error-container' : 'text-on-surface-variant'}`}>{label}</p>
        <h3 className={`text-3xl font-serif ${urgent ? 'text-on-error-container' : 'text-on-background'}`}>{value}</h3>
      </div>
    </div>
  )
}

// ── Sale Row ──────────────────────────────────────────────────
function SaleRow({ sale }) {
  const icons = ['cake', 'cookie', 'bakery_dining', 'set_meal']
  const icon  = icons[sale.id % icons.length]
  const first = sale.items?.[0]
  const name  = first
    ? sale.items.length > 1 ? `${first.productName} +${sale.items.length - 1}` : first.productName
    : `Venda #${sale.id}`

  return (
    <div className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl shadow-[0_2px_12px_rgba(43,22,19,0.06)] border border-outline-variant/10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center">
          <Icon name={icon} fill className="text-primary-container" />
        </div>
        <div>
          <h4 className="font-bold text-on-background text-sm">{name}</h4>
          <p className="text-xs text-on-surface-variant">#{sale.id} &bull; {fmtTime(sale.soldAt)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">{fmtBRL(sale.total)}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-secondary-container text-on-secondary-container">
          Entregue
        </span>
      </div>
    </div>
  )
}

// ── Top Product Card ──────────────────────────────────────────
function TopProductCard({ product, rank }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative mb-3 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-fixed via-surface-container-high to-surface-container h-52 flex items-center justify-center">
        <Icon name="cake" fill className="text-primary opacity-20" style={{ fontSize: '120px' }} />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase text-primary tracking-widest">
          Top {String(rank).padStart(2, '0')}
        </div>
      </div>
      <h4 className="font-serif text-xl mb-1">{product.name}</h4>
      <div className="flex justify-between items-center text-sm">
        <p className="text-on-surface-variant">{product.qty} venda{product.qty !== 1 ? 's' : ''}</p>
        <p className="font-bold text-primary">{fmtBRL(product.total)}</p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function buildTopProducts(sales) {
  const map = {}
  for (const sale of (sales || [])) {
    for (const item of (sale.items || [])) {
      if (!map[item.productName]) map[item.productName] = { name: item.productName, qty: 0, total: 0 }
      map[item.productName].qty   += item.quantity
      map[item.productName].total += item.quantity * Number(item.unitPrice)
    }
  }
  return Object.values(map).sort((a, b) => b.qty - a.qty)
}

function Empty({ msg }) {
  return <p className="text-sm text-on-surface-variant/60 text-center py-8">{msg}</p>
}

function PageState({ spinner, icon, msg, action, actionLabel }) {
  return (
    <div className="pt-20 md:pl-72 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant text-center px-8">
        {spinner
          ? <div className="w-10 h-10 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
          : icon && <Icon name={icon} className="text-5xl text-outline" />}
        <p className="text-sm">{msg}</p>
        {action && (
          <button onClick={action} className="px-6 py-2 border border-outline-variant rounded-xl text-sm hover:bg-surface-container transition-colors">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
