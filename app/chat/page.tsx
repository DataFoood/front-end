'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { memo, Suspense, useEffect, useEffectEvent, useRef, useState, type FormEvent, type Ref } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Coffee, Fish, Pizza, Search, Sparkles } from 'lucide-react'
import { RequireAuth } from '@/components/RequireAuth'
import { RecommendationDialog } from '@/components/RecommendationDialog'
import { Avatar, Logo, PageLoader, Spinner } from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { firstName } from '@/lib/format'
import type { ChatSummary, Conversation, ChatMessage as Message, User } from '@/lib/types'
import { usePaginated } from '@/lib/usePaginated'
import { useAuth } from '../context/AuthContext'
import { useFavoritesCount } from '../context/FavoritesContext'
import { useToast } from '../context/ToastContext'

type AssistantContent = Extract<Message, { role: 'assistant' }>['content']

const SUGGESTIONS = [
  'Quero pizza',
  'Quero sushi',
  'Quero café',
]
const SUGGESTION_ICONS = [Pizza, Fish, Coffee]

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
  return `Encontrei ${count} opções para "${query}". Você pode ver as recomendações ou continuar refinando a busca.`
}

// memo: o histórico inteiro fica montado; mensagens antigas não re-renderizam
// quando chega uma nova ou quando o "buscando…" liga/desliga
const AssistantBubble = memo(function AssistantBubble({ content, query, conversationId, messageIndex, onFollowUp, busy }: {
  content: AssistantContent; query: string; conversationId: number | null; messageIndex: number
  onFollowUp?: (text: string) => void; busy?: boolean
}) {
  const dot = (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-peach text-rust">
      <Sparkles size={15} aria-hidden />
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

  const count = content.count ?? content.results.length
  return (
    <div className="flex animate-fade-in items-start gap-3">
      {dot}
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-line text-sm leading-7 text-ink-700">{content.answer ?? content.notice ?? introFor(query, count)}</p>
        {count > 0 && (
          <RecommendationDialog count={count} conversationId={conversationId} messageIndex={messageIndex}
            initialRestaurants={content.results.map(result => result.restaurant)} />
        )}
        {content.limited && <p className="mt-2 text-xs text-muted">Selecionei até 50 opções. Continue a conversa para encontrar algo mais específico.</p>}
        {content.personalized && <p className="mt-3 text-xs leading-relaxed text-rust">{content.personalization_note ?? 'Personalizado com o contexto que você autorizou na sua conta.'}</p>}
        {onFollowUp && Array.isArray(content.suggestions) && content.suggestions.length > 0 && (
          <div role="group" aria-label="Continuar a conversa" className="mt-4 flex flex-wrap gap-2">
            {content.suggestions.filter((text): text is string => typeof text === 'string').slice(0, 3).map(text => (
              <button key={text} type="button" disabled={busy} onClick={() => onFollowUp(text)} className="rounded-full border border-line-warm-strong bg-white px-4 py-2.5 text-xs text-ink-700 transition hover:border-rust disabled:opacity-50">
                {text}
              </button>
            ))}
          </div>
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
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-[24px] border border-line-warm bg-paper py-2.5 pl-5 pr-2.5 shadow-xl shadow-rust-deep/5 transition focus-within:border-rust/50 focus-within:ring-4 focus-within:ring-rust/5">
        <Sparkles size={18} className="hidden shrink-0 text-rust sm:block" aria-hidden />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={500}
          placeholder="Descreva o momento…"
          aria-label="Descreva o momento"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-hidden placeholder:text-ink-350"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Buscar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rust text-white transition hover:-translate-y-0.5 hover:bg-rust-dark disabled:bg-ink-100 disabled:text-muted"
        >
          <ArrowUpRight size={20} aria-hidden />
        </button>
      </div>
      <p className="mt-3 text-center text-[10px] text-muted">Seu jeito de falar. Novas formas de descobrir.</p>
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

function ChatApp({ user, initialQuery }: { user: User; initialQuery: string }) {
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
  const sending = useRef(false)
  const initialSent = useRef(false)
  const reduced = useReducedMotion()

  const { reload } = chats
  useEffect(() => {
    importLegacyChats(user.id).then(imported => imported && reload())
  }, [user.id, reload])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }, [active?.messages.length, loading, reduced])

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

  const send = async (raw: string) => {
    const query = raw.trim()
    if (!query || sending.current) return
    sending.current = true

    const base: Conversation = active ?? { id: null, title: query.slice(0, 120), messages: [] }
    const withQuestion: Conversation = { ...base, messages: [...base.messages, { role: 'user', text: query }] }
    setActive(withQuestion)
    setLoading(true)

    try {
      const saved = await api<Conversation & ChatSummary>('/api/chats/respond/', {
        method: 'POST',
        body: { query, conversation_id: base.id },
      })
      const summary: ChatSummary = { id: saved.id, title: saved.title, created_at: saved.created_at, updated_at: saved.updated_at }
      chats.update(items => [summary, ...items.filter(c => c.id !== saved.id)])
      setActive(current => current === withQuestion ? saved : current)
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      const message =
        status === 503
          ? 'O assistente está indisponível neste momento. Tente novamente ou'
          : status === 429
            ? 'Você fez muitas buscas seguidas. Respire um pouco e tente novamente em alguns segundos.'
            : err instanceof ApiError
              ? err.message
              : 'Não consegui buscar agora. Verifique sua conexão.'
      const answer: Message = { role: 'assistant', content: { kind: 'error', message, unavailable: status === 503 } }
      setActive(current => current === withQuestion ? { ...withQuestion, messages: [...withQuestion.messages, answer] } : current)
    } finally {
      sending.current = false
      setLoading(false)
    }
  }

  const startQuery = useEffectEvent(() => { void send(initialQuery) })
  useEffect(() => {
    if (!initialQuery || initialSent.current) return
    initialSent.current = true
    startQuery()
  }, [initialQuery])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-cream">
      {/* overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-line-warm bg-paper transition-transform duration-300 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
        aria-label="Conversas"
        inert={!sidebarOpen}
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
          <button onClick={newChat} className="mb-3 mt-2 flex w-full items-center gap-2 rounded-xl bg-rust px-3.5 py-3 text-left text-[13px] font-medium text-white transition hover:bg-rust-dark">
            <Sparkles size={15} aria-hidden /> Nova busca
          </button>
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-line-warm px-3 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-250" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <ChatFilter onChange={setFilter} />
          </div>
          <p className="mb-3 px-2 text-xs font-medium text-muted">Suas conversas</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {chats.loading && <Spinner className="mx-2 h-4 w-4" />}
          {!chats.loading && chats.items.length === 0 && (
            <p className="px-2 text-xs text-ink-200">{filter ? 'Nenhuma conversa com esse título.' : 'Suas buscas aparecem aqui.'}</p>
          )}
          {chats.items.map(chat => (
            <div key={chat.id} className={`group mb-1 flex items-center rounded-xl transition-colors ${active?.id === chat.id ? 'bg-peach/60 text-rust-deep' : 'hover:bg-cream'}`}>
              <button onClick={() => openChat(chat.id)} aria-label={`Abrir conversa: ${chat.title}`} className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[13px] text-ink-800">
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
        <div className="absolute right-5 top-5 z-10 sm:right-8"><Link href="/explorar" className="inline-flex items-center gap-2 rounded-full border border-line-warm bg-paper/90 px-3.5 py-2 text-xs text-ink-600 backdrop-blur-md transition hover:border-rust/40"><Search size={13} aria-hidden /> Explorar <ArrowUpRight size={13} aria-hidden /></Link></div>
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
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center pb-6 pt-5 text-center">
              <div className="mb-6 flex h-16 w-16 -rotate-6 items-center justify-center rounded-[22px] bg-peach text-rust"><Sparkles size={28} strokeWidth={1.3} aria-hidden /></div>
              <p className="mb-3 text-sm text-rust">Olá, {firstName(user.name)}.</p>
              <h1 className="mb-5 max-w-xl font-serif text-[clamp(35px,4.5vw,60px)] leading-[1.1] tracking-[-0.04em]">Que momento<br />vamos viver hoje?</h1>
              <p className="mb-9 max-w-sm text-sm leading-7 text-ink-600">
                {user.level >= 2 ? 'Vamos encontrar uma opção que combine com você hoje.' : 'Conte a cidade, o tipo de comida ou o ambiente que procura.'}
              </p>
              {user.level >= 2 && (
                <div className="mb-6 w-full max-w-lg rounded-2xl border border-line-warm bg-paper px-6 py-5 text-left">
                  <h2 className="mb-2 font-serif text-xl">Seu gosto, seu ponto de partida</h2>
                  <p className="text-sm leading-relaxed text-ink-600">
                    {user.allow_info ? 'Suas preferências, favoritos e lugares acessados podem ajudar na escolha. O que você pedir nesta conversa vem primeiro.' : 'Autorize a personalização para considerar seus gostos. Você também pode conversar usando apenas o que pedir por aqui.'}
                  </p>
                  {user.allow_info && <button type="button" disabled={loading} onClick={() => send('Sugira algo pelos meus gostos')} className="btn-accent mt-4">Sugira algo pelos meus gostos</button>}
                  <Link href="/perfil?aba=privacidade" className="mt-3 block text-xs text-rust underline">{user.allow_info ? 'Ajustar meus gostos e minha privacidade' : 'Ativar personalização no perfil'}</Link>
                </div>
              )}
              <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = SUGGESTION_ICONS[i]
                  return <button key={s} onClick={() => send(s)} className="chat-suggestion group">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${i % 2 ? 'bg-sage text-olive' : 'bg-peach text-rust'}`}><Icon size={17} strokeWidth={1.5} aria-hidden /></span><span className="flex-1 text-[13px] leading-5">{s}</span><ArrowRight size={14} className="shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-rust" aria-hidden />
                  </button>
                })}
              </div>
            </m.div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-7">
              {active.messages.map((msg, i) =>
                msg.role === 'user' ? (
                  <div key={i} className="flex items-end justify-end gap-2.5">
                    <div className="max-w-[80%] animate-fade-in rounded-2xl rounded-br-sm bg-rust px-5 py-3.5 text-sm leading-relaxed text-white">{msg.text}</div>
                    <Avatar name={user.name} url={user.avatar_url} size={28} />
                  </div>
                ) : (
                  <AssistantBubble key={`${active.id ?? 'draft'}:${i}`} content={msg.content} conversationId={active.id} messageIndex={i} query={active.messages[i - 1]?.role === 'user' ? (active.messages[i - 1] as { text: string }).text : ''}
                    onFollowUp={i === active.messages.length - 1 ? send : undefined} busy={loading} />
                ),
              )}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-peach text-rust">
                    <Sparkles size={15} aria-hidden />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-line bg-paper px-4 py-3.5" aria-label="Pensando na sua busca" role="status">
                    <span className="mr-2 text-xs text-muted">Encontrando o seu lugar</span>
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

        <div className="mx-auto w-full max-w-4xl px-6 pb-2 text-xs leading-5 text-muted sm:px-10">
          {user.level >= 2 ? (user.allow_info ? 'Premium · Personalização autorizada. Seus pedidos vêm primeiro.' : 'Premium · Ative a personalização no perfil para usar seus gostos.') : 'Plano gratuito · Vamos refinar juntos, uma mensagem por vez.'}
        </div>
        <Composer onSend={send} disabled={loading} inputRef={inputRef} />
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <RequireAuth><Suspense fallback={<PageLoader />}><ChatWithUser /></Suspense></RequireAuth>
  )
}

function ChatWithUser() {
  const { user } = useAuth()
  const params = useSearchParams()
  return user ? <ChatApp user={user} initialQuery={(params.get('q') ?? '').trim().slice(0, 500)} /> : null
}
