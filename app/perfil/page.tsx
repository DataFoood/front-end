'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { RequireAuth } from '@/components/RequireAuth'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { Avatar, Field, LoadMore, PageLoader, Spinner, Toggle } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { formatDate, maskPhone, onlyDigits } from '@/lib/format'
import type { Affinity, MessagingPreference, Preferences, SearchHistoryEntry, User } from '@/lib/types'
import { usePaginated } from '@/lib/usePaginated'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type Tab = 'dados' | 'privacidade' | 'promocoes' | 'seguranca'
const TABS: { id: Tab; label: string }[] = [
  { id: 'dados', label: 'Meus dados' },
  { id: 'privacidade', label: 'Privacidade' },
  { id: 'promocoes', label: 'Promoções' },
  { id: 'seguranca', label: 'Segurança' },
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
        <div className="text-xs text-ink-300">
          Conta {user.role === 'owner' ? 'de restaurante' : user.role === 'admin' ? 'administradora' : 'pessoal'} · desde {formatDate(user.created_at)}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome completo" name="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="E-mail" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="Telefone" name="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} error={errors.phone} />
        <Field label="Data de nascimento" name="birthday" type="date" value={form.birthday} onChange={set('birthday')} error={errors.birthday} />
        <label className="flex flex-col">
          <span className="label">Gênero</span>
          <select value={form.gender} onChange={set('gender')} className="input">
            <option value="">Prefiro não dizer</option>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
            <option value="O">Outro</option>
            <option value="N">Não informado</option>
          </select>
        </label>
        <Field label="Foto (URL)" name="avatar_url" type="url" value={form.avatar_url} onChange={set('avatar_url')} error={errors.avatar_url} placeholder="https://…" />
      </div>
      {user.cpf && <p className="text-xs text-ink-300">CPF cadastrado: ***.***.{user.cpf.slice(6, 9)}-{user.cpf.slice(9)} (não editável)</p>}
      <button type="submit" disabled={saving} className="btn-primary self-start">
        {saving ? <Spinner className="h-4 w-4 border-ink-600 border-t-white" /> : 'Salvar alterações'}
      </button>
    </form>
  )
}

const DIMENSIONS: { key: keyof Preferences; path: string; label: string }[] = [
  { key: 'cuisines', path: 'cuisines', label: 'Cozinhas' },
  { key: 'ambients', path: 'ambients', label: 'Ambientes' },
  { key: 'price_ranges', path: 'prices', label: 'Faixas de preço' },
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
      <span className="w-44 shrink-0 truncate text-[13px] text-ink-800" title={affinity.name}>
        {affinity.name}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        aria-label={`Afinidade com ${affinity.name}`}
        className="flex-1 accent-rust"
      />
      <span className="w-16 text-right text-[11px] text-ink-300">
        {value}%{affinity.is_manual && ' · manual'}
      </span>
    </div>
  )
}

function PrivacyPanel({ user }: { user: User }) {
  const { setUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefsState] = useState<Preferences | null>(null)
  const setPrefs = (fn: (p: Preferences) => Preferences) => setPrefsState(p => (p ? fn(p) : p))

  useEffect(() => {
    let cancelled = false
    api<Preferences>('/api/preferences/')
      .catch(() => ({ cuisines: [], ambients: [], price_ranges: [] }))
      .then(p => !cancelled && setPrefsState(p))
    return () => {
      cancelled = true
    }
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
          <h3 className="mb-1.5 text-[15px] font-medium">Personalizar recomendações</h3>
          <p className="max-w-lg text-[13px] leading-relaxed text-muted">
            Com isso ligado, guardamos suas últimas buscas e os restaurantes que você visita para aprender seu gosto (LGPD, art. 7º, I). Desligado, a busca funciona igual, mas nada novo é registrado sobre você.
          </p>
        </div>
        <Toggle checked={user.allow_info} onChange={setConsent} disabled={saving} label="Personalizar recomendações" />
      </div>

      <div className="card p-6">
        <h3 className="mb-1.5 text-[15px] font-medium">Suas afinidades</h3>
        <p className="mb-4 text-[13px] text-muted">Calculadas a partir do que você salva e visita. Ajuste à vontade — ajustes manuais não são sobrescritos.</p>
        {!prefs ? (
          <Spinner />
        ) : !hasPrefs ? (
          <p className="text-[13px] text-ink-250">{user.allow_info ? 'Ainda aprendendo seu gosto — salve e visite alguns lugares.' : 'Ative a personalização para montarmos suas afinidades.'}</p>
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
                    onSaved={saved => setPrefs(p => ({ ...p, [d.key]: p[d.key].map(x => (x.id === saved.id ? { ...x, ...saved } : x)) }))}
                  />
                ))}
              </div>
            ) : null,
          )
        )}
      </div>

      {/* chaveado pelo consentimento: ligar/desligar recarrega o histórico */}
      <SearchHistoryCard key={String(user.allow_info)} allowInfo={user.allow_info} />

      <div className="card p-6">
        <h3 className="mb-1.5 text-[15px] font-medium">Conversas da busca</h3>
        <p className="max-w-lg text-[13px] leading-relaxed text-muted">
          As conversas do <Link href="/chat" className="text-rust underline">chat</Link> ficam salvas na sua conta — aparecem em qualquer navegador em que você entrar. Apague cada uma pelo chat; ao encerrar a conta, todas são apagadas junto.
        </p>
      </div>
    </div>
  )
}

