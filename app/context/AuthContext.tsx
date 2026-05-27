'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authenticateUser, type User } from '../data/users'

interface AuthState {
  user: User | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('datafood_user')
      if (stored) setState({ user: JSON.parse(stored), loading: false })
      else setState({ user: null, loading: false })
    } catch {
      setState({ user: null, loading: false })
    }
  }, [])

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 900))

    const user = authenticateUser(email, password)

    if (user) {
      const safe = { id: user.id, name: user.name, email: user.email, type: user.type }
      sessionStorage.setItem('datafood_user', JSON.stringify(safe))
      setState({ user, loading: false })
      return { ok: true, message: `bem-vindo de volta, ${user.name.split(' ')[0]}.` }
    }

    return { ok: false, message: 'e-mail ou senha incorretos. tente novamente.' }
  }

  const logout = () => {
    sessionStorage.removeItem('datafood_user')
    setState({ user: null, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}