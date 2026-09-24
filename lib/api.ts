// Cliente HTTP da API Django: JWT Bearer, refresh automático e erros tipados.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const TOKENS_KEY = 'datafood.tokens'
/** disparado quando a sessão morre (refresh inválido) — o AuthContext escuta */
export const SESSION_EXPIRED_EVENT = 'datafood:session-expired'

export interface Tokens {
  access: string
  refresh: string
}

export const tokenStore = {
  get(): Tokens | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(TOKENS_KEY)
      return raw ? (JSON.parse(raw) as Tokens) : null
    } catch {
      return null
    }
  },
  set(tokens: Tokens) {
    try {
      window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
    } catch {
      /* storage indisponível: sessão vive só em memória nesta aba */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKENS_KEY)
    } catch {
      /* noop */
    }
  },
}

export class ApiError extends Error {
  status: number
  data: unknown
  /** erros por campo no formato DRF {campo: [msg]} */
  fields: Record<string, string>

  constructor(status: number, data: unknown, message: string) {
    super(message)
    this.status = status
    this.data = data
    this.fields = extractFieldErrors(data)
  }
}

function extractFieldErrors(data: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!data || typeof data !== 'object' || Array.isArray(data)) return out
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (key === 'detail') continue
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first === 'string') out[key] = first
  }
  return out
}

function messageFor(status: number, data: unknown, retryAfter: string | null): string {
  if (status === 429) {
    return retryAfter
      ? `Muitas tentativas. Tente novamente em ${retryAfter}s.`
      : 'Muitas tentativas. Aguarde um instante e tente de novo.'
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.detail === 'string') return d.detail
    if (Array.isArray(data) && typeof data[0] === 'string') return data[0]
    const fields = extractFieldErrors(data)
    const first = fields.non_field_errors ?? Object.values(fields)[0]
    if (first) return first
  }
  if (status >= 500) return 'O servidor teve um problema. Tente novamente em instantes.'
  if (status === 404) return 'Não encontrado.'
  if (status === 403) return 'Você não tem permissão para isso.'
  if (status === 401) return 'Sua sessão expirou. Entre novamente.'
  return 'Não foi possível concluir a operação.'
}

// refresh "single-flight": várias requisições com 401 simultâneo esperam o mesmo refresh
let refreshing: Promise<string | null> | null = null

async function refreshAccess(): Promise<string | null> {
  const tokens = tokenStore.get()
  if (!tokens?.refresh) return null
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/login/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: tokens.refresh }),
        })
        if (!res.ok) return null
        const data = (await res.json()) as Partial<Tokens>
        if (!data.access) return null
        // ROTATE_REFRESH_TOKENS: o back devolve um refresh novo
        tokenStore.set({ access: data.access, refresh: data.refresh ?? tokens.refresh })
        return data.access
      } catch {
        return null
      } finally {
        setTimeout(() => (refreshing = null), 0)
      }
    })()
  }
  return refreshing
}

type Query = Record<string, string | number | boolean | undefined | null>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Query
  /** false = não manda o Bearer (rotas públicas de auth) */
  auth?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(path.startsWith('http') ? path : `${API_URL}${path}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal } = opts

  const doFetch = (access?: string) => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (access) headers.Authorization = `Bearer ${access}`
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  }

  let res: Response
  try {
    const access = auth ? tokenStore.get()?.access : undefined
    res = await doFetch(access)
    if (res.status === 401 && auth && tokenStore.get()) {
      const fresh = await refreshAccess()
      if (fresh) {
        res = await doFetch(fresh)
      } else {
        tokenStore.clear()
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new ApiError(0, null, 'Não foi possível conectar ao servidor. Verifique sua conexão.')
  }

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, data, messageFor(res.status, data, res.headers.get('Retry-After')))
  }
  return data as T
}

export function errorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (err instanceof ApiError) return err.message
  return fallback
}
