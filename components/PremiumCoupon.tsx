'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { api, errorMessage } from '@/lib/api'
import type { User } from '@/lib/types'
import { Field } from './ui'

export function PremiumCoupon() {
  const { user, setUser } = useAuth()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!user) return null

  const redeem = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true)
    setError('')
    try {
      const updated = await api<User>('/api/users/premium/redeem/', { method: 'POST', body: { code: code.trim() } })
      setCode('')
      setUser(updated)
    } catch (failure) {
      setError(errorMessage(failure, 'Não foi possível resgatar o cupom.'))
    } finally { setBusy(false) }
  }

  return (
    <section className="card mt-6 space-y-4 p-6" aria-label="Plano da conta">
      <h2 className="font-serif text-2xl">{user.level >= 2 ? 'Premium ativo' : 'Ative seu premium'}</h2>
      {user.level >= 2 ? <>
        <p role="status" className="text-sm text-ink-600">Seu plano premium está disponível no chat. A personalização depende da autorização na aba Privacidade.</p>
        <Link className="btn-accent" href="/chat">Conversar com o assistente</Link>
      </> : <>
        <p className="text-sm text-ink-600">Tem um cupom? Resgate para liberar seu plano premium.</p>
        <form onSubmit={redeem} className="space-y-3">
          <Field label="Cupom premium" name="premium_coupon" value={code} onChange={event => setCode(event.target.value)} maxLength={80} autoComplete="off" spellCheck={false} />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <button className="btn-accent" disabled={busy || !code.trim()} type="submit">{busy ? 'Ativando…' : 'Ativar premium'}</button>
        </form>
      </>}
    </section>
  )
}
