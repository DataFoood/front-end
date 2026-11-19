'use client'

import { useEffect, useRef, useState } from 'react'
import { api, errorMessage } from '@/lib/api'
import type { RestaurantCard } from '@/lib/types'
import { ChoiceDeck } from './ChoiceDeck'
import { Spinner } from './ui'

export function RecommendationDialog({ count, conversationId, messageIndex, initialRestaurants = [] }: {
  count: number; conversationId: number | null; messageIndex: number; initialRestaurants?: RestaurantCard[]
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [activated, setActivated] = useState(false)
  const [selection, setSelection] = useState<{ restaurants: RestaurantCard[] } | { error: string } | null>(
    () => initialRestaurants.length ? { restaurants: initialRestaurants } : null,
  )

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  useEffect(() => {
    if (!open || selection !== null || conversationId === null) return
    const abort = new AbortController()
    api<{ results: RestaurantCard[] }>(`/api/chats/${conversationId}/recommendations/${messageIndex}/`, { signal: abort.signal })
      .then(data => setSelection({ restaurants: data.results }))
      .catch(error => {
        if (error.name !== 'AbortError') setSelection({ error: errorMessage(error, 'Não foi possível carregar as recomendações.') })
      })
    return () => abort.abort()
  }, [open, selection, conversationId, messageIndex])

  return (
    <>
      <button ref={trigger} className="btn-accent mt-4 min-h-12 gap-3" onClick={() => {
        dialog.current?.showModal()
        setActivated(true)
        setOpen(true)
        closeButton.current?.focus({ preventScroll: true })
      }}>
        Ver recomendações ({count}) <span aria-hidden>↗</span>
      </button>
      <dialog ref={dialog} aria-label="Suas recomendações"
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-cream p-0 text-ink backdrop:bg-ink/60"
        onClose={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }) }}>
        <div className="flex h-full flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-8 sm:py-4">
            <button ref={closeButton} className="btn-ghost min-h-11 gap-2 px-3" aria-label="Voltar à conversa" onClick={() => dialog.current?.close()}>
              <span aria-hidden>←</span> Conversa
            </button>
            <h2 className="min-w-0 text-right font-serif text-base sm:text-2xl">Suas recomendações</h2>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-6">
            {activated && (selection === null ? (
              <div role="status" className="flex h-full items-center justify-center gap-3 text-sm text-ink-600"><Spinner /> Carregando suas opções…</div>
            ) : 'error' in selection ? (
              <div role="alert" className="mx-auto max-w-lg space-y-4 rounded-2xl border border-line bg-white p-6">
                <p>{selection.error}</p>
                <button className="btn-accent" onClick={() => setSelection(null)}>Tentar novamente</button>
              </div>
            ) : selection.restaurants.length ? (
              <ChoiceDeck restaurants={selection.restaurants} immersive />
            ) : (
              <div className="mx-auto max-w-lg space-y-3 p-6 text-center">
                <h3 className="font-serif text-2xl">Essas opções não estão mais disponíveis</h3>
                <p className="text-sm text-muted">Volte à conversa para atualizar sua busca.</p>
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </>
  )
}
