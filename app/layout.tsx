import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'datafood — encontre o lugar perfeito para o momento',
  description: 'descreva o momento. datafood cuida do resto.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
