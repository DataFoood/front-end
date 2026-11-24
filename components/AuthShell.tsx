'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Logo } from './ui'

/** Layout das telas de login/cadastro: painel escuro (desktop) + formulário. */
export function AuthShell({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col overflow-hidden bg-olive px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:min-w-0 lg:flex-1 lg:px-12 lg:py-10">
        <div className="absolute inset-0 hidden lg:block"><Image src="/images/restaurant-mood.webp" alt="" fill priority sizes="55vw" className="object-cover" /></div>
        <div className="absolute inset-0 hidden bg-ink/50 lg:block" />
        <div className="relative flex items-center justify-between"><Logo dark /><Link href="/explorar" className="hidden items-center gap-2 text-xs text-white/90 sm:flex">Explore os lugares <ArrowUpRight size={15} aria-hidden /></Link></div>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} className="relative my-auto hidden py-16 lg:block">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-md"><MapPin size={13} aria-hidden /> Seu próximo lugar favorito está por aí.</span>
          <h1 className="max-w-lg font-serif text-[clamp(38px,4.7vw,66px)] leading-[1.1] tracking-[-0.035em] text-white [&_span]:text-butter">{headline}</h1>
        </m.div>
        <p className="relative hidden text-xs text-white/70 lg:block">Bons lugares. Melhores momentos. © {new Date().getFullYear()}</p>
      </aside>
      <m.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="mx-auto flex w-full max-w-[620px] flex-col bg-cream px-6 py-10 sm:px-12 lg:w-[52%] lg:px-16 lg:py-14">{children}</m.main>
    </div>
  )
}
