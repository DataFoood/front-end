'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    window.location.href = '/chat'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* LEFT PANEL */}
      <div style={{
        flex: 1, background: '#0D0D0D', position: 'relative',
        display: 'flex', flexDirection: 'column', padding: '40px 48px',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rust)' }} />
          </div>
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 400 }}>shinzou</span>
        </div>

        {/* Decorative circle */}
        <div style={{
          position: 'absolute', bottom: -120, right: -80,
          width: 500, height: 500, borderRadius: '50%',
          border: '1px solid #1e1e1e', opacity: 0.6
        }} />
        <div style={{
          position: 'absolute', bottom: -200, right: -160,
          width: 650, height: 650, borderRadius: '50%',
          border: '1px solid #1a1a1a', opacity: 0.4
        }} />

        {/* Headline */}
        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 300, color: '#fff', lineHeight: 1.15
          }}>
            bem-vindo de<br />
            volta.<br />
            <span style={{ fontWeight: 300 }}>o que você está<br />
            com{' '}
            <span style={{ color: 'var(--rust)', fontWeight: 400 }}>vontade</span>
            {' '}hoje?</span>
          </h1>
        </div>

        {/* Footer */}
        <div>
          <p style={{ fontSize: 11, color: '#3a3a3a' }}>
            privacidade por design · LGPD compliant · datafood © 2026
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: 580, background: 'var(--cream)', display: 'flex',
        flexDirection: 'column', padding: '60px 64px',
        overflowY: 'auto'
      }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#aaa', marginBottom: 24, fontWeight: 500 }}>
          ENTRAR
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 4vw, 52px)',
          fontWeight: 400, color: '#111', lineHeight: 1.1, marginBottom: 20
        }}>
          seu lugar,<br />seu jeito.
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.65, marginBottom: 48, maxWidth: 380 }}>
          use sua conta shinzou para salvar lugares, ver seu histórico e receber sugestões cada vez mais precisas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>
              E-MAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%', border: '1px solid #ddd', borderRadius: 4,
                padding: '14px 16px', fontSize: 14, background: '#fff',
                outline: 'none', color: '#333', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#999'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>
              SENHA
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', border: '1px solid #ddd', borderRadius: 4,
                padding: '14px 16px', fontSize: 14, background: '#fff',
                outline: 'none', color: '#333', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#999'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <a href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>
                esqueceu a senha?
              </a>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', background: '#0D0D0D', color: '#fff', border: 'none',
              padding: '16px', borderRadius: 4, fontSize: 14, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1, marginTop: 8
            }}
          >
            {loading ? 'entrando...' : 'entrar'}
          </button>
        </div>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 32 }}>
          ainda não tem conta?{' '}
          <Link href="/cadastro" style={{ color: '#111', textDecoration: 'underline' }}>
            criar conta
          </Link>
        </p>

        {/* Bottom links */}
        <div style={{
          marginTop: 'auto', paddingTop: 48, display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Link href="/" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>
            ← voltar para a página inicial
          </Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>privacidade</a>
            <span style={{ color: '#ddd' }}>·</span>
            <a href="#" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>termos</a>
          </div>
        </div>
      </div>
    </div>
  )
}
