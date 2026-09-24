'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { RequireAuth } from '@/components/RequireAuth'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Avatar, Logo } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { firstName } from '@/lib/format'
import type { SearchResult, User } from '@/lib/types'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'

const RESULTS_SHOWN = 3
const RESULTS_FETCHED = 6

type AssistantContent =
  | { kind: 'results'; results: SearchResult[] }
  | { kind: 'error'; message: string; unavailable?: boolean }

interface Message {
  role: 'user' | 'assistant'
  text?: string
  content?: AssistantContent
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  updatedAt: number
}

const SUGGESTIONS = [
  'um lugar tranquilo para um jantar',
  'almoço executivo no centro',
  'café com wifi para trabalhar',
  'comemoração de aniversário com amigos',
  'happy hour com chopp e petiscos',
]

// conversas ficam só neste navegador (por usuário). O histórico de buscas no
// servidor existe apenas com consentimento LGPD e aparece no perfil.
const now = () => Date.now()

const storageKey = (userId: number) => `datafood.chats.${userId}`

function loadChats(userId: number): Chat[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as Chat[]) : []
  } catch {
    return []
  }
}

function saveChats(userId: number, chats: Chat[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(chats.slice(0, 30)))
  } catch {
    /* storage cheio/indisponível: conversa segue só em memória */
  }
}

function introFor(query: string, count: number) {
  if (count === 0) return `não encontrei lugares para "${query}". tente descrever de outro jeito — ocasião, comida ou clima.`
  if (count === 1) return `encontrei um lugar que combina com "${query}".`
  return `${count === RESULTS_SHOWN ? 'três' : count} opções que combinam com "${query}", da mais alinhada para a menos.`
}

