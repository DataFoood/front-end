// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PHASE_PRODUCTION_BUILD } = require('next/constants')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // imagem Docker enxuta (node server.js)
  output: 'standalone',
  poweredByHeader: false,
  // as rotas do Django terminam em "/": sem isto o Next tiraria a barra antes
  // do proxy.ts repassar /api/* (e o POST viraria 308 -> 404 no Django)
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    // URL antiga do protótipo
    return [{ source: '/dashboard', destination: '/painel', permanent: true }]
  },
}

module.exports = (phase) => {
  // `next typegen` usa a fase de build, mas não publica um bundle da API.
  if (phase === PHASE_PRODUCTION_BUILD && process.argv[2] !== 'typegen') {
    let apiUrl
    try {
      apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || '')
    } catch {
      throw new Error('Defina NEXT_PUBLIC_API_URL com a origem HTTPS da API antes do build de produção.')
    }
    if (
      apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password ||
      apiUrl.search || apiUrl.hash || apiUrl.pathname !== '/' ||
      ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].includes(apiUrl.hostname) ||
      apiUrl.hostname.endsWith('.localhost')
    ) {
      throw new Error('NEXT_PUBLIC_API_URL deve ser uma origem HTTPS pública, sem credenciais, caminho, query ou fragmento.')
    }
  }
  return nextConfig
}
