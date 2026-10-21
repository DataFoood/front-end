'use client'

import Link from 'next/link'
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
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Sua lista</p>
            <h1 className="font-serif text-4xl">Restaurantes salvos</h1>
          </div>
          {count > 0 && <span className="rounded-full bg-rust px-3 py-1.5 text-[13px] text-white">{count} salvos</span>}
        </div>
        <RequireAuth>
          <SavedList />
        </RequireAuth>
      </main>
      <SiteFooter />
    </div>
  )
}
