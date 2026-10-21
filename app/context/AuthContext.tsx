'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, refreshSession, SESSION_EXPIRED_EVENT, SESSION_KEY, sessionMarker } from '@/lib/api'
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

// renova um pouco antes do access (15 min no back) vencer
const DEFAULT_ACCESS_SECONDS = 15 * 60
const refreshEvery = (accessSeconds: number) => Math.max(60, accessSeconds - 90) * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessSeconds, setAccessSeconds] = useState(DEFAULT_ACCESS_SECONDS)

  // restaura a sessão: os cookies são HttpOnly (o JS não sabe se existem), então
  // o marcador diz se vale perguntar o /me; o 401 dele roda o refresh sozinho
  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      if (sessionMarker.has()) {
        try {
          const me = await api<User>('/api/users/me/')
          // a sessão pode ter saído (outra aba) enquanto o /me estava em voo
          if (!cancelled && sessionMarker.has()) setUser(me)
        } catch (err) {
          // só descarta a sessão se o back recusou; API fora do ar/rede caída
          // não desloga (o próximo carregamento tenta de novo)
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) sessionMarker.clear()
        }
      }
      if (!cancelled) setLoading(false)
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  // "só ir rodando o refresh": com sessão ativa, renova antes do access vencer
  // (e ao voltar para a aba, se o timer dormiu com o computador suspenso)
  const loggedIn = user !== null
  useEffect(() => {
    if (!loggedIn) return
    const every = refreshEvery(accessSeconds)
    let last = Date.now()
    const renew = async () => {
      last = Date.now()
      if (!(await refreshSession())) {
        sessionMarker.clear()
        setUser(null)
      }
    }
    const timer = setInterval(renew, every)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last >= every) renew()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loggedIn, accessSeconds])

  useEffect(() => {
    const onExpired = () => setUser(null)
    // login/logout em outra aba muda o marcador: reflete aqui
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SESSION_KEY) return
      if (e.newValue === null) setUser(null)
      else api<User>('/api/users/me/').then(setUser, () => undefined)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // o back já gravou os cookies; aqui só o marcador e o usuário
  const startSession = useCallback((data: AuthResponse) => {
    sessionMarker.set()
    setAccessSeconds(data.access_expires_in || DEFAULT_ACCESS_SECONDS)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<AuthResponse>('/api/users/login/', { method: 'POST', body: { email, password } })
      return startSession(data)
    },
    [startSession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await api<AuthResponse>('/api/users/register/', { method: 'POST', body: payload })
      return startSession(data)
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    sessionMarker.clear()
    setUser(null)
    // blacklista o refresh e apaga os cookies; falha aqui não impede o logout local
    await api('/api/users/logout/', { method: 'POST', body: {} }).catch(() => undefined)
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
