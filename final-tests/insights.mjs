// E2E em ambiente demo: campanha sem envio externo, visita atribuída,
// contato, resgate confirmado pelo dono, BI e exportação. O resgate fica no
// histórico de auditoria do banco demo; não execute contra produção.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const FRONT = process.env.FRONT_URL || 'http://localhost:3000'
const API = process.env.API_URL || 'http://localhost:8000'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const problems = []
let owner, promotion, restaurant
let checks = 0
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log(`✓ ${label}`) }
const headers = { 'X-Requested-With': 'datafood' }
try {
  const context = await browser.newContext()
  owner = await context.newPage()
  owner.on('pageerror', error => problems.push(error.message))
  await owner.goto(`${FRONT}/login`)
  await owner.fill('input[name=email]', 'dono@datafood.demo')
  await owner.fill('input[name=password]', 'Demo@12345')
  await owner.click('button[type=submit]')
  await owner.waitForURL(url => !url.pathname.startsWith('/login'))
  restaurant = await (await owner.request.get(`${API}/api/restaurants/by-slug/dallas-restaurante/`)).json()
  const base = `${API}/api/restaurants/${restaurant.id}/promotions/`
  const created = await owner.request.post(base, { headers, data: { title: `E2E BI ${Date.now()}`, message: 'Teste de atribuição, sem disparo externo.', coupon_code: 'E2EBI', send_email: false, send_telegram: false } })
  check(created.status() === 201, 'Campanha demo criada sem envio externo')
  promotion = await created.json()
  const sent = await owner.request.post(`${base}${promotion.id}/send/`, { headers, data: {} })
  check(sent.status() === 202, `Campanha publicada (HTTP ${sent.status()})`)
  promotion = await sent.json()
  const url = promotion.share_text.split('\n').find(line => line.startsWith(FRONT))
  check(!!url && new URL(url).searchParams.has('campaign'), 'Link de campanha tem atribuição assinada')
  const visitor = await (await browser.newContext()).newPage()
  visitor.on('pageerror', error => problems.push(error.message))
  const view = visitor.waitForResponse(response => response.url().endsWith('/api/insights/events/') && response.request().postDataJSON()?.kind === 'detail_view')
  await visitor.goto(url)
  check((await view).status() === 202, 'Visita de visitante registrada')
  const contact = visitor.locator('a[href^="tel:"]').first()
  await contact.waitFor()
  await contact.evaluate(element => element.addEventListener('click', event => event.preventDefault()))
  const clicked = visitor.waitForResponse(response => response.url().endsWith('/api/insights/events/') && response.request().postDataJSON()?.kind === 'contact_click')
  await contact.click()
  check((await clicked).status() === 202, 'Clique em contato registrado sem realizar ligação')
  await owner.goto(`${FRONT}/painel?r=${restaurant.id}&aba=visao`)
  await owner.getByRole('heading', { name: 'Descoberta e resultados' }).waitFor()
  await owner.getByText('Confirmar resgate de cupom', { exact: true }).click()
  await owner.selectOption('select[name=promotion]', String(promotion.id))
  await owner.fill('input[name=reference]', `e2e-bi-${promotion.id}`)
  await owner.fill('input[name=amount]', '20.00')
  await owner.getByRole('button', { name: 'Confirmar resgate', exact: true }).click()
  await owner.getByRole('status').filter({ hasText: 'Resgate confirmado.' }).waitFor()
  check(true, 'Dono confirmou o resgate pelo painel')
  const data = await (await owner.request.get(`${API}/api/restaurants/${restaurant.id}/analytics/?days=30`)).json()
  const row = data.campaigns.find(item => item.id === promotion.id)
  check(row?.events.detail_view >= 1 && row?.events.contact_click >= 1, 'BI atribui visita e contato à campanha correta')
  check(row.redemptions === 1, 'BI conta o resgate confirmado')
  const download = owner.waitForEvent('download')
  await owner.getByRole('button', { name: 'Exportar CSV' }).click()
  const csv = await readFile(await (await download).path(), 'utf8')
  check(csv.includes('Data,Aberturas de detalhe'), 'Exportação CSV contém datas e contagens')
  const period = owner.waitForResponse(response => response.url().includes('/analytics/?days=7'))
  await owner.getByRole('combobox', { name: 'Período dos resultados' }).selectOption('7')
  check((await period).status() === 200, 'Filtro de período atualizado')
  await owner.setViewportSize({ width: 390, height: 844 })
  check(await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Painel cabe na largura de celular')
  if (process.env.SCREENSHOT_PATH) await owner.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true })
  check(problems.length === 0, `Sem exceções no navegador: ${problems.join('; ')}`)
  console.log(`${checks}/${checks} verificações de BI passaram`)
} finally {
  if (promotion && restaurant && owner) await owner.request.delete(`${API}/api/restaurants/${restaurant.id}/promotions/${promotion.id}/`, { headers }).catch(() => {})
  await browser.close()
}
