'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--cream)', borderBottom: '1px solid transparent'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--rust)'
          }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, letterSpacing: '0.02em', color: '#111' }}>
            datafood
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <a href="#como-funciona" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>como funciona</a>
          <a href="#restaurantes" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>para restaurantes</a>
          <a href="#manifesto" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>manifesto</a>
          <Link href="/chat" style={{
            fontSize: 13, background: '#0D0D0D', color: '#fff',
            padding: '9px 20px', borderRadius: 24, textDecoration: 'none',
            fontWeight: 400, letterSpacing: '0.01em'
          }}>
            abrir o app
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 48px 100px', maxWidth: 700 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#999', marginBottom: 24, fontWeight: 400 }}>
          DATAFOOD · GASTRONOMIC INTELLIGENCE
        </p>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(48px, 7vw, 80px)',
          lineHeight: 1.05, fontWeight: 400, color: '#111', marginBottom: 28
        }}>
          o jantar começa antes<br />
          do{' '}
          <em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>cardápio</em>.
        </h1>
        <p style={{ fontSize: 16, color: '#555', lineHeight: 1.65, maxWidth: 340, marginBottom: 40 }}>
          descreva o momento — uma terça tranquila, um aniversário, um almoço de negócios. datafood encontra o lugar certo.
        </p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/chat" style={{
            background: '#0D0D0D', color: '#fff', padding: '14px 28px',
            borderRadius: 4, textDecoration: 'none', fontSize: 14, fontWeight: 400,
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            abrir o app →
          </Link>
          <Link href="/chat" style={{
            color: '#333', textDecoration: 'none', fontSize: 14,
            borderBottom: '1px solid #ccc', paddingBottom: 1
          }}>
            ver demonstração →
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" style={{ background: '#111', padding: '80px 48px' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 40px)',
          color: '#fff', fontWeight: 400, textAlign: 'center', marginBottom: 64
        }}>
          uma engine que entende o momento.
        </h2>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#555', marginBottom: 48 }}>
          01 / COMO FUNCIONA
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, maxWidth: 960, margin: '0 auto' }}>
          {[
            {
              num: '01',
              title: 'diga o momento',
              desc: 'uma frase basta. "um lugar tranquilo para um jantar", "almoço executivo perto da paulista", "comemoração para seis pessoas".'
            },
            {
              num: '02',
              title: 'datafood interpreta',
              desc: 'nossa engine RAG cruza ocasião, vibe, bairro e horário com o histórico anônimo de descobertas que funcionaram para outras pessoas.'
            },
            {
              num: '03',
              title: 'três opções, nunca mais',
              desc: 'no máximo três restaurantes, ranqueados pela qualidade do encaixe — não pela publicidade. cada um vem com a razão da escolha.'
            }
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: 13, color: 'var(--rust)', marginBottom: 16, fontWeight: 500 }}>{item.num}</p>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#fff', fontWeight: 400, marginBottom: 12 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7 }}>{item.desc}</p>
              <div style={{ width: 32, height: 1, background: '#333', marginTop: 24 }} />
            </div>
          ))}
        </div>
      </section>

      {/* FOR RESTAURANTS */}
      <section id="restaurantes" style={{ background: '#1A1A1A', padding: '80px 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#555', marginBottom: 32 }}>
              02 · PARA RESTAURANTES
            </p>
            <p style={{ fontSize: 18, color: '#ccc', lineHeight: 1.7, marginBottom: 32 }}>
              dados anônimos sobre o que os comensais procuram no seu bairro, em qual horário, com qual ocasião, nada pessoal — apenas o tecido de demanda da sua região.
            </p>
            <Link href="/dashboard" style={{
              background: 'transparent', border: '1px solid #444', color: '#fff',
              padding: '12px 24px', borderRadius: 4, fontSize: 14, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none'
            }}>
              conhecer o intelligence →
            </Link>
          </div>

          <div style={{
            background: '#0D0D0D', border: '1px solid #2a2a2a', borderRadius: 8,
            padding: 32
          }}>
            <p style={{ fontSize: 10, letterSpacing: '0.14em', color: '#555', marginBottom: 20 }}>INSIGHT DA SEMANA</p>
            <p style={{ fontSize: 16, color: '#ccc', lineHeight: 1.6, marginBottom: 28 }}>
              terças concentram{' '}
              <span style={{ color: 'var(--rust)', fontWeight: 500 }}>38%</span>{' '}
              das buscas por jantar romântico em vila madalena.
            </p>
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <p style={{ fontSize: 28, color: 'var(--rust)', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>12.8k</p>
                <p style={{ fontSize: 11, color: '#555', marginTop: 4 }}>consultas / 7d</p>
              </div>
              <div>
                <p style={{ fontSize: 28, color: 'var(--rust)', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>+18%</p>
                <p style={{ fontSize: 11, color: '#555', marginTop: 4 }}>vs período anterior</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" style={{ background: 'var(--cream)', padding: '100px 48px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#999', marginBottom: 20 }}>03 / PLANOS</p>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 48px)',
            color: '#111', fontWeight: 400, textAlign: 'center', marginBottom: 64
          }}>
            escolha o nível de leitura.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                tier: 'ESSENCIAL',
                price: 'R$ 89',
                period: '/mês',
                desc: 'para restaurantes começando a entender sua demanda local.',
                features: ['insights semanais do bairro', 'até 100 consultas / mês', 'dashboard básico'],
                bg: '#C0603A'
              },
              {
                tier: 'INTELLIGENCE',
                price: 'R$ 249',
                period: '/mês',
                desc: 'para quem quer ler o tecido de demanda em tempo real.',
                features: ['insights diários', 'consultas ilimitadas', 'alertas de tendências', 'API de demanda'],
                bg: '#A84E2A'
              },
              {
                tier: 'SIGNATURE',
                price: 'R$ 590',
                period: '/mês',
                desc: 'para grupos e operações multi-unidade que decidem com dados.',
                features: ['tudo do intelligence', 'relatórios por unidade', 'consultor dedicado', 'modelos sob medida'],
                bg: '#8B3E20'
              }
            ].map((plan, i) => (
              <div key={i} style={{
                background: plan.bg, borderRadius: 8, padding: '36px 28px',
                display: 'flex', flexDirection: 'column'
              }}>
                <p style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                  {plan.tier}
                </p>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 40, color: '#fff', fontWeight: 400 }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 28 }}>
                  {plan.desc}
                </p>
                <ul style={{ listStyle: 'none', marginBottom: 32, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 10,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <span style={{ fontSize: 10 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{
                  background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff',
                  padding: '12px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.2s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.25)')}
                >
                  começar agora →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="manifesto" style={{ background: 'var(--cream)', padding: '80px 48px 120px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(22px, 3vw, 32px)', color: '#333', lineHeight: 1.55, fontWeight: 400 }}>
            nosso objetivo é oferecer às pessoas uma forma simples de encontrar os lugares perfeitos para viver os momentos que desejam.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #ddd', padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rust)' }} />
          <span style={{ fontSize: 13, color: '#666' }}>datafood © 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" style={{ fontSize: 12, color: '#999', textDecoration: 'none' }}>privacidade · LGPD</a>
          <a href="#" style={{ fontSize: 12, color: '#999', textDecoration: 'none' }}>termos</a>
          <a href="#" style={{ fontSize: 12, color: '#999', textDecoration: 'none' }}>contato</a>
        </div>
      </footer>
    </div>
  )
}
