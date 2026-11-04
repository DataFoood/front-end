'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useFavoriteActions } from '@/app/context/FavoritesContext'
import { api } from '@/lib/api'
import { recordEvent } from '@/lib/analytics'
import { formatRating, priceDetail } from '@/lib/format'
import type { Restaurant, RestaurantCard } from '@/lib/types'
import { CatalogProvenance } from './CatalogProvenance'
import { Cover } from './Illustration'
import { OpenBadge } from './RestaurantCard'

export function ChoiceDeck({ restaurants }: { restaurants: RestaurantCard[] }) {
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<RestaurantCard | null>(null)
  const [busy, setBusy] = useState(false)
  const deciding = useRef(false)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const { save } = useFavoriteActions()
  const current = restaurants[index]
  useEffect(() => {
    if (chosen) confirmationRef.current?.focus({ preventScroll: true })
  }, [chosen])

  const decide = async (choose: boolean) => {
    if (!current || deciding.current) return
    deciding.current = true
    setBusy(true)
    try {
      if (choose && !(await save(current.id))) return
      setIndex(index + 1)
      if (choose) setChosen(current)
    } finally { deciding.current = false; setBusy(false) }
  }

  return (
    <section aria-label="Modo escolha" className="mx-auto w-full max-w-lg">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
        <span>← Recusar · Escolher e salvar →</span>
        <span aria-live="polite">{Math.min(chosen ? index : index + 1, restaurants.length)} de {restaurants.length}</span>
      </div>
      {chosen ? (
        <div ref={confirmationRef} tabIndex={-1} className="card space-y-4 p-6 outline-offset-4" role="region" aria-label="Restaurante escolhido">
          <p className="text-sm text-success" role="status">Escolhido e salvo nos seus favoritos</p>
          <h3 className="font-serif text-3xl">{chosen.name}</h3>
          <p className="text-sm text-muted">Confira os detalhes, o endereço e como falar com o restaurante.</p>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-accent" href={`/restaurante/${chosen.slug}`}>Ver restaurante escolhido</Link>
            <button className="btn-ghost" onClick={() => setChosen(null)}>Continuar vendo</button>
          </div>
        </div>
      ) : current ? (
        <ChoiceCard key={current.id} restaurant={current} busy={busy} onDecision={decide} focusOnMount={index > 0} />
      ) : (
        <div className="card space-y-4 p-6 text-center">
          <h3 className="font-serif text-2xl">Você viu todos os restaurantes desta lista</h3>
          <p className="text-sm text-muted">Suas escolhas estão nos salvos. Reveja os cards ou faça outra busca.</p>
          <div className="flex flex-wrap justify-center gap-2"><Link className="btn-accent" href="/salvos">Ver meus salvos</Link>
            {restaurants.length > 0 && <button className="btn-ghost" onClick={() => setIndex(0)}>Rever restaurantes</button>}</div>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted">Arraste o card para decidir. Use as setas da foto para ver mais imagens. Recusar não remove um favorito que você já salvou.</p>
    </section>
  )
}

function ChoiceCard({ restaurant, busy, onDecision, focusOnMount }: {
  restaurant: RestaurantCard; busy: boolean; onDecision: (choose: boolean) => Promise<void>; focusOnMount: boolean
}) {
  const [loaded, setLoaded] = useState<Restaurant | null>(null)
  const [photoError, setPhotoError] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [broken, setBroken] = useState<string[]>([])
  const [offset, setOffset] = useState(0)
  const start = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusOnMount) cardRef.current?.focus({ preventScroll: true })
  }, [focusOnMount])
  useEffect(() => {
    const abort = new AbortController()
    api<Restaurant>(`/api/restaurants/${restaurant.id}/`, { signal: abort.signal })
      .then(setLoaded)
      .catch(error => { if (error.name !== 'AbortError') setPhotoError(true) })
    return () => abort.abort()
  }, [restaurant.id])
  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        recordEvent(restaurant.id, 'result_impression')
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [restaurant.id])

  const data = loaded ?? restaurant
  const photos = Array.from(new Set([loaded?.cover_image || restaurant.cover_image, ...(loaded?.images.map(image => image.url) ?? [])].filter(Boolean)))
  const distance = restaurant.distance_km ?? loaded?.distance_km
  const photo = photos[photoIndex % Math.max(1, photos.length)]
  const tags = [...data.cuisines, ...data.ambients, ...data.price_ranges].map(tag => tag.name)
  const movePhoto = (step: number) => setPhotoIndex(index => (index + step + photos.length) % photos.length)
  const clearPointer = () => { start.current = null; setOffset(0) }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (busy || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || (event.target as Element).closest('a,button,input,select')) return
    start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false }
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current
    if (!origin || origin.id !== event.pointerId || busy) return
    const dx = event.clientX-origin.x, dy = event.clientY-origin.y
    if (!origin.horizontal && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { clearPointer(); return }
    if (!origin.horizontal && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      origin.horizontal = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (origin.horizontal) setOffset(dx)
  }
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current
    if (!origin || origin.id !== event.pointerId) return
    const dx = event.clientX-origin.x
    const threshold = Math.min(100, Math.max(56, event.currentTarget.clientWidth * .22))
    clearPointer()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (origin.horizontal && Math.abs(dx) >= threshold && !busy) void onDecision(dx > 0)
  }

  return (
    <div className="overflow-hidden px-2 pb-2 pt-1">
      <div ref={cardRef} role="group" aria-label={`Card de escolha: ${restaurant.name}`} tabIndex={0}
        aria-busy={busy} className="card relative select-none overflow-hidden rounded-2xl shadow-lg outline-offset-4 transition-transform motion-reduce:transform-none! motion-reduce:transition-none!"
        style={{ touchAction: 'pan-y', transform: `translateX(${offset}px) rotate(${offset / 25}deg)`, transitionDuration: offset ? '0ms' : '180ms' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={clearPointer}
        onLostPointerCapture={event => {
          // Touch começa com captura implícita na imagem. Transferi-la ao
          // card emite lostpointercapture na imagem, que borbulha até aqui.
          if (event.target === event.currentTarget && !event.currentTarget.hasPointerCapture(event.pointerId)) clearPointer()
        }}
        onKeyDown={event => {
          if (event.target !== event.currentTarget || event.repeat || busy) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); void onDecision(event.key === 'ArrowRight') }
        }}>
        <div className="relative h-64 bg-ink sm:h-80">
          {photo && !broken.includes(photo) ? <img src={photo} alt={`${restaurant.name} — foto ${photoIndex + 1}`} draggable={false} className="h-full w-full object-cover" onError={() => setBroken(previous => [...previous, photo])} /> : <Cover seed={restaurant.id} alt={restaurant.name} className="h-full w-full" />}
          {!photo && <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs text-white">Sem fotos cadastradas</span>}
          {photo && broken.includes(photo) && <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs text-white">Foto indisponível</span>}
          {photos.length > 1 && <>
            <button type="button" disabled={busy} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-xl text-white" onClick={() => movePhoto(-1)}>‹</button>
            <button type="button" disabled={busy} aria-label="Próxima foto" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-xl text-white" onClick={() => movePhoto(1)}>›</button>
            <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs text-white" aria-live="polite">Foto {photoIndex + 1} de {photos.length}</span>
          </>}
          {Math.abs(offset) > 25 && <span aria-hidden className={`absolute inset-x-8 top-16 rounded-lg border-2 p-3 text-center text-2xl font-bold ${offset > 0 ? 'border-success bg-success-bg text-success' : 'border-danger bg-danger-bg text-danger'}`}>{offset > 0 ? 'Quero este' : 'Não é hoje'}</span>}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-2xl sm:text-3xl">{data.name}</h3><OpenBadge open={data.is_open_now} /></div>
          <p className="text-sm text-muted">{[data.address?.neighborhood, data.address?.city, typeof distance === 'number' ? `${distance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km` : null].filter(Boolean).join(' · ') || 'Localização não informada'}</p>
          <div className="flex flex-wrap gap-2">{Array.from(new Set(tags)).slice(0, 6).map(tag => <span key={tag} className="chip text-xs">{tag}</span>)}{data.has_delivery && <span className="chip text-xs">Delivery</span>}{data.has_reservation && <span className="chip text-xs">Aceita reservas</span>}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600"><span>{data.total_reviews > 0 ? `★ ${formatRating(data.average_rating)} · ${data.total_reviews} avaliações` : 'Ainda sem avaliações'}</span>{priceDetail(data.price_ranges) && <span>{priceDetail(data.price_ranges)}</span>}</div>
          {data.description && <p className="line-clamp-3 text-sm leading-relaxed text-ink-600">{data.description}</p>}
          <CatalogProvenance restaurant={data} />
          {photoError && <p className="text-xs text-muted">Não foi possível carregar as fotos adicionais. A capa e os resultados da busca continuam disponíveis.</p>}
          <Link href={`/restaurante/${data.slug}`} className="inline-block py-1 text-sm text-rust underline">Ver detalhes antes de decidir</Link>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className="btn-ghost min-h-12 border-danger-line text-danger" disabled={busy} onClick={() => void onDecision(false)}>✕ Recusar</button>
        <button type="button" className="btn-accent min-h-12" disabled={busy} onClick={() => void onDecision(true)}>{busy ? 'Salvando…' : '♥ Escolher e salvar'}</button>
      </div>
    </div>
  )
}
