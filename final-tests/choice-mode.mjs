// Somente ambiente demo: valida preferência, fotos, gestos reais de toque,
// teclado, persistência, idempotência e recuperação de erro ao salvar.
import assert from 'node:assert/strict'
import { chromium, request } from 'playwright'

const FRONT = process.env.FRONT_URL || 'http://localhost:3000'
const API = process.env.API_URL || 'http://localhost:8000'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const control = await request.newContext()
const imageIds = []
const selectedIds = []
let chatTitle = ''
let originalPreference = false, originalFavorites = new Set(), customerToken, ownerToken, restaurant, count = 0
const errors = []
const check = (condition, message) => { assert.ok(condition, message); count++; console.log(`✓ ${message}`) }
const auth = token => ({ Authorization: `Bearer ${token}` })
const login = async page => {
  await page.goto(`${FRONT}/login`)
  await page.fill('input[name=email]', 'cliente@datafood.demo')
  await page.fill('input[name=password]', 'Demo@12345')
  await page.click('button[type=submit]')
  await page.waitForURL(url => !url.pathname.startsWith('/login'))
}
const activeCard = page => page.getByRole('group', { name: /^Card de escolha:/ })
async function swipe(page, dx, dy = 0) {
  const card = activeCard(page)
  await card.scrollIntoViewIfNeeded()
  const box = await card.boundingBox()
  const x = box.x + box.width / 2, y = Math.max(70, box.y + 100)
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx*i/8, y: y + dy*i/8 }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } finally { await cdp.detach() }
}
try {
  for (const [email, assign] of [['cliente@datafood.demo', token => { customerToken = token }], ['dono@datafood.demo', token => { ownerToken = token }]]) {
    const response = await control.post(`${API}/api/users/login/`, { data: { email, password: 'Demo@12345' } })
    assert.equal(response.status(), 200, 'Contas demo precisam estar disponíveis')
    assign((await response.json()).access)
  }
  const me = await (await control.get(`${API}/api/users/me/`, { headers: auth(customerToken) })).json()
  originalPreference = me.choice_mode
  const favorites = await (await control.get(`${API}/api/restaurants/favorites/?page_size=50`, { headers: auth(customerToken) })).json()
  originalFavorites = new Set(favorites.results.map(row => row.restaurant.id))
  restaurant = await (await control.get(`${API}/api/restaurants/by-slug/dallas-restaurante/`)).json()
  for (let i = 1; i <= 2; i++) {
    const response = await control.post(`${API}/api/restaurants/${restaurant.id}/images/`, { headers: auth(ownerToken), data: { url: `${FRONT}/imgs/icon.svg?choice-photo=${i}` } })
    assert.equal(response.status(), 201)
    imageIds.push((await response.json()).id)
  }
  await control.patch(`${API}/api/users/me/`, { headers: auth(customerToken), data: { choice_mode: false } })
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await mobile.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await login(page)
  await page.goto(`${FRONT}/perfil`)
  const toggle = page.getByRole('switch', { name: 'Habilitar modo escolha' })
  check(await toggle.getAttribute('aria-checked') === 'false', 'Perfil inicia com o modo desligado')
  await toggle.click()
  await page.waitForFunction(() => document.querySelector('[aria-label="Habilitar modo escolha"]')?.getAttribute('aria-checked') === 'true')
  await page.reload()
  check(await page.getByRole('switch', { name: 'Habilitar modo escolha' }).getAttribute('aria-checked') === 'true', 'Preferência permanece após recarregar o perfil')
  await page.goto(`${FRONT}/explorar?q=Dallas`)
  await activeCard(page).waitFor()
  await page.getByRole('button', { name: 'Próxima foto' }).waitFor()
  const name = await activeCard(page).getAttribute('aria-label')
  await page.getByRole('button', { name: 'Próxima foto' }).click()
  await page.getByText('Foto 2 de 2', { exact: true }).waitFor()
  check(await activeCard(page).getAttribute('aria-label') === name, 'Navegar pelas fotos não decide nem troca o restaurante')
  await swipe(page, 20)
  check(await activeCard(page).getAttribute('aria-label') === name, 'Arraste curto não decide')
  await swipe(page, 5, -100)
  check(await activeCard(page).getAttribute('aria-label') === name, 'Rolagem vertical não decide')
  await swipe(page, -150)
  await page.getByRole('heading', { name: 'Você viu todos os restaurantes desta lista' }).waitFor()
  check(true, 'Toque real para a esquerda recusa e encerra a lista de um resultado')
  await page.getByRole('button', { name: 'Rever restaurantes' }).click()
  await activeCard(page).waitFor()
  await swipe(page, 150)
  await page.getByRole('region', { name: 'Restaurante escolhido' }).waitFor()
  selectedIds.push(restaurant.id)
  check(await page.getByRole('link', { name: 'Ver restaurante escolhido' }).getAttribute('href') === `/restaurante/${restaurant.slug}`, 'Toque para a direita escolhe e permite abrir os detalhes')
  let saved = await (await control.get(`${API}/api/restaurants/favorites/?page_size=50`, { headers: auth(customerToken) })).json()
  check(saved.results.some(row => row.restaurant.id === restaurant.id), 'Escolha já salva continua nos favoritos (sem desfavoritar)')
  await page.getByRole('button', { name: 'Continuar vendo' }).click()
  await page.getByRole('button', { name: 'Rever restaurantes' }).click()
  await activeCard(page).waitFor()
  if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true })
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Cards e controles cabem na tela do celular')

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const pc = await desktop.newPage()
  pc.on('pageerror', error => errors.push(error.message))
  await login(pc)
  await pc.goto(`${FRONT}/explorar?ordering=name`)
  await activeCard(pc).waitFor()
  check(await pc.getByRole('switch', { name: 'Habilitar modo escolha' }).getAttribute('aria-checked') === 'true', 'Outro navegador recupera a preferência da conta')
  const before = await activeCard(pc).getAttribute('aria-label')
  await activeCard(pc).focus()
  await pc.keyboard.press('ArrowLeft')
  await pc.waitForFunction(previous => document.querySelector('[aria-label^="Card de escolha:"]')?.getAttribute('aria-label') !== previous, before)
  check(true, 'Teclado recusa e mantém a navegação entre cards')
  const chosenName = (await activeCard(pc).getAttribute('aria-label')).replace('Card de escolha: ', '')
  const list = await (await control.get(`${API}/api/restaurants/?ordering=name&page_size=50`)).json()
  const chosen = list.results.find(row => row.name === chosenName)
  await pc.route('**/api/restaurants/*/favorite/', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Falha simulada ao salvar.' }) }))
  await pc.getByRole('button', { name: 'Escolher e salvar' }).click()
  await pc.getByRole('alert').filter({ hasText: 'Falha simulada ao salvar.' }).waitFor()
  check(await activeCard(pc).getAttribute('aria-label') === `Card de escolha: ${chosenName}`, 'Falha ao salvar mantém o card e permite tentar de novo')
  await pc.unroute('**/api/restaurants/*/favorite/')
  await activeCard(pc).focus()
  await pc.keyboard.press('ArrowRight')
  await pc.getByRole('region', { name: 'Restaurante escolhido' }).waitFor()
  selectedIds.push(chosen.id)
  check(true, 'Teclado escolhe e salva no desktop')
  await pc.getByRole('button', { name: 'Continuar vendo' }).click()
  const mouseCard = activeCard(pc)
  await mouseCard.scrollIntoViewIfNeeded()
  const mouseName = await mouseCard.getAttribute('aria-label')
  const box = await mouseCard.boundingBox()
  await pc.mouse.move(box.x + box.width/2, box.y + 100)
  await pc.mouse.down()
  await pc.mouse.move(box.x + box.width/2 - 150, box.y + 100, { steps: 8 })
  await pc.mouse.up()
  await pc.waitForFunction(previous => document.querySelector('[aria-label^="Card de escolha:"]')?.getAttribute('aria-label') !== previous, mouseName)
  check(true, 'Arraste com mouse também recusa no desktop')
  await pc.getByRole('switch', { name: 'Habilitar modo escolha' }).click()
  await pc.waitForFunction(() => document.querySelector('[aria-label="Habilitar modo escolha"]')?.getAttribute('aria-checked') === 'false')
  check(await activeCard(pc).count() === 0, 'Desligar o modo recupera a grade sem perder a busca')
  await pc.goto(`${FRONT}/chat`)
  await pc.getByRole('switch', { name: 'Habilitar modo escolha' }).click()
  await pc.route(/\/api\/restaurants\/\d+\/$/, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Fotos indisponíveis no teste.' }) }))
  chatTitle = `Jantar tranquilo e2e-escolha-${Date.now()}`
  await pc.getByRole('textbox', { name: 'Descreva o momento', exact: true }).fill(chatTitle)
  await pc.getByRole('button', { name: 'Buscar', exact: true }).click()
  await activeCard(pc).waitFor({ timeout: 30000 })
  check(true, 'Resultados da busca por momento também usam o modo escolha')
  await pc.getByText('Não foi possível carregar as fotos adicionais.', { exact: false }).waitFor()
  check(await pc.getByRole('button', { name: 'Escolher e salvar' }).isEnabled(), 'Falha nas fotos mantém dados da busca e controles disponíveis')
  await pc.unroute(/\/api\/restaurants\/\d+\/$/)
  check(errors.length === 0, `Sem exceções no navegador: ${errors.join('; ')}`)
  console.log(`${count}/${count} verificações do modo escolha passaram`)
} finally {
  if (customerToken) {
    await control.patch(`${API}/api/users/me/`, { headers: auth(customerToken), data: { choice_mode: originalPreference } })
    if (chatTitle) {
      const chats = await (await control.get(`${API}/api/chats/?q=${encodeURIComponent(chatTitle)}`, { headers: auth(customerToken) })).json()
      for (const chat of chats.results ?? []) if (chat.title === chatTitle) await control.delete(`${API}/api/chats/${chat.id}/`, { headers: auth(customerToken) })
    }
    for (const id of selectedIds) if (!originalFavorites.has(id)) await control.delete(`${API}/api/restaurants/${id}/favorite/`, { headers: auth(customerToken) })
  }
  for (const id of imageIds) await control.delete(`${API}/api/restaurants/${restaurant.id}/images/${id}/`, { headers: auth(ownerToken) })
  await control.dispose()
  await browser.close()
}
