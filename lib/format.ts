import type { BusinessHour, Lookup, RestaurantAddress, RestaurantCard } from './types'

export const DAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

/** "Moderado (R$ 30–80/pessoa)" -> "$$" (ordem das faixas no seed) */
const PRICE_SYMBOLS: Record<string, string> = {
  'Econômico': '$',
  'Moderado': '$$',
  'Intermediário': '$$$',
  'Premium': '$$$$',
  'Luxo': '$$$$$',
}

export function priceSymbol(ranges: Lookup[]): string | null {
  const first = ranges[0]?.name
  if (!first) return null
  const key = Object.keys(PRICE_SYMBOLS).find(k => first.startsWith(k))
  return key ? PRICE_SYMBOLS[key] : null
}

/** "Moderado (R$ 30–80/pessoa)" -> "R$ 30–80/pessoa" */
export function priceDetail(ranges: Lookup[]): string | null {
  const match = ranges[0]?.name.match(/\((.+)\)/)
  return match ? match[1] : ranges[0]?.name ?? null
}

export function lowerNames(items: Lookup[], max = 2): string {
  return items.slice(0, max).map(i => i.name.toLowerCase()).join(', ')
}

export function cardSubtitle(r: RestaurantCard): string {
  return [r.address?.neighborhood?.toLowerCase(), lowerNames(r.cuisines, 1), priceSymbol(r.price_ranges)]
    .filter(Boolean)
    .join(' · ')
}

export function formatAddress(a: RestaurantAddress | null): string | null {
  if (!a) return null
  const line1 = [a.street, a.number].filter(Boolean).join(', ')
  const line2 = [a.neighborhood, a.city && `${a.city}${a.state ? ` · ${a.state}` : ''}`].filter(Boolean).join(' · ')
  return [line1, line2].filter(Boolean).join('\n')
}

export function formatPrice(value: string | null): string | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n)) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatRating(value: string | number): string {
  const n = Number(value)
  return n ? n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'
}

const hhmm = (t: string) => t.slice(0, 5)

export function formatIntervals(hour: BusinessHour | undefined): string {
  if (!hour || hour.is_closed) return 'fechado'
  const parts = Object.values(hour.meta_interval || {}).map(([s, e]) => `${hhmm(s)} – ${hhmm(e) === '23:59' ? '00:00' : hhmm(e)}`)
  return parts.length ? parts.join(' · ') : 'fechado'
}

export function todayIndex(): number {
  // JS: domingo=0; backend: segunda=0
  return (new Date().getDay() + 6) % 7
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return raw
}

export function whatsappLink(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (d.length < 10) return null
  return `https://wa.me/55${d}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function firstName(name: string): string {
  return (name || '').trim().split(' ')[0] || ''
}

export function initials(name: string): string {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function onlyDigits(v: string): string {
  return v.replace(/\D/g, '')
}

export function maskCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

/** Validação de CPF (dígitos verificadores). */
export function isValidCpf(v: string): boolean {
  const d = onlyDigits(v)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}
