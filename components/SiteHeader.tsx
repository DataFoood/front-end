'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { ArrowUpRight, Menu, X, Utensils } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { useFavoritesCount } from '@/app/context/FavoritesContext'
import { firstName } from '@/lib/format'
import { Avatar, Logo } from './ui'

export function SiteHeader() {
  const { user, logout } = useAuth()
  const count = useFavoritesCount()
  const pathname = usePathname()
  const router = useRouter()
  // o menu mobile fica aberto só na rota em que foi aberto (fecha ao navegar)
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const menuButton = useRef<HTMLButtonElement>(null)
  const mobileMenu = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpenAt(null); menuButton.current?.focus() }
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !mobileMenu.current?.contains(event.target) && !menuButton.current?.contains(event.target)) setOpenAt(null)
    }
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside) }
  }, [open])

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
    `nav-link ${
      pathname.startsWith(href) ? 'font-medium text-ink' : 'text-muted hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-cream/90 backdrop-blur-xl">
      <div className="section-wrap flex h-20 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          <LayoutGroup id="site-navigation">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)} aria-current={pathname.startsWith(l.href) ? 'page' : undefined}>
              {pathname.startsWith(l.href) && <m.span layoutId="active-navigation" className="absolute inset-0 rounded-full bg-peach/75" transition={{ type: 'spring', stiffness: 350, damping: 32 }} />}
              <span className="relative">{l.label}</span>
              {!!l.badge && <m.span key={l.badge} initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="relative rounded-full bg-rust px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{l.badge}</m.span>}
            </Link>
          ))}
          </LayoutGroup>
          {user ? (
            <div className="ml-3 flex items-center gap-3 border-l border-line-warm pl-4">
              <Link href="/perfil" className="flex items-center gap-2 text-[13px] text-ink-600 hover:text-ink" title="Meu perfil">
                <Avatar name={user.name} url={user.avatar_url} size={30} />
                <span className="hidden lg:inline">{firstName(user.name)}</span>
              </Link>
              <button onClick={handleLogout} className="text-xs text-ink-250 hover:text-error">
                Sair
              </button>
            </div>
          ) : (
            <div className="ml-4 flex items-center gap-5 border-l border-line-warm pl-5">
              <Link href="/login" className="text-[13px] text-ink-600 hover:text-ink">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-accent min-h-10 px-5 py-2.5 text-[13px]">
                Criar conta <ArrowUpRight size={15} aria-hidden />
              </Link>
            </div>
          )}
        </nav>

        <button
          ref={menuButton}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line-warm bg-paper md:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpenAt(open ? null : pathname)}
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </div>

      <AnimatePresence initial={false}>
      {open && (
        <m.nav ref={mobileMenu} id="mobile-navigation" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
          className="absolute inset-x-0 top-full overflow-hidden border-b border-line bg-cream px-5 shadow-xl shadow-ink/5 md:hidden" aria-label="Principal (mobile)">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpenAt(null)} className="flex min-h-12 items-center justify-between border-b border-line py-3.5 text-sm">
              {l.label}
              {!!l.badge && <span className="rounded-full bg-rust px-2 py-0.5 text-[10px] font-bold text-white">{l.badge}</span>}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/perfil" onClick={() => setOpenAt(null)} className="flex items-center gap-3 border-b border-line py-3.5 text-sm">
                <Avatar name={user.name} url={user.avatar_url} size={26} /> Meu perfil
              </Link>
              <button onClick={handleLogout} className="py-3.5 text-sm text-danger">
                Sair da conta
              </button>
            </>
          ) : (
            <div className="my-5 grid grid-cols-2 gap-3">
              <Link href="/login" className="btn-ghost">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-accent">
                Criar conta
              </Link>
            </div>
          )}
        </m.nav>
      )}
      </AnimatePresence>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line-warm bg-cream-dark/40 py-10">
      <div className="section-wrap">
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><Logo /><p className="flex items-center gap-2 text-sm text-ink-600"><Utensils size={15} className="text-rust" aria-hidden /> Feito para bons encontros.</p></div>
        <div className="flex flex-col justify-between gap-5 border-t border-line-warm pt-6 text-xs text-muted sm:flex-row">
          <span>DataFood © {new Date().getFullYear()}</span>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            © OpenStreetMap contributors · ODbL
          </a>
          <Link href="/privacidade" className="hover:text-ink">
            Privacidade · LGPD
          </Link>
          <Link href="/termos" className="hover:text-ink">
            Termos
          </Link>
        </div>
        </div>
      </div>
    </footer>
  )
}
