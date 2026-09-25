import type { User } from './types'

/** Só caminhos internos (evita open redirect via ?next=https://...). */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

/** Página inicial de cada tipo de conta após login/cadastro. */
export function homeFor(user: User): string {
  return user.role === 'owner' ? '/painel' : '/chat'
}
