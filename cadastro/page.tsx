'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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

// aceita "123.456.789-09" ou "12345678909"
const onlyDigits = (v: string) => v.replace(/\D/g, '')

function validateCadastroForm(form: {
  nome: string; sobrenome: string; email: string; cpf: string
  phone: string; senha: string; confirmarSenha: string
}) {
  const errors: Record<string, string> = {}

  if (!form.nome.trim()) errors.nome = 'Informe seu nome.'
  if (!form.sobrenome.trim()) errors.sobrenome = 'Informe seu sobrenome.'

  if (!form.email.trim()) errors.email = 'Informe seu e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'E-mail inválido.'

  const cpfDigits = onlyDigits(form.cpf)
  if (!cpfDigits) errors.cpf = 'Informe seu CPF.'
  else if (cpfDigits.length !== 11) errors.cpf = 'CPF deve ter 11 dígitos.'

  const phoneDigits = onlyDigits(form.phone)
  if (!phoneDigits) errors.phone = 'Informe seu telefone.'
  else if (phoneDigits.length < 10) errors.phone = 'Telefone inválido.'

  if (!form.senha) errors.senha = 'Informe uma senha.'
  else if (form.senha.length < 8) errors.senha = 'A senha deve ter ao menos 8 caracteres.'

  if (!form.confirmarSenha) errors.confirmarSenha = 'Confirme sua senha.'
  else if (form.confirmarSenha !== form.senha) errors.confirmarSenha = 'As senhas não coincidem.'

  return errors
}

export default function CadastroPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [form, setForm] = useState({
    nome: '', sobrenome: '', email: '', cpf: '', phone: '',
    senha: '', confirmarSenha: '', cidade: 'são paulo, sp'
  })
  const [accepted, setAccepted] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
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
    const errors = validateCadastroForm(form)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)

    const result = await register({
      name: `${form.nome.trim()} ${form.sobrenome.trim()}`.trim(),
      email: form.email.trim(),
      cpf: onlyDigits(form.cpf),
      phone: onlyDigits(form.phone),
      password: form.senha,
      confirm_password: form.confirmarSenha,
    })

    setLoading(false)
    showToast(result)

    if (result.ok) {
      setTimeout(() => {
        // se o backend não autenticar direto no registro, troque para router.push('/login')
        router.push('/chat')
      }, 1200)
    }
  }

  const cidades = [
    'são paulo, sp', 'rio de janeiro, rj', 'belo horizonte, mg',
    'curitiba, pr', 'porto alegre, rs', 'brasília, df',
    'salvador, ba', 'recife, pe', 'fortaleza, ce', 'manaus, am'
  ]

  const inputStyle = (field: string) => ({
    width: '100%',
    border: `1px solid ${fieldErrors[field] ? '#e53e3e' : '#ddd'}`,
    borderRadius: 4, padding: '14px 16px', fontSize: 14, background: '#fff',
    outline: 'none', color: '#333', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s'
  })

  const labelStyle = (field: string) => ({
    display: 'block', fontSize: 10, letterSpacing: '0.12em',
    color: fieldErrors[field] ? '#e53e3e' : '#999', marginBottom: 8
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
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
          <Image
            src="/imgs/icon.svg"
            alt="datafood"
            width={35}
            height={35}
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
              <label style={labelStyle('nome')}>NOME</label>
              <input
                type="text" value={form.nome} onChange={e => update('nome', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="ana" style={inputStyle('nome')}
                onFocus={e => e.target.style.borderColor = fieldErrors.nome ? '#e53e3e' : '#999'}
                onBlur={e => e.target.style.borderColor = fieldErrors.nome ? '#e53e3e' : '#ddd'}
              />
              {fieldErrors.nome && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.nome}</p>}
            </div>
            <div>
              <label style={labelStyle('sobrenome')}>SOBRENOME</label>
              <input
                type="text" value={form.sobrenome} onChange={e => update('sobrenome', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="moraes" style={inputStyle('sobrenome')}
                onFocus={e => e.target.style.borderColor = fieldErrors.sobrenome ? '#e53e3e' : '#999'}
                onBlur={e => e.target.style.borderColor = fieldErrors.sobrenome ? '#e53e3e' : '#ddd'}
              />
              {fieldErrors.sobrenome && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.sobrenome}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle('email')}>E-MAIL</label>
            <input
              type="email" value={form.email} onChange={e => update('email', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="ana@email.com" style={inputStyle('email')}
              onFocus={e => e.target.style.borderColor = fieldErrors.email ? '#e53e3e' : '#999'}
              onBlur={e => e.target.style.borderColor = fieldErrors.email ? '#e53e3e' : '#ddd'}
            />
            {fieldErrors.email && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.email}</p>}
          </div>

          {/* CPF / Telefone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle('cpf')}>CPF</label>
              <input
                type="text" value={form.cpf} onChange={e => update('cpf', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="000.000.000-00" style={inputStyle('cpf')}
                onFocus={e => e.target.style.borderColor = fieldErrors.cpf ? '#e53e3e' : '#999'}
                onBlur={e => e.target.style.borderColor = fieldErrors.cpf ? '#e53e3e' : '#ddd'}
              />
              {fieldErrors.cpf && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.cpf}</p>}
            </div>
            <div>
              <label style={labelStyle('phone')}>TELEFONE</label>
              <input
                type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="(11) 91234-5678" style={inputStyle('phone')}
                onFocus={e => e.target.style.borderColor = fieldErrors.phone ? '#e53e3e' : '#999'}
                onBlur={e => e.target.style.borderColor = fieldErrors.phone ? '#e53e3e' : '#ddd'}
              />
              {fieldErrors.phone && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.phone}</p>}
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={labelStyle('senha')}>SENHA</label>
            <input
              type="password" value={form.senha} onChange={e => update('senha', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="mínimo 8 caracteres" style={inputStyle('senha')}
              onFocus={e => e.target.style.borderColor = fieldErrors.senha ? '#e53e3e' : '#999'}
              onBlur={e => e.target.style.borderColor = fieldErrors.senha ? '#e53e3e' : '#ddd'}
            />
            {fieldErrors.senha
              ? <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.senha}</p>
              : <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>use ao menos 8 caracteres, com letras e números.</p>}
          </div>

          {/* Confirmar senha */}
          <div>
            <label style={labelStyle('confirmarSenha')}>CONFIRMAR SENHA</label>
            <input
              type="password" value={form.confirmarSenha} onChange={e => update('confirmarSenha', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="repita a senha" style={inputStyle('confirmarSenha')}
              onFocus={e => e.target.style.borderColor = fieldErrors.confirmarSenha ? '#e53e3e' : '#999'}
              onBlur={e => e.target.style.borderColor = fieldErrors.confirmarSenha ? '#e53e3e' : '#ddd'}
            />
            {fieldErrors.confirmarSenha && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 6 }}>{fieldErrors.confirmarSenha}</p>}
          </div>

          {/* Cidade */}
          <div>
            <label style={labelStyle('cidade')}>CIDADE</label>
            <select
              value={form.cidade} onChange={e => update('cidade', e.target.value)}
              style={{
                ...inputStyle('cidade'), appearance: 'none',
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