import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'
import { MotionProvider } from '@/components/Motion'

export const metadata: Metadata = {
  title: {
    default: 'DataFood — encontre o lugar perfeito para o momento',
    template: '%s · DataFood',
  },
  description: 'Descreva o momento. O DataFood encontra o restaurante certo com busca semântica.',
  icons: { icon: '/imgs/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#FAF7F0', // = --color-cream (metadata não lê CSS)
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <MotionProvider>
          <ToastProvider>
            <AuthProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </AuthProvider>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  )
}
