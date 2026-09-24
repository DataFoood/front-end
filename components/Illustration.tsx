import type { ReactElement } from 'react'

// Arte padrão quando o restaurante não tem foto de capa (mesmas ilustrações do protótipo).

const VARIANTS = ['bowl', 'glass', 'plate'] as const
type Variant = (typeof VARIANTS)[number]

function Bowl() {
  return (
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden>
      <path d="M130 60 Q125 45 130 30" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M150 55 Q145 38 150 22" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M170 60 Q165 45 170 30" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="150" cy="158" rx="68" ry="10" fill="#1a1a1a" />
      <ellipse cx="150" cy="130" rx="60" ry="18" fill="#C0603A" />
      <path d="M90 130 Q90 175 150 175 Q210 175 210 130" fill="#C0603A" />
      <ellipse cx="150" cy="130" rx="60" ry="18" fill="none" stroke="#d4704a" strokeWidth="1" />
    </svg>
  )
}

function Glass() {
  return (
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden>
      <circle cx="80" cy="80" r="4" fill="#8B7355" opacity="0.6" />
      <circle cx="220" cy="110" r="3" fill="#8B7355" opacity="0.5" />
      <circle cx="60" cy="130" r="2.5" fill="#8B7355" opacity="0.4" />
      <circle cx="235" cy="70" r="2" fill="#8B7355" opacity="0.4" />
      <line x1="150" y1="155" x2="150" y2="175" stroke="#C0603A" strokeWidth="2" />
      <ellipse cx="150" cy="175" rx="28" ry="5" fill="#C0603A" />
      <path d="M122 80 Q118 130 138 155 L162 155 Q182 130 178 80 Z" fill="#C0603A" />
      <ellipse cx="150" cy="80" rx="28" ry="6" fill="#d4704a" />
      <path d="M126 95 Q124 120 130 145" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Plate() {
  return (
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden>
      <ellipse cx="150" cy="130" rx="80" ry="22" fill="#1e1e1e" />
      <ellipse cx="150" cy="126" rx="80" ry="22" fill="#2a2a2a" />
      <ellipse cx="150" cy="122" rx="80" ry="22" fill="none" stroke="#333" strokeWidth="1" />
      <ellipse cx="150" cy="120" rx="60" ry="16" fill="#C0603A" />
      <circle cx="145" cy="118" r="8" fill="#8B3E20" />
      <circle cx="158" cy="121" r="5" fill="#2d7a3a" opacity="0.9" />
      <circle cx="140" cy="124" r="3.5" fill="#d4704a" />
    </svg>
  )
}

const ART: Record<Variant, () => ReactElement> = { bowl: Bowl, glass: Glass, plate: Plate }

export function Illustration({ seed }: { seed: number }) {
  const Art = ART[VARIANTS[Math.abs(seed) % VARIANTS.length]]
  return <Art />
}

/** Capa: foto se houver, senão a ilustração sobre fundo escuro. */
export function Cover({ src, seed, alt, className = '' }: { src?: string; seed: number; alt: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-ink ${className}`}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" /> : <Illustration seed={seed} />}
    </div>
  )
}
