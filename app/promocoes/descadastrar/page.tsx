'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { PageLoader, Spinner } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'

function Unsubscribe() {
  const token = useSearchParams().get('token') ?? ''
  const [state, setState] = useState<'idle' | 'sending' | 'done' | { error: string }>('idle')

  // só com clique: leitores de link dos provedores de e-mail abrem a URL
  // sozinhos e descadastrariam a pessoa sem ela pedir
  const confirm = async () => {
    setState('sending')
    try {
      await api('/api/promotions/unsubscribe/', { method: 'POST', body: { token }, auth: false })
      setState('done')
    } catch (err) {
      setState({ error: errorMessage(err) })
    }
  }

  if (!token) return <p className="text-sm text-muted">link incompleto. use o link do fim do e-mail ou desligue em perfil → promoções.</p>
  if (state === 'done') {
    return (
      <>
        <p className="mb-8 text-sm text-muted">pronto. você não vai mais receber promoções. dá para religar quando quiser no seu perfil.</p>
        <Link href="/" className="btn-primary">
          voltar ao início
        </Link>
      </>
    )
  }
  return (
    <>
      <p className="mb-8 text-sm text-muted">você deixa de receber promoções por e-mail e telegram de todos os restaurantes.</p>
      <button onClick={confirm} disabled={state === 'sending'} className="btn-primary">
        {state === 'sending' ? <Spinner className="h-4 w-4 border-ink-600 border-t-white" /> : 'parar de receber promoções'}
      </button>
      {typeof state === 'object' && <p className="mt-4 text-sm text-danger">{state.error}</p>}
    </>
  )
}

export default function DescadastrarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="eyebrow mb-4">promoções</p>
        <h1 className="mb-4 font-serif text-4xl">cancelar inscrição</h1>
        <Suspense fallback={<PageLoader />}>
          <Unsubscribe />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
