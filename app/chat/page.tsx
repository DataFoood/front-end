'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useEffect, useRef, useState, type FormEvent, type Ref } from 'react'
import { RequireAuth } from '@/components/RequireAuth'
import { RestaurantCard } from '@/components/RestaurantCard'
import { Avatar, Logo, Spinner } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { firstName } from '@/lib/format'
import type { ChatSummary, Conversation, ChatMessage as Message, SearchResult, User } from '@/lib/types'
import { usePaginated } from '@/lib/usePaginated'
import { useAuth } from '../context/AuthContext'
import { useFavoritesCount } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'

const RESULTS_SHOWN = 3
const RESULTS_FETCHED = 6

type AssistantContent = Extract<Message, { role: 'assistant' }>['content']

const SUGGESTIONS = [
  'Um lugar tranquilo para um jantar',
  'Almoço executivo no centro',
  'Café com Wi-Fi para trabalhar',
  'Comemoração de aniversário com amigos',
  'Happy hour com chope e petiscos',
]

// As conversas ficam na conta (/api/chats/): seguem a pessoa entre
// navegadores e são apagadas junto com a conta. Antes ficavam no
// localStorage — a cópia antiga é importada uma vez e removida.
const legacyKey = (userId: number) => `datafood.chats.${userId}`

// uma importação por conta, mesmo com o efeito rodando duas vezes (StrictMode)
// ou duas abas abertas na mesma página: sem isso a conversa entrava em dobro
const importing = new Map<number, Promise<boolean>>()

function importLegacyChats(userId: number): Promise<boolean> {
  if (!importing.has(userId)) importing.set(userId, doImport(userId))
  return importing.get(userId)!
}

async function doImport(userId: number): Promise<boolean> {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(legacyKey(userId))
  } catch {
    return false
  }
  if (!raw) return false
  // tira do storage antes de enviar: outra aba que abra agora não reimporta
  try {
    window.localStorage.removeItem(legacyKey(userId))
  } catch {
    /* noop */
  }
  try {
    const chats = (JSON.parse(raw) as { title: string; messages: Message[]; updatedAt: number }[]).slice(0, 30)
    // mais antiga primeiro: a ordem do servidor (updated_at) fica igual à de antes
    for (const chat of chats.sort((a, b) => a.updatedAt - b.updatedAt)) {
      await api('/api/chats/', { method: 'POST', body: { title: chat.title.slice(0, 120) || 'Conversa', messages: chat.messages } }).catch(() => undefined)
    }
  } catch {
    /* cópia corrompida: descarta */
  }
  return true
}

function introFor(query: string, count: number) {
  if (count === 0) return `Não encontrei lugares para "${query}". Tente descrever de outro jeito — ocasião, comida ou clima.`
  if (count === 1) return `Encontrei um lugar que combina com "${query}".`
  return `${count === RESULTS_SHOWN ? 'Três' : count} opções que combinam com "${query}", da mais alinhada para a menos.`
}

// memo: o histórico inteiro fica montado; mensagens antigas não re-renderizam
// quando chega uma nova ou quando o "buscando…" liga/desliga
const AssistantBubble = memo(function AssistantBubble({ content, query }: { content: AssistantContent; query: string }) {
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
        <div className="rounded-2xl rounded-tl-xs border border-line bg-white px-4 py-3 text-sm leading-relaxed text-ink-600">
          {content.message}
          {content.unavailable && (
            <>
              {' '}
              <Link href="/explorar" className="text-rust underline">
                explore a lista de restaurantes
              </Link>
              .
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
        <p className="mb-4 text-sm leading-relaxed text-ink-700">{introFor(query, Math.min(content.results.length, RESULTS_SHOWN))}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r, i) => (
            <RestaurantCard key={r.restaurant.id} restaurant={r.restaurant} match={r.match} index={i} />
          ))}
        </div>
        {!expanded && content.results.length > RESULTS_SHOWN && (
          <button onClick={() => setExpanded(true)} className="mt-3 text-xs text-ink-350 underline hover:text-ink">
            Ver mais {content.results.length - RESULTS_SHOWN} opções
          </button>
        )}
      </div>
    </div>
  )
})

/** Campo de busca com estado próprio: digitar não re-renderiza o histórico. */
function Composer({ onSend, disabled, inputRef }: { onSend: (text: string) => void; disabled: boolean; inputRef: Ref<HTMLInputElement> }) {
  const [input, setInput] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSend(input)
    setInput('')
  }

  return (
    <form onSubmit={onSubmit} className="px-4 pb-5 pt-2 sm:px-8 sm:pb-7">
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-full border border-line-warm bg-white py-2 pl-5 pr-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={500}
          placeholder="Descreva o momento…"
          aria-label="Descreva o momento"
          className="min-w-0 flex-1 bg-transparent text-sm outline-hidden"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Buscar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink transition disabled:bg-ink-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  )
}

