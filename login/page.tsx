'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { validateLoginForm } from '../data/validation'
import Image from 'next/image'

type Toast = { ok: boolean; message: string } | null

function ToastBanner({ toast }: { toast: NonNullable<Toast> }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 100,
      background: toast.ok ? '#1a7a45' : '#c53030',
      color: '#fff', borderRadius: 6, padding: '14px 20px',
      fontSize: 13, maxWidth: 320, lineHeight: 1.5,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <span style={{ fontSize: 16, lineHeight: 1 }}>{toast.ok ? '✓' : '✕'}</span>
      {toast.message}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const showToast = (t: NonNullable<Toast>) => {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async () => {
    const errors = validateLoginForm(email, password)
    if (errors.length) {
      const map: Record<string, string> = {}
      errors.forEach(e => { map[e.field] = e.message })
      setFieldErrors(map)
      return
    }
    setFieldErrors({})
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    showToast(result)

    if (result.ok) {
      const stored = sessionStorage.getItem('datafood_user')
      const user = stored ? JSON.parse(stored) : null
      setTimeout(() => {
        if (user?.type === 'restaurante') router.push('/dashboard')
        else router.push('/chat')
      }, 1200)
    }
  }

  const inputStyle = (field: string) => ({
    width: '100%',
    border: `1px solid ${fieldErrors[field] ? '#e53e3e' : '#ddd'}`,
    borderRadius: 4, padding: '14px 16px', fontSize: 14, background: '#fff',
    outline: 'none', color: '#333', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-sans)' }}>
      {toast && <ToastBanner toast={toast} />}

      {/* LEFT PANEL */}
      <div style={{
        flex: 1, background: '#0D0D0D', position: 'relative',
        display: 'flex', flexDirection: 'column', padding: '40px 48px',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <Image
            src="/imgs/icon.svg"
            alt="datafood"
            width={35}
            height={35}
            style={{ objectFit: 'contain' }}
          />
          <span style={{ fontSize: 22, fontWeight: 500, color: '#e3a086', letterSpacing: '0.02em' }}>
            DATAFOOD
          </span>
        </Link>
        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(35px, 4vw, 60px)', fontWeight: 300, color: '#fff', lineHeight: 1.15 }}>
            Bem-vindo de<br />volta.<br />
            O que você está<br />com{' '}
            <span style={{ color: 'var(--rust)', fontWeight: 400 }}>vontade</span>
            {' '}hoje?
          </h1>
        </div>

        {/* Test accounts */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#555', marginBottom: 12 }}>CONTAS DE TESTE</p>
          {[
            { label: 'pessoa', email: 'testepessoa@datafood.com' },
            { label: 'restaurante', email: 'testerestaurante@datafood.com' },
          ].map(c => (
            <button
              key={c.label}
              onClick={() => { setEmail(c.email); setPassword('Teste@123') }}
              style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', textAlign: 'left', width: '100%' }}
            >
              <span style={{ fontSize: 11, color: '#555', marginRight: 8 }}>→</span>
              <span style={{ fontSize: 12, color: '#888' }}>{c.label}</span>
              <span style={{ fontSize: 11, color: '#444', marginLeft: 8 }}>{c.email}</span>
            </button>
          ))}
          <p style={{ fontSize: 11, color: '#444', marginTop: 8 }}>senha: <span style={{ color: '#666' }}>Teste@123</span></p>
        </div>

        <p style={{ fontSize: 11, color: '#3a3a3a' }}>Privacidade por design · LGPD compliant · DataFood © 2026</p>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: 580, background: 'var(--cream)', display: 'flex', flexDirection: 'column', padding: '60px 64px', overflowY: 'auto' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: '#aaa', marginBottom: 24 }}>ENTRAR</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, color: '#111', lineHeight: 1.1, marginBottom: 20 }}>
          Seu lugar,<br />Seu jeito.
        </h2>
        <p style={{ fontSize: 14, color: '#777', lineHeight: 1.65, marginBottom: 48, maxWidth: 380 }}>
          Use sua conta datafood para salvar lugares, ver seu histórico e receber sugestões cada vez mais precisas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: fieldErrors.email ? '#e53e3e' : '#999', marginBottom: 8 }}>
              E-MAIL
            </label>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="seu@email.com"
              style={inputStyle('email')}
              onFocus={e => e.target.style.borderColor = fieldErrors.email ? '#e53e3e' : '#999'}
              onBlur={e => e.target.style.borderColor = fieldErrors.email ? '#e53e3e' : '#ddd'}
            />
            {fieldErrors.email && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: fieldErrors.password ? '#e53e3e' : '#999', marginBottom: 8 }}>
              SENHA
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                style={{ ...inputStyle('password'), paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = fieldErrors.password ? '#e53e3e' : '#999'}
                onBlur={e => e.target.style.borderColor = fieldErrors.password ? '#e53e3e' : '#ddd'}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 12 }}
              >
                {showPass ? 'ocultar' : 'ver'}
              </button>
            </div>
            {fieldErrors.password && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.password}</p>}
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <a href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>Esqueceu a senha?</a>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', background: '#0D0D0D', color: '#fff', border: 'none', padding: '16px', borderRadius: 4, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s', marginTop: 8 }}
          >
            {loading ? 'Verificando...' : 'ENTRAR'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 32 }}>
          Ainda não tem conta?{' '}
          <Link href="/cadastro" style={{ color: '#111', textDecoration: 'underline' }}>Criar conta</Link>
        </p>

        <div style={{ marginTop: 'auto', paddingTop: 48, display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>← Voltar para a página inicial</Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>Privacidade</a>
            <span style={{ color: '#ddd' }}>·</span>
            <a href="#" style={{ fontSize: 12, color: '#bbb', textDecoration: 'none' }}>Termos</a>
          </div>
        </div>
      </div>
    </div>
  )
}