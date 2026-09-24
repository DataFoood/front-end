'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { useFavorites } from '@/app/context/FavoritesContext'
import { cardSubtitle, formatRating } from '@/lib/format'
import type { RestaurantCard as Card } from '@/lib/types'
import { Cover } from './Illustration'

export function FavoriteButton({ restaurantId, variant = 'icon' }: { restaurantId: number; variant?: 'icon' | 'full' }) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()
  const router = useRouter()
  const saved = isFavorite(restaurantId)

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    toggle(restaurantId)
  }

  const icon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  )

  if (variant === 'full') {
    return (
      <button onClick={onClick} aria-pressed={saved} className={`btn border ${saved ? 'border-[#ffeba0] bg-[#fff3cd] text-[#333]' : 'border-[#ddd] bg-transparent text-[#333] hover:bg-white'}`}>
        {icon}
        {saved ? 'salvo' : 'salvar'}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'remover dos salvos' : 'salvar restaurante'}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 ${saved ? 'text-rust' : 'text-[#555]'}`}
    >
      {icon}
    </button>
  )
}

export function OpenBadge({ open }: { open: boolean | null }) {
  if (open === null) return null
  return open ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#a8d8bc] bg-[#f0faf5] px-2.5 py-0.5 text-[11px] text-[#1a7a45]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#38a169]" /> aberto agora
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-[#ddd] px-2.5 py-0.5 text-[11px] text-[#999]">fechado agora</span>
  )
}

export function RestaurantCard({ restaurant, match, index = 0 }: { restaurant: Card; match?: number | null; index?: number }) {
  const rating = Number(restaurant.average_rating)
  return (
    <Link
      href={`/restaurante/${restaurant.slug}`}
      className="group flex min-w-0 animate-fade-in flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:-translate-y-0.5 hover:border-[#bbb]"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="relative">
        <Cover src={restaurant.cover_image} seed={restaurant.id} alt={restaurant.name} className="h-40" />
        <div className="absolute right-3 top-3">
          <FavoriteButton restaurantId={restaurant.id} />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <h3 className="truncate font-serif text-xl lowercase">{restaurant.name}</h3>
          {typeof match === 'number' && <span className="shrink-0 text-xs font-medium text-rust">{match}% match</span>}
        </div>
        <p className="mb-3 text-xs text-[#999]">{cardSubtitle(restaurant) || '—'}</p>
        <p className="mb-4 line-clamp-3 text-[13px] leading-relaxed text-[#555]">{restaurant.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <OpenBadge open={restaurant.is_open_now} />
            {rating > 0 && (
              <span className="text-[11px] text-[#777]">
                ★ {formatRating(rating)} <span className="text-[#bbb]">({restaurant.total_reviews})</span>
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-rust">
            ver
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}
