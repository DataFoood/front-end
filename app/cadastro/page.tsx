'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

export default function CadastroPage() {
  const [form, setForm] = useState({
    nome: '', sobrenome: '', email: '', senha: '', cidade: 'são paulo, sp'
  })
  const [accepted, setAccepted] = useState(true)
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    window.location.href = '/chat'
  }

  const cidades = [
    'são paulo, sp', 'rio de janeiro, rj', 'belo horizonte, mg',
    'curitiba, pr', 'porto alegre, rs', 'brasília, df',
    'salvador, ba', 'recife, pe', 'fortaleza, ce', 'manaus, am'
  ]

  const inputStyle = {
    width: '100%', border: '1px solid #ddd', borderRadius: 4,
    padding: '14px 16px', fontSize: 14, background: '#fff',
    outline: 'none', color: '#333', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* LEFT PANEL */}
      <div style={{
        flex: 1, background: '#0D0D0D', position: 'relative',
        display: 'flex', flexDirection: 'column', padding: '40px 48px',
        overflow: 'hidden'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
          <Image
            src="/imgs/logo2noBg.png"
            alt="datafood"
            width={75}
            height={75}
            style={{ objectFit: 'contain' }}
          />
          <span style={{ fontSize: 26, fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em' }}>
            DATAFOOD
          </span>
        </Link>

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', bottom: -80, right: -60,
          width: 440, height: 440, borderRadius: '50%',
          border: '1px solid #1e1e1e', opacity: 0.7
        }} />
        <div style={{
          position: 'absolute', bottom: -170, right: -150,
          width: 620, height: 620, borderRadius: '50%',
          border: '1px solid #181818', opacity: 0.5
        }} />

        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 300, color: '#fff', lineHeight: 1.15
          }}>
            uma conta.<br />
            infinitos{' '}
            <span style={{ color: 'var(--rust)', fontWeight: 400 }}>jantares</span><br />
            certos.
          </h1>
        </div>

        <p style={{ fontSize: 11, color: '#3a3a3a' }}>
          privacidade por design · LGPD compliant · datafood © 2026
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: 580, background: 'var(--cream)', display: 'flex',
        flexDirection: 'column', padding: '60px 64px',
        overflowY: 'auto'
      }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#aaa', marginBottom: 24 }}>
          CRIAR CONTA
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 4vw, 52px)',
          fontWeight: 400, color: '#111', lineHeight: 1.1, marginBottom: 16
        }}>
          comece pelo<br />momento certo.
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.65, marginBottom: 40 }}>
          leva menos de um minuto. você pode usar datafood sem conta — mas com uma, salvamos suas preferências.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Nome / Sobrenome */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>NOME</label>
              <input
                type="text" value={form.nome} onChange={e => update('nome', e.target.value)}
                placeholder="ana" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#999'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>SOBRENOME</label>
              <input
                type="text" value={form.sobrenome} onChange={e => update('sobrenome', e.target.value)}
                placeholder="moraes" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#999'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>E-MAIL</label>
            <input
              type="email" value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="ana@email.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#999'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>SENHA</label>
            <input
              type="password" value={form.senha} onChange={e => update('senha', e.target.value)}
              placeholder="mínimo 8 caracteres" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#999'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
              use ao menos 8 caracteres, com letras e números.
            </p>
          </div>

          {/* Cidade */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>CIDADE</label>
            <select
              value={form.cidade} onChange={e => update('cidade', e.target.value)}
              style={{
                ...inputStyle, appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                cursor: 'pointer'
              }}
            >
              {cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              onClick={() => setAccepted(!accepted)}
              style={{
                width: 18, height: 18, borderRadius: 3, flexShrink: 0, marginTop: 1,
                background: accepted ? '#111' : 'transparent',
                border: `2px solid ${accepted ? '#111' : '#ccc'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              {accepted && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              aceito os{' '}
              <a href="#" style={{ textDecoration: 'underline', color: '#333' }}>termos de uso</a>
              {' '}e a{' '}
              <a href="#" style={{ textDecoration: 'underline', color: '#333' }}>política de privacidade</a>
              . concordo com o uso anônimo dos meus dados para melhorar recomendações.
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !accepted}
            style={{
              width: '100%', background: '#0D0D0D', color: '#fff', border: 'none',
              padding: '16px', borderRadius: 4, fontSize: 14, cursor: loading || !accepted ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)', opacity: loading || !accepted ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'criando conta...' : 'criar conta'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 24 }}>
          já tem conta?{' '}
          <Link href="/login" style={{ color: '#111', textDecoration: 'underline' }}>
            entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
