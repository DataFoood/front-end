'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { initials } from '@/lib/format'

export function Logo({ dark = false, size = 32 }: { dark?: boolean; size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="datafood — início">
      <Image src="/imgs/icon.svg" alt="" width={size} height={size} className="object-contain" priority />
      <span className={`text-base font-medium tracking-wide ${dark ? 'text-rust-soft' : 'text-rust'}`}>DATAFOOD</span>
    </Link>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="carregando"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ddd] border-t-rust ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  )
}

export function Avatar({ name, url, size = 32 }: { name: string; url?: string; size?: number }) {
  if (url) {
    return <img src={url} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-rust font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  right?: ReactNode
}

export function Field({ label, error, hint, right, id, className = '', ...props }: FieldProps) {
  const fieldId = id ?? `f-${props.name ?? label}`
  return (
    <div className={className}>
      <label htmlFor={fieldId} className={`label ${error ? '!text-[#e53e3e]' : ''}`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
          className={`input ${error ? 'input-error' : ''} ${right ? 'pr-16' : ''}`}
          {...props}
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {(error || hint) && (
        <p id={`${fieldId}-msg`} className={`mt-1.5 text-xs ${error ? 'text-[#e53e3e]' : 'text-[#aaa]'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextArea({ label, error, id, className = '', ...props }: TextAreaProps) {
  const fieldId = id ?? `t-${props.name ?? label}`
  return (
    <div className={className}>
      <label htmlFor={fieldId} className={`label ${error ? '!text-[#e53e3e]' : ''}`}>
        {label}
      </label>
      <textarea id={fieldId} aria-invalid={!!error} className={`input min-h-[110px] resize-y ${error ? 'input-error' : ''}`} {...props} />
      {error && <p className="mt-1.5 text-xs text-[#e53e3e]">{error}</p>}
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  id: string
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-[#666]">
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-ink" />
      <span>{children}</span>
    </label>
  )
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-rust' : 'bg-[#ccc]'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value)
  return (
    <span className="inline-flex" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= rounded ? '#C0603A' : 'none'} stroke="#C0603A" strokeWidth="1.5" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-ink">
        <div className="h-3 w-3 rounded-full bg-rust" />
      </div>
      <h3 className="mb-2 font-serif text-2xl">{title}</h3>
      {text && <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted">{text}</p>}
      {action}
    </div>
  )
}

export function SectionTitle({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="font-serif text-2xl sm:text-[28px]">{title}</h2>
      {eyebrow && <span className="text-[11px] tracking-[0.1em] text-[#bbb]">{eyebrow}</span>}
      {action}
    </div>
  )
}
