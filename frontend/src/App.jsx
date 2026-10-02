import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import PlayerPage from './pages/PlayerPage'
import ProfilePage from './pages/ProfilePage'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/video/:id" element={<RequireAuth><PlayerPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
