'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Cover } from '@/components/Illustration'
import { FavoriteButton, OpenBadge } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { EmptyState, PageLoader, SectionTitle, Spinner, Stars, TextArea } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import {
  DAYS,
  formatAddress,
  formatDate,
  formatIntervals,
  formatPhone,
  formatPrice,
  formatRating,
  lowerNames,
  priceDetail,
  priceSymbol,
  todayIndex,
  whatsappLink,
} from '@/lib/format'
import type { Restaurant, Review } from '@/lib/types'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const CHANNEL_LABELS: [keyof Restaurant, string][] = [
  ['has_dine_in', 'salão'],
  ['has_delivery', 'delivery'],
  ['has_take_out', 'retirada'],
  ['has_drive_thru', 'drive-thru'],
  ['has_reservation', 'aceita reserva'],
  ['accepts_vale_refeicao', 'vale-refeição'],
  ['accepts_online_order', 'pedido online'],
]

function ReviewForm({ restaurantId, onCreated }: { restaurantId: number; onCreated: () => void }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!rating) {
      toast.error('Escolha uma nota de 1 a 5.')
      return
    }
    setSending(true)
    try {
      await api(`/api/restaurants/${restaurantId}/reviews/`, {
        method: 'POST',
        body: { rating, title: title.trim(), description: description.trim() },
      })
      toast.success('Avaliação publicada. Obrigado!')
      setRating(0)
      setTitle('')
      setDescription('')
      onCreated()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-5">
      <div>
        <span className="label">sua nota</span>
        <div className="flex gap-1" role="radiogroup" aria-label="nota" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={n <= (hover || rating) ? '#C0603A' : 'none'} stroke="#C0603A" strokeWidth="1.5" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <input className="input" placeholder="título (opcional)" maxLength={150} value={title} onChange={e => setTitle(e.target.value)} aria-label="título" />
      <TextArea label="comentário (opcional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="como foi a experiência?" />
      <button type="submit" disabled={sending} className="btn-primary self-start">
        {sending ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'publicar avaliação'}
      </button>
    </form>
  )
}

