'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Check, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const STYLES: Record<ToastKind, string> = {
  success: 'bg-success-bg text-success',
  error: 'bg-danger-bg text-danger',
  info: 'bg-peach text-rust',
}
const ICONS = { success: Check, error: X, info: Info }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++seq.current
    setToasts(prev => [...prev.slice(-2), { id, kind, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const value = useMemo(
    () => ({
      success: (m: string) => push('success', m),
      error: (m: string) => push('error', m),
      info: (m: string) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:top-6"
      >
        <AnimatePresence initial={false}>
        {toasts.map(t => {
          const Icon = ICONS[t.kind]
          return <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border border-line-warm bg-paper p-4 text-sm leading-relaxed text-ink-700 shadow-xl shadow-ink/10"
          >
            <span aria-hidden className={`${STYLES[t.kind]} flex h-7 w-7 shrink-0 items-center justify-center rounded-full`}><Icon size={15} /></span>
            <span className="pt-0.5">{t.message}</span>
          </m.div>
        })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
