'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Spinner, Stars } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { formatDate, formatRating } from '@/lib/format'
import type { Restaurant, RestaurantStats } from '@/lib/types'

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="card px-5 py-5">
      <p className="mb-3 text-[10px] tracking-[0.1em] text-[#999]">{label}</p>
      <p className="font-serif text-[32px] leading-none tracking-tight">{value}</p>
      {note && <p className="mt-2 text-[11px] text-[#777]">{note}</p>}
    </div>
  )
}

/** Barras verticais de série única (favoritos/dia), com tooltip por barra. */
function DailyBars({ series, windowDays }: { series: RestaurantStats['series']; windowDays: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const values = series.map(s => s.favorites)
  const max = Math.max(1, ...values)
  const active = hover !== null ? series[hover] : null

  if (values.every(v => v === 0)) {
    return (
      <div className="card flex flex-col p-5 sm:p-6">
        <p className="mb-1 text-sm">novos favoritos por dia</p>
        <p className="my-auto py-12 text-center text-[13px] text-[#999]">nenhum favorito nos últimos {windowDays} dias.</p>
      </div>
    )
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <p className="text-sm">novos favoritos por dia</p>
        <p className="text-[11px] text-[#777]" aria-live="polite">
          {active ? `${formatDate(active.date)} · ${active.favorites} favorito${active.favorites === 1 ? '' : 's'}` : `últimos ${windowDays} dias`}
        </p>
      </div>
      <p className="mb-5 text-[11px] text-[#999]">quantas pessoas salvaram o restaurante em cada dia</p>
      <div className="relative">
        {/* grid recessiva: só a linha do máximo */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#eee]" aria-hidden />
        <span className="absolute -top-2 right-0 bg-white pl-1 text-[10px] text-[#999]" aria-hidden>
          {max}
        </span>
        <div className="flex h-36 items-end gap-[2px]" role="img" aria-label={`favoritos por dia nos últimos ${windowDays} dias, máximo de ${max}`}>
          {series.map((s, i) => (
            <div
              key={s.date}
              className="flex h-full flex-1 cursor-default items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={`w-full rounded-t-[4px] transition-opacity ${hover !== null && hover !== i ? 'opacity-40' : ''}`}
                style={{ height: s.favorites ? `${(s.favorites / max) * 100}%` : 2, background: s.favorites ? '#C0603A' : '#eee' }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[#999]">
        <span>{formatDate(series[0].date)}</span>
        <span>hoje</span>
      </div>
      {/* versão tabular p/ leitores de tela */}
      <table className="sr-only">
        <caption>favoritos por dia</caption>
        <tbody>
          {series.map(s => (
            <tr key={s.date}>
              <td>{s.date}</td>
              <td>{s.favorites}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RatingBars({ distribution, total }: { distribution: RestaurantStats['rating_distribution']; total: number }) {
  const max = Math.max(1, ...Object.values(distribution))
  return (
    <div className="card p-5 sm:p-6">
      <p className="mb-1 text-sm">distribuição das notas</p>
      <p className="mb-5 text-[11px] text-[#999]">{total} avaliações no total</p>
      <div className="flex flex-col gap-3">
        {(['5', '4', '3', '2', '1'] as const).map(star => (
          <div key={star} className="flex items-center gap-3">
            <span className="w-6 text-xs text-[#555]">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0ece4]">
              <div className="h-full rounded-full bg-rust" style={{ width: `${(distribution[star] / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right text-xs text-[#555]">{distribution[star]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Overview({ restaurant }: { restaurant: Restaurant }) {
  const [state, setState] = useState<{ id: number; stats?: RestaurantStats; error?: string } | null>(null)

  useEffect(() => {
    const id = restaurant.id
    api<RestaurantStats>(`/api/restaurants/${id}/stats/`)
      .then(stats => setState({ id, stats }))
      .catch(err => setState({ id, error: errorMessage(err) }))
  }, [restaurant.id])

  const current = state?.id === restaurant.id ? state : null
  const stats = current?.stats
  const error = current?.error

  if (error) return <p className="text-sm text-[#c53030]">{error}</p>
  if (!stats) return <Spinner />

  const missing = [
    !restaurant.description && 'descrição',
    !restaurant.cuisines.length && 'cozinhas',
    !restaurant.price_ranges.length && 'faixa de preço',
    !restaurant.address && 'endereço',
    !restaurant.business_hours.length && 'horários',
    !restaurant.items.length && 'pratos do cardápio',
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-5">
      {missing.length > 0 && (
        <div className="rounded-md border-l-[3px] border-rust bg-white px-5 py-4 text-[13px] leading-relaxed text-[#555]">
          complete o cadastro para aparecer melhor na busca inteligente: falta <strong>{missing.join(', ')}</strong>.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="VISUALIZAÇÕES" value={stats.view_count.toLocaleString('pt-BR')} note="acessos à página (total)" />
        <Tile label="FAVORITOS" value={stats.favorites_total} note={`+${stats.favorites_window} nos últimos ${stats.window_days} dias`} />
        <Tile label="AVALIAÇÕES" value={stats.reviews_total} note={`+${stats.reviews_window} nos últimos ${stats.window_days} dias`} />
        <Tile label="NOTA MÉDIA" value={formatRating(stats.average_rating)} note={stats.reviews_total ? 'de 5,0' : 'sem avaliações ainda'} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <DailyBars series={stats.series} windowDays={stats.window_days} />
        <RatingBars distribution={stats.rating_distribution} total={stats.reviews_total} />
      </div>
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm">avaliações recentes</p>
          <Link href={`/restaurante/${restaurant.slug}`} className="text-xs text-rust underline">
            ver página pública
          </Link>
        </div>
        {stats.recent_reviews.length === 0 ? (
          <p className="text-[13px] text-[#999]">nenhuma avaliação ainda.</p>
        ) : (
          <ul className="divide-y divide-[#f0ece4]">
            {stats.recent_reviews.map(r => (
              <li key={r.id} className="py-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Stars value={r.rating} size={12} />
                  <span className="text-[11px] text-[#999]">
                    {r.author_name} · {formatDate(r.created_at)}
                  </span>
                </div>
                {r.title && <p className="text-[13px] font-medium">{r.title}</p>}
                {r.description && <p className="text-[13px] text-[#555]">{r.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
