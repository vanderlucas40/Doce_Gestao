import { useState, useEffect, useCallback } from 'react'
import { useStore }                          from '../hooks/useStore'
import { salesApi }                          from '../api'
import { Icon, Card, Toast, useToast, fmtBRL, fmtDate, fmtTime } from '../components/ui'

// ── Helpers de data ───────────────────────────────────────────
const toISO   = d => d.toISOString().slice(0, 10)
const today   = () => toISO(new Date())
const daysAgo = n  => { const d = new Date(); d.setDate(d.getDate() - n); return toISO(d) }

const PRESETS = [
  { label: 'Hoje',        from: today,             to: today             },
  { label: 'Ontem',       from: () => daysAgo(1),  to: () => daysAgo(1)  },
  { label: 'Últimos 7d',  from: () => daysAgo(6),  to: today             },
  { label: 'Este mês',    from: () => toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: today },
]

// Limite do backend: 366 dias
const MAX_RANGE_DAYS = 366

export function Relatorios() {
  const { currentStore }           = useStore()
  const storeId                    = currentStore?.id
  const { toast, show: showToast } = useToast()

  const [from,         setFrom]         = useState(daysAgo(6))
  const [to,           setTo]           = useState(today())
  const [sales,        setSales]        = useState([])
  const [loading,      setLoading]      = useState(false)
  const [activePreset, setActivePreset] = useState(2)
  const [rangeError,   setRangeError]   = useState(null)

  // ── Validação de range no cliente ─────────────────────────────
  function validateRange(f, t) {
    const diff = Math.round((new Date(t) - new Date(f)) / (1000 * 60 * 60 * 24))
    if (new Date(f) > new Date(t)) return 'A data inicial não pode ser posterior à data final.'
    if (diff > MAX_RANGE_DAYS)    return `O intervalo máximo é de ${MAX_RANGE_DAYS} dias.`
    return null
  }

  // ── Busca com único request /by-range ─────────────────────────
  const fetchSales = useCallback(async () => {
    if (!storeId) return
    const err = validateRange(from, to)
    if (err) { setRangeError(err); return }
    setRangeError(null)
    setLoading(true)
    try {
      // 1 request em vez de N — backend faz a query de range direto no banco
      const data = await salesApi.byRange(storeId, from, to)
      setSales(data)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [storeId, from, to])

  useEffect(() => { fetchSales() }, [fetchSales])

  function applyPreset(i) {
    setActivePreset(i)
    setFrom(PRESETS[i].from())
    setTo(PRESETS[i].to())
  }

  function handleFromChange(val) {
    setFrom(val)
    setActivePreset(-1)
    setRangeError(validateRange(val, to))
  }

  function handleToChange(val) {
    setTo(val)
    setActivePreset(-1)
    setRangeError(validateRange(from, val))
  }

  // ── Métricas do período ────────────────────────────────────────
  const total      = sales.reduce((s, v) => s + Number(v.total), 0)
  const count      = sales.length
  const ticket     = count > 0 ? total / count : 0
  const topProducts = buildTopProducts(sales)
  const topProduct  = topProducts[0]

  // ── CSV export ────────────────────────────────────────────────
  function exportCSV() {
    const rows = [
      ['ID', 'Data', 'Hora', 'Produtos', 'Total (R$)'],
      ...sales.map(s => [
        s.id,
        fmtDate(s.soldAt),
        fmtTime(s.soldAt),
        (s.items || []).map(i => `${i.productName} (${i.quantity}x)`).join(' | '),
        Number(s.total).toFixed(2).replace('.', ','),
      ])
    ]
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href:     url,
      download: `vendas_${from}_${to}.csv`
    })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`${count} vendas exportadas!`)
  }

  if (!storeId) return (
    <PageState icon="store" msg="Selecione uma loja para ver os relatórios." />
  )

  return (
    <div className="pt-20 pb-28 md:pt-8 md:pb-8 md:pl-72 px-6 md:px-12 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 md:pt-8 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Financeiro</span>
          <h2 className="text-3xl font-serif text-on-surface mt-1">Relatório de Vendas</h2>
        </div>
        <button
          onClick={exportCSV}
          disabled={sales.length === 0 || loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            sales.length === 0 || loading
              ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
              : 'bg-gradient-to-br from-secondary to-on-secondary-container text-white shadow-lg hover:opacity-90'
          }`}
        >
          <Icon name="download" />
          Exportar CSV
        </button>
      </div>

      {/* ── Filtros ────────────────────────────────────────── */}
      <Card className="mb-8">
        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(i)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activePreset === i
                  ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Datas customizadas */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Data inicial
            </label>
            <input type="date" value={from} max={to}
              onChange={e => handleFromChange(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Data final
            </label>
            <input type="date" value={to} min={from} max={today()}
              onChange={e => handleToChange(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20" />
          </div>
          <button onClick={fetchSales} disabled={!!rangeError || loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              rangeError || loading
                ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                : 'bg-primary text-white hover:opacity-90'
            }`}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Buscando...</>
              : <><Icon name="search" /> Buscar</>
            }
          </button>
        </div>

        {/* Erro de range */}
        {rangeError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-error bg-error-container/30 rounded-xl px-4 py-2">
            <Icon name="warning" className="text-base flex-shrink-0" />
            {rangeError}
          </div>
        )}
      </Card>

      {/* ── Métricas do período ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <PeriodCard icon="payments"     color="text-primary"              label="Faturamento"  value={fmtBRL(total)} />
        <PeriodCard icon="shopping_bag" color="text-secondary"            label="Vendas"       value={`${count} pedidos`} />
        <PeriodCard icon="receipt_long" color="text-tertiary"             label="Ticket médio" value={fmtBRL(ticket)} />
        <PeriodCard icon="star"         color="text-on-tertiary-fixed-variant" label="Top produto" value={topProduct?.name || '—'} small />
      </div>

      {/* ── Tabela de vendas ────────────────────────────────── */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="font-serif text-lg">
            {loading
              ? 'Buscando vendas...'
              : `${count} venda${count !== 1 ? 's' : ''} encontrada${count !== 1 ? 's' : ''}`
            }
          </h3>
          {loading && <div className="w-5 h-5 border-2 border-primary-container border-t-primary rounded-full animate-spin" />}
        </div>

        {!loading && sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
            <Icon name="receipt_long" className="text-5xl text-outline" />
            <p className="text-sm">Nenhuma venda no período selecionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  {['#','Data','Hora','Itens','Total',''].map(h => (
                    <th key={h} className="px-6 py-4 text-xs text-on-surface-variant tracking-wider uppercase font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {sales.map(sale => <SaleTableRow key={sale.id} sale={sale} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Totalizador */}
        {sales.length > 0 && !loading && (
          <div className="px-6 py-4 border-t border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
            <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
              Total do período
            </span>
            <span className="font-serif text-2xl text-primary">{fmtBRL(total)}</span>
          </div>
        )}
      </Card>

      {/* ── Ranking de produtos ─────────────────────────────── */}
      {topProducts.length > 0 && !loading && (
        <div className="mt-8">
          <h3 className="text-2xl font-serif mb-6">Ranking de Produtos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topProducts.slice(0, 6).map((p, i) => (
              <RankingRow key={p.name} product={p} rank={i + 1} maxQty={topProducts[0].qty} />
            ))}
          </div>
        </div>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  )
}

// ── Sale Table Row (expansível) ───────────────────────────────
function SaleTableRow({ sale }) {
  const [open, setOpen] = useState(false)
  const items = sale.items || []
  const label = items.length === 0 ? '—'
    : items.length === 1 ? `${items[0].productName}`
    : `${items[0].productName} +${items.length - 1}`

  return (
    <>
      <tr className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
        onClick={() => items.length > 0 && setOpen(o => !o)}>
        <td className="px-6 py-4 text-sm font-bold text-on-surface">#{sale.id}</td>
        <td className="px-6 py-4 text-sm text-on-surface-variant">{fmtDate(sale.soldAt)}</td>
        <td className="px-6 py-4 text-sm text-on-surface-variant">{fmtTime(sale.soldAt)}</td>
        <td className="px-6 py-4 text-sm text-on-surface">{label}</td>
        <td className="px-6 py-4 text-sm font-bold text-primary">{fmtBRL(sale.total)}</td>
        <td className="px-6 py-4">
          {items.length > 0 && (
            <Icon name={open ? 'expand_less' : 'expand_more'} className="text-outline text-xl" />
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-surface-container-low">
          <td colSpan={6} className="px-10 pb-4 pt-2">
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{item.quantity}×</span> {item.productName}
                  </span>
                  <span className="font-semibold text-on-surface">{fmtBRL(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Period Metric Card ────────────────────────────────────────
function PeriodCard({ icon, color, label, value, small }) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon name={icon} fill className={`text-xl ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      </div>
      <p className={`font-serif font-bold leading-tight text-on-surface ${small ? 'text-sm' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Ranking Row ───────────────────────────────────────────────
function RankingRow({ product, rank, maxQty }) {
  const pct = Math.round((product.qty / maxQty) * 100)
  return (
    <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 ${
        rank === 1 ? 'bg-gradient-to-br from-primary to-primary-container text-white' :
        rank === 2 ? 'bg-surface-container-high text-on-surface' :
                     'bg-surface-container text-on-surface-variant'
      }`}>
        {rank}º
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-on-surface truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-outline-variant/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-on-surface-variant whitespace-nowrap">{product.qty} un.</span>
        </div>
      </div>
      <p className="font-bold text-sm text-primary flex-shrink-0">{fmtBRL(product.total)}</p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function buildTopProducts(sales) {
  const map = {}
  for (const sale of sales) {
    for (const item of (sale.items || [])) {
      if (!map[item.productName]) map[item.productName] = { name: item.productName, qty: 0, total: 0 }
      map[item.productName].qty   += item.quantity
      map[item.productName].total += item.quantity * Number(item.unitPrice)
    }
  }
  return Object.values(map).sort((a, b) => b.qty - a.qty)
}

function PageState({ icon, msg }) {
  return (
    <div className="pt-20 md:pl-72 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant text-center px-8">
        <Icon name={icon} className="text-5xl text-outline" />
        <p className="text-sm">{msg}</p>
      </div>
    </div>
  )
}
