'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Check, Coffee, Heart, MapPin, MessageCircle, Search, Sparkles, Utensils, Wine } from 'lucide-react'
import { CardGrid, RestaurantCard } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { Reveal } from '@/components/Motion'
import { api } from '@/lib/api'
import type { Paginated, RestaurantCard as Card } from '@/lib/types'
import { useAuth } from './context/AuthContext'

const MOMENTS = [
  { title: 'Uma pausa, um café.', subtitle: 'Para desacelerar', query: 'Um café aconchegante para conversar e relaxar', image: '/images/coffee-moment.webp', icon: Coffee },
  { title: 'Só mais um brinde.', subtitle: 'Para celebrar', query: 'Um restaurante para comemorar com amigos e tomar um vinho', image: '/images/restaurant-mood.webp', icon: Wine },
  { title: 'Mesa para dois.', subtitle: 'Para se encontrar', query: 'Um jantar romântico com massas e ambiente tranquilo', image: '/images/fresh-pasta.webp', icon: Heart },
]

function MomentSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const submit = (event: FormEvent) => {
    event.preventDefault()
    router.push(query.trim() ? `/chat?q=${encodeURIComponent(query.trim())}` : '/chat')
  }
  return (
    <form onSubmit={submit} className="mt-9 max-w-lg rounded-2xl border border-line-warm bg-paper p-2 shadow-xl shadow-rust-deep/5 transition focus-within:border-rust/50 focus-within:ring-4 focus-within:ring-rust/5 sm:rounded-full">
      <div className="flex items-center gap-2 pl-3">
        <Search size={19} className="shrink-0 text-rust" aria-hidden />
        <input value={query} onChange={event => setQuery(event.target.value)} maxLength={500} aria-label="Que momento você quer viver?"
          placeholder="Um jantar tranquilo a dois…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-ink-350" />
        <button type="submit" aria-label="Encontrar meu lugar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rust text-white transition hover:rotate-[-8deg] hover:bg-rust-dark active:scale-95">
          <ArrowUpRight size={21} aria-hidden />
        </button>
      </div>
    </form>
  )
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 55])
  return (
    <section ref={ref} className="section-wrap relative pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
        <div className="relative z-10">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-rust/15 bg-peach/50 px-3.5 py-2 text-xs text-rust-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-rust" /> Bons lugares. Melhores momentos.
          </m.div>
          <h1 className="font-serif text-[clamp(49px,6.8vw,86px)] leading-[1.04] tracking-[-0.055em]">
            {['A vida acontece', 'ao redor', 'da mesa.'].map((line, index) => (
              <span className="block overflow-hidden pb-2" key={line}>
                <m.span className="block" initial={{ y: '110%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.16 + index * 0.11 }}>{line}</m.span>
              </span>
            ))}
          </h1>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.6 }}>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-ink-600">Um encontro, uma comemoração ou só aquela vontade. Descreva seu momento e descubra onde vivê-lo.</p>
            <MomentSearch />
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-rust" aria-hidden /> Uma busca que entende você</span>
              <Link href="/explorar" className="inline-flex items-center gap-1.5 text-ink-700 underline decoration-line-warm-strong underline-offset-4 transition hover:text-rust">Prefiro explorar <ArrowRight size={13} aria-hidden /></Link>
            </div>
          </m.div>
        </div>
        <m.div style={{ y: photoY }} className="relative mx-auto w-full max-w-[500px] pb-8 pl-5 sm:pl-9 lg:pb-12">
          <m.div initial={{ opacity: 0, scale: 0.94, rotate: 4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, delay: 0.3 }}
            className="relative aspect-[0.86] overflow-hidden rounded-t-[180px] rounded-b-[24px] bg-olive">
            <Image src="/images/shared-table.webp" alt="Pratos preparados na brasa, à mesa com acompanhamentos frescos" fill priority sizes="(max-width: 1023px) 90vw, 480px" className="object-cover" />
            <div className="photo-shade absolute inset-0" />
          </m.div>
          <m.div initial={{ opacity: 0, x: -30, rotate: -8 }} animate={{ opacity: 1, x: 0, rotate: -6 }} transition={{ delay: 0.75, duration: 0.8 }}
            whileHover={{ rotate: 0, y: -5 }} className="absolute -left-1 bottom-2 w-[40%] rounded-2xl bg-paper p-2.5 shadow-2xl shadow-ink/15 sm:-left-3">
            <div className="relative aspect-square overflow-hidden rounded-xl"><Image src="/images/fresh-pasta.webp" alt="Massa fresca com tomates e manjericão" fill sizes="190px" className="object-cover" /></div>
            <div className="flex items-center justify-between gap-1 px-1 pb-1 pt-3"><span className="text-xs font-medium">Deu vontade?</span><Heart size={15} className="text-rust" aria-hidden /></div>
          </m.div>
          <m.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: 'spring', bounce: 0.4 }}
            className="absolute -right-2 top-9 flex h-24 w-24 rotate-12 flex-col items-center justify-center rounded-full bg-butter text-center text-xs font-medium text-rust-deep shadow-sm sm:-right-5 sm:h-28 sm:w-28">
            <Sparkles size={21} strokeWidth={1.4} className="mb-1.5" aria-hidden /> Seu momento,<br />seu lugar.
          </m.div>
        </m.div>
      </div>
      <div className="mt-12 flex items-center justify-between border-t border-line-warm pt-6 text-xs text-muted lg:mt-16">
        <p className="max-w-[220px] sm:max-w-none">Menos tempo escolhendo. Mais tempo vivendo.</p>
        <a href="#momentos" className="flex items-center gap-2 text-ink-700">Vem descobrir <ArrowDown size={14} aria-hidden /></a>
      </div>
    </section>
  )
}

