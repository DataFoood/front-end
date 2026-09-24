'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { AddressEditor, HoursEditor, MenuEditor, PhotosEditor } from '@/components/painel/Editors'
import { CreateRestaurant, InfoForm } from '@/components/painel/InfoForm'
import { Overview } from '@/components/painel/Overview'
import { RequireAuth } from '@/components/RequireAuth'
import { SiteHeader } from '@/components/SiteHeader'
import { PageLoader } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import type { Restaurant, RestaurantCard } from '@/lib/types'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'visao', label: 'visão geral' },
  { id: 'info', label: 'informações' },
  { id: 'cardapio', label: 'cardápio' },
  { id: 'horarios', label: 'horários' },
  { id: 'endereco', label: 'endereço' },
  { id: 'fotos', label: 'fotos' },
] as const
type TabId = (typeof TABS)[number]['id'] | 'novo'

function Panel() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { user, refreshUser } = useAuth()

  const [mine, setMine] = useState<RestaurantCard[] | null>(null)
  const [mineKey, setMineKey] = useState(0)
  // restaurante chaveado pelo id selecionado + contador de recarga
  const [loaded, setLoaded] = useState<{ id: number; data: Restaurant } | null>(null)
  const [restaurantKey, setRestaurantKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const selectedId = Number(params.get('r')) || null
  const tab = (params.get('aba') as TabId) || 'visao'

  const go = useCallback(
    (next: { r?: number | null; aba?: TabId }) => {
      const q = new URLSearchParams(params.toString())
      if (next.r) q.set('r', String(next.r))
      else if (next.r === null) q.delete('r')
      if (next.aba) q.set('aba', next.aba)
      router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    },
    [params, pathname, router],
  )

  useEffect(() => {
    api<RestaurantCard[]>('/api/restaurants/mine/')
      .then(setMine)
      .catch(err => setError(errorMessage(err)))
  }, [mineKey])
  const loadMine = useCallback(() => setMineKey(k => k + 1), [])

  // sem seleção: abre o primeiro (ou o cadastro, se não houver nenhum)
  useEffect(() => {
    if (!mine) return
    if (mine.length === 0 && tab !== 'novo') go({ r: null, aba: 'novo' })
    else if (mine.length && tab !== 'novo' && (!selectedId || !mine.some(m => m.id === selectedId)) && user?.role !== 'admin') go({ r: mine[0].id })
  }, [mine, selectedId, tab, go, user?.role])

  useEffect(() => {
    if (!selectedId) return
    api<Restaurant>(`/api/restaurants/${selectedId}/`)
      .then(data => setLoaded({ id: selectedId, data }))
      .catch(err => setError(errorMessage(err)))
  }, [selectedId, restaurantKey])
  const loadRestaurant = useCallback(() => setRestaurantKey(k => k + 1), [])
  const restaurant = loaded && loaded.id === selectedId ? loaded.data : null
  const setRestaurant = (data: Restaurant) => setLoaded({ id: data.id, data })

  const reloadAll = () => {
    loadRestaurant()
    loadMine()
  }

  if (error) return <p className="p-8 text-sm text-[#c53030]">{error}</p>
  if (!mine) return <PageLoader />

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-20 pt-8 sm:px-8 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-6">
        <div>
          <p className="eyebrow mb-3">meus restaurantes</p>
          <div className="flex flex-col gap-1">
            {mine.map(m => (
              <button
                key={m.id}
                onClick={() => go({ r: m.id, aba: tab === 'novo' ? 'visao' : tab })}
                className={`truncate rounded-md px-3 py-2 text-left text-[13px] ${m.id === selectedId && tab !== 'novo' ? 'bg-ink text-white' : 'text-[#444] hover:bg-white'}`}
              >
                {m.name}
              </button>
            ))}
            <button onClick={() => go({ r: null, aba: 'novo' })} className={`rounded-md px-3 py-2 text-left text-[13px] ${tab === 'novo' ? 'bg-ink text-white' : 'text-rust hover:bg-white'}`}>
              + novo restaurante
            </button>
          </div>
        </div>
        {restaurant && tab !== 'novo' && (
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="seções do painel">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => go({ aba: t.id })}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-left text-[13px] lg:border-b-0 lg:border-l-2 ${tab === t.id ? 'border-rust text-ink' : 'border-transparent text-[#888] hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}
      </aside>

      <section className="min-w-0">
        {tab === 'novo' ? (
          <CreateRestaurant
            onCreated={async id => {
              loadMine()
              await refreshUser() // role vira "owner" no back
              go({ r: id, aba: 'info' })
            }}
          />
        ) : !restaurant ? (
          <PageLoader />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="font-serif text-3xl lowercase sm:text-4xl">{restaurant.name}</h1>
              <Link href={`/restaurante/${restaurant.slug}`} className="text-xs text-rust underline">
                ver página pública →
              </Link>
            </div>
            {tab === 'visao' && <Overview restaurant={restaurant} />}
            {tab === 'info' && (
              <InfoForm
                restaurant={restaurant}
                onSaved={saved => {
                  setRestaurant(saved)
                  loadMine()
                }}
                onDeleted={() => {
                  setMine(null)
                  loadMine()
                  go({ r: null, aba: 'visao' })
                }}
              />
            )}
            {tab === 'cardapio' && <MenuEditor restaurant={restaurant} onChange={loadRestaurant} />}
            {tab === 'horarios' && <HoursEditor restaurant={restaurant} onChange={loadRestaurant} />}
            {tab === 'endereco' && <AddressEditor restaurant={restaurant} onChange={reloadAll} />}
            {tab === 'fotos' && <PhotosEditor restaurant={restaurant} onChange={loadRestaurant} />}
          </>
        )}
      </section>
    </div>
  )
}

export default function PainelPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <RequireAuth>
        <Suspense fallback={<PageLoader />}>
          <Panel />
        </Suspense>
      </RequireAuth>
    </div>
  )
}
