'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { RequireAuth } from '@/components/RequireAuth'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { Avatar, Field, Spinner, Toggle } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { formatDate, maskPhone, onlyDigits } from '@/lib/format'
import type { Affinity, Preferences, SearchHistoryEntry, User } from '@/lib/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type Tab = 'dados' | 'privacidade' | 'seguranca'
const TABS: { id: Tab; label: string }[] = [
  { id: 'dados', label: 'meus dados' },
  { id: 'privacidade', label: 'privacidade' },
  { id: 'seguranca', label: 'segurança' },
]

function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: maskPhone(user.phone || ''),
    birthday: user.birthday ?? '',
    gender: user.gender,
    avatar_url: user.avatar_url,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const updated = await api<User>('/api/users/me/', {
        method: 'PATCH',
        body: { ...form, phone: onlyDigits(form.phone), birthday: form.birthday || null },
      })
      setUser(updated)
      toast.success('Dados atualizados.')
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={submit} className="card flex flex-col gap-5 p-6">
      <div className="flex items-center gap-4">
        <Avatar name={form.name} url={form.avatar_url} size={56} />
        <div className="text-xs text-[#999]">
          conta {user.role === 'owner' ? 'de restaurante' : user.role === 'admin' ? 'administradora' : 'pessoal'} · desde {formatDate(user.created_at)}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="nome completo" name="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="e-mail" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="telefone" name="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} error={errors.phone} />
        <Field label="data de nascimento" name="birthday" type="date" value={form.birthday} onChange={set('birthday')} error={errors.birthday} />
        <label className="flex flex-col">
          <span className="label">gênero</span>
          <select value={form.gender} onChange={set('gender')} className="input">
            <option value="">prefiro não dizer</option>
            <option value="F">feminino</option>
            <option value="M">masculino</option>
            <option value="O">outro</option>
            <option value="N">não informado</option>
          </select>
        </label>
        <Field label="foto (url)" name="avatar_url" type="url" value={form.avatar_url} onChange={set('avatar_url')} error={errors.avatar_url} placeholder="https://…" />
      </div>
      {user.cpf && <p className="text-xs text-[#999]">CPF cadastrado: ***.***.{user.cpf.slice(6, 9)}-{user.cpf.slice(9)} (não editável)</p>}
      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'salvar alterações'}
      </button>
    </form>
  )
}

const DIMENSIONS: { key: keyof Preferences; path: string; label: string }[] = [
  { key: 'cuisines', path: 'cuisines', label: 'cozinhas' },
  { key: 'ambients', path: 'ambients', label: 'ambientes' },
  { key: 'price_ranges', path: 'prices', label: 'faixas de preço' },
]

