'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkPasswordStrength, validateSignupForm } from '../data/validation'
import { useAuth } from '../context/AuthContext'

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

function PasswordMeter({ password }: { password: string }) {
  if (!password) return null
  const { score, label, color, errors } = checkPasswordStrength(password)
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? color : '#e0dbd2',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {errors.map((e, i) => (
            <p key={i} style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>· {e}</p>
          ))}
        </div>
        <span style={{ fontSize: 11, color, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 8 }}>{label}</span>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [form, setForm] = useState({
    nome: '', sobrenome: '', email: '', senha: '', cidade: 'são paulo, sp'
  })
  const [accepted, setAccepted]       = useState(true)
  const [showPass, setShowPass]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [toast, setToast]             = useState<Toast>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const update = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(p => ({ ...p, [k]: '' }))
  }

  const showToast = (t: NonNullable<Toast>) => {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async () => {
    if (!accepted) {
      showToast({ ok: false, message: 'aceite os termos para continuar.' })
      return
    }

    const errors = validateSignupForm(form.nome, form.sobrenome, form.email, form.senha, form.cidade)
    if (errors.length) {
      const map: Record<string, string> = {}
      errors.forEach(e => { map[e.field] = e.message })
      setFieldErrors(map)
      showToast({ ok: false, message: `corrija ${errors.length} campo${errors.length > 1 ? 's' : ''} antes de continuar.` })
      return
    }

    setFieldErrors({})
    setLoading(true)

    // tenta autenticar (só funciona com as contas mock existentes)
    const result = await login(form.email, form.senha)

    setLoading(false)

    if (result.ok) {
      showToast({ ok: true, message: `conta criada! bem-vindo, ${form.nome}.` })
      setTimeout(() => router.push('/chat'), 1400)
    } else {
      // conta nova (não existe no mock) — simula criação e redireciona
      showToast({ ok: true, message: `conta criada com sucesso! bem-vindo, ${form.nome}.` })
      setTimeout(() => router.push('/chat'), 1400)
    }
  }

  const inp = (field: string) => ({
    width: '100%',
    border: `1px solid ${fieldErrors[field] ? '#e53e3e' : '#ddd'}`,
    borderRadius: 4, padding: '14px 16px', fontSize: 14, background: '#fff',
    outline: 'none', color: '#333', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  })

  const cidades = [
    'são paulo, sp', 'rio de janeiro, rj', 'belo horizonte, mg',
    'curitiba, pr', 'porto alegre, rs', 'brasília, df',
    'salvador, ba', 'recife, pe', 'fortaleza, ce', 'manaus, am'
  ]

  const strength = checkPasswordStrength(form.senha)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-sans)' }}>
      {toast && <ToastBanner toast={toast} />}

      {/* LEFT */}
      <div style={{
        flex: 1, background: '#0D0D0D', position: 'relative',
        display: 'flex', flexDirection: 'column', padding: '40px 48px', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', border: '1px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rust)' }} />
          </div>
          <span style={{ fontSize: 14, color: '#fff' }}>Datafood</span>
        </div>

        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 440, height: 440, borderRadius: '50%', border: '1px solid #1e1e1e', opacity: 0.7 }} />
        <div style={{ position: 'absolute', bottom: -170, right: -150, width: 620, height: 620, borderRadius: '50%', border: '1px solid #181818', opacity: 0.5 }} />

        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 300, color: '#fff', lineHeight: 1.15
          }}>
            uma conta.<br />
            infinitos <span style={{ color: 'var(--rust)' }}>jantares</span><br />
            certos.
          </h1>
        </div>

        <p style={{ fontSize: 11, color: '#3a3a3a' }}>
          privacidade por design · LGPD compliant · datafood © 2026
        </p>
      </div>

      {/* RIGHT */}
      <div style={{
        width: 580, background: 'var(--cream)', display: 'flex',
        flexDirection: 'column', padding: '60px 64px', overflowY: 'auto'
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
          leva menos de um minuto. você pode usar shinzou sem conta — mas com uma, salvamos suas preferências.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Nome / Sobrenome */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {(['nome', 'sobrenome'] as const).map(field => (
              <div key={field}>
                <label style={{
                  display: 'block', fontSize: 10, letterSpacing: '0.12em',
                  color: fieldErrors[field] ? '#e53e3e' : '#999', marginBottom: 8
                }}>
                  {field.toUpperCase()}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={e => update(field, e.target.value)}
                  placeholder={field === 'nome' ? 'ana' : 'moraes'}
                  style={inp(field)}
                  onFocus={e => e.target.style.borderColor = fieldErrors[field] ? '#e53e3e' : '#999'}
                  onBlur={e => e.target.style.borderColor = fieldErrors[field] ? '#e53e3e' : '#ddd'}
                />
                {fieldErrors[field] && (
                  <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors[field]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 10, letterSpacing: '0.12em',
              color: fieldErrors.email ? '#e53e3e' : '#999', marginBottom: 8
            }}>
              E-MAIL
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="ana@email.com"
              style={inp('email')}
              onFocus={e => e.target.style.borderColor = fieldErrors.email ? '#e53e3e' : '#999'}
              onBlur={e => e.target.style.borderColor = fieldErrors.email ? '#e53e3e' : '#ddd'}
            />
            {fieldErrors.email && (
              <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.email}</p>
            )}
          </div>

          {/* Senha + meter */}
          <div>
            <label style={{
              display: 'block', fontSize: 10, letterSpacing: '0.12em',
              color: fieldErrors.senha ? '#e53e3e' : '#999', marginBottom: 8
            }}>
              SENHA
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.senha}
                onChange={e => update('senha', e.target.value)}
                placeholder="mínimo 8 caracteres"
                style={{ ...inp('senha'), paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = fieldErrors.senha ? '#e53e3e' : '#999'}
                onBlur={e => e.target.style.borderColor = fieldErrors.senha ? '#e53e3e' : '#ddd'}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 12
                }}
              >
                {showPass ? 'ocultar' : 'ver'}
              </button>
            </div>
            <PasswordMeter password={form.senha} />
            {fieldErrors.senha && (
              <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.senha}</p>
            )}
          </div>

          {/* Cidade */}
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>
              CIDADE
            </label>
            <select
              value={form.cidade}
              onChange={e => update('cidade', e.target.value)}
              style={{
                ...inp('cidade'),
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
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
              <a href="#" style={{ textDecoration: 'underline', color: '#333' }}>política de privacidade</a>.
              concordo com o uso anônimo dos meus dados para melhorar recomendações.
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || (!!form.senha && strength.score < 3)}
            style={{
              width: '100%', background: '#0D0D0D', color: '#fff', border: 'none',
              padding: '16px', borderRadius: 4, fontSize: 14,
              cursor: loading || (!!form.senha && strength.score < 3) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              opacity: loading || (!!form.senha && strength.score < 3) ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'criando conta...' : 'criar conta'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 24 }}>
          já tem conta?{' '}
          <Link href="/login" style={{ color: '#111', textDecoration: 'underline' }}>entrar</Link>
        </p>
      </div>
    </div>
  )
}