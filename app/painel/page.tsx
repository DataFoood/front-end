'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { LayoutGroup, m } from 'motion/react'
import { ArrowUpRight, BarChart3, Camera, Clock, LayoutDashboard, MapPin, Megaphone, Plus, Settings, Utensils } from 'lucide-react'
import { AddressEditor, HoursEditor, MenuEditor, PhotosEditor } from '@/components/painel/Editors'
import { CreateRestaurant, InfoForm } from '@/components/painel/InfoForm'
import { Overview } from '@/components/painel/Overview'
import { InfraCard, PromotionsEditor } from '@/components/painel/Promotions'
import { RequireAuth } from '@/components/RequireAuth'
import { SiteHeader } from '@/components/SiteHeader'
import { PageLoader } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { fetchAll } from '@/lib/usePaginated'
import type { Restaurant, RestaurantCard } from '@/lib/types'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'visao', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'info', label: 'Informações', icon: Settings },
  { id: 'cardapio', label: 'Cardápio', icon: Utensils },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'endereco', label: 'Endereço', icon: MapPin },
  { id: 'fotos', label: 'Fotos', icon: Camera },
  { id: 'promocoes', label: 'Promoções', icon: Megaphone },
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
  const [mineError, setMineError] = useState<string | null>(null)
  // erro chaveado pelo restaurante: trocar de restaurante limpa sozinho
  const [loadError, setLoadError] = useState<{ id: number; message: string } | null>(null)

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
    // paginado no back; a barra lateral mostra todos os do dono
    fetchAll<RestaurantCard>('/api/restaurants/mine/')
      .then(list => {
        setMine(list)
        setMineError(null)
      })
      .catch(err => setMineError(errorMessage(err)))
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
    let cancelled = false
    api<Restaurant>(`/api/restaurants/${selectedId}/`)
      .then(data => !cancelled && setLoaded({ id: selectedId, data }))
      .catch(err => !cancelled && setLoadError({ id: selectedId, message: errorMessage(err) }))
    return () => {
      cancelled = true
    }
  }, [selectedId, restaurantKey])
  const loadRestaurant = useCallback(() => setRestaurantKey(k => k + 1), [])
  const restaurant = loaded && loaded.id === selectedId ? loaded.data : null
  const setRestaurant = (data: Restaurant) => setLoaded({ id: data.id, data })

  const reloadAll = () => {
    loadRestaurant()
    loadMine()
  }

  const error = mineError ?? (loadError && loadError.id === selectedId && !restaurant ? loadError.message : null)
  if (error) return <p className="p-8 text-sm text-danger">{error}</p>
  if (!mine) return <PageLoader />

  return (
    <div className="section-wrap grid grid-cols-1 gap-8 pb-20 pt-8 lg:grid-cols-[220px_1fr]">
      <aside className="flex h-fit flex-col gap-6 rounded-2xl border border-line bg-paper p-4 lg:sticky lg:top-28">
        <div>
          <p className="eyebrow mb-3">Meus restaurantes</p>
          <div className="flex flex-col gap-1">
            {mine.map(m => (
              <button
                key={m.id}
                onClick={() => go({ r: m.id, aba: tab === 'novo' ? 'visao' : tab })}
                className={`truncate rounded-xl px-3 py-3 text-left text-[13px] transition ${m.id === selectedId && tab !== 'novo' ? 'bg-olive text-white' : 'text-ink-700 hover:bg-cream'}`}
              >
                {m.name}
              </button>
            ))}
            <button onClick={() => go({ r: null, aba: 'novo' })} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-[13px] transition ${tab === 'novo' ? 'bg-rust text-white' : 'text-rust hover:bg-peach/50'}`}>
              <Plus size={14} aria-hidden /> Novo restaurante
            </button>
          </div>
        </div>
        {restaurant && tab !== 'novo' && (
          <LayoutGroup id="dashboard-tabs"><nav className="flex gap-1 overflow-x-auto border-t border-line pt-4 lg:flex-col" aria-label="Seções do painel">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => go({ aba: t.id })}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-3 text-left text-[13px] transition-colors ${tab === t.id ? 'font-medium text-rust-deep' : 'text-muted hover:text-ink'}`}
              >
                {tab === t.id && <m.span layoutId="dashboard-active-tab" className="absolute inset-0 rounded-xl bg-peach/60" transition={{ type: 'spring', stiffness: 350, damping: 32 }} />}
                <t.icon size={16} className="relative shrink-0" aria-hidden /><span className="relative">{t.label}</span>
              </button>
            ))}
          </nav></LayoutGroup>
        )}
      </aside>

      <section className="min-w-0">
        {/* operação da plataforma (números agregados de todos): só admin */}
        {user?.role === 'admin' && (
          <div className="mb-6">
            <InfraCard />
          </div>
        )}
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
          <div key={restaurant.id}>
            <div className="relative mb-7 overflow-hidden rounded-2xl bg-sage px-6 py-7 sm:px-7">
              <BarChart3 size={120} strokeWidth={0.8} className="absolute -right-4 -top-5 -rotate-12 text-olive/10" aria-hidden />
              <p className="eyebrow relative mb-3 text-olive">Seu espaço para crescer</p>
              <h1 className="relative mb-4 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">{restaurant.name}</h1>
              <Link href={`/restaurante/${restaurant.slug}`} className="relative inline-flex items-center gap-1.5 text-xs font-medium text-olive">
                Ver página pública <ArrowUpRight size={14} aria-hidden />
              </Link>
            </div>
            <m.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
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
            {tab === 'promocoes' && <PromotionsEditor restaurant={restaurant} />}
            </m.div>
          </div>
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
