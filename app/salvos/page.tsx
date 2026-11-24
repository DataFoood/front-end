'use client'

import Link from 'next/link'
import { Bookmark, ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/Motion'
import { RequireAuth } from '@/components/RequireAuth'
import { CardGrid, RestaurantCard } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { EmptyState, LoadMore, PageLoader } from '@/components/ui'
import type { Favorite } from '@/lib/types'
import { usePaginated } from '@/lib/usePaginated'
import { useFavoriteIds, useFavoritesCount } from '../context/FavoritesContext'

function SavedList() {
  const ids = useFavoriteIds()
  const { items, count, hasMore, loading, loadingMore, loadMore, error } = usePaginated<Favorite>('/api/restaurants/favorites/')

  if (error) return <EmptyState title="Não foi possível carregar seus salvos" text={error} />
  if (loading) return <PageLoader />

  // some da lista na hora ao desfavoritar (estado vem do contexto)
  const visible = items.filter(f => ids.has(f.restaurant.id))
  if (visible.length === 0 && !hasMore) {
    return (
      <EmptyState
        title="Nada salvo por enquanto"
        text="Toque no marcador de um restaurante para guardá-lo aqui."
        action={
          <Link href="/chat" className="btn-primary">
            Descobrir lugares
          </Link>
        }
      />
    )
  }
  return (
    <>
      <CardGrid>
        {visible.map((f, i) => (
          <RestaurantCard key={f.id} restaurant={f.restaurant} index={i} />
        ))}
      </CardGrid>
      <LoadMore shown={items.length} total={count} hasMore={hasMore} loading={loadingMore} onClick={loadMore} noun="salvos" />
    </>
  )
}

export default function SalvosPage() {
  const count = useFavoritesCount()
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-wrap pb-20 pt-9 sm:pt-12">
        <Reveal className="relative mb-10 flex items-end justify-between gap-4 overflow-hidden rounded-[24px] bg-peach/70 px-6 py-8 sm:px-9 sm:py-10">
          <div>
            <p className="eyebrow mb-3">Sua coleção de bons momentos</p>
            <h1 className="mb-4 font-serif text-[clamp(34px,4vw,52px)] tracking-[-0.035em]">Restaurantes salvos</h1>
            <p className="max-w-md text-sm leading-7 text-ink-600">Os lugares que deram vontade de conhecer.<br className="hidden sm:block" /> Guarde para quando o momento chegar.</p>
            <Link href="/explorar" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-rust">Encontrar novos lugares <ArrowUpRight size={15} aria-hidden /></Link>
          </div>
          <div className="hidden flex-col items-center gap-3 sm:flex"><span className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-paper/80 text-rust"><Bookmark size={27} strokeWidth={1.3} aria-hidden /></span>{count > 0 && <span className="text-xs text-rust-deep">{count} {count === 1 ? 'lugar salvo' : 'lugares salvos'}</span>}</div>
        </Reveal>
        <RequireAuth>
          <SavedList />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  )
}
