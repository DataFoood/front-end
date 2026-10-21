'use client'

import { useEffect, useState } from 'react'
import { api } from './api'
import type { Taxonomies } from './types'

// Taxonomias são estáticas (seed do back): uma requisição por carregamento
// da aba, compartilhada entre /explorar e o painel.
let cache: Taxonomies | null = null
let inflight: Promise<Taxonomies> | null = null

function loadTaxonomies(): Promise<Taxonomies> {
  inflight ??= api<Taxonomies>('/api/restaurants/taxonomies/')
    .then(t => (cache = t))
    .catch(err => {
      inflight = null // deixa tentar de novo no próximo uso
      throw err
    })
  return inflight
}

/** Taxonomias (cozinhas, ambientes, preços…) ou null enquanto carrega. */
export function useTaxonomies(): Taxonomies | null {
  const [tax, setTax] = useState<Taxonomies | null>(cache)
  useEffect(() => {
    if (cache) return
    let cancelled = false
    loadTaxonomies()
      .then(t => !cancelled && setTax(t))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return tax
}
