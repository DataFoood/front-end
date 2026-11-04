import { formatDate } from '@/lib/format'
import type { RestaurantCard } from '@/lib/types'

export function CatalogProvenance({ restaurant, links = false }: { restaurant: RestaurantCard; links?: boolean }) {
  if (restaurant.is_demo) return <p className="text-xs text-rust">Dados de demonstração · informações não verificadas</p>
  const sources = restaurant.sources ?? []
  if (!sources.length) return null
  return (
    <div className="space-y-1 text-xs leading-relaxed text-muted">
      {sources.map(source => (
        <p key={`${source.provider}:${source.url}`}>
          {links ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.attribution}</a> : source.attribution}
          {links && <> · {source.license} · consultado em {formatDate(source.fetched_at)}</>}
        </p>
      ))}
      {links && <p>Cadastro de fonte externa. Confirme horários, cardápio e preços com o restaurante.</p>}
    </div>
  )
}
