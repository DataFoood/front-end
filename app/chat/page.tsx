'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { slugify } from '../data/restaurants'
import { useAuth } from '../context/AuthContext'
import Image from 'next/image'

interface Restaurant {
  name: string
  neighborhood: string
  cuisine: string
  price: string
  match: number
  description: string
  illustration: 'bowl' | 'glass' | 'plate'
}

interface AssistantMessage {
  type: 'restaurants'
  intro: string
  restaurants: Restaurant[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string | AssistantMessage
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

const INITIAL_CHATS: Chat[] = [
  { id: '1', title: 'jantar romântico em pinheiros', messages: [] },
  { id: '2', title: 'almoço rápido vila madalena', messages: [] },
  { id: '3', title: 'café para reunião — itaim', messages: [] },
  { id: '4', title: 'happy hour com amigos', messages: [] },
  { id: '5', title: 'brunch domingo de manhã', messages: [] },
]

const SUGGESTIONS = [
  'um lugar tranquilo para um jantar',
  'almoço executivo perto da paulista',
  'café com wifi para trabalhar',
  'comemoração de aniversário, 6 pessoas',
  'vegetariano romântico',
]

const MOCK_RESULTS: Record<string, AssistantMessage> = {
  default: {
    type: 'restaurants',
    intro: 'três opções para uma noite tranquila — todas com mesas espaçadas e iluminação baixa.',
    restaurants: [
      {
        name: 'tuju',
        neighborhood: 'vila madalena',
        cuisine: 'contemporâneo',
        price: '$$$$',
        match: 96,
        description: 'iluminação baixa, mesas espaçadas. carta de vinhos curada por sommelier.',
        illustration: 'bowl'
      },
      {
        name: 'a casa do porco',
        neighborhood: 'centro',
        cuisine: 'brasileiro',
        price: '$$$',
        match: 91,
        description: 'ambiente íntimo no segundo andar, luz quente. reservar com antecedência.',
        illustration: 'glass'
      },
      {
        name: 'evvai',
        neighborhood: 'jardins',
        cuisine: 'italiano',
        price: '$$$$',
        match: 88,
        description: 'salão pequeno, atendimento atento. cozinha de autor.',
        illustration: 'plate'
      }
    ]
  },
  cafe: {
    type: 'restaurants',
    intro: 'três cafés com boa conexão e ambiente para trabalhar durante horas.',
    restaurants: [
      {
        name: 'coffee lab',
        neighborhood: 'vila madalena',
        cuisine: 'café especialidade',
        price: '$$',
        match: 94,
        description: 'wifi rápido, tomadas em todas as mesas. silêncio respeitado pela galera.',
        illustration: 'glass'
      },
      {
        name: 'nespresso boutique',
        neighborhood: 'itaim',
        cuisine: 'café',
        price: '$$$',
        match: 89,
        description: 'espaço amplo, luz natural, atendimento discreto. perfeito para reuniões.',
        illustration: 'bowl'
      },
      {
        name: 'madreselva',
        neighborhood: 'pinheiros',
        cuisine: 'café e bistrô',
        price: '$$',
        match: 85,
        description: 'jardim interno, mesas separadas, playlist baixa. bolo de cenoura excepcional.',
        illustration: 'plate'
      }
    ]
  },
  aniversario: {
    type: 'restaurants',
    intro: 'três lugares para celebrar com seis pessoas — com espaço, boa comida e memória.',
    restaurants: [
      {
        name: 'charco',
        neighborhood: 'pinheiros',
        cuisine: 'contemporâneo',
        price: '$$$',
        match: 97,
        description: 'mesa longa disponível, chef presente na sala. experiência gastronômica completa.',
        illustration: 'plate'
      },
      {
        name: 'chou',
        neighborhood: 'jardins',
        cuisine: 'francês',
        price: '$$$$',
        match: 92,
        description: 'salão intimista com reserva de ambiente privativo para grupos.',
        illustration: 'glass'
      },
      {
        name: 'banzeiro',
        neighborhood: 'itaim',
        cuisine: 'amazônico',
        price: '$$$',
        match: 87,
        description: 'cardápio único com ingredientes raros. experiência que o grupo não vai esquecer.',
        illustration: 'bowl'
      }
    ]
  }
}

function getResponse(text: string): AssistantMessage {
  const lower = text.toLowerCase()
  if (lower.includes('café') || lower.includes('wifi') || lower.includes('trabalhar')) return MOCK_RESULTS.cafe
  if (lower.includes('aniversário') || lower.includes('seis') || lower.includes('6 pessoas')) return MOCK_RESULTS.aniversario
  return MOCK_RESULTS.default
}

// SVG illustrations for each card
function IllustrationBowl() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Steam lines */}
      <path d="M130 60 Q125 45 130 30" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M150 55 Q145 38 150 22" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M170 60 Q165 45 170 30" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bowl shadow */}
      <ellipse cx="150" cy="158" rx="68" ry="10" fill="#1a1a1a" />
      {/* Bowl */}
      <ellipse cx="150" cy="130" rx="60" ry="18" fill="#C0603A" />
      <path d="M90 130 Q90 175 150 175 Q210 175 210 130" fill="#C0603A" />
      {/* Bowl rim shine */}
      <ellipse cx="150" cy="130" rx="60" ry="18" fill="none" stroke="#d4704a" strokeWidth="1" />
    </svg>
  )
}