/** Filtro da lista lateral: estado próprio + espera o usuário parar de digitar. */
function ChatFilter({ onChange }: { onChange: (q: string) => void }) {
  const [value, setValue] = useState('')
  useEffect(() => {
    const t = setTimeout(() => onChange(value.trim()), 250)
    return () => clearTimeout(t)
  }, [value, onChange])
  return (
    <input value={value} onChange={e => setValue(e.target.value)} placeholder="Procurar conversas" aria-label="Procurar conversas" className="w-full bg-transparent text-[13px] outline-hidden" />
  )
}

function ChatApp({ user }: { user: User }) {
  const router = useRouter()
  const toast = useToast()
  const { logout } = useAuth()
  const savedCount = useFavoritesCount()

  const [filter, setFilter] = useState('')
  const chats = usePaginated<ChatSummary>('/api/chats/', { q: filter }, 20)
  // conversa aberta: id (null = nova, ainda não salva) + mensagens
  const [active, setActive] = useState<Conversation | null>(null)
  const [opening, setOpening] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  // desktop começa com a sidebar aberta
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { reload } = chats
  useEffect(() => {
    importLegacyChats(user.id).then(imported => imported && reload())
  }, [user.id, reload])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, loading])

  const closeOnMobile = () => {
    if (!window.matchMedia('(min-width: 1024px)').matches) setSidebarOpen(false)
  }

  const newChat = () => {
    setActive(null)
    closeOnMobile()
    inputRef.current?.focus()
  }

  const openChat = async (id: number) => {
    closeOnMobile()
    if (active?.id === id) return
    setOpening(id)
    try {
      setActive(await api<Conversation>(`/api/chats/${id}/`))
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível abrir a conversa.'))
    } finally {
      setOpening(null)
    }
  }

  const deleteChat = async (id: number) => {
    try {
      await api(`/api/chats/${id}/`, { method: 'DELETE' })
      chats.update(items => items.filter(c => c.id !== id))
      if (active?.id === id) setActive(null)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  /** grava a conversa na conta (cria na 1ª troca, depois atualiza) */
  const persist = async (conversation: Conversation): Promise<Conversation> => {
    const body = { title: conversation.title, messages: conversation.messages }
    try {
      const saved = conversation.id
        ? await api<Conversation & ChatSummary>(`/api/chats/${conversation.id}/`, { method: 'PATCH', body: { messages: body.messages } })
        : await api<Conversation & ChatSummary>('/api/chats/', { method: 'POST', body })
      // sobe para o topo da lista lateral sem buscar a lista de novo
      const summary: ChatSummary = { id: saved.id, title: saved.title, created_at: saved.created_at, updated_at: saved.updated_at }
      chats.update(items => [summary, ...items.filter(c => c.id !== saved.id)])
      return saved
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível salvar a conversa.'))
      return conversation
    }
  }

  const send = async (raw: string) => {
    const query = raw.trim()
    if (!query || loading) return

    const base: Conversation = active ?? { id: null, title: query.slice(0, 120), messages: [] }
    const withQuestion: Conversation = { ...base, messages: [...base.messages, { role: 'user', text: query }] }
    setActive(withQuestion)
    setLoading(true)

    let answer: Message
    try {
      const data = await api<{ results: SearchResult[] }>('/api/search/', {
        method: 'POST',
        body: { query, limit: RESULTS_FETCHED },
      })
      answer = { role: 'assistant', content: { kind: 'results', results: data.results } }
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      const message =
        status === 503
          ? 'A busca inteligente está indisponível neste momento. Tente de novo em instantes ou'
          : status === 429
            ? 'Você fez muitas buscas seguidas. Respire um pouco e tente novamente em alguns segundos.'
            : err instanceof ApiError
              ? err.message
              : 'Não consegui buscar agora. Verifique sua conexão.'
      answer = { role: 'assistant', content: { kind: 'error', message, unavailable: status === 503 } }
    }

    const finished: Conversation = { ...withQuestion, messages: [...withQuestion.messages, answer] }
    setActive(finished)
    setLoading(false)
    const saved = await persist(finished)
    // a pessoa pode ter trocado de conversa enquanto salvava
    setActive(current => (current === finished ? { ...finished, id: saved.id } : current))
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream">
      {/* overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-white transition-transform duration-300 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
        aria-label="Conversas"
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <Logo size={30} />
          <button onClick={() => setSidebarOpen(false)} className="rounded-sm p-1.5 text-ink-250 hover:bg-cream hover:text-ink" aria-label="Fechar painel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        </div>

        <div className="px-3">
          <button onClick={newChat} className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-ink-700 hover:bg-cream">
            <span className="text-base">+</span> Nova busca
          </button>
          <div className="mb-4 flex items-center gap-2 px-2 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-250" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <ChatFilter onChange={setFilter} />
          </div>
          <p className="mb-2 px-2 text-[10px] tracking-[0.1em] text-ink-200">RECENTES</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {chats.loading && <Spinner className="mx-2 h-4 w-4" />}
          {!chats.loading && chats.items.length === 0 && (
            <p className="px-2 text-xs text-ink-200">{filter ? 'Nenhuma conversa com esse título.' : 'Suas buscas aparecem aqui.'}</p>
          )}
          {chats.items.map(chat => (
            <div key={chat.id} className={`group flex items-center rounded-md ${active?.id === chat.id ? 'bg-line-soft' : 'hover:bg-cream'}`}>
              <button onClick={() => openChat(chat.id)} className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[13px] text-ink-800">
                {opening === chat.id ? <Spinner className="h-3 w-3" /> : chat.title}
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                aria-label={`Excluir conversa ${chat.title}`}
                className="mr-1.5 rounded-sm p-1 text-ink-200 opacity-100 hover:text-error lg:opacity-0 lg:group-hover:opacity-100"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                </svg>
              </button>
            </div>
          ))}
          {chats.hasMore && (
            <button onClick={chats.loadMore} disabled={chats.loadingMore} className="mb-3 px-2.5 py-2 text-[12px] text-ink-350 underline hover:text-ink">
              {chats.loadingMore ? <Spinner className="h-3 w-3" /> : 'Carregar mais'}
            </button>
          )}
        </div>

        <nav className="border-t border-line px-3 py-3 text-[13px]" aria-label="Atalhos">
          <Link href="/explorar" className="block rounded-sm px-2 py-1.5 text-ink-600 hover:bg-cream">Explorar restaurantes</Link>
          <Link href="/salvos" className="flex items-center justify-between rounded-sm px-2 py-1.5 text-ink-600 hover:bg-cream">
            Salvos {savedCount > 0 && <span className="rounded-full bg-rust px-1.5 text-[10px] font-bold text-white">{savedCount}</span>}
          </Link>
          {user.role !== 'customer' && (
            <Link href="/painel" className="block rounded-sm px-2 py-1.5 text-ink-600 hover:bg-cream">Meu restaurante</Link>
          )}
        </nav>

        <div className="border-t border-line p-4">
          <Link href="/perfil" className="flex items-center gap-2.5 rounded-md p-1 hover:bg-cream">
            <Avatar name={user.name} url={user.avatar_url} size={32} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink-800">{user.name}</p>
              <p className="truncate text-[10px] text-ink-250">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={async () => {
              await logout()
              router.push('/login')
            }}
            className="mt-2 px-1 text-[11px] text-ink-200 hover:text-error"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-10 flex items-center rounded-md border border-line bg-white px-2 py-1.5 text-ink-500"
            aria-label="Abrir conversas"
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
              <h1 className="mb-4 max-w-xl font-serif text-[clamp(32px,5vw,56px)] leading-[1.15]">Olá, {firstName(user.name)}.</h1>
              <p className="mb-10 text-[15px] leading-relaxed text-ink-350">
                Descreva o momento — ocasião, companhia, vibe.
                <br />O DataFood cuida do resto.
              </p>
              <div className="flex max-w-2xl flex-wrap justify-center gap-2.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-line-warm-strong px-5 py-2.5 text-[13px] text-ink-700 transition hover:border-ink-300 hover:bg-white">
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
                    <div className="max-w-[80%] rounded-2xl rounded-br-xs bg-ink px-4 py-3 text-sm leading-relaxed text-white">{msg.text}</div>
                    <Avatar name={user.name} url={user.avatar_url} size={28} />
                  </div>
                ) : (
                  <AssistantBubble key={i} content={msg.content} query={active.messages[i - 1]?.role === 'user' ? (active.messages[i - 1] as { text: string }).text : ''} />
                ),
              )}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink">
                    <div className="h-2 w-2 rounded-full bg-rust" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-line bg-white px-4 py-3.5" aria-label="Buscando">
                    {[0, 1, 2].map(j => (
                      <span key={j} className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-200" />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <Composer onSend={send} disabled={loading} inputRef={inputRef} />
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
