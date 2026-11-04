'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import { api, errorMessage } from '@/lib/api'
import type { User } from '@/lib/types'
import { Toggle } from './ui'

export function ChoiceModeSetting({ compact = false }: { compact?: boolean }) {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  if (!user) return null
  const change = async (enabled: boolean) => {
    setSaving(true)
    try {
      const updated = await api<User>('/api/users/me/', { method: 'PATCH', body: { choice_mode: enabled } })
      setUser(updated)
      toast.success(enabled ? 'Modo escolha ativado.' : 'Modo escolha desativado.')
    } catch (err) { toast.error(errorMessage(err)) } finally { setSaving(false) }
  }
  if (compact) return <div className="flex items-center justify-between gap-3 py-2 text-sm"><span>Modo escolha</span><Toggle label="Habilitar modo escolha" checked={!!user.choice_mode} disabled={saving} onChange={change} /></div>
  return (
    <section className="card mt-5 p-6" aria-label="Preferências de busca">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-serif text-2xl">Modo escolha</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Veja um restaurante por vez nas buscas. Arraste para a esquerda para recusar ou para a direita para escolher e salvar. No computador, use os botões ou as setas do teclado com o card em foco.</p></div>
        <Toggle label="Habilitar modo escolha" checked={!!user.choice_mode} disabled={saving} onChange={change} />
      </div>
      <p className="mt-3 text-xs text-muted">Sua preferência fica salva na conta. Você pode desativar aqui quando quiser.</p>
      {user.choice_mode && <Link className="mt-4 inline-block text-sm text-rust underline" href="/chat">Experimentar na busca →</Link>}
    </section>
  )
}
