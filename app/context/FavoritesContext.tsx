'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, errorMessage } from '@/lib/api'
import type { Favorite } from '@/lib/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

interface FavoritesContextValue {
  /** ids favoritados pelo usuário logado */
  ids: Set<number>
  count: number
  isFavorite: (id: number) => boolean
  /** alterna o favorito; retorna o novo estado (ou o anterior se falhar) */
  toggle: (id: number) => Promise<boolean>
}

const EMPTY: Set<number> = new Set()

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  // ids ficam amarrados ao usuário que os carregou: trocar/sair de conta zera sem effect
  const [loaded, setLoaded] = useState<{ userId: number; ids: Set<number> } | null>(null)
  const ids = useMemo(() => (user && loaded?.userId === user.id ? loaded.ids : EMPTY), [user, loaded])
  const setIds = useCallback(
    (fn: (prev: Set<number>) => Set<number>) => setLoaded(prev => (prev && user ? { userId: prev.userId, ids: fn(prev.ids) } : prev)),
    [user],
  )

  useEffect(() => {
    if (!user) return
    api<Favorite[]>('/api/restaurants/favorites/')
      .then(list => setLoaded({ userId: user.id, ids: new Set(list.map(f => f.restaurant.id)) }))
      .catch(() => setLoaded({ userId: user.id, ids: new Set() }))
  }, [user])

  const toggle = useCallback(
    async (id: number) => {
      const wasFavorite = ids.has(id)
      const apply = (fav: boolean) =>
        setIds(prev => {
          const next = new Set(prev)
          if (fav) next.add(id)
          else next.delete(id)
          return next
        })
      apply(!wasFavorite) // otimista
      try {
        await api(`/api/restaurants/${id}/favorite/`, { method: wasFavorite ? 'DELETE' : 'POST' })
        return !wasFavorite
      } catch (err) {
        apply(wasFavorite)
        toast.error(errorMessage(err, 'Não foi possível atualizar seus salvos.'))
        return wasFavorite
      }
    },
    [ids, setIds, toast],
  )

  const value = useMemo(
    () => ({ ids, count: ids.size, isFavorite: (id: number) => ids.has(id), toggle }),
    [ids, toggle],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites precisa estar dentro de <FavoritesProvider>')
  return ctx
}