function IllustrationGlass() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Floating dots */}
      <circle cx="80" cy="80" r="4" fill="#8B7355" opacity="0.6" />
      <circle cx="220" cy="110" r="3" fill="#8B7355" opacity="0.5" />
      <circle cx="60" cy="130" r="2.5" fill="#8B7355" opacity="0.4" />
      <circle cx="235" cy="70" r="2" fill="#8B7355" opacity="0.4" />
      {/* Stem */}
      <line x1="150" y1="155" x2="150" y2="175" stroke="#C0603A" strokeWidth="2" />
      {/* Base */}
      <ellipse cx="150" cy="175" rx="28" ry="5" fill="#C0603A" />
      {/* Glass body */}
      <path d="M122 80 Q118 130 138 155 L162 155 Q182 130 178 80 Z" fill="#C0603A" />
      {/* Glass top ellipse */}
      <ellipse cx="150" cy="80" rx="28" ry="6" fill="#d4704a" />
      {/* Glass shine */}
      <path d="M126 95 Q124 120 130 145" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function IllustrationPlate() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Outer plate */}
      <ellipse cx="150" cy="130" rx="80" ry="22" fill="#1e1e1e" />
      <ellipse cx="150" cy="126" rx="80" ry="22" fill="#2a2a2a" />
      {/* Plate rim */}
      <ellipse cx="150" cy="122" rx="80" ry="22" fill="none" stroke="#333" strokeWidth="1" />
      {/* Inner plate */}
      <ellipse cx="150" cy="120" rx="60" ry="16" fill="#C0603A" />
      {/* Food dots */}
      <circle cx="145" cy="118" r="8" fill="#8B3E20" />
      <circle cx="158" cy="121" r="5" fill="#2d7a3a" opacity="0.9" />
      <circle cx="140" cy="124" r="3.5" fill="#d4704a" />
    </svg>
  )
}

function RestaurantCard({ restaurant, index }: { restaurant: Restaurant; index: number }) {
  const illustrations: Record<Restaurant['illustration'], React.ReactNode> = {
    bowl: <IllustrationBowl />,
    glass: <IllustrationGlass />,
    plate: <IllustrationPlate />
  }

  const slug = slugify(restaurant.name)

  return (
    <Link
      href={`/restaurante/${slug}`}
      style={{
        display: 'block',
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #e8e4dc',
        animation: `fadeIn 0.5s ease ${index * 0.12}s both`,
        flex: '1 1 0',
        minWidth: 0,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#bbb'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#e8e4dc'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Illustration area */}
      <div style={{
        background: '#111', height: 180,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {illustrations[restaurant.illustration]}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{
            fontFamily: 'var(--font-serif)', fontSize: 20,
            fontWeight: 400, color: '#111'
          }}>
            {restaurant.name}
          </span>
          <span style={{ fontSize: 12, color: '#C0603A', fontWeight: 500 }}>
            {restaurant.match}% match
          </span>
        </div>

        <p style={{ fontSize: 12, color: '#999', marginBottom: 14, lineHeight: 1.5 }}>
          {restaurant.neighborhood} · {restaurant.cuisine} · {restaurant.price}
        </p>

        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65 }}>
          {restaurant.description}
        </p>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 4, color: '#C0603A', fontSize: 12 }}>
          <span>ver detalhes</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </div>
      </div>
    </Link>
  )
}

