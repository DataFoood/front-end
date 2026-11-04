'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { api, API_URL, errorMessage } from '@/lib/api'
import { formatDate, formatMoney } from '@/lib/format'
import { Spinner } from '@/components/ui'
import { useToast } from '@/app/context/ToastContext'
import type { AnalyticsKind } from '@/lib/analytics'

type Counts = Record<AnalyticsKind, number>
interface Report {
  window: { days: number; start: string; end: string }
  observed_since: string | null
  comparison_available: boolean
  totals: Counts
  previous: Counts
  series: { date: string; views: number }[]
  redemptions: number
  redemption_value: string | null
  redemptions_with_value: number
  notice: string
  campaigns: { id: number; title: string; coupon_code: string; status: string; events: Counts; redemptions: number; accepted: number }[]
}

const METRICS: [AnalyticsKind, string][] = [
  ['result_impression', 'Aparições em resultados'], ['detail_view', 'Aberturas de detalhe'],
  ['contact_click', 'Cliques em contato'], ['menu_click', 'Aberturas de cardápio'],
]

export function Insights({ restaurantId }: { restaurantId: number }) {
  const toast = useToast()
  const [days, setDays] = useState(30)
  const [nonce, setNonce] = useState(0)
  const key = `${restaurantId}:${days}:${nonce}`
  const [state, setState] = useState<{ key: string; data?: Report; error?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const abort = new AbortController()
    api<Report>(`/api/restaurants/${restaurantId}/analytics/`, { query: { days }, signal: abort.signal })
      .then(data => setState({ key, data }))
      .catch(err => { if (err.name !== 'AbortError') setState({ key, error: errorMessage(err) }) })
    return () => abort.abort()
  }, [restaurantId, days, key])
  const current = state?.key === key ? state : null
  const data = current?.data
  const exportCsv = async () => {
    setBusy(true)
    try {
      const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/analytics/?days=${days}&export=csv`, { credentials: 'include', headers: { 'X-Requested-With': 'datafood' } })
      if (!response.ok) throw new Error('Não foi possível exportar. Atualize a sessão e tente novamente.')
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url; link.download = `datafood-${restaurantId}-${days}-dias.csv`; link.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return (
    <section className="space-y-5" aria-label="Resultados do restaurante">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-serif text-2xl">Descoberta e resultados</h2><p className="mt-1 text-sm text-muted">Entenda como encontram seu restaurante e acompanhe suas campanhas.</p></div>
        <div className="flex items-end gap-2"><label className="flex flex-col"><span className="label">Período</span><select aria-label="Período dos resultados" className="input" value={days} onChange={e => setDays(Number(e.target.value))}>{[7, 30, 90].map(n => <option key={n} value={n}>Últimos {n} dias</option>)}</select></label>
          <button className="btn-ghost" onClick={() => setNonce(n => n + 1)}>Atualizar</button>
          <button className="btn-ghost" disabled={!data || busy} onClick={exportCsv}>Exportar CSV</button></div>
      </div>
      {!current && <Spinner />}
      {current?.error && <p role="alert" className="text-sm text-danger">{current.error}</p>}
      {data && <>
        <p className="text-xs text-muted">De {formatDate(data.window.start)} a {formatDate(data.window.end)} · {data.observed_since ? `Eventos observados desde ${formatDate(data.observed_since)}` : 'Ainda sem eventos registrados'}. {data.comparison_available ? 'Comparação com o intervalo anterior de mesma duração.' : 'Histórico insuficiente para comparar períodos completos.'}</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{METRICS.map(([kind, label]) => {
          const previous = data.previous[kind], total = data.totals[kind]
          const change = previous ? Math.round((total - previous) / previous * 100) : null
          return <div className="card p-4" key={kind}><p className="text-xs text-muted">{label}</p><p className="my-2 font-serif text-3xl">{total.toLocaleString('pt-BR')}</p><p className="text-xs text-muted">{data.comparison_available ? `${previous} no período anterior${change !== null ? ` · ${change > 0 ? '+' : ''}${change}%` : ''}` : 'Comparação indisponível'}</p></div>
        })}</div>
        <div className="card p-5"><h3 className="mb-4 text-sm font-medium">Aberturas de detalhe ao longo do período</h3>
          {data.series.every(row => !row.views) ? <p className="py-6 text-sm text-muted">Ainda sem visitas observadas neste período.</p> : <div role="img" aria-label="Aberturas de detalhe por dia; dados completos na tabela abaixo" className="flex h-36 items-end gap-1">{data.series.map(row => <div key={row.date} title={`${formatDate(row.date)}: ${row.views}`} className="min-w-0 flex-1 rounded-t bg-rust" style={{ height: `${Math.max(1, row.views / Math.max(1, ...data.series.map(s => s.views)) * 100)}%` }} />)}</div>}
          <details className="mt-4 text-xs"><summary className="cursor-pointer text-rust">Ver dados por dia</summary><table className="mt-3 w-full text-left"><caption className="sr-only">Aberturas de detalhe por data</caption><thead><tr><th scope="col">Data</th><th scope="col">Aberturas</th></tr></thead><tbody>{data.series.map(row => <tr key={row.date}><td>{formatDate(row.date)}</td><td>{row.views}</td></tr>)}</tbody></table></details>
        </div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="card p-5"><p className="text-sm">Resgates confirmados pelo restaurante</p><p className="mt-2 font-serif text-3xl">{data.redemptions}</p></div><div className="card p-5"><p className="text-sm">Valor dos resgates informado</p><p className="mt-2 font-serif text-3xl">{data.redemption_value === null ? 'Não informado' : formatMoney(Number(data.redemption_value))}</p><p className="mt-1 text-xs text-muted">{data.redemptions_with_value} resgate(s) com valor. Não é cálculo de ROI.</p></div></div>
        <div className="card overflow-x-auto p-5"><h3 className="mb-4 text-sm font-medium">Campanhas recentes · resultados no período</h3>{!data.campaigns.length ? <p className="text-sm text-muted">Crie uma promoção para começar a acompanhar.</p> : <table className="w-full min-w-[540px] text-left text-sm"><caption className="sr-only">Resultados por campanha</caption><thead className="border-b border-line text-xs text-muted"><tr><th scope="col" className="pb-3">Campanha</th><th scope="col">Aceitas pelo provedor</th><th scope="col">Visitas atribuídas</th><th scope="col">Resgates</th></tr></thead><tbody>{data.campaigns.map(c => <tr className="border-b border-line-soft" key={c.id}><th scope="row" className="py-3 font-normal">{c.title}</th><td>{c.accepted}</td><td>{c.events.detail_view}</td><td>{c.redemptions}</td></tr>)}</tbody></table>}</div>
        <RedemptionForm restaurantId={restaurantId} campaigns={data.campaigns} onSaved={() => setNonce(n => n + 1)} />
        <p className="text-xs leading-relaxed text-muted">{data.notice} Bloqueadores e preferências do navegador podem reduzir a amostra.</p>
      </>}
    </section>
  )
}

function RedemptionForm({ restaurantId, campaigns, onSaved }: { restaurantId: number; campaigns: Report['campaigns']; onSaved: () => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const eligible = campaigns.filter(c => c.coupon_code && ['sent', 'partial'].includes(c.status))
  if (!eligible.length) return null
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    try {
      const result = await api<{ created: boolean }>(`/api/restaurants/${restaurantId}/redemptions/`, { method: 'POST', body: { promotion: Number(fields.get('promotion')), reference: fields.get('reference'), amount: fields.get('amount') || null } })
      toast.success(result.created ? 'Resgate confirmado.' : 'Este resgate já estava registrado.')
      form.reset(); onSaved()
    } catch (err) { toast.error(errorMessage(err)) } finally { setBusy(false) }
  }
  return <details className="card p-5"><summary className="cursor-pointer text-sm font-medium">Confirmar resgate de cupom</summary><p className="my-3 text-xs text-muted">Registre apenas resgates verificados. Use uma referência interna única, sem nome, telefone ou CPF do cliente.</p><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
    <label className="flex flex-col"><span className="label">Campanha</span><select name="promotion" className="input">{eligible.map(c => <option key={c.id} value={c.id}>{c.title} · {c.coupon_code}</option>)}</select></label>
    <label className="flex flex-col"><span className="label">Referência do resgate</span><input name="reference" required maxLength={100} className="input" placeholder="Ex.: caixa-001" /></label>
    <label className="flex flex-col"><span className="label">Valor confirmado (opcional)</span><input name="amount" type="number" min="0" step="0.01" className="input" /></label>
    <button className="btn-accent self-end" disabled={busy}>Confirmar resgate</button>
  </form></details>
}
