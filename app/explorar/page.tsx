'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { CardGrid, RestaurantCard } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { EmptyState, LoadMore, Spinner } from '@/components/ui'
import { useTaxonomies } from '@/lib/taxonomies'
import type { Lookup, RestaurantCard as Card, Taxonomies } from '@/lib/types'
import { PAGE_SIZE, usePaginated } from '@/lib/usePaginated'

const FILTERS: { key: 'cuisine' | 'ambient' | 'price_range'; tax: keyof Taxonomies; label: string }[] = [
  { key: 'cuisine', tax: 'cuisines', label: 'Cozinha' },
  { key: 'ambient', tax: 'ambients', label: 'Ambiente' },
  { key: 'price_range', tax: 'price_ranges', label: 'Preço' },
]
const ORDERINGS = [
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'name', label: 'Nome (A–Z)' },
]

function Select({ label, value, options, onChange }: { label: string; value: string; options: Lookup[]; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="input cursor-pointer py-2.5">
        <option value="">Todos</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Busca por nome com estado próprio: digitar não re-renderiza a lista.
 *  Chaveada pelo ?q= da URL — voltar/limpar filtros reinicia o campo. */
function SearchBox({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [q, setQ] = useState(initial)
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSearch(q.trim())
      }}
      className="mb-6 flex gap-2"
    >
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou descrição" aria-label="Buscar por nome" className="input" />
      <button type="submit" className="btn-primary">
        Buscar
      </button>
    </form>
  )
}

function Explorer() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const taxonomies = useTaxonomies()

  const filters = {
    q: params.get('q') ?? '',
    cuisine: params.get('cuisine') ?? '',
    ambient: params.get('ambient') ?? '',
    price_range: params.get('price_range') ?? '',
    delivery: params.get('delivery') ?? '',
    ordering: params.get('ordering') ?? 'rating',
  }
  // paginação padrão: chaveada pelos filtros (resposta antiga nunca entra na lista nova)
  const { items, count, hasMore, loading, loadingMore, loadMore, error } = usePaginated<Card>('/api/restaurants/', filters)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'ordering' && v)

  return (
    <>
      <SearchBox key={filters.q} initial={filters.q} onSearch={v => setParam('q', v)} />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {FILTERS.map(f => (
          <Select key={f.key} label={f.label} value={filters[f.key]} options={taxonomies?.[f.tax] ?? []} onChange={v => setParam(f.key, v)} />
        ))}
        <label className="flex flex-col">
          <span className="label">Ordenar</span>
          <select value={filters.ordering} onChange={e => setParam('ordering', e.target.value)} className="input cursor-pointer py-2.5">
            {ORDERINGS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex items-end gap-2 pb-3 text-[13px] text-ink-600 md:col-span-1">
          <input type="checkbox" checked={filters.delivery === 'true'} onChange={e => setParam('delivery', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-ink" />
          Faz delivery
        </label>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-ink-300">
        <span>{loading ? 'Carregando…' : `${count} restaurante${count === 1 ? '' : 's'}`}</span>
        {hasFilters && (
          <button onClick={() => router.replace(pathname, { scroll: false })} className="underline hover:text-ink">
            Limpar filtros
          </button>
        )}
      </div>

      {error && items.length === 0 ? (
        <EmptyState title="Não foi possível carregar" text={error} />
      ) : loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Nenhum restaurante encontrado" text="Tente remover alguns filtros." />
      ) : (
        <>
          <CardGrid>
            {items.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} index={i % PAGE_SIZE} />
            ))}
          </CardGrid>
          <LoadMore shown={items.length} total={count} hasMore={hasMore} loading={loadingMore} onClick={loadMore} noun="restaurantes" />
        </>
      )}
    </>
  )
}

export default function ExplorarPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8">
        <p className="eyebrow mb-3">Explorar</p>
        <h1 className="mb-3 font-serif text-4xl">Todos os restaurantes</h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted">
          Prefere descrever o momento em vez de filtrar? Use a <Link href="/chat" className="text-rust underline">busca inteligente</Link>.
        </p>
        <Suspense>
          <Explorer />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
