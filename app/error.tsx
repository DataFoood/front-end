'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 font-serif text-4xl">Algo deu errado.</h1>
      <p className="mb-8 text-sm text-muted">Tivemos um problema ao carregar esta página.</p>
      <button onClick={reset} className="btn-primary">
        Tentar novamente
      </button>
    </main>
  )
}
