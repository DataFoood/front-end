'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../data/users'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type AuthResult = { ok: boolean; message: string }

type RegisterPayload = {
  name: string
  email: string
  cpf: string
  phone: string
  password: string
  confirm_password: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (payload: RegisterPayload) => Promise<AuthResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Extrai a melhor mensagem de erro possível de uma resposta de erro do DRF
function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback
  if (data.detail) return data.detail
  if (data.message) return data.message
  if (data.non_field_errors?.[0]) return data.non_field_errors[0]
  const firstFieldError = Object.values(data).flat().find((v): v is string => typeof v === 'string')
  return firstFieldError || fallback
}

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

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_URL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        return {
          ok: false,
          message: retryAfter
            ? `Muitas tentativas. Tente novamente em ${retryAfter}s.`
            : 'Muitas tentativas de login. Aguarde um instante e tente novamente.',
        }
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        return { ok: false, message: extractErrorMessage(data, 'E-mail ou senha incorretos. Tente novamente.') }
      }

      // Ajuste as chaves abaixo caso o payload real do backend use outros nomes
      const accessToken: string | undefined = data.access || data.token
      const refreshToken: string | undefined = data.refresh
      const found: User | undefined = data.user

      if (!accessToken || !found) {
        return { ok: false, message: 'Resposta inesperada do servidor.' }
      }

      sessionStorage.setItem('datafood_token', accessToken)
      if (refreshToken) sessionStorage.setItem('datafood_refresh', refreshToken)
      sessionStorage.setItem('datafood_user', JSON.stringify(found))
      setUser(found)

      return { ok: true, message: `Olá ${found.name.split(' ')[0]}, Bem vindo(a) de volta!` }
    } catch {
      return { ok: false, message: 'Não foi possível conectar ao servidor. Tente novamente.' }
    }
  }

  const register = async (payload: RegisterPayload): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_URL}/api/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        return {
          ok: false,
          message: retryAfter
            ? `Muitas tentativas. Tente novamente em ${retryAfter}s.`
            : 'Muitas tentativas de cadastro. Aguarde um instante e tente novamente.',
        }
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        return { ok: false, message: extractErrorMessage(data, 'Não foi possível criar a conta. Verifique os dados e tente novamente.') }
      }

      // Se o backend já autenticar no próprio registro (retorna token + user), loga direto.
      // Caso contrário, troque a tela de cadastro para redirecionar ao /login em vez de logar.
      const accessToken: string | undefined = data.access || data.token
      const refreshToken: string | undefined = data.refresh
      const found: User | undefined = data.user

      if (accessToken && found) {
        sessionStorage.setItem('datafood_token', accessToken)
        if (refreshToken) sessionStorage.setItem('datafood_refresh', refreshToken)
        sessionStorage.setItem('datafood_user', JSON.stringify(found))
        setUser(found)
      }

      return { ok: true, message: 'Conta criada com sucesso!' }
    } catch {
      return { ok: false, message: 'Não foi possível conectar ao servidor. Tente novamente.' }
    }
  }

  const logout = () => {
    sessionStorage.removeItem('datafood_token')
    sessionStorage.removeItem('datafood_refresh')
    sessionStorage.removeItem('datafood_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}