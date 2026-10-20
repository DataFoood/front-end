'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useToast } from '@/app/context/ToastContext'
import { Checkbox, Field, Spinner, TextArea } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { formatDate, formatDateTime, formatMoney, toDateTimeLocal } from '@/lib/format'
import type { InfraSuggestion, Promotion, PromotionAudience, PromotionStatus, Restaurant } from '@/lib/types'

const MAX_MESSAGE = 1000

const STATUS_LABEL: Record<PromotionStatus, string> = {
  draft: 'rascunho',
  scheduled: 'agendada',
  sending: 'enviando',
  sent: 'enviada',
}

const STATUS_CLASS: Record<PromotionStatus, string> = {
  draft: 'border-line text-ink-350',
  scheduled: 'border-rust text-rust',
  sending: 'border-rust bg-rust text-white',
  sent: 'border-success-line bg-success-bg text-success',
}

/* ─── Sugestão de infra no fim de semana ─────────────────────────────── */

function InfraCard() {
  const [data, setData] = useState<InfraSuggestion | null>(null)

  // aviso, não bloqueio: se falhar, o painel segue sem ele
  useEffect(() => {
    api<InfraSuggestion>('/api/promotions/infra-suggestion/')
      .then(setData)
      .catch(() => setData(null))
  }, [])

  if (!data) return null
  const slot = data.suggested_window
  const peak = `${data.projected.messages_peak_day} mensagens e ${data.projected.searches_peak_day} buscas/dia`

  if (!data.recommend) {
    return (
      <p className="text-[12px] text-ink-300">
        fim de semana tranquilo: a máquina local dá conta (pico previsto de {peak}, {Math.round(data.utilization * 100)}% da capacidade).
      </p>
    )
  }

  return (
    <div className={`rounded-md border-l-[3px] bg-white px-5 py-4 text-[13px] leading-relaxed text-ink-600 ${data.level === 'hire' ? 'border-danger' : 'border-rust'}`}>
      <p className="mb-1 font-medium text-ink">
        {data.level === 'hire' ? 'contrate infraestrutura para o fim de semana' : 'fim de semana movimentado à vista'}
      </p>
      <p className="mb-2">
        o pico previsto é de {peak} — {Math.round(data.utilization * 100)}% do que a máquina local aguenta. sugerimos subir a stack de produção numa
        VPS só de <strong>{formatDateTime(slot.start)}</strong> a <strong>{formatDateTime(slot.end)}</strong> ({slot.hours}h, cerca de{' '}
        <strong>{formatMoney(data.estimated_cost.total, data.estimated_cost.currency)}</strong>) e desligar na segunda.
      </p>
      {data.reasons.length > 0 && (
        <ul className="list-disc pl-5 text-[12px] text-ink-500">
          {data.reasons.map(r => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-ink-300">
        projeção pelas últimas {data.history_weeks} semanas + promoções já agendadas. passo a passo no guia de infraestrutura de fim de semana (docs do back).
      </p>
    </div>
  )
}

/* ─── Formulário (cria rascunho / edita) ─────────────────────────────── */

type FormState = Pick<Promotion, 'title' | 'message' | 'coupon_code' | 'send_telegram' | 'send_email'> & { valid_until: string }

function PromotionForm({
  initial,
  audience,
  onSubmit,
  onCancel,
}: {
  initial?: Promotion
  audience: PromotionAudience | null
  onSubmit: (data: FormState) => Promise<Record<string, string> | null>
  onCancel?: () => void
}) {
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? '',
    message: initial?.message ?? '',
    coupon_code: initial?.coupon_code ?? '',
    valid_until: initial?.valid_until ?? '',
    send_telegram: initial?.send_telegram ?? true,
    send_email: initial?.send_email ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const fieldErrors = await onSubmit(form)
    setSaving(false)
    if (fieldErrors) setErrors(fieldErrors)
    else if (!initial) setForm(f => ({ ...f, title: '', message: '', coupon_code: '', valid_until: '' }))
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-5 sm:p-6">
      {!initial && <h3 className="text-[15px] font-medium">nova promoção</h3>}
      <Field label="título" name="promo-title" maxLength={120} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} error={errors.title} required placeholder="ex.: rodízio em dobro na sexta" />
      <div>
        <TextArea label="mensagem" name="promo-message" maxLength={MAX_MESSAGE} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} error={errors.message} required />
        <p className="mt-1 text-right text-[11px] text-ink-250">
          {form.message.length}/{MAX_MESSAGE}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="cupom (opcional)" name="promo-coupon" maxLength={40} value={form.coupon_code} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value }))} error={errors.coupon_code} />
        <Field label="válida até (opcional)" name="promo-valid" type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} error={errors.valid_until} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="label">enviar por</span>
        <Checkbox id={`tg-${initial?.id ?? 'new'}`} checked={form.send_telegram} onChange={v => setForm(f => ({ ...f, send_telegram: v }))}>
          telegram {audience && (audience.telegram_configured ? `· ${audience.telegram} pessoa${audience.telegram === 1 ? '' : 's'}` : '· bot não configurado no servidor')}
        </Checkbox>
        <Checkbox id={`em-${initial?.id ?? 'new'}`} checked={form.send_email} onChange={v => setForm(f => ({ ...f, send_email: v }))}>
          e-mail {audience && `· ${audience.email} pessoa${audience.email === 1 ? '' : 's'}`}
        </Checkbox>
        <p className="text-[12px] text-ink-300">whatsapp: depois de enviar, o botão &quot;compartilhar no whatsapp&quot; abre o seu app com o texto pronto para a lista de transmissão, grupo ou status.</p>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !form.title.trim() || !form.message.trim()} className="btn-primary py-2">
          {saving ? <Spinner className="h-4 w-4 border-ink-600 border-t-white" /> : initial ? 'salvar' : 'salvar rascunho'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost py-2">
            cancelar
          </button>
        )}
      </div>
    </form>
  )
}