function SearchHistoryCard({ allowInfo }: { allowInfo: boolean }) {
  const history = usePaginated<SearchHistoryEntry>('/api/preferences/searches/', {}, 10)
  return (
    <div className="card p-6">
      <h3 className="mb-4 text-[15px] font-medium">Buscas recentes</h3>
      {history.loading ? (
        <Spinner />
      ) : history.items.length === 0 ? (
        <p className="text-[13px] text-ink-250">{allowInfo ? 'Nenhuma busca registrada ainda.' : 'Sem personalização, suas buscas não são guardadas.'}</p>
      ) : (
        <>
          <ul className="divide-y divide-line-soft">
            {history.items.map(h => (
              <li key={h.id} className="flex justify-between gap-4 py-2 text-[13px]">
                <span className="truncate text-ink-800">{h.query}</span>
                <span className="shrink-0 text-[11px] text-ink-250">{formatDate(h.created_at)}</span>
              </li>
            ))}
          </ul>
          <LoadMore shown={history.items.length} total={history.count} hasMore={history.hasMore} loading={history.loadingMore} onClick={history.loadMore} noun="buscas" />
        </>
      )}
    </div>
  )
}

function ChannelRow({ title, text, children }: { title: string; text: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="mb-1 text-[14px]">{title}</p>
        <div className="max-w-md text-[12px] leading-relaxed text-muted">{text}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function PromotionsPanel({ user }: { user: User }) {
  const toast = useToast()
  const [pref, setPref] = useState<MessagingPreference | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    api<MessagingPreference>('/api/promotions/preferences/')
      .then(p => !cancelled && setPref(p))
      .catch(err => !cancelled && setError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const patch = async (body: Partial<MessagingPreference>, success?: string) => {
    setSaving(true)
    try {
      setPref(await api<MessagingPreference>('/api/promotions/preferences/', { method: 'PATCH', body }))
      if (success) toast.success(success)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const linkTelegram = async () => {
    try {
      const res = await api<{ url: string }>('/api/promotions/preferences/telegram/', { method: 'POST' })
      setLink(res.url)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const unlinkTelegram = async () => {
    try {
      await api('/api/promotions/preferences/telegram/', { method: 'DELETE' })
      setLink(null)
      setReloadKey(k => k + 1)
      toast.info('Telegram desvinculado.')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (error) return <p className="text-sm text-danger">{error}</p>
  if (!pref) return <Spinner />

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex items-start justify-between gap-6 p-6">
        <div>
          <h3 className="mb-1.5 text-[15px] font-medium">Receber promoções</h3>
          <p className="max-w-lg text-[13px] leading-relaxed text-muted">
            Ligado, você recebe as promoções dos restaurantes que <Link href="/salvos" className="text-rust underline">salvou</Link> — só deles, no máximo algumas por dia. Desligue quando quiser (também pelo link no fim de cada e-mail ou enviando /sair no Telegram).
          </p>
          {pref.promotions_opt_in && pref.opted_in_at && <p className="mt-2 text-[11px] text-ink-250">Consentimento registrado em {formatDate(pref.opted_in_at)}</p>}
        </div>
        <Toggle
          checked={pref.promotions_opt_in}
          onChange={v => patch({ promotions_opt_in: v }, v ? 'Pronto! Você vai receber promoções dos seus salvos.' : 'Você não vai mais receber promoções.')}
          disabled={saving}
          label="Receber promoções"
        />
      </div>

      <div className={`card p-6 ${pref.promotions_opt_in ? '' : 'opacity-60'}`}>
        <h3 className="mb-4 text-[15px] font-medium">Por onde</h3>
        <div className="divide-y divide-line-soft">
        <ChannelRow title="E-mail" text={<>Para {user.email}</>}>
          <Toggle checked={pref.channel_email} onChange={v => patch({ channel_email: v })} disabled={saving || !pref.promotions_opt_in} label="Receber por e-mail" />
        </ChannelRow>
        <ChannelRow
          title="Telegram"
          text={
            pref.telegram_linked ? (
              <>
                Vinculado{pref.telegram_linked_at && ` desde ${formatDate(pref.telegram_linked_at)}`}.{' '}
                <button onClick={unlinkTelegram} className="text-rust underline">
                  Desvincular
                </button>
              </>
            ) : link ? (
              <>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-rust underline">
                  Abra o bot no Telegram
                </a>{' '}
                e toque em <strong>Iniciar</strong>. Depois,{' '}
                <button onClick={() => setReloadKey(k => k + 1)} className="text-rust underline">
                  confirme aqui
                </button>
                . O link vale 15 minutos.
              </>
            ) : (
              <>
                Chega na hora, no celular.{' '}
                <button onClick={linkTelegram} disabled={!pref.promotions_opt_in} className="text-rust underline disabled:text-ink-250 disabled:no-underline">
                  Vincular Telegram
                </button>
              </>
            )
          }
        >
          <Toggle checked={pref.channel_telegram} onChange={v => patch({ channel_telegram: v })} disabled={saving || !pref.promotions_opt_in} label="Receber pelo Telegram" />
        </ChannelRow>
        <ChannelRow title="WhatsApp" text="O restaurante compartilha as promoções na própria lista de transmissão ou grupo — peça para entrar direto com ele. Não repassamos seu telefone.">
          <span className="text-[11px] text-ink-250">Pelo restaurante</span>
        </ChannelRow>
        </div>
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
      // o back derruba todas as sessões e grava um par novo em cookie para esta continuar
      await api(`/api/users/${user.id}/change-password/`, { method: 'POST', body: form })
      toast.success('Senha alterada. As outras sessões foram encerradas.')
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
      // o back apaga a conta, as conversas e os cookies de sessão
      await api(`/api/users/${user.id}/delete/`, { method: 'DELETE' })
      try {
        window.localStorage.removeItem(`datafood.chats.${user.id}`) // cópia antiga, de antes de irem para a conta
      } catch {
        /* noop */
      }
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
        <h3 className="text-[15px] font-medium">Alterar senha</h3>
        <Field label="Senha atual" name="current_password" type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} error={errors.current_password} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nova senha" name="new_password" type="password" autoComplete="new-password" value={form.new_password} onChange={set('new_password')} error={errors.new_password} />
          <Field label="Confirmar nova senha" name="confirm_password" type="password" autoComplete="new-password" value={form.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} />
        </div>
        <button type="submit" disabled={saving || !form.current_password || !form.new_password} className="btn-primary self-start">
          {saving ? <Spinner className="h-4 w-4 border-ink-600 border-t-white" /> : 'Alterar senha'}
        </button>
      </form>

      <div className="card border-danger-line p-6">
        <h3 className="mb-1.5 text-[15px] font-medium text-danger">Encerrar conta</h3>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">Seu acesso é bloqueado imediatamente e suas conversas da busca são apagadas. Digite <strong>encerrar</strong> para confirmar.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)} className="input sm:max-w-xs" aria-label="Confirmação" placeholder="encerrar" />
          <button onClick={deleteAccount} disabled={confirmText.trim().toLowerCase() !== 'encerrar'} className="btn-danger">
            Encerrar minha conta
          </button>
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const { user } = useAuth()
  const params = useSearchParams()
  // ?aba=promocoes (link da página do restaurante) abre direto na aba
  const [tab, setTab] = useState<Tab>(() => TABS.find(t => t.id === params.get('aba'))?.id ?? 'dados')
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
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[13px] ${tab === t.id ? 'border-rust text-ink' : 'border-transparent text-ink-350 hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dados' && <ProfileForm user={user} />}
      {tab === 'privacidade' && <PrivacyPanel user={user} />}
      {tab === 'promocoes' && <PromotionsPanel user={user} />}
      {tab === 'seguranca' && <SecurityPanel user={user} />}
    </>
  )
}

export default function PerfilPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-8">
        <p className="eyebrow mb-3">Conta</p>
        <h1 className="mb-8 font-serif text-4xl">Meu perfil</h1>
        <RequireAuth>
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  )
}