export default function RestaurantePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()
  // resultado chaveado pelo slug + contador de recarga (após avaliar/excluir)
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<{ slug: string; data?: Restaurant; error?: 'not-found' | 'error' } | null>(null)
  const load = useCallback(() => setReloadKey(k => k + 1), [])

  useEffect(() => {
    api<Restaurant>(`/api/restaurants/by-slug/${encodeURIComponent(slug)}/`)
      .then(data => {
        setState({ slug, data })
        document.title = `${data.name} · datafood`
      })
      .catch(err => setState({ slug, error: err instanceof ApiError && err.status === 404 ? 'not-found' : 'error' }))
  }, [slug, reloadKey])

  const current = state?.slug === slug ? state : null
  const restaurant = current?.data ?? null
  const error = current?.error ?? null

  const deleteReview = async (review: Review) => {
    if (!restaurant || !confirm('Excluir sua avaliação?')) return
    try {
      await api(`/api/restaurants/${restaurant.id}/reviews/${review.id}/`, { method: 'DELETE' })
      toast.success('Avaliação excluída.')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const body = () => {
    if (error === 'not-found') {
      return (
        <EmptyState
          title="restaurante não encontrado"
          text="ele pode ter saído do ar ou o link está incorreto."
          action={
            <Link href="/explorar" className="btn-primary">
              explorar restaurantes
            </Link>
          }
        />
      )
    }
    if (error) {
      return <EmptyState title="não foi possível carregar" text="tente novamente em instantes." action={<button onClick={load} className="btn-primary">tentar de novo</button>} />
    }
    if (!restaurant) return <PageLoader />

    const r = restaurant
    const today = todayIndex()
    const address = formatAddress(r.address)
    const whats = r.phone ? whatsappLink(r.phone) : null
    const rating = Number(r.average_rating)
    const isOwner = !!user && (user.id === r.owner || user.role === 'admin')
    const alreadyReviewed = !!user && r.reviews.some(rv => rv.author === user.id)
    const channels = CHANNEL_LABELS.filter(([k]) => r[k]).map(([, label]) => label)
    const tags = [r.address?.neighborhood, lowerNames(r.cuisines), priceSymbol(r.price_ranges), lowerNames(r.ambients)].filter(Boolean) as string[]
    const mapsUrl = r.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address!.replace('\n', ', '))}` : null

    return (
      <>
        <button onClick={() => router.back()} className="mb-7 inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          voltar
        </button>

        <div className="mb-14 grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
          <Cover src={r.cover_image} seed={r.id} alt={r.name} className="aspect-[4/3] rounded-lg" />
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <OpenBadge open={r.is_open_now} />
              {rating > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-[#777]">
                  <Stars value={rating} size={12} /> {formatRating(rating)} · {r.total_reviews} {r.total_reviews === 1 ? 'avaliação' : 'avaliações'}
                </span>
              )}
            </div>
            <h1 className="mb-4 font-serif text-[clamp(38px,5vw,52px)] lowercase leading-[1.05]">{r.name}</h1>
            <p className="mb-6 max-w-md text-[15px] leading-relaxed text-[#555]">{r.description}</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {tags.map(t => (
                <span key={t} className="chip lowercase">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {whats ? (
                <a href={whats} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  {r.has_reservation ? 'reservar pelo whatsapp' : 'falar com o restaurante'}
                </a>
              ) : r.phone ? (
                <a href={`tel:${r.phone}`} className="btn-primary">
                  ligar
                </a>
              ) : null}
              <FavoriteButton restaurantId={r.id} variant="full" />
              {isOwner && (
                <Link href={`/painel?r=${r.id}`} className="btn-ghost">
                  editar no painel
                </Link>
              )}
            </div>
          </div>
        </div>

        <hr className="mb-12 border-line" />

        <section className="mb-14">
          <SectionTitle title="fatos" eyebrow="01 / informações" />
          <div className="grid grid-cols-1 overflow-hidden rounded-md border border-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'ENDEREÇO',
                value: address ?? 'não informado',
                note: mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    abrir no mapa
                  </a>
                ) : null,
              },
              { label: 'FAIXA DE PREÇO', value: priceSymbol(r.price_ranges) ?? '—', note: priceDetail(r.price_ranges) },
              { label: 'CONTATO', value: r.phone ? formatPhone(r.phone) : '—', note: r.website ? <a href={r.website} target="_blank" rel="noopener noreferrer" className="underline">site</a> : r.email || null },
              { label: 'ATENDIMENTO', value: channels.length ? channels.join(' · ') : '—', note: null },
            ].map((item, i) => (
              <div key={item.label} className={`border-line px-5 pb-6 pt-5 ${i > 0 ? 'border-t sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:border-l' : ''} ${i >= 2 ? 'sm:border-t lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l' : ''}`}>
                <p className="mb-3 text-[10px] tracking-[0.1em] text-[#bbb]">{item.label}</p>
                <p className="whitespace-pre-line text-[15px] leading-normal">{item.value}</p>
                {item.note && <p className="mt-1 text-xs text-[#999]">{item.note}</p>}
              </div>
            ))}
          </div>
        </section>

        {r.items.length > 0 && (
          <section className="mb-14">
            <SectionTitle title="destaques do cardápio" eyebrow={`02 / ${r.items.length} pratos`} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {r.items.map((item, i) => (
                <div key={item.id} className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-md">
                  <Cover seed={r.id + i + 1} alt="" className="h-36" />
                  <div className="px-4 pb-5 pt-4">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <span className="text-[15px]">{item.name}</span>
                      {formatPrice(item.price) && <span className="whitespace-nowrap text-[13px] font-medium text-rust">{formatPrice(item.price)}</span>}
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#666]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {r.menu_url && (
              <a href={r.menu_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-rust underline">
                ver cardápio completo
              </a>
            )}
          </section>
        )}

        {r.images.length > 0 && (
          <section className="mb-14">
            <SectionTitle title="fotos" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {r.images.map(img => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-md bg-ink">
                  <img src={img.url} alt={`foto de ${r.name}`} loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mb-14">
          <SectionTitle title="horários" eyebrow="03 / funcionamento" />
          {r.business_hours.length === 0 ? (
            <p className="text-sm text-[#999]">horários não informados.</p>
          ) : (
            <div className="max-w-md">
              {DAYS.map((day, i) => {
                const hour = r.business_hours.find(h => h.day_week === i)
                const text = formatIntervals(hour)
                const isToday = i === today
                return (
                  <div key={day} className={`flex justify-between border-b border-[#f0ece4] py-2.5 text-[13px] ${isToday ? 'font-medium text-ink' : text === 'fechado' ? 'text-[#ccc]' : 'text-[#555]'}`}>
                    <span>
                      {day}
                      {isToday && ' · hoje'}
                    </span>
                    <span>{text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="avaliações" eyebrow={`04 / ${r.total_reviews}`} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              {r.reviews.length === 0 && <p className="text-sm text-[#999]">ainda sem avaliações. seja o primeiro!</p>}
              {r.reviews.map(rv => (
                <article key={rv.id} className="card p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <Stars value={rv.rating} />
                    <span className="text-[11px] text-[#aaa]">
                      {rv.author_name} · {formatDate(rv.created_at)}
                    </span>
                  </div>
                  {rv.title && <h3 className="mb-1 text-[15px] font-medium">{rv.title}</h3>}
                  {rv.description && <p className="text-sm leading-relaxed text-[#555]">{rv.description}</p>}
                  {user && rv.author === user.id && (
                    <button onClick={() => deleteReview(rv)} className="mt-3 text-xs text-[#aaa] hover:text-[#e53e3e]">
                      excluir minha avaliação
                    </button>
                  )}
                </article>
              ))}
            </div>
            <div>
              {!user ? (
                <div className="card p-5 text-sm text-[#666]">
                  <Link href={`/login?next=/restaurante/${r.slug}`} className="text-rust underline">
                    entre
                  </Link>{' '}
                  para avaliar este restaurante.
                </div>
              ) : isOwner ? (
                <p className="text-sm text-[#999]">donos não avaliam o próprio restaurante.</p>
              ) : alreadyReviewed ? (
                <p className="text-sm text-[#999]">você já avaliou este restaurante.</p>
              ) : (
                <ReviewForm restaurantId={r.id} onCreated={load} />
              )}
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-8">{body()}</main>
      <SiteFooter />
    </div>
  )
}
