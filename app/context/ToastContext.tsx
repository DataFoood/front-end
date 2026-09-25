'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

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
  success: 'bg-[#1a7a45]',
  error: 'bg-[#c53030]',
  info: 'bg-ink',
}
const ICONS: Record<ToastKind, string> = { success: '✓', error: '✕', info: '•' }

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
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`${STYLES[t.kind]} pointer-events-auto flex max-w-sm animate-fade-in items-start gap-3 rounded-md px-5 py-3.5 text-sm leading-relaxed text-white shadow-lg`}
          >
            <span aria-hidden className="text-base leading-none">
              {ICONS[t.kind]}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return ctx
}
