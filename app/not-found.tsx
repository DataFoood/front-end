import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="mb-4 font-serif text-4xl">esta mesa não existe.</h1>
        <p className="mb-8 text-sm text-muted">a página que você procura saiu do cardápio.</p>
        <Link href="/" className="btn-primary">
          voltar ao início
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
