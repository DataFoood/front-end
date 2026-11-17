import { NextResponse, type NextRequest } from 'next/server'

// Proxy da API: o navegador só fala com o domínio do front e o Next repassa
// /api/* para o Django. Assim os cookies de sessão (HttpOnly, SameSite=Lax) são
// first-party mesmo com front em *.vercel.app e API em outro domínio — chamada
// direta entre sites tem os cookies bloqueados e a sessão cai no primeiro 401.

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// Cabeçalhos que só o proxy pode mandar (o back confia neles com o segredo
// certo, ver back/dtfd/utils/frontend_proxy.py)
const SECRET_HEADER = 'x-datafood-proxy-secret'
const CLIENT_IP_HEADER = 'x-datafood-client-ip'

/** IP do usuário. A Vercel (e o Caddy no Docker) sobrescrevem o
 * X-Forwarded-For com o IP de quem conectou, então o último item é confiável. */
function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const last = forwarded?.split(',').pop()?.trim()
  return last || null
}

export function proxy(request: NextRequest) {
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, API_ORIGIN)

  const headers = new Headers(request.headers)
  // nunca repassa o que veio do navegador nesses cabeçalhos
  headers.delete(SECRET_HEADER)
  headers.delete(CLIENT_IP_HEADER)
  // o Host certo é o da API (Caddy e ALLOWED_HOSTS roteiam por ele)
  headers.delete('host')

  const secret = process.env.API_PROXY_SECRET
  const ip = clientIp(request)
  if (secret && ip) {
    headers.set(SECRET_HEADER, secret)
    headers.set(CLIENT_IP_HEADER, ip)
  }

  return NextResponse.rewrite(target, { request: { headers } })
}

export const config = {
  matcher: '/api/:path*',
}
