'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { RequireAuth } from '@/components/RequireAuth'
import { CardGrid, RestaurantCard } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { EmptyState, PageLoader } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import type { Favorite } from '@/lib/types'
import { useFavorites } from '../context/FavoritesContext'

function SavedList() {
  const { ids } = useFavorites()
  const [favorites, setFavorites] = useState<Favorite[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Favorite[]>('/api/restaurants/favorites/')
      .then(setFavorites)
      .catch(err => setError(errorMessage(err)))
  }, [])

  if (error) return <EmptyState title="não foi possível carregar seus salvos" text={error} />
  if (!favorites) return <PageLoader />

  // some da lista na hora ao desfavoritar (estado vem do contexto)
  const visible = favorites.filter(f => ids.has(f.restaurant.id))
  if (visible.length === 0) {
    return (
      <EmptyState
        title="nada salvo por enquanto"
        text="toque no marcador de um restaurante para guardá-lo aqui."
        action={
          <Link href="/chat" className="btn-primary">
            descobrir lugares
          </Link>
        }
      />
    )
  }
  return (
    <CardGrid>
      {visible.map((f, i) => (
        <RestaurantCard key={f.id} restaurant={f.restaurant} index={i} />
      ))}
    </CardGrid>
  )
}

export default function SalvosPage() {
  const { count } = useFavorites()
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">sua lista</p>
            <h1 className="font-serif text-4xl">restaurantes salvos</h1>
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
