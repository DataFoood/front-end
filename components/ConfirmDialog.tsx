'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import { CircleHelp, TriangleAlert } from 'lucide-react'

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

/** A confirmação pertence à tela: desmontá-la cancela qualquer ação pendente. */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const pending = useRef<((confirmed: boolean) => void) | null>(null)

  useEffect(() => () => {
    const resolve = pending.current
    pending.current = null
    resolve?.(false)
  }, [])

  const confirm = useCallback((next: ConfirmOptions): Promise<boolean> => {
    // Dois cliques antes de abrir o modal não podem autorizar a mesma ação duas vezes.
    if (pending.current) return Promise.resolve(false)
    return new Promise(resolve => {
      pending.current = resolve
      setOptions(next)
    })
  }, [])

  const decide = useCallback((confirmed: boolean) => {
    const resolve = pending.current
    pending.current = null
    setOptions(null)
    resolve?.(confirmed)
  }, [])

  return {
    confirm,
    confirmation: options ? <ConfirmDialog {...options} onDecision={decide} /> : null,
  }
}

export function ConfirmDialog({ title, description, confirmLabel, cancelLabel = 'Cancelar', tone = 'default', onDecision }: ConfirmOptions & { onDecision: (confirmed: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const danger = tone === 'danger'
  const Icon = danger ? TriangleAlert : CircleHelp

  useLayoutEffect(() => {
    const element = dialog.current
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    cancel.current?.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (origin?.isConnected) origin.focus({ preventScroll: true })
    }
  }, [])

  return (
    <dialog ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); onDecision(false) }}
      // Ignore o close da limpeza do StrictMode quando o dialog já tiver sido reaberto.
      onClose={event => { if (!event.currentTarget.open) onDecision(false) }}
      onClick={event => { if (event.target === event.currentTarget) onDecision(false) }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-3xl border border-line-warm bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm">
      <m.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }} className="p-6 sm:p-8">
        <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? 'bg-danger-bg text-danger' : 'bg-peach text-rust'}`}><Icon size={23} strokeWidth={1.5} aria-hidden /></span>
        <h2 id={titleId} className="mb-3 font-serif text-[28px] leading-tight tracking-[-0.02em]">{title}</h2>
        <p id={descriptionId} className="text-sm leading-7 text-ink-600">{description}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancel} type="button" className="btn-ghost" onClick={() => onDecision(false)}>{cancelLabel}</button>
          <button type="button" className={danger ? 'btn-danger bg-danger text-white hover:bg-danger/90' : 'btn-accent'} onClick={() => onDecision(true)}>{confirmLabel}</button>
        </div>
      </m.div>
    </dialog>
  )
}
