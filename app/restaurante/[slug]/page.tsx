'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getRestaurant } from '../../data/restaurants'
import { useFavorites } from '../../context/FavoritesContext'

function IllustrationBowl() {
  return (
    <svg viewBox="0 0 600 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M240 110 Q228 82 240 55" fill="none" stroke="#3a3a3a" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M300 100 Q288 68 300 38" fill="none" stroke="#3a3a3a" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M360 110 Q348 82 360 55" fill="none" stroke="#3a3a3a" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="300" cy="285" rx="130" ry="18" fill="#1a1a1a"/>
      <ellipse cx="300" cy="240" rx="115" ry="32" fill="#C0603A"/>
      <path d="M185 240 Q185 318 300 318 Q415 318 415 240" fill="#C0603A"/>
      <ellipse cx="300" cy="240" rx="115" ry="32" fill="none" stroke="#d4704a" strokeWidth="1.5"/>
    </svg>
  )
}

function IllustrationGlass() {
  return (
    <svg viewBox="0 0 600 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="150" cy="140" r="7" fill="#8B7355" opacity="0.5"/>
      <circle cx="440" cy="190" r="5.5" fill="#8B7355" opacity="0.4"/>
      <circle cx="120" cy="230" r="4.5" fill="#8B7355" opacity="0.35"/>
      <circle cx="460" cy="120" r="3.5" fill="#8B7355" opacity="0.35"/>
      <circle cx="480" cy="250" r="3" fill="#8B7355" opacity="0.3"/>
      <line x1="300" y1="285" x2="300" y2="320" stroke="#C0603A" strokeWidth="3"/>
      <ellipse cx="300" cy="320" rx="52" ry="9" fill="#C0603A"/>
      <path d="M248 140 Q240 230 272 285 L328 285 Q360 230 352 140 Z" fill="#C0603A"/>
      <ellipse cx="300" cy="140" rx="52" ry="11" fill="#d4704a"/>
      <path d="M253 168 Q249 220 260 272" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  )
}

function IllustrationPlate() {
  return (
    <svg viewBox="0 0 600 360" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="300" cy="248" rx="152" ry="40" fill="#1e1e1e"/>
      <ellipse cx="300" cy="240" rx="152" ry="40" fill="#2a2a2a"/>
      <ellipse cx="300" cy="232" rx="152" ry="40" fill="none" stroke="#333" strokeWidth="1.5"/>
      <ellipse cx="300" cy="228" rx="115" ry="30" fill="#C0603A"/>
      <circle cx="288" cy="222" r="15" fill="#8B3E20"/>
      <circle cx="314" cy="228" r="10" fill="#2d7a3a" opacity="0.9"/>
      <circle cx="278" cy="232" r="7" fill="#d4704a"/>
      <circle cx="308" cy="216" r="5" fill="#1a1a1a" opacity="0.5"/>
    </svg>
  )
}

function SmallIllustrationBowl() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <path d="M130 60 Q125 45 130 30" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M150 55 Q145 38 150 22" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M170 60 Q165 45 170 30" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="150" cy="158" rx="68" ry="10" fill="#1a1a1a"/>
      <ellipse cx="150" cy="130" rx="60" ry="18" fill="#C0603A"/>
      <path d="M90 130 Q90 175 150 175 Q210 175 210 130" fill="#C0603A"/>
      <ellipse cx="150" cy="130" rx="60" ry="18" fill="none" stroke="#d4704a" strokeWidth="1"/>
    </svg>
  )
}

function SmallIllustrationGlass() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="4" fill="#8B7355" opacity="0.6"/>
      <circle cx="220" cy="110" r="3" fill="#8B7355" opacity="0.5"/>
      <circle cx="60" cy="130" r="2.5" fill="#8B7355" opacity="0.4"/>
      <circle cx="235" cy="70" r="2" fill="#8B7355" opacity="0.4"/>
      <line x1="150" y1="155" x2="150" y2="175" stroke="#C0603A" strokeWidth="2"/>
      <ellipse cx="150" cy="175" rx="28" ry="5" fill="#C0603A"/>
      <path d="M122 80 Q118 130 138 155 L162 155 Q182 130 178 80 Z" fill="#C0603A"/>
      <ellipse cx="150" cy="80" rx="28" ry="6" fill="#d4704a"/>
      <path d="M126 95 Q124 120 130 145" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function SmallIllustrationPlate() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="150" cy="130" rx="80" ry="22" fill="#1e1e1e"/>
      <ellipse cx="150" cy="126" rx="80" ry="22" fill="#2a2a2a"/>
      <ellipse cx="150" cy="122" rx="80" ry="22" fill="none" stroke="#333" strokeWidth="1"/>
      <ellipse cx="150" cy="120" rx="60" ry="16" fill="#C0603A"/>
      <circle cx="145" cy="118" r="8" fill="#8B3E20"/>
      <circle cx="158" cy="121" r="5" fill="#2d7a3a" opacity="0.9"/>
      <circle cx="140" cy="124" r="3.5" fill="#d4704a"/>
    </svg>
  )
}

