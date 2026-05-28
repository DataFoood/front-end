'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authenticateUser, type User } from '../data/users'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('datafood_user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 900))
    const found = authenticateUser(email, password)
    if (found) {
      sessionStorage.setItem('datafood_user', JSON.stringify(found))
      setUser(found)
      return { ok: true, message: `bem-vindo de volta, ${found.name.split(' ')[0]}.` }
    }
    return { ok: false, message: 'e-mail ou senha incorretos. tente novamente.' }
  }

  const logout = () => {
    sessionStorage.removeItem('datafood_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
