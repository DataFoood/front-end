'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { api, errorMessage } from '@/lib/api'
import type { Favorite } from '@/lib/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

// Os ids favoritados mudam a cada clique e são lidos por todo card da tela.
// Se ficassem no value do contexto, favoritar um restaurante re-renderizaria
// todos os consumidores. Por isso o contexto carrega só coisas estáveis (um
// store + ações) e cada componente assina a fatia que usa via
// useSyncExternalStore: favoritar re-renderiza só o botão daquele restaurante
// e o contador.

type Ids = ReadonlySet<number>
const EMPTY: Ids = new Set()

function createFavoritesStore() {
  let ids: Ids = EMPTY
  const listeners = new Set<() => void>()
  const setIds = (next: Ids) => {
    if (next === ids) return
    ids = next
    listeners.forEach(l => l())
  }
  return {
    getIds: () => ids,
    setIds,
    update(id: number, favorite: boolean) {
      const next = new Set(ids)
      if (favorite) next.add(id)
      else next.delete(id)
      setIds(next)
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

type FavoritesStore = ReturnType<typeof createFavoritesStore>

interface FavoritesContextValue {
  store: FavoritesStore
  /** alterna o favorito; retorna o novo estado (ou o anterior se falhar) */
  toggle: (id: number) => Promise<boolean>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const [store] = useState(createFavoritesStore)
  // depende só do id: salvar o perfil troca o objeto user, não a conta
  const userId = user?.id ?? null

  useEffect(() => {
    // trocar/sair de conta zera na hora; ids de uma conta nunca aparecem em outra
    store.setIds(EMPTY)
    if (userId === null) return
    let cancelled = false
    api<Favorite[]>('/api/restaurants/favorites/')
      .then(list => !cancelled && store.setIds(new Set(list.map(f => f.restaurant.id))))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [store, userId])

  const toggle = useCallback(
    async (id: number) => {
      const wasFavorite = store.getIds().has(id)
      store.update(id, !wasFavorite) // otimista
      try {
        await api(`/api/restaurants/${id}/favorite/`, { method: wasFavorite ? 'DELETE' : 'POST' })
        return !wasFavorite
      } catch (err) {
        store.update(id, wasFavorite)
        toast.error(errorMessage(err, 'Não foi possível atualizar seus salvos.'))
        return wasFavorite
      }
    },
    [store, toast],
  )

  const value = useMemo(() => ({ store, toggle }), [store, toggle])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

function useFavoritesContext() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites precisa estar dentro de <FavoritesProvider>')
  return ctx
}

const serverIds = () => EMPTY

/** Conjunto de ids favoritados (re-renderiza quando qualquer favorito muda). */
export function useFavoriteIds(): Ids {
  const { store } = useFavoritesContext()
  return useSyncExternalStore(store.subscribe, store.getIds, serverIds)
}

/** Quantidade de favoritos (re-renderiza só quando o total muda). */
export function useFavoritesCount(): number {
  const { store } = useFavoritesContext()
  return useSyncExternalStore(store.subscribe, () => store.getIds().size, () => 0)
}

/** Se um restaurante está favoritado (re-renderiza só quando ele muda). */
export function useIsFavorite(id: number): boolean {
  const { store } = useFavoritesContext()
  return useSyncExternalStore(store.subscribe, () => store.getIds().has(id), () => false)
}

/** Ações estáveis (não re-renderizam quem só dispara). */
export function useFavoriteActions() {
  return { toggle: useFavoritesContext().toggle }
}
