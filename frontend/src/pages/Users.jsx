import { useState }                                from 'react'
import { useStore }                                from '../hooks/useStore'
import { useFetch }                                from '../hooks/useFetch'
import { api }                                     from '../api/client'
import { authApi }                                 from '../api/auth'
import { Icon, Modal, Toast, Card, useToast }      from '../components/ui'

export function Users() {
  const { stores }                         = useStore()
  const { toast, show: showToast }         = useToast()
  const { data: users, loading, error, refetch } = useFetch(() => api.get('/users').then(r => r.data), [])

  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState({ username: '', password: '', role: 'OPERATOR', storeId: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await authApi.register({ ...form, storeId: form.storeId ? Number(form.storeId) : null })
      showToast('Usuário criado com sucesso!')
      setShowForm(false)
      setForm({ username: '', password: '', role: 'OPERATOR', storeId: '' })
      refetch()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(id, username) {
    if (!confirm(`Desativar "${username}"?`)) return
    try {
      await api.delete(`/users/${id}`)
      showToast('Usuário desativado.')
      refetch()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const activeCount = (users || []).filter(u => u.active).length
  const adminCount  = (users || []).filter(u => u.role === 'ADMIN').length

  if (loading) return <PageState spinner msg="Carregando equipe..." />
  if (error)   return <PageState icon="error" msg={error} action={refetch} actionLabel="Tentar novamente" />

  return (
    <div className="pt-20 pb-28 md:pt-8 md:pb-8 md:pl-72 px-6 md:px-12 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-6 md:pt-8">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Administração</span>
          <h2 className="text-3xl font-serif text-primary">Gestão de Usuários</h2>
          <p className="text-on-surface-variant text-sm max-w-md">
            Controle o acesso da sua equipe e defina permissões por loja.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all self-start"
        >
          <Icon name="person_add" />
          Novo Usuário
        </button>
      </div>

      {/* Bento resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard icon="badge"         bg="bg-primary/10 text-primary"     label="Colaboradores" value={activeCount} sub="ativos" />
        <SummaryCard icon="store"         bg="bg-secondary/10 text-secondary" label="Unidades"      value={stores.length} sub="vinculadas" />
        <SummaryCard icon="verified_user" bg="bg-tertiary/10 text-tertiary"   label="Admins"        value={adminCount} sub="supervisores" />
      </div>

      {/* Tabela */}
      <Card className="rounded-[2rem]" padding="p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h4 className="font-serif text-xl">Equipe Registrada</h4>
          <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-2">
            <Icon name="search" className="text-sm text-on-surface-variant" />
            <input className="bg-transparent border-none text-sm focus:outline-none w-32 md:w-48 placeholder:text-outline/40" placeholder="Buscar..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10">
                {['Usuário', 'Cargo', 'Unidade', 'Status', 'Ações'].map(h => (
                  <th key={h} className="pb-4 text-xs text-on-surface-variant tracking-wider uppercase font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {(users || []).map(u => (
                <UserRow key={u.id} user={u} onDeactivate={() => handleDeactivate(u.id, u.username)} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Novo usuário */}
      {showForm && (
        <Modal onClose={() => !submitting && setShowForm(false)} maxWidth="max-w-lg">
          <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <Icon name="close" />
          </button>
          <div className="mb-8">
            <h3 className="font-serif text-2xl text-primary mb-1">Novo Membro da Equipe</h3>
            <p className="text-on-surface-variant text-sm">Preencha os dados para cadastrar um novo usuário.</p>
          </div>

          <form className="space-y-5" onSubmit={handleCreate}>
            <Field label="Nome de usuário">
              <input required placeholder="ex: joao.silva" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20" />
            </Field>

            <Field label="Senha">
              <input required type="password" minLength={6} placeholder="Mínimo 6 caracteres" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cargo / Perfil">
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, storeId: '' }))}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20">
                  <option value="OPERATOR">Operador</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
              <Field label="Unidade">
                <select required={form.role === 'OPERATOR'} value={form.storeId}
                  onChange={e => setForm(f => ({ ...f, storeId: e.target.value }))}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20">
                  <option value="">{form.role === 'ADMIN' ? '— Todas —' : 'Selecione...'}</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} disabled={submitting}
                className="flex-1 py-4 bg-surface-container-highest text-primary font-bold rounded-xl hover:opacity-90 transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={submitting}
                className={`flex-1 py-4 text-white font-bold rounded-xl shadow-lg transition-all ${
                  submitting ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                             : 'bg-gradient-to-br from-primary to-primary-container shadow-primary/20 hover:opacity-90'
                }`}>
                {submitting ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  )
}

// ── User Row ──────────────────────────────────────────────────
function UserRow({ user, onDeactivate }) {
  return (
    <tr className={`hover:bg-surface-container-low/50 transition-colors ${!user.active ? 'opacity-50' : ''}`}>
      <td className="py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">{user.username}</p>
            <p className="text-xs text-on-surface-variant">{user.storeName || '—'}</p>
          </div>
        </div>
      </td>
      <td className="py-6">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          user.role === 'ADMIN' ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
        }`}>
          {user.role === 'ADMIN' ? 'Admin' : 'Operador'}
        </span>
      </td>
      <td className="py-6 text-sm text-on-surface-variant">{user.storeName || '— todas'}</td>
      <td className="py-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-secondary' : 'bg-stone-400'}`} />
          <span className={`text-sm font-medium ${user.active ? 'text-secondary' : 'text-stone-400'}`}>
            {user.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </td>
      <td className="py-6 text-right">
        {user.active && (
          <button onClick={onDeactivate} className="p-2 hover:bg-error-container/30 text-on-surface-variant hover:text-error rounded-lg transition-colors">
            <Icon name="more_vert" className="text-xl" />
          </button>
        )}
      </td>
    </tr>
  )
}

// ── Summary Card ──────────────────────────────────────────────
function SummaryCard({ icon, bg, label, value, sub }) {
  return (
    <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/15">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${bg}`}><span className="material-symbols-outlined">{icon}</span></div>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <h3 className="text-3xl font-serif text-on-surface">{value}</h3>
      <p className="text-sm text-on-surface-variant">{sub}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</label>
      {children}
    </div>
  )
}

function PageState({ spinner, icon, msg, action, actionLabel }) {
  return (
    <div className="pt-20 md:pl-72 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant text-center px-8">
        {spinner ? <div className="w-10 h-10 border-2 border-primary-container border-t-primary rounded-full animate-spin" /> : <Icon name={icon || 'error'} className="text-5xl text-outline" />}
        <p className="text-sm">{msg}</p>
        {action && <button onClick={action} className="px-6 py-2 border border-outline-variant rounded-xl text-sm hover:bg-surface-container">{actionLabel}</button>}
      </div>
    </div>
  )
}
