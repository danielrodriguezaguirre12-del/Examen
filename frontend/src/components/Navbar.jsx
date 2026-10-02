import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">▶</span> VideoTube
      </Link>
      {user && (
        <nav className="nav-actions">
          <Link to="/profile" className="nav-user">
            <span className="avatar">{user.name[0]?.toUpperCase()}</span>
            {user.name}
          </Link>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Salir
          </button>
        </nav>
      )}
    </header>
  )
}
