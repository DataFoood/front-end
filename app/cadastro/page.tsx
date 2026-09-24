'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { AuthShell } from '@/components/AuthShell'
import { Checkbox, Field, Spinner } from '@/components/ui'
import { ApiError, errorMessage } from '@/lib/api'
import { isValidCpf, isValidEmail, maskCpf, maskPhone, onlyDigits } from '@/lib/format'
import { homeFor } from '@/lib/nav'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

type AccountType = 'customer' | 'owner'

const EMPTY = { nome: '', sobrenome: '', email: '', cpf: '', phone: '', senha: '', confirmarSenha: '' }

function validate(form: typeof EMPTY, acceptedTerms: boolean) {
  const e: Record<string, string> = {}
  if (!form.nome.trim()) e.nome = 'informe seu nome.'
  if (!form.sobrenome.trim()) e.sobrenome = 'informe seu sobrenome.'
  if (!isValidEmail(form.email.trim())) e.email = 'e-mail inválido.'
  // CPF é opcional no back; se informado, precisa ser válido
  if (form.cpf && !isValidCpf(form.cpf)) e.cpf = 'CPF inválido.'
  if (form.phone && onlyDigits(form.phone).length < 10) e.phone = 'telefone inválido.'
  if (form.senha.length < 8) e.senha = 'a senha deve ter ao menos 8 caracteres.'
  else if (/^\d+$/.test(form.senha)) e.senha = 'a senha não pode ser só números.'
  if (form.confirmarSenha !== form.senha) e.confirmarSenha = 'as senhas não coincidem.'
  if (!acceptedTerms) e.terms = 'é preciso aceitar os termos para continuar.'
  return e
}

// mapeia erros do back (nomes da API) para os campos do formulário
const API_FIELD: Record<string, keyof typeof EMPTY> = {
  name: 'nome',
  email: 'email',
  cpf: 'cpf',
  phone: 'phone',
  password: 'senha',
  confirm_password: 'confirmarSenha',
}

function CadastroForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { register } = useAuth()
  const toast = useToast()

  const [accountType, setAccountType] = useState<AccountType>(() => (params.get('tipo') === 'restaurante' ? 'owner' : 'customer'))
  const [form, setForm] = useState(EMPTY)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [allowInfo, setAllowInfo] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (k: keyof typeof EMPTY, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(form, acceptedTerms)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const user = await register({
        name: `${form.nome.trim()} ${form.sobrenome.trim()}`,
        email: form.email.trim(),
        cpf: form.cpf ? onlyDigits(form.cpf) : null,
        phone: onlyDigits(form.phone),
        password: form.senha,
        confirm_password: form.confirmarSenha,
        account_type: accountType,
        allow_info: allowInfo,
      })
      toast.success('Conta criada! Bem-vindo(a) ao datafood.')
      router.replace(homeFor(user))
    } catch (err) {
      setSubmitting(false)
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fields)) mapped[API_FIELD[k] ?? k] = v
        setErrors(mapped)
        toast.error('Revise os campos destacados.')
      } else {
        toast.error(errorMessage(err))
      }
    }
  }

  const typeBtn = (value: AccountType, label: string, hint: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={accountType === value}
      onClick={() => setAccountType(value)}
      className={`rounded border px-4 py-3 text-left transition ${accountType === value ? 'border-ink bg-white' : 'border-[#ddd] hover:border-[#bbb]'}`}
    >
      <span className="block text-sm text-ink">{label}</span>
      <span className="block text-[11px] text-[#999]">{hint}</span>
    </button>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="tipo de conta" className="grid grid-cols-2 gap-3">
        {typeBtn('customer', 'quero descobrir', 'lugares para comer')}
        {typeBtn('owner', 'tenho um restaurante', 'cadastrar e gerenciar')}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="nome" name="nome" autoComplete="given-name" value={form.nome} onChange={e => update('nome', e.target.value)} placeholder="ana" error={errors.nome} />
        <Field label="sobrenome" name="sobrenome" autoComplete="family-name" value={form.sobrenome} onChange={e => update('sobrenome', e.target.value)} placeholder="moraes" error={errors.sobrenome} />
      </div>
      <Field label="e-mail" name="email" type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="ana@email.com" error={errors.email} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="cpf (opcional)" name="cpf" inputMode="numeric" value={form.cpf} onChange={e => update('cpf', maskCpf(e.target.value))} placeholder="000.000.000-00" error={errors.cpf} />
        <Field label="telefone (opcional)" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', maskPhone(e.target.value))} placeholder="(14) 91234-5678" error={errors.phone} />
      </div>
      <Field label="senha" name="senha" type="password" autoComplete="new-password" value={form.senha} onChange={e => update('senha', e.target.value)} placeholder="mínimo 8 caracteres" error={errors.senha} hint="ao menos 8 caracteres, evite senhas óbvias." />
      <Field label="confirmar senha" name="confirmarSenha" type="password" autoComplete="new-password" value={form.confirmarSenha} onChange={e => update('confirmarSenha', e.target.value)} placeholder="repita a senha" error={errors.confirmarSenha} />

      <div className="flex flex-col gap-3">
        <Checkbox id="terms" checked={acceptedTerms} onChange={v => { setAcceptedTerms(v); setErrors(p => ({ ...p, terms: '' })) }}>
          li e aceito os{' '}
          <Link href="/termos" target="_blank" className="text-[#333] underline">termos de uso</Link> e a{' '}
          <Link href="/privacidade" target="_blank" className="text-[#333] underline">política de privacidade</Link>.
        </Checkbox>
        {errors.terms && <p className="-mt-1 text-xs text-[#e53e3e]">{errors.terms}</p>}
        {/* LGPD: consentimento separado, opcional e desmarcado por padrão */}
        <Checkbox id="consent" checked={allowInfo} onChange={setAllowInfo}>
          <span className="text-[#333]">personalizar minhas recomendações (opcional).</span> autorizo guardar meu histórico de buscas e interações para melhorar as sugestões. dá para desligar a qualquer momento no perfil.
        </Checkbox>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full py-4">
        {submitting ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'criar conta'}
      </button>
    </form>
  )
}

export default function CadastroPage() {
  return (
    <AuthShell
      headline={
        <>
          uma conta.
          <br />
          infinitos <span className="font-normal text-rust">jantares</span>
          <br />
          certos.
        </>
      }
    >
      <p className="eyebrow mb-6">criar conta</p>
      <h2 className="mb-4 font-serif text-[clamp(36px,4vw,52px)] leading-[1.1]">
        comece pelo
        <br />
        momento certo.
      </h2>
      <p className="mb-8 text-sm leading-relaxed text-muted">leva menos de um minuto. com uma conta, você busca por momento, salva lugares e recebe sugestões melhores.</p>
      <Suspense>
        <CadastroForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-[#888]">
        já tem conta?{' '}
        <Link href="/login" className="text-ink underline">
          entrar
        </Link>
      </p>
    </AuthShell>
  )
}
