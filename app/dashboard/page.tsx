'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { RESTAURANTS } from '../data/restaurants'
import Image from 'next/image'

/* ─── helpers ─────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rust)' }} />
      </div>
      <span style={{ fontSize: 14, color: '#888', fontWeight: 400, letterSpacing: '0.02em' }}>datafood</span>
    </div>
  )
}

function UserAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--rust)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
      <span style={{ fontSize: size * 0.36, color: '#fff', fontWeight: 600, lineHeight: 1 }}>{initials}</span>
    </div>
  )
}

/* ─── mock chart data generator ───────────────────────── */
function generateDailyData(days: number, base: number, trend = 1.04) {
  return Array.from({ length: days }, (_, i) => {
    const noise = 0.85 + Math.random() * 0.3
    return Math.round(base * Math.pow(trend, i) * noise)
  })
}

/* ─── Sparkline SVG ────────────────────────────────────── */
function Sparkline({ data, color = '#C0603A', height = 180, filled = true }: {
  data: number[]; color?: string; height?: number; filled?: boolean
}) {
  const w = 100, h = height
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h * 0.75) - h * 0.1
    return `${x},${y}`
  })
  const pathD = `M ${pts.join(' L ')}`
  const fillD = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      {filled && (
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {filled && <path d={fillD} fill="url(#grad)" />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* last dot */}
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill={color} />
    </svg>
  )
}

/* ─── Bar chart ────────────────────────────────────────── */
function HBarChart({ items }: { items: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...items.map(i => i.value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#333' }}>{item.label}</span>
            <span style={{ fontSize: 12, color: '#999' }}>{item.value}%</span>
          </div>
          <div style={{ height: 3, background: '#f0ece4', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: item.color || '#111',
              width: `${(item.value / max) * 100}%`,
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Metric card ──────────────────────────────────────── */
function MetricCard({ label, value, unit, delta, deltaLabel, blur }: {
  label: string; value: string; unit?: string; delta?: string; deltaLabel?: string; blur?: boolean
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: '20px 24px', flex: 1 }}>
      <p style={{ fontSize: 10, letterSpacing: '0.1em', color: '#bbb', marginBottom: 12 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, filter: blur ? 'blur(6px)' : 'none', userSelect: blur ? 'none' : 'auto' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: '#111', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: '#aaa' }}>{unit}</span>}
      </div>
      {delta && (
        <p style={{ fontSize: 11, color: delta.startsWith('+') ? '#38a169' : '#e53e3e', marginTop: 6, filter: blur ? 'blur(6px)' : 'none' }}>
          {delta} {deltaLabel}
        </p>
      )}
    </div>
  )
}

/* ─── Pill filter ──────────────────────────────────────── */
function Pill({ label, active, onRemove, onClick }: {
  label: string; active?: boolean; onRemove?: () => void; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        border: `1px solid ${active ? '#bbb' : '#ddd'}`,
        borderRadius: 20, padding: '5px 12px', fontSize: 12,
        color: '#444', background: active ? '#f5f5f5' : '#fff',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {label}
      {onRemove && (
        <span onClick={e => { e.stopPropagation(); onRemove() }} style={{ color: '#bbb', fontSize: 14, lineHeight: 1, cursor: 'pointer' }}>×</span>
      )}
    </div>
  )
}

/* ─── Insight card ─────────────────────────────────────── */
function InsightCard({ children, blur }: { children: React.ReactNode; blur?: boolean }) {
  return (
    <div style={{ borderLeft: '3px solid var(--rust)', background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: '20px 24px', filter: blur ? 'blur(4px)' : 'none', userSelect: blur ? 'none' : 'auto' }}>
      {children}
    </div>
  )
}

/* ─── Stat card ────────────────────────────────────────── */
function StatCard({ title, subtitle, value, unit, note, blur }: {
  title: string; subtitle: string; value: string; unit?: string; note: string; blur?: boolean
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: '24px 28px', flex: 1 }}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 11, color: '#bbb', marginBottom: 16 }}>{subtitle}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, filter: blur ? 'blur(6px)' : 'none' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#111' }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: '#aaa' }}>{unit}</span>}
      </div>
      <p style={{ fontSize: 11, color: '#aaa', marginTop: 8, filter: blur ? 'blur(4px)' : 'none' }}>{note}</p>
    </div>
  )
}

