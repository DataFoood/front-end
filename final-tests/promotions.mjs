// E2E das promoções por mensageiros: dono cria e envia pelo painel, cliente
// gerencia o opt-in no perfil, a promoção aparece na página pública e o link
// de descadastro do e-mail funciona.
//
// Pré-requisitos: os mesmos do navigation.mjs (API :8000 com
// `seed_demo --demo-users`, front em :3000) e o log da API num arquivo, porque
// o e-mail sai pelo backend de console (é de lá que tiramos o link de
// descadastro). Com Celery eager o envio acontece na própria requisição.
//
//   API_LOG=/caminho/api.log bun run e2e:promocoes
//
// Faz 2 logins (limite do back: 5/min por IP). Remove a promoção no fim e
// religa o opt-in do cliente demo. Cada execução gasta 1 da cota diária de
// promoções do restaurante (remover não devolve): para repetir no mesmo dia,
// suba a API com PROMOTIONS_MAX_PER_DAY alto.

import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const FRONT = (process.env.FRONT_URL || 'http://localhost:3000').replace(/\/$/, '')
const API = (process.env.API_URL || 'http://localhost:8000').replace(/\/$/, '')
const API_LOG = process.env.API_LOG
const OWNER = { email: 'dono@datafood.demo', password: 'Demo@12345' }
const CUSTOMER = { email: 'cliente@datafood.demo', password: 'Demo@12345' }

const results = []
const problems = []

