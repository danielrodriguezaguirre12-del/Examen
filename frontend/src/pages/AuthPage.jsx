import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function AuthPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const isLogin = mode === 'login'
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="card auth-card" onSubmit={submit}>
        <h1>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h1>

        {!isLogin && (
          <label>
            Nombre
            <input name="name" value={form.name} onChange={update} required minLength={2} />
          </label>
        )}
        <label>
          Correo
          <input name="email" type="email" value={form.email} onChange={update} required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" value={form.password} onChange={update} required minLength={6} />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Procesando…' : isLogin ? 'Entrar' : 'Registrarme'}
        </button>

        <p className="muted center">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(isLogin ? 'register' : 'login')
              setError('')
            }}
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </form>
    </div>
  )
}
