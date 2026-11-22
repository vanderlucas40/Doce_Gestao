import { useState } from 'react'
import { useAuth }  from '../hooks/useAuth'

export function Login() {
  const { login }  = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username || !password) return
    setLoading(true)
    setError(null)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">

      {/* Decorative blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-surface-container-low rounded-full mix-blend-multiply opacity-50 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] bg-primary-fixed/20 rounded-full mix-blend-multiply opacity-40 blur-3xl pointer-events-none" />

      <main className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 md:gap-20">

        {/* ── Lado esquerdo: Branding ───────────────────────── */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start space-y-8">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-xs text-primary tracking-[0.2em] uppercase font-bold">
              Artesanal &amp; Premium
            </span>
            <h1 className="font-serif text-5xl md:text-7xl text-primary font-normal leading-tight tracking-tighter">
              JM Bolos
            </h1>
            <p className="font-serif italic text-2xl text-on-surface-variant opacity-80 mt-2">
              O sabor da excelência artesanal começa aqui.
            </p>
          </div>

          {/* Imagem decorativa */}
          <div className="hidden md:block w-full max-w-sm aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl shadow-on-surface/10 rotate-[-2deg] hover:rotate-0 transition-transform duration-700 bg-gradient-to-br from-primary-fixed via-surface-container to-surface-container-high">
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <span
                className="material-symbols-outlined text-primary"
                style={{
                  fontSize: '160px',
                  fontVariationSettings: "'FILL' 1,'wght' 200,'GRAD' 0,'opsz' 48"
                }}
              >
                cake
              </span>
            </div>
          </div>
        </div>

        {/* ── Lado direito: Formulário ──────────────────────── */}
        <div className="w-full md:w-1/2 max-w-md">
          <div
            className="p-8 md:p-12 rounded-[2.5rem] space-y-8 border border-outline-variant/10 shadow-[0_24px_48px_rgba(43,22,19,0.08)]"
            style={{ background: 'rgba(255,248,246,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl text-on-background">Bem-vindo ao Ateliê</h2>
              <p className="text-on-surface-variant text-sm font-medium">
                Acesse sua conta para gerenciar seus pedidos
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Usuário */}
              <div className="space-y-2 group">
                <label className="block text-xs font-bold tracking-wider text-on-surface-variant uppercase px-1">
                  Usuário
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/60 group-focus-within:text-primary transition-colors text-xl"
                  >
                    alternate_email
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="seu.usuario"
                    autoComplete="username"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-bold tracking-wider text-on-surface-variant uppercase">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="text-xs text-primary hover:opacity-70 transition-opacity font-bold"
                  >
                    {showPass ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/60 group-focus-within:text-primary transition-colors text-xl">
                    lock_open
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none"
                  />
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-error-container border border-error/20 rounded-xl px-4 py-3 text-sm text-on-error-container font-medium">
                  {error}
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className={`w-full py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-lg transition-all duration-300 ${
                  loading || !username || !password
                    ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                    : 'bg-gradient-to-br from-primary to-primary-container text-white shadow-primary/20 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {loading ? 'Entrando...' : 'Entrar no Dashboard'}
              </button>
            </form>

            {/* Hint de credenciais padrão */}
            <p className="text-center text-xs text-outline/50">
              admin / admin123 &nbsp;·&nbsp; operador.centro / operador123
            </p>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <div className="fixed bottom-8 left-10 hidden md:flex items-center gap-2 text-on-surface-variant/30">
        <span className="material-symbols-outlined text-base">verified</span>
        <span className="text-[10px] tracking-widest uppercase">Pâtisserie Management System v2.0</span>
      </div>
    </div>
  )
}