function check(ok, label, detail = '') {
  results.push({ ok, label })
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${label}${!ok && detail ? `  [${detail}]` : ''}`)
  return ok
}

async function step(title, fn) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
  try {
    await fn()
  } catch (err) {
    check(false, `${title}: exceção`, String(err).split('\n')[0])
  }
}

function watch(page, tag) {
  page.on('console', m => {
    // 401 de rota protegida e 503 do telegram não configurado são esperados
    if (m.type() === 'error' && !/status of (401|404|503)/.test(m.text())) problems.push(`[${tag}] console: ${m.text()}`)
  })
  page.on('pageerror', e => problems.push(`[${tag}] pageerror: ${e.message}`))
  page.on('response', r => r.status() >= 500 && r.status() !== 503 && problems.push(`[${tag}] ${r.status()} ${r.request().method()} ${r.url()}`))
  page.on('dialog', d => d.accept())
}

async function login(page, { email, password }) {
  await page.goto(`${FRONT}/login`)
  await page.fill('input[name=email]', email)
  await page.fill('input[name=password]', password)
  await page.click('button[type=submit]')
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 })
}

async function main() {
  const dallas = await fetch(`${API}/api/restaurants/by-slug/dallas-restaurante/`).then(r => (r.ok ? r.json() : null)).catch(() => null)
  if (!dallas) {
    console.error(`API fora do ar em ${API} ou sem seed (dallas-restaurante) — suba o back antes.`)
    process.exit(2)
  }

  const browser = await chromium.launch({
    headless: !process.env.HEADED,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  })
  const title = `E2E promo ${Date.now().toString(36)}`
  const logStart = API_LOG ? readFileSync(API_LOG, 'utf8').length : 0

  const customerCtx = await browser.newContext()
  const customer = await customerCtx.newPage()
  watch(customer, 'cliente')
  const ownerCtx = await browser.newContext()
  const owner = await ownerCtx.newPage()
  watch(owner, 'dono')

  await step('cliente: perfil → promoções', async () => {
    await login(customer, CUSTOMER)
    await customer.goto(`${FRONT}/perfil?aba=promocoes`)
    const optIn = customer.getByRole('switch', { name: 'receber promoções' })
    await optIn.waitFor()
    check((await customer.getByRole('tab', { name: 'promoções' }).getAttribute('aria-selected')) === 'true', '?aba=promocoes abre a aba certa')
    if ((await optIn.getAttribute('aria-checked')) !== 'true') {
      await optIn.click()
      await customer.waitForFunction(() => document.querySelector('[aria-label="Receber promoções"]')?.getAttribute('aria-checked') === 'true')
    }
    check((await optIn.getAttribute('aria-checked')) === 'true', 'opt-in ligado')
    check(await customer.getByRole('switch', { name: 'receber por e-mail' }).isEnabled(), 'canal e-mail habilitado com opt-in')
    await customer.getByRole('button', { name: 'vincular telegram' }).click()
    await customer.getByText('Telegram não está configurado').waitFor({ timeout: 5000 })
    check(true, 'sem bot configurado: vincular telegram avisa (503 tratado)')
  })

  await step('dono: painel → promoções → criar e enviar', async () => {
    await login(owner, OWNER)
    await owner.goto(`${FRONT}/painel?r=${dallas.id}&aba=promocoes`)
    await owner.getByRole('heading', { name: 'nova promoção' }).waitFor({ timeout: 15000 })
    check(!(await owner.getByText(/fim de semana tranquilo|fim de semana movimentado|contrate infraestrutura/i).count()), 'dono não vê a sugestão de infra (só admin)')
    await owner.getByText(/1 pessoa/).first().waitFor({ timeout: 10000 })
    check(true, 'alcance mostra o cliente demo (e-mail)')

    await owner.fill('input[name=promo-title]', title)
    await owner.fill('textarea[name=promo-message]', 'Burger em dobro hoje à noite.')
    await owner.fill('input[name=promo-coupon]', 'E2EDOBRO')
    await owner.getByRole('button', { name: 'salvar rascunho' }).click()
    const row = owner.locator('li', { hasText: title })
    await row.getByText('rascunho').waitFor({ timeout: 10000 })
    check(true, 'rascunho criado e listado')

    await row.getByRole('button', { name: 'enviar agora' }).click()
    await row.getByText('Enviada', { exact: true }).waitFor({ timeout: 20000 })
    check(true, 'enviar agora → enviada')
    const meta = await row.innerText()
    check(/entregue|limite diário/.test(meta), 'estatística de entrega na linha', meta.split('\n').slice(-2).join(' | '))
    const wa = await row.getByRole('link', { name: 'compartilhar no whatsapp' }).getAttribute('href')
    check(wa?.startsWith('https://wa.me/?text=') && decodeURIComponent(wa).includes('E2EDOBRO'), 'link do whatsapp com o texto e o cupom')
  })

  await step('visitante: promoção na página do restaurante', async () => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    watch(page, 'visitante')
    await page.goto(`${FRONT}/restaurante/dallas-restaurante`)
    await page.getByRole('heading', { name: title }).waitFor({ timeout: 10000 })
    check(true, 'promoção ativa aparece na página pública')
    check(await page.getByRole('link', { name: 'entre e salve o restaurante' }).isVisible(), 'convite para receber as próximas')
    await ctx.close()
  })

  await step('e-mail: link de descadastro', async () => {
    if (!API_LOG) {
      check(true, 'API_LOG não informado — pulei (o e-mail sai no log da API)')
      return
    }
    const log = readFileSync(API_LOG, 'utf8').slice(logStart)
    // o console backend quebra linhas longas em quoted-printable
    const flat = log.replace(/=\r?\n/g, '').replace(/=3D/g, '=')
    const token = /descadastrar\?token=([\w:.-]+)/.exec(flat)?.[1]
    if (!check(!!token, 'e-mail com link de descadastro no log')) return
    await customer.goto(`${FRONT}/promocoes/descadastrar?token=${token}`)
    await customer.getByRole('button', { name: 'parar de receber promoções' }).click()
    await customer.getByText(/não vai mais receber promoções/).waitFor({ timeout: 10000 })
    check(true, 'descadastro confirmado')
    await customer.goto(`${FRONT}/perfil?aba=promocoes`)
    const optIn = customer.getByRole('switch', { name: 'receber promoções' })
    await optIn.waitFor()
    check((await optIn.getAttribute('aria-checked')) === 'false', 'perfil reflete o descadastro')
    await optIn.click() // restaura o estado do seed
    await customer.waitForFunction(() => document.querySelector('[aria-label="Receber promoções"]')?.getAttribute('aria-checked') === 'true')
  })

  await step('limpeza', async () => {
    const row = owner.locator('li', { hasText: title })
    await row.getByRole('button', { name: 'tirar da página' }).click()
    await row.waitFor({ state: 'detached', timeout: 10000 })
    check(true, 'promoção removida da página')
  })

  await browser.close()
  const failed = results.filter(r => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checagens ok`)
  if (problems.length) {
    console.log('\nproblemas durante a navegação:')
    for (const p of problems) console.log(`  - ${p}`)
  }
  process.exit(failed.length || problems.length ? 1 : 0)
}

main()
