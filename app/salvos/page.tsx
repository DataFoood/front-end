'use client'

import Link from 'next/link'
import { useFavorites } from '../context/FavoritesContext'

export default function SalvosPage() {
  const { favorites, toggleFavorite } = useFavorites()

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', padding: '48px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        
        {/* Header Simples */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none', color: '#c0603a', fontSize: '14px' }}>← Voltar</Link>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: '#111', marginTop: '12px' }}>
              Seus Restaurantes Salvos
            </h1>
          </div>
          <span style={{ background: '#c0603a', color: '#fff', padding: '6px 12px', borderRadius: '12px', fontSize: '13px' }}>
            {favorites.length} salvos
          </span>
        </div>

        {/* Lista de Salvos */}
        {favorites.length === 0 ? (
          <p style={{ color: '#666', fontSize: '16px' }}>Você ainda não salvou nenhum restaurante.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {favorites.map((rest) => (
              <div key={rest.id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#999', letterSpacing: '0.05em' }}>{rest.bairro.toUpperCase()} · {rest.vibe.toUpperCase()}</span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: '#111', margin: '8px 0' }}>{rest.name}</h3>
                  <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5' }}>{rest.desc}</p>
                </div>
                
                <button 
                  onClick={() => toggleFavorite(rest)}
                  style={{ background: 'transparent', border: '1px solid #c0603a', color: '#c0603a', padding: '8px 12px', borderRadius: '4px', marginTop: '20px', cursor: 'pointer', fontSize: '13px', width: 'fit-content' }}
                >
                  Remover dos Salvos
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}