function AffinityRow({ affinity, path, onSaved }: { affinity: Affinity; path: string; onSaved: (a: Affinity) => void }) {
  const toast = useToast()
  const [value, setValue] = useState(Math.round(affinity.score * 100))

  const commit = async () => {
    if (value === Math.round(affinity.score * 100)) return
    try {
      const saved = await api<Affinity>(`/api/preferences/${path}/${affinity.id}/`, { method: 'PATCH', body: { score: value / 100 } })
      onSaved(saved)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-44 shrink-0 truncate text-[13px] text-[#333]" title={affinity.name}>
        {affinity.name}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        aria-label={`afinidade com ${affinity.name}`}
        className="flex-1 accent-rust"
      />
      <span className="w-16 text-right text-[11px] text-[#999]">
        {value}%{affinity.is_manual && ' · manual'}
      </span>
    </div>
  )
}

function PrivacyPanel({ user }: { user: User }) {
  const { setUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [history, setHistory] = useState<SearchHistoryEntry[] | null>(null)

  useEffect(() => {
    api<Preferences>('/api/preferences/').then(setPrefs).catch(() => setPrefs({ cuisines: [], ambients: [], price_ranges: [] }))
    api<SearchHistoryEntry[]>('/api/preferences/searches/').then(setHistory).catch(() => setHistory([]))
  }, [user.allow_info])

  const setConsent = async (value: boolean) => {
    setSaving(true)
    try {
      await api('/api/users/consent/', { method: 'PATCH', body: { allow_info: value } })
      setUser({ ...user, allow_info: value })
      toast.success(value ? 'Personalização ativada.' : 'Personalização desativada. Não guardaremos novas buscas.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const hasPrefs = prefs && DIMENSIONS.some(d => prefs[d.key].length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex items-start justify-between gap-6 p-6">
        <div>
          <h3 className="mb-1.5 text-[15px] font-medium">personalizar recomendações</h3>
          <p className="max-w-lg text-[13px] leading-relaxed text-[#777]">
            com isso ligado, guardamos suas últimas buscas e os restaurantes que você visita para aprender seu gosto (LGPD, art. 7º, I). desligado, a busca funciona igual, mas nada novo é registrado sobre você.
          </p>
        </div>
        <Toggle checked={user.allow_info} onChange={setConsent} disabled={saving} label="personalizar recomendações" />
      </div>

      <div className="card p-6">
        <h3 className="mb-1.5 text-[15px] font-medium">suas afinidades</h3>
        <p className="mb-4 text-[13px] text-[#777]">calculadas a partir do que você salva e visita. ajuste à vontade — ajustes manuais não são sobrescritos.</p>
        {!prefs ? (
          <Spinner />
        ) : !hasPrefs ? (
          <p className="text-[13px] text-[#aaa]">{user.allow_info ? 'ainda aprendendo seu gosto — salve e visite alguns lugares.' : 'ative a personalização para montarmos suas afinidades.'}</p>
        ) : (
          DIMENSIONS.map(d =>
            prefs[d.key].length ? (
              <div key={d.key} className="mb-4">
                <p className="label mb-1">{d.label}</p>
                {prefs[d.key].map(a => (
                  <AffinityRow
                    key={a.id}
                    affinity={a}
                    path={d.path}
                    onSaved={saved => setPrefs(p => (p ? { ...p, [d.key]: p[d.key].map(x => (x.id === saved.id ? { ...x, ...saved } : x)) } : p))}
                  />
                ))}
              </div>
            ) : null,
          )
        )}
      </div>

      <div className="card p-6">
        <h3 className="mb-4 text-[15px] font-medium">buscas recentes</h3>
        {!history ? (
          <Spinner />
        ) : history.length === 0 ? (
          <p className="text-[13px] text-[#aaa]">{user.allow_info ? 'nenhuma busca registrada ainda.' : 'sem personalização, suas buscas não são guardadas.'}</p>
        ) : (
          <ul className="divide-y divide-[#f0ece4]">
            {history.slice(0, 20).map(h => (
              <li key={h.id} className="flex justify-between gap-4 py-2 text-[13px]">
                <span className="truncate text-[#333]">{h.query}</span>
                <span className="shrink-0 text-[11px] text-[#aaa]">{formatDate(h.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SecurityPanel({ user }: { user: User }) {
  const { logout } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await api(`/api/users/${user.id}/change-password/`, { method: 'POST', body: form })
      toast.success('Senha alterada.')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    try {
      await api(`/api/users/${user.id}/delete/`, { method: 'DELETE' })
      await logout()
      toast.info('Sua conta foi encerrada.')
      router.replace('/')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={changePassword} className="card flex flex-col gap-4 p-6">
        <h3 className="text-[15px] font-medium">alterar senha</h3>
        <Field label="senha atual" name="current_password" type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} error={errors.current_password} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="nova senha" name="new_password" type="password" autoComplete="new-password" value={form.new_password} onChange={set('new_password')} error={errors.new_password} />
          <Field label="confirmar nova senha" name="confirm_password" type="password" autoComplete="new-password" value={form.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} />
        </div>
        <button type="submit" disabled={saving || !form.current_password || !form.new_password} className="btn-primary self-start">
          {saving ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'alterar senha'}
        </button>
      </form>

      <div className="card border-[#f3c1c1] p-6">
        <h3 className="mb-1.5 text-[15px] font-medium text-[#c53030]">encerrar conta</h3>
        <p className="mb-4 text-[13px] leading-relaxed text-[#777]">seu acesso é bloqueado imediatamente. digite <strong>encerrar</strong> para confirmar.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)} className="input sm:max-w-xs" aria-label="confirmação" placeholder="encerrar" />
          <button onClick={deleteAccount} disabled={confirmText.trim().toLowerCase() !== 'encerrar'} className="btn-danger">
            encerrar minha conta
          </button>
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('dados')
  if (!user) return null
  return (
    <>
      <div role="tablist" className="mb-8 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[13px] ${tab === t.id ? 'border-rust text-ink' : 'border-transparent text-[#888] hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dados' && <ProfileForm user={user} />}
      {tab === 'privacidade' && <PrivacyPanel user={user} />}
      {tab === 'seguranca' && <SecurityPanel user={user} />}
    </>
  )
}

export default function PerfilPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-8">
        <p className="eyebrow mb-3">conta</p>
        <h1 className="mb-8 font-serif text-4xl">meu perfil</h1>
        <RequireAuth>
          <Profile />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  )
}
