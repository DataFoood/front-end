'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CardGrid, RestaurantCard } from '@/components/RestaurantCard'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { api } from '@/lib/api'
import type { Paginated, RestaurantCard as Card } from '@/lib/types'
import heroImage from '../public/imgs/tst.svg'
import { useAuth } from './context/AuthContext'

const STEPS = [
  { num: '01', title: 'diga o momento', desc: 'uma frase basta. "um lugar tranquilo para um jantar", "almoço executivo no centro", "comemoração para seis pessoas".' },
  { num: '02', title: 'datafood interpreta', desc: 'nossa busca semântica entende ocasião, clima, comida e preço — e, se você permitir, aprende com o que você salva e visita.' },
  { num: '03', title: 'três opções, nunca mais', desc: 'poucos restaurantes, ranqueados pela qualidade do encaixe — não pela publicidade. cada um com o grau de match.' },
]

const PLANS = [
  { tier: 'ESSENCIAL', price: 'R$ 89', desc: 'para restaurantes começando a entender sua demanda local.', features: ['insights semanais do bairro', 'até 100 consultas / mês', 'dashboard básico'], bg: 'bg-rust' },
  { tier: 'INTELLIGENCE', price: 'R$ 249', desc: 'para quem quer ler o tecido de demanda em tempo real.', features: ['insights diários', 'consultas ilimitadas', 'alertas de tendências', 'API de demanda'], bg: 'bg-rust-dark' },
  { tier: 'SIGNATURE', price: 'R$ 590', desc: 'para grupos e operações multi-unidade que decidem com dados.', features: ['tudo do intelligence', 'relatórios por unidade', 'consultor dedicado', 'modelos sob medida'], bg: 'bg-[#8B3E20]' },
]

function Highlights() {
  const [items, setItems] = useState<Card[] | null>(null)
  useEffect(() => {
    api<Paginated<Card>>('/api/restaurants/', { query: { ordering: 'rating', page_size: 3 } })
      .then(d => setItems(d.results))
      .catch(() => setItems([]))
  }, [])
  if (!items || items.length === 0) return null
  return (
    <section className="px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">destaques</p>
            <h2 className="font-serif text-[clamp(28px,4vw,40px)]">bem avaliados agora.</h2>
          </div>
          <Link href="/explorar" className="text-sm text-rust underline">
            ver todos →
          </Link>
        </div>
        <CardGrid>
          {items.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} index={i} />
          ))}
        </CardGrid>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const appHref = user ? '/chat' : '/cadastro'

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-14 sm:px-8 md:flex-row md:items-end md:justify-between md:py-20">
        <section className="max-w-2xl">
          <p className="eyebrow mb-6">datafood · gastronomic intelligence</p>
          <h1 className="mb-7 font-serif text-[clamp(44px,7vw,80px)] leading-[1.05]">
            o jantar começa antes
            <br />
            do <em className="text-rust">cardápio</em>.
          </h1>
          <p className="mb-10 max-w-sm text-base leading-relaxed text-[#555]">
            descreva o momento — uma terça tranquila, um aniversário, um almoço de negócios. datafood encontra o lugar certo.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={appHref} className="rounded-lg bg-rust px-7 py-3.5 text-[13px] text-white hover:bg-rust-dark">
              {user ? 'abrir a busca →' : 'começar grátis →'}
            </Link>
            <Link href="/explorar" className="text-[13px] text-[#555] underline hover:text-ink">
              explorar restaurantes
            </Link>
          </div>
        </section>
        <Image src={heroImage} alt="" priority className="h-auto w-full max-w-sm rounded-lg object-cover md:max-w-md" />
      </div>

      <section id="como-funciona" className="bg-ink px-4 py-20 sm:px-8">
        <h2 className="mb-14 text-center font-serif text-[clamp(28px,4vw,40px)] text-white">uma engine que entende o momento.</h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-3">
          {STEPS.map(s => (
            <div key={s.num}>
              <p className="mb-4 text-[13px] font-medium text-rust">{s.num}</p>
              <h3 className="mb-3 font-serif text-xl text-white">{s.title}</h3>
              <p className="text-sm leading-relaxed text-[#888]">{s.desc}</p>
              <div className="mt-6 h-px w-8 bg-[#333]" />
            </div>
          ))}
        </div>
      </section>

      <Highlights />

      <section id="restaurantes" className="bg-dark-panel px-4 py-20 sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-8 text-[11px] tracking-[0.12em] text-[#666]">PARA RESTAURANTES</p>
            <p className="mb-8 text-lg leading-relaxed text-[#ccc]">
              cadastre seu restaurante, mantenha cardápio e horários em dia e acompanhe quantas pessoas visitam e salvam sua página. tudo agregado e anônimo — nada pessoal.
            </p>
            <Link href={user ? '/painel' : '/cadastro?tipo=restaurante'} className="inline-flex items-center gap-2 rounded-sm border border-[#444] px-6 py-3 text-sm text-white hover:border-[#777]">
              {user ? 'abrir meu painel →' : 'cadastrar meu restaurante →'}
            </Link>
          </div>
          <div className="rounded-lg border border-[#2a2a2a] bg-dark-bg p-8">
            <p className="mb-5 text-[10px] tracking-[0.14em] text-[#666]">NO SEU PAINEL</p>
            <ul className="flex flex-col gap-4 text-[15px] text-[#ccc]">
              {['visualizações da sua página', 'novos favoritos por dia', 'distribuição das notas', 'avaliações recentes'].map(t => (
                <li key={t} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-rust" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="planos" className="px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center font-serif text-[clamp(32px,4vw,48px)]">escolha o nível de leitura.</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PLANS.map(p => (
              <div key={p.tier} className={`${p.bg} flex flex-col rounded-lg px-7 py-9 transition hover:-translate-y-1.5 hover:shadow-xl`}>
                <p className="mb-6 text-[10px] tracking-[0.14em] text-white/60">{p.tier}</p>
                <p className="mb-2">
                  <span className="font-serif text-4xl text-white">{p.price}</span>
                  <span className="ml-1 text-xs text-white/60">/mês</span>
                </p>
                <p className="mb-7 text-[13px] leading-relaxed text-white/75">{p.desc}</p>
                <ul className="mb-8 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="mb-2.5 flex items-center gap-2 text-[13px] text-white/85">
                      <span className="text-[10px]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastro?tipo=restaurante" className="rounded-sm bg-black/25 py-3 text-center text-[13px] text-white hover:bg-black/40">
                  começar agora →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="manifesto" className="px-4 pb-28 pt-8 sm:px-8">
        <p className="mx-auto max-w-2xl text-center font-serif text-[clamp(22px,3vw,32px)] leading-relaxed text-[#333]">
          nosso objetivo é oferecer às pessoas uma forma simples de encontrar os lugares perfeitos para viver os momentos que desejam.
        </p>
      </section>

      <SiteFooter />
    </div>
  )
}
