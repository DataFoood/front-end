'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import type { Role } from '@/lib/types'
import { PageLoader } from './ui'

/** Renderiza os filhos só com usuário logado; senão manda pro login com ?next=. */
export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const allowed = !!user && (!roles || roles.includes(user.role))

  useEffect(() => {
    if (loading) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (!allowed) router.replace('/chat')
  }, [loading, user, allowed, router, pathname])

  if (loading || !allowed) return <PageLoader />
  return <>{children}</>
}
