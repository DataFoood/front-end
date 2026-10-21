// Cliente HTTP da API Django. A sessão vive em cookies HttpOnly gravados pelo
// back (o JS nunca vê os tokens); aqui só mandamos os cookies e rodamos o
// refresh quando o access vence.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

/** disparado quando a sessão morre (refresh recusado) — o AuthContext escuta */
export const SESSION_EXPIRED_EVENT = 'datafood:session-expired'

/** Cabeçalho anti-CSRF: o back só aceita escrita via cookie com ele (um site
 * de terceiro não consegue mandá-lo sem passar pelo CORS). Também liga o
 * "modo navegador" nas rotas de sessão (tokens em cookie, fora do corpo). */
const BROWSER_HEADERS = { 'X-Requested-With': 'datafood' }

/** Marcador de "tem sessão" no localStorage — nenhum token, só um sinal para
 * não chamar /me à toa em visitantes e para avisar as outras abas. */
export const SESSION_KEY = 'datafood.session'
const REFRESHED_AT_KEY = 'datafood.session.refreshedAt'

export const sessionMarker = {
  has(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  },
  set() {
    try {
      window.localStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* storage indisponível: a sessão funciona, só não sincroniza abas */
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(SESSION_KEY)
      window.localStorage.removeItem(REFRESHED_AT_KEY)
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

// Refresh "single-flight" nesta aba + trava entre abas (Web Locks). As abas
// dividem os cookies: se duas renovassem juntas, a segunda mandaria o refresh
// que a primeira acabou de rotacionar (blacklist) e derrubaria a sessão.
let refreshing: Promise<boolean> | null = null
const RECENT_MS = 10_000

async function doRefresh(): Promise<boolean> {
  try {
    // outra aba acabou de renovar: os cookies já são os novos
    const last = Number(window.localStorage.getItem(REFRESHED_AT_KEY) || 0)
    if (Date.now() - last < RECENT_MS) return true
  } catch {
    /* sem storage: renova mesmo */
  }
  try {
    const res = await fetch(`${API_URL}/api/users/login/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...BROWSER_HEADERS, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!res.ok) return false
    try {
      window.localStorage.setItem(REFRESHED_AT_KEY, String(Date.now()))
    } catch {
      /* noop */
    }
    return true
  } catch {
    return false
  }
}

/** Renova a sessão (cookies). true = renovou ou outra aba renovou. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
    refreshing = (locks ? locks.request('datafood-refresh', doRefresh) : doRefresh()).finally(() => {
      setTimeout(() => (refreshing = null), 0)
    })
  }
  return refreshing
}

export type Query = Record<string, string | number | boolean | undefined | null>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Query
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

// rotas de sessão respondem 401 por credencial errada, não por access vencido
const SESSION_ROUTES = ['/api/users/login/', '/api/users/register/', '/api/users/logout/']

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = opts

  const doFetch = () => {
    const headers: Record<string, string> = { Accept: 'application/json', ...BROWSER_HEADERS }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    return fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  }

  let res: Response
  try {
    res = await doFetch()
    if (res.status === 401 && sessionMarker.has() && !SESSION_ROUTES.some(r => path.startsWith(r))) {
      // access vencido: um refresh e repete. Sem refresh válido (expirou ou
      // foi revogado, ex.: senha trocada em outro dispositivo) a sessão acaba
      if (await refreshSession()) {
        res = await doFetch()
      } else {
        sessionMarker.clear()
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
