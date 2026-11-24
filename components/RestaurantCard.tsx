'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useEffect, useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { ArrowUpRight, Bookmark, Check, MapPin, Star } from 'lucide-react'
import { recordEvent } from '@/lib/analytics'
import { useAuth } from '@/app/context/AuthContext'
import { useFavoriteActions, useIsFavorite } from '@/app/context/FavoritesContext'
import { cardSubtitle, formatRating } from '@/lib/format'
import type { RestaurantCard as Card } from '@/lib/types'
import { Cover } from './Illustration'
import { CatalogProvenance } from './CatalogProvenance'

export function FavoriteButton({ restaurantId, variant = 'icon' }: { restaurantId: number; variant?: 'icon' | 'full' }) {
  const { user } = useAuth()
  const { toggle } = useFavoriteActions()
  const saved = useIsFavorite(restaurantId)
  const router = useRouter()

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    toggle(restaurantId)
  }

  const icon = <AnimatePresence mode="wait" initial={false}><m.span key={String(saved)} className="flex" initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>{saved ? <Check size={17} strokeWidth={2} aria-hidden /> : <Bookmark size={17} strokeWidth={1.6} aria-hidden />}</m.span></AnimatePresence>

  if (variant === 'full') {
    return (
      <button onClick={onClick} aria-pressed={saved} className={`btn border ${saved ? 'border-saved-line bg-saved-bg text-ink-800' : 'border-ink-100 bg-transparent text-ink-800 hover:bg-white'}`}>
        {icon}
        {saved ? 'Salvo' : 'Salvar'}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remover dos salvos' : 'Salvar restaurante'}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-paper/95 shadow-sm backdrop-blur-md transition hover:scale-105 active:scale-90 ${saved ? 'text-rust' : 'text-ink-600'}`}
    >
      {icon}
    </button>
  )
}

export function OpenBadge({ open }: { open: boolean | null }) {
  if (open === null) return null
  return open ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-success-line bg-success-bg px-2.5 py-0.5 text-[11px] text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success-bright" /> Aberto agora
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-ink-100 px-2.5 py-0.5 text-[11px] text-ink-300">Fechado agora</span>
  )
}

// memo: listas crescem ("carregar mais", novas respostas no chat) e o pai
// re-renderiza por estado próprio; cards com as mesmas props ficam parados
export const RestaurantCard = memo(function RestaurantCard({ restaurant, match, index = 0, trackImpression = false }: { restaurant: Card; match?: number | null; index?: number; trackImpression?: boolean }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const observed = useRef(false)
  useEffect(() => {
    if (!trackImpression || !cardRef.current || observed.current || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observed.current = true
        recordEvent(restaurant.id, 'result_impression')
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [restaurant.id, trackImpression])
  const rating = Number(restaurant.average_rating)
  return (
    <Link
      ref={cardRef}
      href={`/restaurante/${restaurant.slug}`}
      className="restaurant-card group animate-fade-in hover:-translate-y-1.5"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="relative overflow-hidden">
        <Cover src={restaurant.cover_image} seed={restaurant.id} alt={restaurant.name} className="h-52 transition-transform duration-700 group-hover:scale-105" />
        {rating > 0 && <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-paper/95 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md"><Star size={12} className="fill-rust text-rust" aria-hidden />{formatRating(rating)}<span className="text-ink-350">({restaurant.total_reviews})</span></div>}
        <div className="absolute right-3 top-3">
          <FavoriteButton restaurantId={restaurant.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <h3 className="truncate font-serif text-[23px] tracking-[-0.02em] transition-colors group-hover:text-rust">{restaurant.name}</h3>
          {typeof match === 'number' && <span className="shrink-0 text-xs font-medium text-rust" title="Ordenação por similaridade; não é probabilidade de satisfação.">Afinidade contextual</span>}
        </div>
        <p className="mb-3 flex items-center gap-1 text-xs text-muted"><MapPin size={12} className="shrink-0" aria-hidden />{cardSubtitle(restaurant) || 'Localização não informada'}</p>
        <p className="mb-4 line-clamp-2 text-[13px] leading-6 text-ink-600">{restaurant.description}</p>
        <div className="mb-3">{typeof restaurant.distance_km === 'number' && <p className="mb-1 text-xs text-muted">A {restaurant.distance_km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km de você</p>}<CatalogProvenance restaurant={restaurant} /></div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <OpenBadge open={restaurant.is_open_now} />
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-rust">
            Conhecer <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
})

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}