function AssistantRestaurantMessage({ data }: { data: AssistantMessage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, animation: 'fadeIn 0.4s ease' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: '#111',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C0603A' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.65, marginBottom: 18 }}>
          {data.intro}
        </p>
        <div style={{ display: 'flex', gap: 14 }}>
          {data.restaurants.map((r, i) => (
            <RestaurantCard key={i} restaurant={r} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(c => c.id === activeChatId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages])

  const startNewChat = () => {
    const id = Date.now().toString()
    setChats(prev => [{ id, title: 'novo chat', messages: [] }, ...prev])
    setActiveChatId(id)
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setInput('')

    let chatId = activeChatId
    if (!chatId) {
      chatId = Date.now().toString()
      setChats(prev => [{ id: chatId!, title: text.slice(0, 40), messages: [] }, ...prev])
      setActiveChatId(chatId)
    }

    const userMsg: Message = { role: 'user', content: text }

    setChats(prev => prev.map(c =>
      c.id === chatId
        ? {
          ...c,
          title: c.title === 'novo chat' ? text.slice(0, 40) : c.title,
          messages: [...c.messages, userMsg]
        }
        : c
    ))

    setLoading(true)
    await new Promise(r => setTimeout(r, 1600))

    const response = getResponse(text)
    const assistantMsg: Message = { role: 'assistant', content: response }

    setChats(prev => prev.map(c =>
      c.id === chatId
        ? { ...c, messages: [...c.messages, assistantMsg] }
        : c
    ))
    setLoading(false)
  }

  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--cream)', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        overflow: 'hidden',
        transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#fff',
        borderRight: '1px solid #e8e4dc',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px 12px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            {/* Always show datafood logo — not user info */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
              <Image
                src="/imgs/logo1noBg.png"
                alt="datafood"
                width={50}
                height={50}
                style={{ objectFit: 'contain' }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#111', letterSpacing: '0.02em' }}>
                DATAFOOD
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4, borderRadius: 4, display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>

          <button onClick={startNewChat} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', borderRadius: 6, marginBottom: 4, color: '#444', fontSize: 13, textAlign: 'left' }}>
            <span style={{ fontSize: 16 }}>+</span> novo chat
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 16 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="procurar chats" style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#444', width: '100%' }} />
          </div>

          <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#bbb', marginBottom: 8, paddingLeft: 4 }}>RECENTES</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredChats.map(chat => (
              <button key={chat.id} onClick={() => setActiveChatId(chat.id)} style={{ background: activeChatId === chat.id ? '#f0ece4' : 'none', border: 'none', cursor: 'pointer', borderRadius: 6, padding: '8px 10px', textAlign: 'left', width: '100%', fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chat.title}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f0ece4' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Avatar + name + email — clickable → dashboard if restaurant */}
              <div
                onClick={() => user.type === 'restaurante' ? router.push('/dashboard') : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: user.type === 'restaurante' ? 'pointer' : 'default', borderRadius: 6, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (user.type === 'restaurante') e.currentTarget.style.background = '#f8f5f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                title={user.type === 'restaurante' ? 'abrir dashboard' : undefined}
              >
                {/* Avatar with initials */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.type === 'restaurante' ? 'var(--rust)' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>
                    {user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{ fontSize: 13, color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: 10, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.type === 'restaurante' ? '⚡ ver dashboard →' : user.email}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => { logout(); router.push('/login') }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 11, padding: '4px 4px', textAlign: 'left', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e53e3e'}
                onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                sair da conta
              </button>
            </div>
          ) : (
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#555', fontSize: 13, padding: '8px 4px', whiteSpace: 'nowrap' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              minha conta
            </Link>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', top: 20, left: 16, zIndex: 10, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>
          </button>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '48px 32px' }}>
          {!activeChat || activeChat.messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, color: '#111', lineHeight: 1.15, marginBottom: 16, maxWidth: 560 }}>
                Encontre o lugar perfeito para o momento
              </h1>
              <p style={{ fontSize: 15, color: '#888', marginBottom: 40 }}>
                descreva o momento — ocasião, companhia, vibe.<br />datafood cuida do resto.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 700 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{ background: 'none', border: '1px solid #d4cfc7', borderRadius: 24, padding: '10px 20px', fontSize: 13, color: '#444', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
              {activeChat.messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: '70%', background: '#111', color: '#fff', padding: '12px 18px', borderRadius: '18px 18px 4px 18px', fontSize: 14, lineHeight: 1.65 }}>
                        {msg.content as string}
                      </div>
                    </div>
                  ) : (
                    <AssistantRestaurantMessage data={msg.content as AssistantMessage} />
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C0603A' }} />
                  </div>
                  <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '4px 18px 18px 18px', display: 'flex', gap: 6, alignItems: 'center', border: '1px solid #e8e4dc' }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#bbb' }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 32px 28px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 32, border: '1px solid #e0dbd2', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e8e4dc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#bbb' }} />
            </div>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="pergunte ao datafood..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#333' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? '#111' : '#ddd', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
