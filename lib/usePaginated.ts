'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage, type Query } from './api'
import type { Paginated } from './types'

/** Tamanho de página padrão do front (o back aceita até 50). */
export const PAGE_SIZE = 12

interface State<T> {
  key: string
  items: T[]
  count: number
  page: number
  hasMore: boolean
  error: string | null
}

/**
 * Paginação padrão de toda listagem: carrega a página 1 quando `path`/`query`
 * mudam e anexa as próximas com `loadMore()`. O estado é chaveado pela
 * consulta: resposta de uma consulta antiga nunca entra na lista nova.
 * `path = null` não carrega (ex.: esperando o id).
 */
export function usePaginated<T>(path: string | null, query: Query = {}, pageSize = PAGE_SIZE) {
  const key = JSON.stringify([path, query, pageSize])
  const [state, setState] = useState<State<T> | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    const [, q] = JSON.parse(key) as [string, Query]
    api<Paginated<T>>(path, { query: { ...q, page: 1, page_size: pageSize }, signal: controller.signal })
      .then(data => setState({ key, items: data.results, count: data.count, page: 1, hasMore: !!data.next, error: null }))
      .catch(err => {
        if (err?.name !== 'AbortError') setState({ key, items: [], count: 0, page: 1, hasMore: false, error: errorMessage(err) })
      })
    return () => controller.abort()
  }, [path, key, pageSize, nonce])

  const current = state?.key === key ? state : null

  const loadMore = useCallback(async () => {
    if (!path || !current?.hasMore) return
    setLoadingMore(true)
    try {
      const data = await api<Paginated<T>>(path, { query: { ...query, page: current.page + 1, page_size: pageSize } })
      setState(prev => (prev?.key === current.key ? { ...prev, items: [...prev.items, ...data.results], page: current.page + 1, hasMore: !!data.next, count: data.count } : prev))
    } catch (err) {
      setState(prev => (prev?.key === current.key ? { ...prev, error: errorMessage(err) } : prev))
    } finally {
      setLoadingMore(false)
    }
    // query entra pela key (objeto novo a cada render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, pageSize, current])

  /** recarrega da página 1 (depois de criar/remover algo) */
  const reload = useCallback(() => setNonce(n => n + 1), [])

  /** ajuste local sem recarregar (editou/removeu um item) */
  const update = useCallback(
    (fn: (items: T[]) => T[]) =>
      setState(prev => {
        if (!prev || prev.key !== key) return prev
        const items = fn(prev.items)
        return { ...prev, items, count: prev.count + (items.length - prev.items.length) }
      }),
    [key],
  )

  return {
    items: current?.items ?? [],
    count: current?.count ?? 0,
    hasMore: current?.hasMore ?? false,
    error: current?.error ?? null,
    /** primeira página ainda não chegou */
    loading: !!path && !current,
    loadingMore,
    loadMore,
    reload,
    update,
  }
}

/** Todas as páginas de uma listagem (para conjuntos pequenos, ex.: ids favoritos). */
export async function fetchAll<T>(path: string, query: Query = {}): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; ; page++) {
    const data = await api<Paginated<T>>(path, { query: { ...query, page, page_size: 50 } })
    out.push(...data.results)
    if (!data.next) return out
  }
}
