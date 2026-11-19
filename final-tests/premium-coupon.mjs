// UI isolada; autenticação, validação e concessão reais são testadas no backend.
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const FRONT = process.env.FRONT_URL || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++; console.log(`✓ ${message}`) }
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    await context.addInitScript(() => localStorage.setItem('datafood.session', '1'))
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    let user = { id: 1, name: 'Ana', email: 'ana@test.example', phone: '', gender: '', birthday: null, avatar_url: '', banner_url: '', role: 'customer', level: 1, allow_info: false, choice_mode: false, is_active: true, created_at: '2026-11-19T12:00:00Z' }
    await page.route('**/api/**', route => {
      const request = route.request(), path = new URL(request.url()).pathname
      const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/api/users/me/') return respond(user)
      if (path === '/api/users/premium/redeem/') {
        assert.deepEqual(Object.keys(request.postDataJSON()), ['code'])
        if (request.postDataJSON().code !== 'TEST-ONLY-COUPON') return respond({ code: 'Cupom inválido.' }, 400)
        user = { ...user, level: 2 }
        return respond(user)
      }
      if (path === '/api/preferences/') return respond({ cuisines: [], ambients: [], price_ranges: [] })
      if (path === '/api/restaurants/favorites/' || path === '/api/chats/' || path === '/api/preferences/history/') return respond({ count: 0, results: [], next: null, previous: null })
      throw new Error(`Requisição não prevista: ${path}`)
    })
    await page.goto(`${FRONT}/perfil`, { waitUntil: 'domcontentloaded' })
    const code = page.getByRole('textbox', { name: 'Cupom premium', exact: true })
    await code.waitFor({ timeout: 10000 })
    const redeem = page.getByRole('button', { name: 'Ativar premium', exact: true })
    check(await redeem.isDisabled(), `${width}px: código vazio não envia`)
    await code.fill('wrong')
    await redeem.click()
    await page.getByText('Cupom inválido.', { exact: true }).waitFor()
    check(await code.inputValue() === 'wrong', `${width}px: erro preserva o código para correção`)
    await code.fill('TEST-ONLY-COUPON')
    await redeem.click()
    await page.getByRole('heading', { name: 'Premium ativo', exact: true }).waitFor()
    check(await code.count() === 0, `${width}px: resgate atualiza o plano na sessão`)
    await page.reload()
    await page.getByRole('heading', { name: 'Premium ativo', exact: true }).waitFor()
    check(user.level === 2 && user.allow_info === false && user.role === 'customer', `${width}px: premium persiste sem alterar consentimento ou permissões`)
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: perfil cabe na tela`)
    await page.goto(`${FRONT}/chat`, { waitUntil: 'domcontentloaded' })
    await page.getByText(/Premium ·/).waitFor()
    check(errors.length === 0, `${width}px: chat reconhece o plano sem erros JavaScript`)
    await context.close()
  }
  console.log(`${checks} verificações de cupom passaram.`)
} finally { await browser.close() }
