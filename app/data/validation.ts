export interface FieldError { field: string; message: string }

export function validateEmail(email: string): string | null {
  if (!email) return 'e-mail obrigatório.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'formato de e-mail inválido.'
  return null
}

export interface PasswordStrength { score: number; label: string; color: string; errors: string[] }

export function checkPasswordStrength(password: string): PasswordStrength {
  const errors: string[] = []
  if (password.length < 8)            errors.push('mínimo 8 caracteres')
  if (!/[A-Z]/.test(password))        errors.push('pelo menos uma letra maiúscula')
  if (!/[a-z]/.test(password))        errors.push('pelo menos uma letra minúscula')
  if (!/[0-9]/.test(password))        errors.push('pelo menos um número')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('pelo menos um caractere especial')
  const score = 5 - errors.length
  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'muito fraca', color: '#e53e3e' },
    1: { label: 'fraca',       color: '#dd6b20' },
    2: { label: 'razoável',    color: '#d69e2e' },
    3: { label: 'boa',         color: '#38a169' },
    4: { label: 'forte',       color: '#2b6cb0' },
    5: { label: 'muito forte', color: '#553c9a' },
  }
  return { score, errors, ...map[score] }
}

export function validateLoginForm(email: string, password: string): FieldError[] {
  const errors: FieldError[] = []
  const emailErr = validateEmail(email)
  if (emailErr) errors.push({ field: 'email', message: emailErr })
  if (!password) errors.push({ field: 'password', message: 'senha obrigatória.' })
  return errors
}

export function validateSignupForm(nome: string, sobrenome: string, email: string, senha: string, cidade: string): FieldError[] {
  const errors: FieldError[] = []
  if (!nome.trim())      errors.push({ field: 'nome',      message: 'nome obrigatório.' })
  if (!sobrenome.trim()) errors.push({ field: 'sobrenome', message: 'sobrenome obrigatório.' })
  const emailErr = validateEmail(email)
  if (emailErr)          errors.push({ field: 'email', message: emailErr })
  if (!cidade)           errors.push({ field: 'cidade', message: 'cidade obrigatória.' })
  const strength = checkPasswordStrength(senha)
  if (strength.score < 3) errors.push({ field: 'senha', message: `senha ${strength.label}. faltam: ${strength.errors.join(', ')}.` })
  return errors
}
