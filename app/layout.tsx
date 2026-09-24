import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'

export const metadata: Metadata = {
  title: {
    default: 'datafood — encontre o lugar perfeito para o momento',
    template: '%s · datafood',
  },
  description: 'descreva o momento. datafood encontra o restaurante certo com busca semântica.',
  icons: { icon: '/imgs/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#F5F0E8',
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
