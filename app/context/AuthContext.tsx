'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, SESSION_EXPIRED_EVENT, tokenStore } from '@/lib/api'
import type { AuthResponse, User } from '@/lib/types'

export interface RegisterPayload {
  name: string
  email: string
  cpf: string | null
  phone: string
  password: string
  confirm_password: string
  account_type: 'customer' | 'owner'
  allow_info: boolean
}

interface AuthContextValue {
  user: User | null
  /** true até a sessão salva ser validada no primeiro carregamento */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // restaura a sessão: se há tokens salvos, valida buscando /me (o refresh é automático)
  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      if (tokenStore.get()) {
        try {
          const me = await api<User>('/api/users/me/')
          if (!cancelled) setUser(me)
        } catch {
          tokenStore.clear()
        }
      }
      if (!cancelled) setLoading(false)
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const startSession = useCallback((data: AuthResponse) => {
    tokenStore.set({ access: data.access, refresh: data.refresh })
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<AuthResponse>('/api/users/login/', {
        method: 'POST',
        body: { email, password },
        auth: false,
      })
      return startSession(data)
    },
    [startSession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await api<AuthResponse>('/api/users/register/', {
        method: 'POST',
        body: payload,
        auth: false,
      })
      return startSession(data)
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStore.get()?.refresh
    tokenStore.clear()
    setUser(null)
    if (refresh) {
      // invalida o refresh no back; falha aqui não impede o logout local
      await api('/api/users/logout/', { method: 'POST', body: { refresh }, auth: false }).catch(() => undefined)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await api<User>('/api/users/me/'))
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUser }),
    [user, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
