import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'

export const metadata: Metadata = {
  title: {
    default: 'DataFood — encontre o lugar perfeito para o momento',
    template: '%s · DataFood',
  },
  description: 'Descreva o momento. O DataFood encontra o restaurante certo com busca semântica.',
  icons: { icon: '/imgs/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#F5F0E8', // = --color-cream (metadata não lê CSS)
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <AuthProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
