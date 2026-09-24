// Tipos espelhando o contrato da API Django (ver API_MAP.md / Swagger no back).

export type Role = 'customer' | 'owner' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  cpf: string | null
  phone: string
  birthday: string | null
  gender: '' | 'M' | 'F' | 'O' | 'N'
  avatar_url: string
  banner_url: string
  role: Role
  level: number
  allow_info: boolean
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface Lookup {
  id: number
  name: string
}

export interface Taxonomies {
  cuisines: Lookup[]
  ambients: Lookup[]
  service_models: Lookup[]
  target_audiences: Lookup[]
  price_ranges: Lookup[]
  business_models: Lookup[]
  physical_formats: Lookup[]
}

export type TaxonomyKey = keyof Taxonomies

export interface RestaurantAddress {
  id: number
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
  latitude: string | null
  longitude: string | null
}

export interface RestaurantCard {
  id: number
  name: string
  slug: string
  description: string
  cover_image: string
  average_rating: string
  total_reviews: number
  cuisines: Lookup[]
  ambients: Lookup[]
  price_ranges: Lookup[]
  address: RestaurantAddress | null
  is_open_now: boolean | null
  is_favorited: boolean
  has_delivery: boolean
  has_reservation: boolean
}

export interface MenuItem {
  id: number
  restaurant: number
  name: string
  description: string
  price: string | null
  position: number
  created_at: string
}

export interface Review {
  id: number
  restaurant: number
  author: number | null
  author_name: string
  title: string
  description: string
  rating: number
  created_at: string
}

export interface RestaurantImage {
  id: number
  url: string
  created_at: string
}

/** {"almoco": ["11:00:00", "15:00:00"], ...} */
export type MetaInterval = Record<string, [string, string]>

export interface BusinessHour {
  id: number
  restaurant: number
  day_week: number
  meta_interval: MetaInterval
  is_closed: boolean
  created_at: string
}

export const SALES_CHANNELS = [
  'has_dine_in',
  'has_delivery',
  'has_take_out',
  'has_drive_thru',
  'has_reservation',
  'accepts_vale_refeicao',
  'accepts_online_order',
] as const

export type SalesChannel = (typeof SALES_CHANNELS)[number]

export interface Restaurant extends Omit<RestaurantCard, 'has_delivery' | 'has_reservation'>, Record<SalesChannel, boolean> {
  owner: number | null
  cnpj: string | null
  phone: string
  email: string
  website: string
  menu_url: string
  created_at: string
  updated_at: string
  images: RestaurantImage[]
  reviews: Review[]
  business_hours: BusinessHour[]
  items: MenuItem[]
  service_models: Lookup[]
  target_audiences: Lookup[]
  business_models: Lookup[]
  physical_formats: Lookup[]
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface SearchResult {
  restaurant: RestaurantCard
  score: number
  match: number | null
}

export interface Favorite {
  id: number
  restaurant: RestaurantCard
  created_at: string
}

export interface Affinity {
  id: number
  name: string
  score: number
  is_manual: boolean
}

export interface Preferences {
  cuisines: Affinity[]
  ambients: Affinity[]
  price_ranges: Affinity[]
}

export interface SearchHistoryEntry {
  id: number
  query: string
  created_at: string
}

export interface RestaurantStats {
  view_count: number
  favorites_total: number
  favorites_window: number
  reviews_total: number
  reviews_window: number
  average_rating: number
  rating_distribution: Record<'1' | '2' | '3' | '4' | '5', number>
  window_days: number
  series: { date: string; favorites: number; reviews: number }[]
  recent_reviews: Review[]
}

export interface Address {
  id: number
  entity_type: 'user' | 'restaurant'
  object_id: number
  label: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  country: string
  zipcode: string
  latitude: string | null
  longitude: string | null
  is_default: boolean
}