/* ─── Uma promoção na lista ──────────────────────────────────────────── */

function ScheduleInput({ onSchedule }: { onSchedule: (iso: string) => void }) {
  const [value, setValue] = useState(() => toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)))
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="datetime-local" value={value} onChange={e => setValue(e.target.value)} className="input w-auto py-1.5 text-[13px]" aria-label="data e hora do envio" />
      <button type="button" disabled={!value} onClick={() => onSchedule(new Date(value).toISOString())} className="btn-ghost py-1.5 text-[13px]">
        agendar
      </button>
    </div>
  )
}

function PromotionRow({
  promotion: p,
  audience,
  base,
  onChange,
}: {
  promotion: Promotion
  audience: PromotionAudience | null
  base: string
  onChange: (updated?: Promotion) => void
}) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const url = `${base}${p.id}/`

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    setBusy(true)
    try {
      await fn()
      if (success) toast.success(success)
      onChange()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const reach = audience ? (p.send_telegram ? audience.telegram : 0) + (p.send_email ? audience.email : 0) : null

  const sendNow = () => {
    const text = reach === null ? 'Enviar agora?' : reach === 0 ? 'Ninguém para receber por telegram/e-mail ainda. Publicar mesmo assim (fica na página e no whatsapp)?' : `Enviar agora? Até ${reach} mensagem(ns).`
    if (!confirm(text)) return
    run(() => api(`${url}send/`, { method: 'POST', body: {} }), 'Promoção enviada para a fila.')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.share_text)
      toast.success('Texto copiado.')
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto manualmente.')
    }
  }

  if (editing) {
    return (
      <PromotionForm
        initial={p}
        audience={audience}
        onCancel={() => setEditing(false)}
        onSubmit={async data => {
          try {
            const saved = await api<Promotion>(url, { method: 'PATCH', body: { ...data, valid_until: data.valid_until || null } })
            setEditing(false)
            onChange(saved)
            return null
          } catch (err) {
            toast.error(errorMessage(err))
            return err instanceof ApiError ? err.fields : {}
          }
        }}
      />
    )
  }

  const delivered = p.stats.sent
  const problems = p.stats.failed + p.stats.skipped

  return (
    <li className="card p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-medium">{p.title}</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
      </div>
      <p className="mb-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-600">{p.message}</p>
      <p className="mb-4 text-[11px] text-ink-300">
        {[
          p.coupon_code && `cupom ${p.coupon_code}`,
          p.valid_until && `válida até ${formatDate(p.valid_until)}`,
          p.status === 'scheduled' && p.scheduled_for && `envio em ${formatDateTime(p.scheduled_for)}`,
          p.sent_at && `enviada em ${formatDateTime(p.sent_at)}`,
          (p.status === 'sent' || p.status === 'sending') && `${delivered} entregue${delivered === 1 ? '' : 's'}${problems ? ` · ${p.stats.failed} falha(s) · ${p.stats.skipped} no limite diário` : ''}`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {p.status === 'draft' && (
          <>
            <button onClick={sendNow} disabled={busy} className="btn-accent py-1.5 text-[13px]">
              enviar agora
            </button>
            <ScheduleInput onSchedule={iso => run(() => api(`${url}send/`, { method: 'POST', body: { scheduled_for: iso } }), 'Promoção agendada.')} />
            <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 text-[13px]">
              editar
            </button>
          </>
        )}
        {p.status === 'scheduled' && (
          <>
            <button onClick={() => run(() => api(`${url}unschedule/`, { method: 'POST' }), 'Agendamento cancelado.')} disabled={busy} className="btn-ghost py-1.5 text-[13px]">
              cancelar agendamento
            </button>
            <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 text-[13px]">
              editar
            </button>
          </>
        )}
        {p.status === 'sending' && <Spinner className="h-4 w-4" />}
        {p.status === 'sent' && (
          <>
            <a href={p.whatsapp_url} target="_blank" rel="noopener noreferrer" className="btn-primary py-1.5 text-[13px]">
              compartilhar no whatsapp
            </a>
            <button onClick={copy} className="btn-ghost py-1.5 text-[13px]">
              copiar texto
            </button>
          </>
        )}
        {p.status !== 'sending' && (
          <button
            onClick={() => confirm(p.status === 'sent' ? 'Tirar da página do restaurante? Mensagens já enviadas não voltam.' : `Remover "${p.title}"?`) && run(() => api(url, { method: 'DELETE' }))}
            disabled={busy}
            className="ml-auto text-xs text-ink-250 hover:text-danger"
          >
            {p.status === 'sent' ? 'tirar da página' : 'remover'}
          </button>
        )}
      </div>
    </li>
  )
}

/* ─── Aba "promoções" ────────────────────────────────────────────────── */

export function PromotionsEditor({ restaurant }: { restaurant: Restaurant }) {
  const toast = useToast()
  const base = `/api/restaurants/${restaurant.id}/promotions/`
  const [state, setState] = useState<{ list: Promotion[]; audience: PromotionAudience | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  // o painel remonta este componente por restaurante (key), então `base` é fixo aqui
  useEffect(() => {
    let cancelled = false
    Promise.all([api<Promotion[]>(base), api<PromotionAudience>(`${base}audience/`).catch(() => null)])
      .then(([list, audience]) => {
        if (cancelled) return
        setState({ list, audience })
        setError(null)
      })
      .catch(err => !cancelled && setError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [base, reloadKey])

  // envio roda no worker: acompanha até terminar
  const sending = state?.list.some(p => p.status === 'sending') ?? false
  useEffect(() => {
    if (!sending) return
    const id = setInterval(reload, 3000)
    return () => clearInterval(id)
  }, [sending, reload])

  const create = async (data: FormState) => {
    try {
      await api<Promotion>(base, { method: 'POST', body: { ...data, valid_until: data.valid_until || null } })
      toast.success('Rascunho salvo. Envie agora ou agende.')
      reload()
      return null
    } catch (err) {
      toast.error(errorMessage(err))
      return err instanceof ApiError ? err.fields : {}
    }
  }

  if (error) {
    return (
      <p className="text-sm text-danger">
        {error}{' '}
        <button onClick={reload} className="underline">
          tentar de novo
        </button>
      </p>
    )
  }
  if (!state) return <Spinner />
  const { list, audience } = state

  return (
    <div className="flex flex-col gap-5">
      <InfraCard />
      <p className="text-[13px] text-muted">
        promoções chegam por telegram e e-mail para quem salvou o restaurante <strong>e</strong> aceitou receber promoções
        {audience && (
          <>
            {' '}
            — hoje, {audience.opted_in} de {audience.favorites} pessoa{audience.favorites === 1 ? '' : 's'} que salvaram
          </>
        )}
        . cada pessoa recebe no máximo algumas promoções por dia, de todos os restaurantes.
      </p>
      <PromotionForm audience={audience} onSubmit={create} />
      {list.length === 0 ? (
        <p className="text-[13px] text-ink-300">nenhuma promoção ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map(p => (
            <PromotionRow
              key={p.id}
              promotion={p}
              audience={audience}
              base={base}
              onChange={updated =>
                updated ? setState(s => (s ? { ...s, list: s.list.map(x => (x.id === updated.id ? updated : x)) } : s)) : reload()
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}
