'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useFavorites } from '@/app/context/FavoritesContext'
import { firstName } from '@/lib/format'
import { Avatar, Logo } from './ui'

export function SiteHeader() {
  const { user, logout } = useAuth()
  const { count } = useFavorites()
  const pathname = usePathname()
  const router = useRouter()
  // o menu mobile fica aberto só na rota em que foi aberto (fecha ao navegar)
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname

  const links = [
    { href: '/chat', label: 'Descobrir' },
    { href: '/explorar', label: 'Explorar' },
    ...(user ? [{ href: '/salvos', label: 'Salvos', badge: count }] : []),
    ...(user && user.role !== 'customer' ? [{ href: '/painel', label: 'Meu restaurante' }] : []),
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const linkClass = (href: string) =>
    `inline-flex items-center gap-1.5 text-[13px] transition-colors ${
      pathname.startsWith(href) ? 'font-medium text-ink' : 'text-[#777] hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex" aria-label="principal">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
              {!!l.badge && <span className="rounded-full bg-rust px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{l.badge}</span>}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/perfil" className="flex items-center gap-2 text-[13px] text-[#555] hover:text-ink" title="meu perfil">
                <Avatar name={user.name} url={user.avatar_url} size={30} />
                <span className="hidden lg:inline">{firstName(user.name).toLowerCase()}</span>
              </Link>
              <button onClick={handleLogout} className="text-xs text-[#aaa] hover:text-[#e53e3e]">
                sair
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[13px] text-[#555] hover:text-ink">
                Entrar
              </Link>
              <Link href="/cadastro" className="rounded-full bg-rust px-5 py-2 text-[13px] text-white hover:bg-rust-dark">
                Criar conta
              </Link>
            </div>
          )}
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-sm md:hidden"
          aria-label={open ? 'fechar menu' : 'abrir menu'}
          aria-expanded={open}
          onClick={() => setOpenAt(open ? null : pathname)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-cream px-4 pb-5 pt-2 md:hidden" aria-label="principal (mobile)">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="flex items-center justify-between border-b border-line py-3.5 text-sm">
              {l.label}
              {!!l.badge && <span className="rounded-full bg-rust px-2 py-0.5 text-[10px] font-bold text-white">{l.badge}</span>}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/perfil" className="flex items-center gap-3 border-b border-line py-3.5 text-sm">
                <Avatar name={user.name} url={user.avatar_url} size={26} /> Meu perfil
              </Link>
              <button onClick={handleLogout} className="py-3.5 text-sm text-[#c53030]">
                Sair da conta
              </button>
            </>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/login" className="btn-ghost">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-accent">
                Criar conta
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#ddd] px-4 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-[#999] sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-rust" />
          <span className="text-[13px] text-[#666]">DataFood © {new Date().getFullYear()}</span>
        </div>
        <div className="flex gap-6">
          <Link href="/privacidade" className="hover:text-ink">
            Privacidade · LGPD
          </Link>
          <Link href="/termos" className="hover:text-ink">
            Termos
          </Link>
        </div>
      </div>
    </footer>
  )
}
