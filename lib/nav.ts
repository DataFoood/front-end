import type { User } from './types'

const BASE = 'http://datafood.local'

/** Só caminhos internos (evita open redirect via ?next=https://...).
 * Resolve como o navegador resolveria: `/\evil.com` e `/<tab>/evil.com` viram
 * `//evil.com` (outro host) — checar só o prefixo deixava esses passarem. */
export function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/')) return null
  try {
    const url = new URL(next, BASE)
    if (url.origin !== BASE) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

/** Página inicial de cada tipo de conta após login/cadastro. */
export function homeFor(user: User): string {
  return user.role === 'owner' ? '/painel' : '/chat'
}
