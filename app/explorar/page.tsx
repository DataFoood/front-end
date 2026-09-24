'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { CardGrid, RestaurantCard } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { EmptyState, Spinner } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import type { Lookup, Paginated, RestaurantCard as Card, Taxonomies } from '@/lib/types'

const PAGE_SIZE = 12
const FILTERS: { key: 'cuisine' | 'ambient' | 'price_range'; tax: keyof Taxonomies; label: string }[] = [
  { key: 'cuisine', tax: 'cuisines', label: 'cozinha' },
  { key: 'ambient', tax: 'ambients', label: 'ambiente' },
  { key: 'price_range', tax: 'price_ranges', label: 'preço' },
]
const ORDERINGS = [
  { value: 'rating', label: 'melhor avaliados' },
  { value: 'recent', label: 'mais recentes' },
  { value: 'name', label: 'nome (a–z)' },
]

function Select({ label, value, options, onChange }: { label: string; value: string; options: Lookup[]; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="input cursor-pointer py-2.5">
        <option value="">todos</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function Explorer() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [taxonomies, setTaxonomies] = useState<Taxonomies | null>(null)
  // página 1 chaveada pelos filtros: mudou filtro -> "carregando" é derivado, sem reset em effect
  const [result, setResult] = useState<{ key: string; items: Card[]; count: number; page: number; error?: string } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [q, setQ] = useState(params.get('q') ?? '')

  const filters = {
    q: params.get('q') ?? '',
    cuisine: params.get('cuisine') ?? '',
    ambient: params.get('ambient') ?? '',
    price_range: params.get('price_range') ?? '',
    delivery: params.get('delivery') ?? '',
    ordering: params.get('ordering') ?? 'rating',
  }
  const filterKey = JSON.stringify(filters)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  useEffect(() => {
    api<Taxonomies>('/api/restaurants/taxonomies/', { auth: false }).then(setTaxonomies).catch(() => undefined)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const query = JSON.parse(filterKey) as typeof filters
    api<Paginated<Card>>('/api/restaurants/', { query: { ...query, page: 1, page_size: PAGE_SIZE }, signal: controller.signal })
      .then(data => setResult({ key: filterKey, items: data.results, count: data.count, page: 1 }))
      .catch(err => {
        if (err?.name !== 'AbortError') setResult({ key: filterKey, items: [], count: 0, page: 1, error: errorMessage(err) })
      })
    return () => controller.abort()
  }, [filterKey])

  const current = result?.key === filterKey ? result : null
  const items = current?.items ?? []
  const count = current?.count ?? 0
  const error = current?.error ?? null
  const loading = !current || loadingMore

  const loadMore = async () => {
    if (!current) return
    setLoadingMore(true)
    try {
      const data = await api<Paginated<Card>>('/api/restaurants/', { query: { ...filters, page: current.page + 1, page_size: PAGE_SIZE } })
      setResult({ ...current, items: [...current.items, ...data.results], page: current.page + 1 })
    } catch (err) {
      setResult({ ...current, error: errorMessage(err) })
    } finally {
      setLoadingMore(false)
    }
  }

  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'ordering' && v)

  return (
    <>
      <form
        onSubmit={e => {
          e.preventDefault()
          setParam('q', q.trim())
        }}
        className="mb-6 flex gap-2"
      >
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="buscar por nome ou descrição" aria-label="buscar por nome" className="input" />
        <button type="submit" className="btn-primary">
          buscar
        </button>
      </form>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {FILTERS.map(f => (
          <Select key={f.key} label={f.label} value={filters[f.key]} options={taxonomies?.[f.tax] ?? []} onChange={v => setParam(f.key, v)} />
        ))}
        <label className="flex flex-col">
          <span className="label">ordenar</span>
          <select value={filters.ordering} onChange={e => setParam('ordering', e.target.value)} className="input cursor-pointer py-2.5">
            {ORDERINGS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex items-end gap-2 pb-3 text-[13px] text-[#555] md:col-span-1">
          <input type="checkbox" checked={filters.delivery === 'true'} onChange={e => setParam('delivery', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-ink" />
          faz delivery
        </label>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-[#999]">
        <span>{loading && items.length === 0 ? 'carregando…' : `${count} restaurante${count === 1 ? '' : 's'}`}</span>
        {hasFilters && (
          <button
            onClick={() => {
              setQ('')
              router.replace(pathname, { scroll: false })
            }}
            className="underline hover:text-ink"
          >
            limpar filtros
          </button>
        )}
      </div>

      {error ? (
        <EmptyState title="não foi possível carregar" text={error} />
      ) : !loading && items.length === 0 ? (
        <EmptyState title="nenhum restaurante encontrado" text="tente remover alguns filtros." />
      ) : (
        <CardGrid>
          {items.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} index={i % PAGE_SIZE} />
          ))}
        </CardGrid>
      )}

      <div className="mt-10 flex justify-center">
        {loading ? <Spinner /> : items.length < count && <button onClick={loadMore} className="btn-ghost">carregar mais</button>}
      </div>
    </>
  )
}

export default function ExplorarPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
        <p className="eyebrow mb-3">explorar</p>
        <h1 className="mb-3 font-serif text-4xl">todos os restaurantes</h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted">
          prefere descrever o momento em vez de filtrar? use a <Link href="/chat" className="text-rust underline">busca inteligente</Link>.
        </p>
        <Suspense>
          <Explorer />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