function Highlights() {
  const [items, setItems] = useState<Card[] | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    api<Paginated<Card>>('/api/restaurants/', { query: { ordering: 'rating', page_size: 3 }, signal: controller.signal })
      .then(data => setItems(data.results)).catch(error => { if (error.name !== 'AbortError') setItems([]) })
    return () => controller.abort()
  }, [])
  if (items?.length === 0) return null
  return (
    <section className="section-wrap py-20 sm:py-24">
      <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3">Vale conhecer</p><h2 className="section-heading">À sua próxima descoberta.</h2></div><Link href="/explorar" className="btn-ghost">Ver todos os restaurantes <ArrowUpRight size={17} aria-hidden /></Link></Reveal>
      <CardGrid>{items ? items.map((restaurant, index) => <RestaurantCard key={restaurant.id} restaurant={restaurant} index={index} />) : [0, 1, 2].map(index => <div key={index} aria-hidden className="h-96 animate-pulse rounded-2xl bg-cream-dark" />)}</CardGrid>
    </section>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader />
      <main>
        <Hero />
        <section id="momentos" className="bg-sage/60 py-16 sm:py-24">
          <div className="section-wrap">
            <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3 text-olive">Qual é o clima de hoje?</p><h2 className="section-heading">Tem lugar para todo momento.</h2></div><p className="max-w-xs text-sm leading-6 text-ink-600">Escolha uma inspiração.<br />A gente ajuda a encontrar o lugar.</p></Reveal>
            <div className="grid gap-5 sm:grid-cols-3">{MOMENTS.map(({ title, subtitle, query, image, icon: Icon }, index) => <Reveal key={title} delay={index * 0.08}>
              <Link href={`/chat?q=${encodeURIComponent(query)}`} className="group relative block aspect-[1.05] overflow-hidden rounded-2xl bg-olive sm:aspect-[0.85]">
                <Image src={image} alt="" fill sizes="(max-width: 639px) 90vw, 350px" className="photo-reveal object-cover" />
                <div className="photo-shade absolute inset-0" />
                <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md"><Icon size={18} strokeWidth={1.5} aria-hidden /></span>
                <div className="absolute inset-x-6 bottom-6 text-white"><p className="mb-2 text-xs text-white/80">{subtitle}</p><div className="flex items-center justify-between gap-3"><h3 className="font-serif text-[clamp(25px,2.7vw,34px)] leading-tight">{title}</h3><ArrowUpRight size={22} className="shrink-0 transition group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden /></div></div>
              </Link>
            </Reveal>)}</div>
          </div>
        </section>
        <section id="como-funciona" className="section-wrap py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1fr] lg:gap-24">
            <Reveal><p className="eyebrow mb-4">Parece conversa. É descoberta.</p><h2 className="section-heading max-w-md">Você traz a vontade.<br />A gente encontra a mesa.</h2><p className="mt-6 max-w-sm text-sm leading-7 text-ink-600">Não precisa saber o nome do restaurante. Basta saber o que você quer viver.</p><Link href="/chat" className="btn-accent mt-8">Descrever meu momento <Sparkles size={16} aria-hidden /></Link></Reveal>
            <div>{[
              { icon: MessageCircle, title: 'Conte o que está imaginando', text: '“Um lugar tranquilo, com comida boa e espaço para conversar.” Pode falar do seu jeito.' },
              { icon: MapPin, title: 'Descubra lugares que combinam', text: 'A busca entende o contexto e encontra opções para a ocasião, o ambiente e o seu gosto.' },
              { icon: Bookmark, title: 'Escolha. Salve. Viva o momento.', text: 'Veja os detalhes, guarde seus favoritos e fale diretamente com o restaurante.' },
            ].map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * 0.1} className="flex gap-5 border-b border-line-warm py-6 first:pt-0 last:border-0"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${index === 1 ? 'bg-sage text-olive' : 'bg-peach text-rust'}`}><Icon size={21} strokeWidth={1.5} aria-hidden /></span><div><h3 className="mb-2 text-base font-semibold">{title}</h3><p className="max-w-sm text-sm leading-7 text-ink-600">{text}</p></div></Reveal>)}</div>
          </div>
        </section>
        <div className="border-y border-line bg-paper"><Highlights /></div>
        <section id="restaurantes" className="section-wrap py-20 sm:py-28">
          <div className="overflow-hidden rounded-[28px] bg-olive text-white lg:grid lg:grid-cols-2">
            <div className="relative min-h-[300px] lg:min-h-[510px]"><Image src="/images/restaurant-mood.webp" alt="Um restaurante acolhedor com plantas, luz natural e mesas prontas para receber" fill sizes="(max-width: 1023px) 100vw, 560px" className="object-cover" /><div className="absolute bottom-6 left-6 rounded-2xl border border-white/25 bg-white/15 px-5 py-4 backdrop-blur-xl"><Utensils size={22} className="mb-2" aria-hidden /><p className="font-serif text-xl">Toda mesa tem uma história.</p></div></div>
            <Reveal className="flex flex-col justify-center p-8 sm:p-12"><p className="mb-5 text-xs text-white/70">Para quem recebe</p><h2 className="section-heading">Seu restaurante.<br />Novos encontros.</h2><p className="mb-7 mt-6 max-w-sm text-sm leading-7 text-white/80">Mostre o que torna seu lugar especial. Conecte-se com quem está procurando uma experiência como a sua.</p><ul className="mb-8 space-y-3 text-sm text-white/90">{['Seu cardápio, fotos e horários em um só lugar', 'Promoções para quem quer receber novidades', 'Resultados para acompanhar suas descobertas'].map(text => <li key={text} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-butter" aria-hidden />{text}</li>)}</ul><Link href={user ? '/painel' : '/cadastro?tipo=restaurante'} className="btn w-fit bg-butter text-ink hover:bg-white">{user ? 'Abrir meu painel' : 'Quero fazer parte'} <ArrowUpRight size={17} aria-hidden /></Link></Reveal>
          </div>
        </section>
        <section className="section-wrap pb-24 pt-2 text-center sm:pb-32"><Reveal><span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-peach text-rust"><Utensils size={22} strokeWidth={1.4} aria-hidden /></span><h2 className="mx-auto max-w-2xl font-serif text-[clamp(35px,5vw,62px)] leading-[1.15] tracking-[-0.04em]">O melhor da vida<br />não se pede para viagem.</h2><p className="mt-5 text-sm text-muted">Encontre um lugar. Crie uma boa história.</p><Link href="/explorar" className="btn-accent mt-8">Descobrir meu próximo lugar <ArrowRight size={17} aria-hidden /></Link></Reveal></section>
      </main>
      <SiteFooter />
    </div>
  )
}