/* ─── Nav items ────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'visao', label: 'visão geral', icon: '◫' },
  { id: 'tendencias', label: 'tendências', icon: '⟋' },
  { id: 'horarios', label: 'horários de pico', icon: '◷' },
  { id: 'regioes', label: 'regiões', icon: '◎' },
]

/* ─── Dashboard ────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const isRestaurant = user?.type === 'restaurante'
  const restaurantData = isRestaurant && user.restaurantSlug ? RESTAURANTS[user.restaurantSlug] : null

  const [activeNav, setActiveNav] = useState('visao')
  const [period, setPeriod] = useState('últimos 7 dias')
  const [filters, setFilters] = useState<string[]>(['jantar'])
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)

  // generate stable chart data
  const dailyData = useRef(generateDailyData(14, isRestaurant ? 850 : 300, 1.03)).current
  const weeklyData = useRef(generateDailyData(7, isRestaurant ? 1200 : 500, 1.02)).current

  const periods = ['últimos 7 dias', 'últimos 14 dias', 'últimos 30 dias', 'este mês']

  const occasionData = [
    { label: 'jantar romântico', value: 38, color: 'var(--rust)' },
    { label: 'almoço executivo', value: 24, color: '#111' },
    { label: 'encontro com amigos', value: 18, color: '#111' },
    { label: 'celebração', value: 12, color: '#111' },
    { label: 'café / trabalho', value: 8, color: '#111' },
  ]

  const regionData = [
    { label: 'vila madalena', value: 34, color: 'var(--rust)' },
    { label: 'pinheiros', value: 28, color: '#111' },
    { label: 'itaim bibi', value: 19, color: '#111' },
    { label: 'jardins', value: 12, color: '#111' },
    { label: 'outros', value: 7, color: '#111' },
  ]

  const hourData = [6, 4, 3, 3, 4, 8, 14, 18, 22, 19, 16, 18, 22, 26, 24, 20, 18, 22, 38, 42, 36, 28, 18, 10]

  const blurAll = !isRestaurant

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--cream)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 160, background: '#0D0D0D', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '0 10px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="/imgs/logo1noBg.png"
              alt="datafood"
              width={50}
              height={50}
              style={{ objectFit: 'contain' }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em' }}>
              DATAFOOD
            </span>
          </div>
        </div>

        {/* Restaurant info */}
        {restaurantData && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
            <p style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{restaurantData.name}</p>
            <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{restaurantData.neighborhood} · sp</p>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38a169' }} />
              <span style={{ fontSize: 10, color: '#555' }}>{restaurantData.match}% match médio</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ padding: '16px 0', flex: 1 }}>
          <p style={{ fontSize: 9, letterSpacing: '0.12em', color: '#444', padding: '0 20px', marginBottom: 8 }}>DEMANDA</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', background: activeNav === item.id ? '#1a1a1a' : 'none',
                border: 'none', cursor: 'pointer', padding: '9px 20px',
                color: activeNav === item.id ? '#fff' : '#555',
                fontSize: 12, textAlign: 'left',
                borderLeft: activeNav === item.id ? '2px solid var(--rust)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </button>
          ))}

          <p style={{ fontSize: 9, letterSpacing: '0.12em', color: '#444', padding: '16px 20px 8px' }}>CONTA</p>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '9px 20px', color: '#555', fontSize: 12, textAlign: 'left' }}>
            configurações
          </button>
        </nav>

        {/* User / logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a1a' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <UserAvatar name={user.name} size={26} />
                <p style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0].toLowerCase()}
                </p>
              </div>
              <button
                onClick={() => { logout(); router.push('/login') }}
                style={{ fontSize: 11, color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e53e3e'}
                onMouseLeave={e => e.currentTarget.style.color = '#444'}
              >
                sair da conta →
              </button>
            </>
          ) : (
            <Link href="/login" style={{ fontSize: 11, color: '#444', textDecoration: 'none' }}>entrar →</Link>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e8e4dc', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 400, color: '#111', letterSpacing: '-0.01em' }}>
            {activeNav === 'visao' && 'visão geral'}
            {activeNav === 'tendencias' && 'tendências'}
            {activeNav === 'horarios' && 'horários de pico'}
            {activeNav === 'regioes' && 'regiões'}
          </h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/chat" style={{ fontSize: 12, color: '#888', border: '1px solid #e8e4dc', borderRadius: 4, padding: '7px 14px', textDecoration: 'none', background: '#fff' }}>
              ← voltar ao chat
            </Link>
            <button style={{ fontSize: 12, color: '#888', border: '1px solid #e8e4dc', borderRadius: 4, padding: '7px 14px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ↓ exportar
            </button>
            <button style={{ fontSize: 12, color: '#fff', background: '#111', border: 'none', borderRadius: 4, padding: '7px 14px', cursor: 'pointer' }}>
              compartilhar relatório
            </button>
          </div>
        </header>

        {/* Blur overlay for non-restaurant */}
        {!isRestaurant && (
          <div style={{ position: 'absolute', top: 52, left: 160, right: 0, bottom: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,240,232,0.7)', backdropFilter: 'blur(2px)' }}>
            <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 8, padding: '40px 48px', textAlign: 'center', maxWidth: 400 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--rust)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: '#111', marginBottom: 12 }}>
                inteligência de demanda
              </h2>
              <p style={{ fontSize: 14, color: '#777', lineHeight: 1.65, marginBottom: 28 }}>
                este dashboard está disponível para contas de restaurante. faça login com sua conta para acessar os dados da sua região.
              </p>
              <Link href="/login" style={{ display: 'inline-block', background: '#111', color: '#fff', padding: '12px 28px', borderRadius: 4, textDecoration: 'none', fontSize: 13 }}>
                entrar como restaurante
              </Link>
              <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>
                conta de teste: testerestaurante@datafood.com · Teste@123
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.08em' }}>FILTROS</span>

            {/* Period dropdown */}
            <div style={{ position: 'relative' }}>
              <Pill label={`${period} ▾`} active onClick={() => setShowPeriodMenu(p => !p)} />
              {showPeriodMenu && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, zIndex: 10, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                  {periods.map(p => (
                    <button key={p} onClick={() => { setPeriod(p); setShowPeriodMenu(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: period === p ? '#f5f5f5' : 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#333' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {restaurantData && (
              <Pill label={restaurantData.neighborhood} active onRemove={() => { }} />
            )}
            {filters.map(f => (
              <Pill key={f} label={f} active onRemove={() => setFilters(prev => prev.filter(x => x !== f))} />
            ))}
            <Pill label="+ adicionar" onClick={() => setFilters(prev => [...prev, 'almoço'])} />
          </div>

          {/* ── VISÃO GERAL ── */}
          {activeNav === 'visao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* KPIs */}
              <div style={{ display: 'flex', gap: 16 }}>
                <MetricCard label="CONSULTAS RELEVANTES" value={isRestaurant ? '12,847' : '—'} delta={isRestaurant ? '↑ 18.4%' : undefined} deltaLabel="vs período anterior" blur={blurAll} />
                <MetricCard label="JANTAR ROMÂNTICO" value={isRestaurant ? '38' : '—'} unit="%" delta={isRestaurant ? '↑ 4 pp' : undefined} deltaLabel="" blur={blurAll} />
                <MetricCard label="RAIO MÉDIO" value={isRestaurant ? '2.4' : '—'} unit="km" delta={isRestaurant ? '↓ 0.3 km' : undefined} deltaLabel="" blur={blurAll} />
                <MetricCard label="RESERVAS ATRIBUÍDAS" value={isRestaurant ? '412' : '—'} delta={isRestaurant ? '↑ 22.1%' : undefined} deltaLabel="" blur={blurAll} />
              </div>

              {/* Chart + occasions */}
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Line chart */}
                <div style={{ flex: 2, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: '24px' }}>
                  <p style={{ fontSize: 14, color: '#111', fontWeight: 400, marginBottom: 4 }}>demanda diária · últimos 14 dias</p>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>
                    {restaurantData ? `consultas que mencionam ${restaurantData.neighborhood} ou raio < 1km` : 'consultas por região e período'}
                  </p>
                  <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                    <Sparkline data={dailyData} height={160} />
                  </div>
                  {/* X axis */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    {['14d', '12d', '10d', '8d', '6d', '4d', '2d', 'hoje'].map(d => (
                      <span key={d} style={{ fontSize: 10, color: '#ccc' }}>{d}</span>
                    ))}
                  </div>
                </div>

                {/* Occasions */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: '24px' }}>
                  <p style={{ fontSize: 14, color: '#111', fontWeight: 400, marginBottom: 4 }}>perfil de ocasião</p>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>distribuição das buscas no período</p>
                  <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                    <HBarChart items={occasionData} />
                  </div>
                </div>
              </div>

              {/* Insight callout */}
              <div style={{ filter: blurAll ? 'blur(3px)' : 'none', userSelect: blurAll ? 'none' : 'auto' }}>
                <InsightCard>
                  <p style={{ fontSize: 15, color: '#333', lineHeight: 1.6 }}>
                    terças-feiras concentram{' '}
                    <span style={{ color: 'var(--rust)', fontWeight: 500 }}>38%</span>
                    {' '}das buscas por jantar romântico no{' '}
                    {restaurantData?.neighborhood || 'seu bairro'}
                    {' '}— pico entre 19h e 21h.
                  </p>
                  <p style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
                    fonte: datafood engine · janela 14d · n = {isRestaurant ? '12,847' : '—'} consultas
                  </p>
                </InsightCard>
              </div>

              {/* 3 stat cards */}
              <div style={{ display: 'flex', gap: 16 }}>
                <StatCard title="terças" subtitle="dia de pico" value={isRestaurant ? '+42' : '—'} unit="%" note="vs média semanal" blur={blurAll} />
                <StatCard title="19h – 21h" subtitle="janela de pico" value={isRestaurant ? '61' : '—'} unit="%" note="do volume diário" blur={blurAll} />
                <StatCard title={restaurantData?.neighborhood || 'seu bairro'} subtitle="bairro líder" value={isRestaurant ? '1.9' : '—'} unit="k" note="consultas no período" blur={blurAll} />
              </div>
            </div>
          )}

          {/* ── TENDÊNCIAS ── */}
          {activeNav === 'tendencias' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 24 }}>
                  <p style={{ fontSize: 14, color: '#111', marginBottom: 4 }}>volume semanal</p>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>últimas 7 semanas</p>
                  <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                    <Sparkline data={weeklyData} height={140} />
                  </div>
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 24 }}>
                  <p style={{ fontSize: 14, color: '#111', marginBottom: 4 }}>categorias em alta</p>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>crescimento vs período anterior</p>
                  <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                    <HBarChart items={[
                      { label: 'jantar romântico', value: 42, color: 'var(--rust)' },
                      { label: 'brunch', value: 31, color: '#111' },
                      { label: 'vegetariano', value: 28, color: '#111' },
                      { label: 'happy hour', value: 19, color: '#111' },
                    ]} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <MetricCard label="CRESCIMENTO MÉDIO" value={isRestaurant ? '+18' : '—'} unit="% / semana" blur={blurAll} />
                <MetricCard label="NOVA OCASIÃO DETECTADA" value={isRestaurant ? 'brunch' : '—'} delta={isRestaurant ? '↑ 31% nas últimas 2 semanas' : undefined} blur={blurAll} />
                <MetricCard label="TICKET MÉDIO BUSCADO" value={isRestaurant ? 'R$ 180' : '—'} delta={isRestaurant ? '↑ R$ 12 vs mês anterior' : undefined} blur={blurAll} />
              </div>
            </div>
          )}

          {/* ── HORÁRIOS DE PICO ── */}
          {activeNav === 'horarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 24 }}>
                <p style={{ fontSize: 14, color: '#111', marginBottom: 4 }}>distribuição de buscas por hora</p>
                <p style={{ fontSize: 11, color: '#bbb', marginBottom: 24 }}>média dos últimos 7 dias · todas as ocasiões</p>
                <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                  {/* Hour bar chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                    {hourData.map((v, i) => {
                      const max = Math.max(...hourData)
                      const isPeak = v === max || v > max * 0.85
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: '100%', background: isPeak ? 'var(--rust)' : '#e8e4dc', borderRadius: '2px 2px 0 0', height: `${(v / max) * 100}%`, transition: 'height 0.5s ease', minHeight: 3 }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    {['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'].map(h => (
                      <span key={h} style={{ fontSize: 10, color: '#ccc' }}>{h}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <StatCard title="pico principal" subtitle="horário com mais buscas" value={isRestaurant ? '20h' : '—'} note="42% do volume diário" blur={blurAll} />
                <StatCard title="segundo pico" subtitle="horário secundário" value={isRestaurant ? '13h' : '—'} note="26% do volume diário" blur={blurAll} />
                <StatCard title="janela morta" subtitle="menor volume" value={isRestaurant ? '4h' : '—'} note="< 1% das consultas" blur={blurAll} />
              </div>
            </div>
          )}

          {/* ── REGIÕES ── */}
          {activeNav === 'regioes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 24 }}>
                  <p style={{ fontSize: 14, color: '#111', marginBottom: 4 }}>bairros com mais buscas</p>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>para {restaurantData?.cuisine || 'sua categoria'} no período</p>
                  <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                    <HBarChart items={regionData} />
                  </div>
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e8e4dc', borderRadius: 6, padding: 24 }}>
                  <p style={{ fontSize: 14, color: '#111', marginBottom: 4 }}>raio de deslocamento</p>
                  <p style={{ fontSize: 11, color: '#bbb', marginBottom: 20 }}>distância que os usuários percorrem</p>
                  <div style={{ filter: blurAll ? 'blur(4px)' : 'none' }}>
                    <HBarChart items={[
                      { label: 'até 1km', value: 44, color: 'var(--rust)' },
                      { label: '1–3km', value: 32, color: '#111' },
                      { label: '3–7km', value: 18, color: '#111' },
                      { label: '7km+', value: 6, color: '#111' },
                    ]} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <MetricCard label="BAIRRO LÍDER" value={isRestaurant ? restaurantData?.neighborhood.split(' ')[0] || 'v. madalena' : '—'} delta={isRestaurant ? '34% das buscas no período' : undefined} blur={blurAll} />
                <MetricCard label="RAIO MÉDIO" value={isRestaurant ? '2.4' : '—'} unit="km" delta={isRestaurant ? '↓ 0.3 km vs período anterior' : undefined} blur={blurAll} />
                <MetricCard label="ALCANCE POTENCIAL" value={isRestaurant ? '48k' : '—'} delta={isRestaurant ? 'usuários únicos no raio de 5km' : undefined} blur={blurAll} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
