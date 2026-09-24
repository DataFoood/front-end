import type { ReactNode } from 'react'
import { SiteFooter, SiteHeader } from './SiteHeader'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-8">
        <p className="eyebrow mb-3">atualizado em {updated}</p>
        <h1 className="mb-10 font-serif text-4xl">{title}</h1>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-[#444] [&_h2]:mt-6 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