function AssistantBubble({ content, query }: { content: AssistantContent; query: string }) {
  const [expanded, setExpanded] = useState(false)
  const dot = (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink">
      <div className="h-2 w-2 rounded-full bg-rust" />
    </div>
  )

  if (content.kind === 'error') {
    return (
      <div className="flex animate-fade-in items-start gap-3">
        {dot}
        <div className="rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-3 text-sm leading-relaxed text-[#555]">
          {content.message}
          {content.unavailable && (
            <>
              {' '}
              <Link href="/explorar" className="text-rust underline">
                explorar a lista de restaurantes
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  const visible = expanded ? content.results : content.results.slice(0, RESULTS_SHOWN)
  return (
    <div className="flex animate-fade-in items-start gap-3">
      {dot}
      <div className="min-w-0 flex-1">
        <p className="mb-4 text-sm leading-relaxed text-[#444]">{introFor(query, Math.min(content.results.length, RESULTS_SHOWN))}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r, i) => (
            <RestaurantCard key={r.restaurant.id} restaurant={r.restaurant} match={r.match} index={i} />
          ))}
        </div>
        {!expanded && content.results.length > RESULTS_SHOWN && (
          <button onClick={() => setExpanded(true)} className="mt-3 text-xs text-[#888] underline hover:text-ink">
            ver mais {content.results.length - RESULTS_SHOWN} opções
          </button>
        )}
      </div>
    </div>
  )
}

function ChatApp({ user }: { user: User }) {
  const router = useRouter()
  const { logout } = useAuth()
  const { count: savedCount } = useFavorites()

  // ChatApp só renderiza no cliente (depois do RequireAuth), então dá pra ler o storage direto
  const [chats, setChats] = useState<Chat[]>(() => loadChats(user.id))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  // desktop começa com a sidebar aberta
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const persist = useCallback(
    (updater: (prev: Chat[]) => Chat[]) =>
      setChats(prev => {
        const next = updater(prev)
        saveChats(user.id, next)
        return next
      }),
    [user.id],
  )

  const active = chats.find(c => c.id === activeId)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, loading])

  const closeOnMobile = () => {
    if (!window.matchMedia('(min-width: 1024px)').matches) setSidebarOpen(false)
  }

  const newChat = () => {
    setActiveId(null)
    closeOnMobile()
    inputRef.current?.focus()
  }

  const deleteChat = (id: string) => {
    persist(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const send = async (raw: string) => {
    const query = raw.trim()
    if (!query || loading) return
    setInput('')

    let chatId = activeId
    if (!chatId) {
      chatId = crypto.randomUUID()
      const created: Chat = { id: chatId, title: query.slice(0, 48), messages: [], updatedAt: now() }
      persist(prev => [created, ...prev])
      setActiveId(chatId)
    }
    const id = chatId
    const append = (msg: Message) =>
      persist(prev =>
        prev
          .map(c => (c.id === id ? { ...c, messages: [...c.messages, msg], updatedAt: now() } : c))
          .sort((a, b) => b.updatedAt - a.updatedAt),
      )

    append({ role: 'user', text: query })
    setLoading(true)
    try {
      const data = await api<{ results: SearchResult[] }>('/api/search/', {
        method: 'POST',
        body: { query, limit: RESULTS_FETCHED },
      })
      append({ role: 'assistant', content: { kind: 'results', results: data.results } })
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      const message =
        status === 503
          ? 'a busca inteligente está indisponível neste momento. tente de novo em instantes ou'
          : status === 429
            ? 'você fez muitas buscas seguidas. respire um pouco e tente novamente em alguns segundos.'
            : err instanceof ApiError
              ? err.message
              : 'não consegui buscar agora. verifique sua conexão.'
      append({ role: 'assistant', content: { kind: 'error', message, unavailable: status === 503 } })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  const visibleChats = chats.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream">
      {/* overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-white transition-transform duration-300 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
        aria-label="conversas"
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <Logo size={30} />
          <button onClick={() => setSidebarOpen(false)} className="rounded p-1.5 text-[#aaa] hover:bg-cream hover:text-ink" aria-label="fechar painel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        </div>

        <div className="px-3">
          <button onClick={newChat} className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-[#444] hover:bg-cream">
            <span className="text-base">+</span> nova busca
          </button>
          <div className="mb-4 flex items-center gap-2 px-2 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="procurar conversas" aria-label="procurar conversas" className="w-full bg-transparent text-[13px] outline-none" />
          </div>
          <p className="mb-2 px-2 text-[10px] tracking-[0.1em] text-[#bbb]">RECENTES</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {visibleChats.length === 0 && <p className="px-2 text-xs text-[#bbb]">suas buscas aparecem aqui.</p>}
          {visibleChats.map(chat => (
            <div key={chat.id} className={`group flex items-center rounded-md ${activeId === chat.id ? 'bg-[#f0ece4]' : 'hover:bg-cream'}`}>
              <button
                onClick={() => {
                  setActiveId(chat.id)
                  closeOnMobile()
                }}
                className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[13px] text-[#333]"
              >
                {chat.title}
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                aria-label={`excluir conversa ${chat.title}`}
                className="mr-1.5 rounded p-1 text-[#bbb] opacity-100 hover:text-[#e53e3e] lg:opacity-0 lg:group-hover:opacity-100"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <nav className="border-t border-line px-3 py-3 text-[13px]" aria-label="atalhos">
          <Link href="/explorar" className="block rounded px-2 py-1.5 text-[#555] hover:bg-cream">explorar restaurantes</Link>
          <Link href="/salvos" className="flex items-center justify-between rounded px-2 py-1.5 text-[#555] hover:bg-cream">
            salvos {savedCount > 0 && <span className="rounded-full bg-rust px-1.5 text-[10px] font-bold text-white">{savedCount}</span>}
          </Link>
          {user.role !== 'customer' && (
            <Link href="/painel" className="block rounded px-2 py-1.5 text-[#555] hover:bg-cream">meu restaurante</Link>
          )}
        </nav>

        <div className="border-t border-line p-4">
          <Link href="/perfil" className="flex items-center gap-2.5 rounded-md p-1 hover:bg-cream">
            <Avatar name={user.name} url={user.avatar_url} size={32} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#333]">{user.name}</p>
              <p className="truncate text-[10px] text-[#aaa]">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={async () => {
              await logout()
              router.push('/login')
            }}
            className="mt-2 px-1 text-[11px] text-[#bbb] hover:text-[#e53e3e]"
          >
            sair da conta
          </button>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-10 flex items-center rounded-md border border-line bg-white px-2 py-1.5 text-[#666]"
            aria-label="abrir conversas"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-16 sm:px-8 lg:pt-12">
          {!active || active.messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center text-center">
              <h1 className="mb-4 max-w-xl font-serif text-[clamp(32px,5vw,56px)] leading-[1.15]">olá, {firstName(user.name).toLowerCase()}.</h1>
              <p className="mb-10 text-[15px] leading-relaxed text-[#888]">
                descreva o momento — ocasião, companhia, vibe.
                <br />
                datafood cuida do resto.
              </p>
              <div className="flex max-w-2xl flex-wrap justify-center gap-2.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-[#d4cfc7] px-5 py-2.5 text-[13px] text-[#444] transition hover:border-[#999] hover:bg-white">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-7">
              {active.messages.map((msg, i) =>
                msg.role === 'user' ? (
                  <div key={i} className="flex items-end justify-end gap-2.5">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm leading-relaxed text-white">{msg.text}</div>
                    <Avatar name={user.name} url={user.avatar_url} size={28} />
                  </div>
                ) : (
                  <AssistantBubble key={i} content={msg.content!} query={active.messages[i - 1]?.text ?? ''} />
                ),
              )}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink">
                    <div className="h-2 w-2 rounded-full bg-rust" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-3.5" aria-label="buscando">
                    {[0, 1, 2].map(j => (
                      <span key={j} className="typing-dot h-1.5 w-1.5 rounded-full bg-[#bbb]" />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="px-4 pb-5 pt-2 sm:px-8 sm:pb-7">
          <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-full border border-[#e0dbd2] bg-white py-2 pl-5 pr-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={500}
              placeholder="descreva o momento…"
              aria-label="descreva o momento"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="buscar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink transition disabled:bg-[#ddd]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <RequireAuth>
      <ChatWithUser />
    </RequireAuth>
  )
}

function ChatWithUser() {
  const { user } = useAuth()
  return user ? <ChatApp user={user} /> : null
}
