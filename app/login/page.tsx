'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { AuthShell } from '@/components/AuthShell'
import { Field, Spinner } from '@/components/ui'
import { ApiError, errorMessage } from '@/lib/api'
import { firstName, isValidEmail } from '@/lib/format'
import { homeFor, safeNext } from '@/lib/nav'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  const { login, user, loading: authLoading } = useAuth()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // já logado: não faz sentido ver o login
  useEffect(() => {
    if (!authLoading && user && !submitting) router.replace(next ?? homeFor(user))
  }, [authLoading, user, submitting, next, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!isValidEmail(email.trim())) errs.email = 'informe um e-mail válido.'
    if (!password) errs.password = 'informe sua senha.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    try {
      const u = await login(email.trim(), password)
      toast.success(`Olá, ${firstName(u.name)}! Bem-vindo(a) de volta.`)
      router.replace(next ?? homeFor(u))
    } catch (err) {
      setSubmitting(false)
      if (err instanceof ApiError && err.status === 401) {
        setErrors({ password: 'e-mail ou senha incorretos.' })
      } else if (err instanceof ApiError && Object.keys(err.fields).length) {
        setErrors(err.fields)
      } else {
        toast.error(errorMessage(err))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field
        label="e-mail"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com"
        error={errors.email}
      />
      <div>
        <Field
          label="senha"
          name="password"
          type={showPass ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          error={errors.password}
          right={
            <button type="button" onClick={() => setShowPass(s => !s)} className="text-xs text-[#aaa] hover:text-ink">
              {showPass ? 'ocultar' : 'ver'}
            </button>
          }
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full py-4 tracking-wide">
        {submitting ? <Spinner className="h-4 w-4 border-[#555] border-t-white" /> : 'ENTRAR'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthShell
      headline={
        <>
          Bem-vindo de volta.
          <br />O que você está com <span className="font-normal text-rust">vontade</span> hoje?
        </>
      }
    >
      <p className="eyebrow mb-6">entrar</p>
      <h2 className="mb-4 font-serif text-[clamp(36px,4vw,52px)] leading-[1.1]">
        Seu lugar,
        <br />
        seu jeito.
      </h2>
      <p className="mb-10 max-w-sm text-sm leading-relaxed text-muted">
        Use sua conta datafood para salvar lugares, ver seu histórico e receber sugestões cada vez mais precisas.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-[#888]">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="text-ink underline">
          Criar conta
        </Link>
      </p>
      <div className="mt-auto flex justify-between pt-12 text-xs text-[#bbb]">
        <Link href="/" className="hover:text-ink">
          ← Voltar para o início
        </Link>
        <div className="flex gap-3">
          <Link href="/privacidade" className="hover:text-ink">
            Privacidade
          </Link>
          <Link href="/termos" className="hover:text-ink">
            Termos
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
