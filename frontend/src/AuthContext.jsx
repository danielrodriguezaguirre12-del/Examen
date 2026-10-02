import { createContext, useContext, useState } from 'react'
import { api, setToken } from './api'

const AuthContext = createContext(null)
const USER_KEY = 'vt_user'

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const saveSession = ({ access_token, user }) => {
    setToken(access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }

  const value = {
    user,
    login: async (email, password) => saveSession(await api.login(email, password)),
    register: async (name, email, password) => saveSession(await api.register(name, email, password)),
    logout: () => {
      setToken(null)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
