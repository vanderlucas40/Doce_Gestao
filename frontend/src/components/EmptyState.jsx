import { useState }   from 'react'
import { storesApi }  from '../api'
import { useStore }   from '../hooks/useStore'
import { useAuth }    from '../hooks/useAuth'
import { Icon }       from './ui'

/**
 * Tela de onboarding: exibida quando nenhuma loja existe no banco.
 * ADMIN → formulário de cadastro da primeira loja.
 * OPERATOR → aviso para contatar o administrador.
 */
export function EmptyState() {
  const { isAdmin } = useAuth()
  const { reload }  = useStore()

  // Estados do formulário
  const [name,    setName]    = useState('')
  const [address, setAddress] = useState('')
  const [phone,   setPhone]   = useState('')

  // Estados de UI
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState(null)      // mensagem de erro principal
  const [fieldErrs, setFieldErrs] = useState({})        // { name: "...", ... }

  // ── Operador sem loja ─────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto">
            <Icon name="lock" className="text-4xl text-outline" />
          </div>
          <h2 className="font-serif text-2xl text-on-surface">Nenhuma loja disponível</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Peça ao administrador para cadastrar a sua loja e vincular o seu usuário a ela.
          </p>
        </div>
      </div>
    )
  }

  // ── Tela de sucesso ───────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
            <Icon name="check_circle" fill className="text-4xl text-secondary" />
          </div>
          <h2 className="font-serif text-2xl">Loja cadastrada!</h2>
          <p className="text-sm text-on-surface-variant">Carregando o sistema...</p>
        </div>
      </div>
    )
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setFieldErrs({})

    // Validação mínima no cliente antes de bater na API
    if (!name.trim()) {
      setFieldErrs({ name: 'O nome da loja é obrigatório.' })
      return
    }

    setLoading(true)
    try {
      // Objeto com chaves em inglês — paridade com Store.java
      await storesApi.create({
        name:    name.trim(),
        address: address.trim() || null,
        phone:   phone.trim()   || null,
      })
      setDone(true)
      setTimeout(reload, 900)
    } catch (err) {
      // err.message = mensagem principal do GlobalExceptionHandler
      // err.fields  = { campo: "mensagem" } quando é erro de validação (@Valid)
      if (err.fields) {
        setFieldErrs(err.fields)
      }
      setError(err.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Formulário ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      {/* Blobs decorativos */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-surface-container-low rounded-full opacity-50 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] bg-primary-fixed/20 rounded-full opacity-40 blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-surface-container-lowest rounded-[2.5rem] p-10 w-full max-w-md
                      shadow-[0_24px_48px_rgba(43,22,19,0.08)] border border-outline-variant/10 text-center">

        {/* Ícone */}
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon name="cake" fill className="text-primary text-3xl" />
        </div>

        <h2 className="font-serif text-3xl text-on-background mb-2">Bem-vindo ao Ateliê!</h2>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          Nenhuma loja cadastrada ainda.<br />Crie a primeira para começar.
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-5" noValidate>

          {/* Nome — obrigatório */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Nome da loja *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setFieldErrs(f => ({ ...f, name: '' })) }}
              placeholder="ex: JM Bolos — Centro"
              disabled={loading}
              className={`w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm
                          focus:outline-none focus:ring-1 focus:ring-primary/20
                          ${fieldErrs.name ? 'ring-1 ring-error/50 bg-error-container/10' : ''}`}
            />
            {fieldErrs.name && (
              <p className="text-xs text-error mt-1 ml-1">{fieldErrs.name}</p>
            )}
          </div>

          {/* Endereço — opcional */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="ex: Rua das Flores, 120"
              disabled={loading}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm
                         focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Telefone — opcional */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="ex: (83) 99999-0001"
              disabled={loading}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm
                         focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Erro principal */}
          {error && (
            <div className="flex items-start gap-2 bg-error-container text-on-error-container
                            rounded-xl px-4 py-3 text-sm">
              <Icon name="error" fill className="text-base flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all mt-2
                        ${loading || !name.trim()
                          ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                          : 'bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98]'
                        }`}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cadastrando...
                </span>
              : '+ Cadastrar minha primeira loja'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
