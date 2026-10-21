import type { ReactNode } from 'react'
import { Logo } from './ui'

/** Layout das telas de login/cadastro: painel escuro (desktop) + formulário. */
export function AuthShell({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col overflow-hidden bg-dark-bg px-6 py-6 lg:min-h-screen lg:flex-1 lg:px-12 lg:py-10">
        <Logo dark />
        <div aria-hidden className="absolute -bottom-20 -right-16 hidden h-[440px] w-[440px] rounded-full border border-dark-ring lg:block" />
        <div aria-hidden className="absolute -bottom-44 -right-36 hidden h-[620px] w-[620px] rounded-full border border-dark-ring-soft lg:block" />
        <h1 className="my-auto hidden text-[clamp(36px,4vw,60px)] font-light leading-[1.15] text-white lg:block">{headline}</h1>
        <p className="hidden text-[11px] text-dark-text lg:block">Privacidade por design · LGPD · DataFood © {new Date().getFullYear()}</p>
      </aside>
      <main className="flex w-full flex-col bg-cream px-6 py-10 sm:px-12 lg:w-[580px] lg:overflow-y-auto lg:px-16 lg:py-14">{children}</main>
    </div>
  )
}
