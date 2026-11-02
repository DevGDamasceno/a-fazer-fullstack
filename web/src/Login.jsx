import { useState } from 'react'
import { api } from './api'
import DemoNote from './DemoNote'

export default function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const action = isRegister ? api.register : api.login
      const { token } = await action(email, password)
      onAuthenticated(token)
    } catch (err) {
      setError(err.status === 401 ? 'E-mail ou senha incorretos.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="card auth">
      <h1>A Fazer</h1>
      <p className="muted">{isRegister ? 'Crie sua conta' : 'Entre para ver suas tarefas'}</p>

      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={isRegister ? 8 : undefined}
            required
          />
          {isRegister && <small className="muted">Mínimo de 8 caracteres.</small>}
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(isRegister ? 'login' : 'register')
          setError('')
        }}
      >
        {isRegister ? 'Já tenho conta' : 'Criar uma conta'}
      </button>

      <DemoNote />
    </main>
  )
}