const BIG_ILLUS = {
  bowl: IllustrationBowl,
  glass: IllustrationGlass,
  plate: IllustrationPlate,
}

const SMALL_ILLUS = {
  bowl: SmallIllustrationBowl,
  glass: SmallIllustrationGlass,
  plate: SmallIllustrationPlate,
}

function ActionButtons({ restaurant }: { restaurant: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const { toggleFavorite, isFavorite } = useFavorites()
  
  const isSaved = isFavorite(restaurant.slug || restaurant.id)
  
  const [isReserveHovered, setIsReserveHovered] = useState(false)
  const [isSaveHovered, setIsSaveHovered] = useState(false)

  const handleSaveClick = () => {
    toggleFavorite({
      id: restaurant.slug || restaurant.id,
      name: restaurant.name,
      bairro: restaurant.neighborhood || 'Bairro',
      vibe: restaurant.tags?.[1] || 'Casual',
      desc: restaurant.longDescription?.[0] || '',
    })
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsReserveHovered(true)}
          onMouseLeave={() => setIsReserveHovered(false)}
          style={{
            background: isReserveHovered ? '#333' : '#111', 
            color: '#fff', 
            border: 'none',
            padding: '13px 24px', 
            borderRadius: 4, 
            fontSize: 14,
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            transition: 'background 0.2s ease'
          }}
        >
          reservar mesa
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <button 
          onClick={handleSaveClick}
          onMouseEnter={() => setIsSaveHovered(true)}
          onMouseLeave={() => setIsSaveHovered(false)}
          style={{
            background: isSaved ? (isSaveHovered ? '#ffe893' : '#fff3cd') : (isSaveHovered ? '#f5f5f5' : 'transparent'),
            color: '#333',
            border: isSaved ? '1px solid #ffeba0' : '1px solid #ddd',
            padding: '13px 20px', 
            borderRadius: 4, 
            fontSize: 14,
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          {isSaved ? 'salvo' : 'salvar'}
        </button>
      </div>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', padding: '32px', borderRadius: 8,
              maxWidth: 420, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              textAlign: 'center', position: 'relative'
            }}
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'none',
                border: 'none', fontSize: 18, cursor: 'pointer', color: '#888'
              }}
            >
              ✕
            </button>

            <div style={{
              width: 56, height: 56, background: '#f0faf5', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#1a7a45'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: '#111', marginBottom: 12 }}>
              Reserva Solicitada!
            </h3>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
              Sua mesa no <strong>{restaurant.name}</strong> foi reservada com sucesso para o próximo horário disponível.
            </p>

            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: '#111', color: '#fff', border: 'none', width: '100%',
                padding: '12px', borderRadius: 4, fontSize: 14, cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function MenuCard({ item }: { item: any }) {
  const [isHovered, setIsHovered] = useState(false)
  // @ts-ignore
  const SmallIllus = SMALL_ILLUS[item.illustration || 'bowl']

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        border: '1px solid #e8e4dc', 
        borderRadius: 8, 
        overflow: 'hidden', 
        background: '#fff',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
      }}
    >
      <div style={{ background: '#111', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {SmallIllus && <SmallIllus />}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 15, color: '#111', fontWeight: 400 }}>{item.name}</span>
          <span style={{ fontSize: 13, color: '#C0603A', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 8 }}>R$ {item.price}</span>
        </div>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>{item.description}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.tags.map((tag: string, j: number) => (
            <span key={j} style={{ fontSize: 11, color: '#888', border: '1px solid #e0dbd2', borderRadius: 12, padding: '3px 10px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RestaurantePage({ params }: { params: any }) {
  const { slug } = params
  
  const restaurant = getRestaurant(slug)
  if (!restaurant) notFound()

  // Chamada do hook para capturar a lista global de itens salvos
  const { favorites } = useFavorites()

  // @ts-ignore
  const BigIllus = BIG_ILLUS[restaurant.illustration || 'bowl']

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 48px', background: 'var(--cream)',
        borderBottom: '1px solid #e8e4dc', position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image
            src="/imgs/icon.svg"
            alt="datafood"
            width={35}
            height={35}
            style={{ objectFit: 'contain' }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#c0603a', letterSpacing: '0.02em' }}>
            DATAFOOD
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/chat" style={{ fontSize: 13, color: '#111', textDecoration: 'none', fontWeight: 500 }}>Descobrir</Link>
          
          {/* BOTÃO SALVOS COM CONDICIONAL DE COR E BADGE */}
          <Link 
            href="/salvos" 
            style={{ 
              fontSize: 13, 
              color: favorites.length > 0 ? '#c0603a' : '#888', 
              fontWeight: favorites.length > 0 ? 600 : 400,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            Salvos
            {favorites.length > 0 && (
              <span style={{
                background: '#c0603a',
                color: '#fff',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 10,
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                {favorites.length}
              </span>
            )}
          </Link>
          
          <a href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Histórico</a>
          <Link href="/login" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 840, margin: '0 auto', padding: '36px 48px 80px' }}>

        {/* Back link */}
        <Link href="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888', textDecoration: 'none', marginBottom: 28 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Voltar para resultados
        </Link>

        {/* Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start', marginBottom: 56 }}>
          <div style={{ background: '#111', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {BigIllus && <BigIllus />}
          </div>

          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#aaa', marginBottom: 12 }}>
              RECOMENDADO POR DATAFOOD · {restaurant.match}% MATCH
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 52, fontWeight: 400, color: '#111', lineHeight: 1.05, marginBottom: 16 }}>
              {restaurant.name}
            </h1>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 24, maxWidth: 340 }}>
              {restaurant.longDescription[0]}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {restaurant.tags.map((tag: string, i: number) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  border: `1px solid ${tag === 'aberto agora' ? '#a8d8bc' : '#ddd'}`,
                  borderRadius: 24, padding: '6px 14px', fontSize: 12,
                  background: tag === 'aberto agora' ? '#f0faf5' : 'transparent',
                  color: tag === 'aberto agora' ? '#1a7a45' : '#444',
                }}>
                  {tag === 'aberto agora' && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  )}
                  {tag === restaurant.neighborhood && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  )}
                  {tag}
                </span>
              ))}
            </div>

            <ActionButtons restaurant={{...restaurant, slug}} />
          </div>
        </div>

        <div style={{ height: 1, background: '#e8e4dc', marginBottom: 48 }} />

        {/* Fatos */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: '#111' }}>fatos</h2>
            <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#bbb' }}>01 / informações</span>
          </div>

          <div style={{ border: '1px solid #e8e4dc', borderRadius: 6, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'hidden' }}>
            {[
              { label: 'ENDEREÇO',     value: restaurant.address,             note: null },
              { label: 'CAPACIDADE',   value: `${restaurant.capacity} lugares`, note: restaurant.capacityNote },
              { label: 'TICKET MÉDIO', value: restaurant.ticketAvg,             note: restaurant.ticketNote },
              { label: 'CONTATO',      value: restaurant.phone,                 note: restaurant.phoneNote },
            ].map((item, i) => (
              <div key={i} style={{ padding: '20px 20px 24px', borderRight: i < 3 ? '1px solid #e8e4dc' : 'none' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#bbb', marginBottom: 12 }}>{item.label}</p>
                <p style={{ fontSize: 15, color: '#111', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.value}</p>
                {item.note && <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{item.note}</p>}
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#e8e4dc', marginBottom: 48 }} />

        {/* Menu */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: '#111' }}>destaques do cardápio</h2>
            <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#bbb' }}>02 / três pratos</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {restaurant.menu.map((item: any, i: number) => (
              <MenuCard key={i} item={item} />
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#e8e4dc', marginBottom: 48 }} />

        {/* Sobre & Horários */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, color: '#111' }}>sobre & horários</h2>
            <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#bbb' }}>03 / contexto</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
            <div>
              {restaurant.longDescription.map((p: string, i: number) => (
                <p key={i} style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 20 }}>{p}</p>
              ))}
            </div>
            <div>
              {restaurant.schedule.map((item: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < restaurant.schedule.length - 1 ? '1px solid #f0ece4' : 'none',
                  fontWeight: item.highlight ? 500 : 400,
                  color: item.highlight ? '#111' : item.hours === 'fechado' ? '#ccc' : '#555',
                }}>
                  <span style={{ fontSize: 13 }}>{item.day}</span>
                  <span style={{ fontSize: 13 }}>{item.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}