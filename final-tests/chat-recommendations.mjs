// API simulada em navegador isolado; inferência e filtros reais têm testes no backend.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const FRONT = process.env.FRONT_URL || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++; console.log(`✓ ${message}`) }
const cards = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1, name: `Restaurante ${String(i + 1).padStart(2, '0')}`, slug: `teste-${i + 1}`,
  description: 'Comida preparada na hora, em um ambiente acolhedor para aproveitar a conversa.',
  cover_image: '', average_rating: '4.50', total_reviews: 10, cuisines: [{ id: 1, name: 'Italiana' }],
  ambients: [{ id: 2, name: 'Ao Ar Livre' }], price_ranges: [{ id: 1, name: 'Econômico' }],
  address: { neighborhood: 'Centro', city: 'Marília', state: 'SP' }, is_open_now: true,
  is_favorited: false, has_delivery: false, has_reservation: true, is_demo: true, sources: [], distance_km: null,
}))

try {
  if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true })
  for (const [width, height, mobile] of [[390, 844, true], [1440, 1000, false], [320, 640, true]]) {
    const premium = width !== 320
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile })
    await context.addInitScript(() => localStorage.setItem('datafood.session', '1'))
    const page = await context.newPage()
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type()) && !/status of 503/.test(message.text())) errors.push(message.text())
    })
    const messages = []
    let failFavorite = true, failSelection = false
    const saved = new Set()
    const conversation = () => ({ id: 1, title: 'Jantar em Marília', messages, created_at: '2026-11-19T12:00:00Z', updated_at: '2026-11-19T12:00:00Z' })
    const otherConversation = { id: 2, title: 'Outra seleção', created_at: '2026-11-19T11:00:00Z', updated_at: '2026-11-19T11:00:00Z', messages: [
      { role: 'user', text: 'Quero o último restaurante' },
      { role: 'assistant', content: { kind: 'results', results: [], answer: 'Uma opção para outra ocasião.', recommendation_ids: [12], count: 1 } },
    ] }
    await page.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname
      const fulfill = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path === '/api/users/me/') return fulfill({
        id: 1, name: 'Ana', email: 'ana@test.example', cpf: null, phone: '', birthday: null,
        gender: '', avatar_url: '', banner_url: '', role: 'customer', level: premium ? 2 : 1, allow_info: true,
        choice_mode: false, is_active: true, created_at: '2026-11-19T12:00:00Z',
      })
      if (path === '/api/restaurants/favorites/') return fulfill({ count: 0, results: [], next: null, previous: null })
      if (path === '/api/search/') return fulfill({ results: cards.map(restaurant => ({ restaurant, score: 0, match: null })) })
      if (path === '/api/chats/respond/') {
        const { query, conversation_id } = request.postDataJSON()
        check(messages.length === 0 ? conversation_id === null : conversation_id === 1, `${width}px: turno mantém a própria conversa`)
        const selected = query.includes('aberto') ? cards.slice(0, 4) : cards
        messages.push({ role: 'user', text: query }, { role: 'assistant', content: {
          kind: 'results', results: [], answer: selected.length === 4 ? 'Vamos considerar os ambientes ao ar livre.' : 'Você pode abrir as opções ou me contar mais sobre o que procura.',
          recommendation_ids: selected.map(card => card.id), count: selected.length,
          filters: { city: 'Marília' }, plan: premium ? 'premium' : 'free', personalized: premium, limited: false,
          suggestions: selected.length === 4 ? ['Italiana'] : ['Em um lugar aberto'],
          ...(premium ? { personalization_note: 'Restaurante 01 está nos seus favoritos e ajudou a ordenar as opções.' } : {}),
        } })
        return fulfill(conversation())
      }
      if (path === '/api/chats/') return fulfill({ count: messages.length ? 2 : 1, results: messages.length ? [conversation(), otherConversation] : [otherConversation], next: null, previous: null })
      if (path === '/api/chats/1/') return fulfill(conversation())
      if (path === '/api/chats/2/') return fulfill(otherConversation)
      const selection = path.match(/^\/api\/chats\/([12])\/recommendations\/(\d+)\/$/)
      if (selection) {
        if (failSelection) { failSelection = false; return fulfill({ detail: 'Falha de teste.' }, 503) }
        const ids = (selection[1] === '1' ? messages : otherConversation.messages)[Number(selection[2])].content.recommendation_ids
        return fulfill({ count: ids.length, results: cards.filter(card => ids.includes(card.id)) })
      }
      const favorite = path.match(/^\/api\/restaurants\/(\d+)\/favorite\/$/)
      if (favorite) {
        if (failFavorite) { failFavorite = false; return fulfill({ detail: 'Não foi possível salvar sua escolha.' }, 503) }
        saved.add(Number(favorite[1])); return fulfill({})
      }
      const detail = path.match(/^\/api\/restaurants\/(\d+)\/$/)
      if (detail) return fulfill({ ...cards[Number(detail[1]) - 1], images: Number(detail[1]) === 2 ? [{ url: '/imgs/icon.svg?photo=1' }, { url: '/imgs/icon.svg?photo=2' }] : [], items: [], business_hours: [] })
      if (path === '/api/insights/events/') return fulfill({})
      throw new Error(`Requisição não prevista: ${request.method()} ${path}`)
    })
    await page.goto(`${FRONT}/chat`, { waitUntil: 'domcontentloaded' })
    const input = page.getByRole('textbox', { name: 'Descreva o momento', exact: true })
    await input.waitFor()
    const personalStart = page.getByRole('button', { name: 'Sugira algo pelos meus gostos', exact: true })
    check(premium ? await personalStart.isVisible() : await personalStart.count() === 0, `${width}px: início pelos gostos acompanha o plano`)
    if (premium) {
      check(await page.getByRole('link', { name: 'Ajustar meus gostos e minha privacidade', exact: true }).getAttribute('href') === '/perfil?aba=privacidade', `${width}px: acesso direto às preferências autorizadas`)
      await personalStart.click()
    } else {
      await input.fill('Quero jantar em Marília')
      await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    }
    const open12 = page.getByRole('button', { name: 'Ver recomendações (12)', exact: true })
    await open12.waitFor({ timeout: 15000 })
    if (premium) check(messages[0].text === 'Sugira algo pelos meus gostos', `${width}px: início personalizado envia um turno normal ao backend`)
    check(await page.getByRole('button', { name: 'Em um lugar aberto', exact: true }).isVisible(), `${width}px: oferece próximo passo enviado pelo backend`)
    if (premium) check(await page.getByText('Restaurante 01 está nos seus favoritos e ajudou a ordenar as opções.', { exact: true }).isVisible(), `${width}px: explica personalização com evidência da seleção`)
    check(await page.getByRole('group', { name: /^Card de escolha:/ }).count() === 0, `${width}px: cards só aparecem ao abrir recomendações`)
    await input.fill('meu rascunho')
    await open12.click()
    const dialog = page.getByRole('dialog', { name: 'Suas recomendações' })
    await dialog.waitFor()
    const activeCard = () => dialog.getByRole('group', { name: /^Card de escolha:/ })
    await activeCard().waitFor()
    const box = await dialog.boundingBox()
    check(Math.abs(box.x) < 1 && Math.abs(box.y) < 1 && Math.abs(box.width - width) < 2 && Math.abs(box.height - height) < 2, `${width}px: seleção ocupa a tela inteira`)
    const first = await activeCard().getAttribute('aria-label')
    if (mobile) {
      const bounds = await activeCard().boundingBox()
      const x = bounds.x + bounds.width / 2, y = bounds.y + 70
      const cdp = await context.newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 130 * i / 8, y }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await cdp.detach()
    } else {
      await activeCard().focus(); await page.keyboard.press('ArrowLeft')
    }
    await page.waitForFunction(previous => document.querySelector('dialog[open] [aria-label^="Card de escolha:"]')?.getAttribute('aria-label') !== previous, first)
    const second = await activeCard().getAttribute('aria-label')
    await dialog.getByRole('button', { name: 'Próxima foto', exact: true }).click()
    check(await dialog.getByText('Foto 2 de 2', { exact: true }).isVisible() && await activeCard().getAttribute('aria-label') === second, `${width}px: trocar foto não decide pelo usuário`)
    await dialog.getByRole('button', { name: 'Voltar à conversa' }).click()
    check(await input.inputValue() === 'meu rascunho', `${width}px: fechar mantém o rascunho`)
    check(await open12.evaluate(element => element === document.activeElement), `${width}px: foco retorna ao botão`)
    await open12.click()
    check(await activeCard().getAttribute('aria-label') === second, `${width}px: reabrir mantém o progresso dos cards`)
    await dialog.getByRole('button', { name: '♥ Escolher e salvar', exact: true }).click()
    await dialog.getByText('Não foi possível salvar sua escolha. Tente novamente.', { exact: true }).waitFor()
    check(await activeCard().getAttribute('aria-label') === second, `${width}px: falha ao salvar mantém o card`)
    await dialog.getByRole('button', { name: '♥ Escolher e salvar', exact: true }).click()
    await dialog.getByRole('region', { name: 'Restaurante escolhido' }).waitFor()
    check(saved.size === 1, `${width}px: escolha salva um favorito`)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Em um lugar aberto', exact: true }).click()
    const open4 = page.getByRole('button', { name: 'Ver recomendações (4)', exact: true })
    await open4.waitFor()
    check(await page.getByRole('button', { name: 'Em um lugar aberto', exact: true }).count() === 0, `${width}px: próximo passo antigo não permanece clicável`)
    check(await page.getByRole('button', { name: 'Italiana', exact: true }).isVisible(), `${width}px: apresenta refinamentos da nova seleção`)
    check(await page.getByText('Vamos considerar os ambientes ao ar livre.', { exact: true }).isVisible(), `${width}px: conversa refina sem abrir cards automaticamente`)
    check(await page.getByText(premium ? /Premium ·/ : /Plano gratuito ·/).isVisible(), `${width}px: identifica o plano da conta`)
    if (process.env.SCREENSHOT_DIR) {
      await page.getByRole('alert').filter({ hasText: 'Não foi possível salvar sua escolha.' }).waitFor({ state: 'hidden' })
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/conversation-${width}.png`, animations: 'disabled' })
    }
    failSelection = true
    await open4.click()
    await dialog.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await activeCard().waitFor()
    check(await dialog.getByText('1 de 4', { exact: true }).isVisible(), `${width}px: nova seleção contém quatro opções e permite recuperar erro`)
    const chooseBounds = await dialog.getByRole('button', { name: '♥ Escolher e salvar', exact: true }).boundingBox()
    check(chooseBounds.y >= 0 && chooseBounds.y + chooseBounds.height <= height, `${width}px: ação principal permanece visível`)
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: sem overflow horizontal`)
    if (process.env.SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/chat-${width}.png`, animations: 'disabled' })
    }
    await page.keyboard.press('Escape')
    if (await page.getByRole('button', { name: 'Abrir conversas', exact: true }).isVisible()) await page.getByRole('button', { name: 'Abrir conversas', exact: true }).click()
    await page.getByRole('button', { name: 'Abrir conversa: Outra seleção', exact: true }).click()
    await page.getByRole('button', { name: 'Ver recomendações (1)', exact: true }).click()
    await dialog.getByRole('group', { name: 'Card de escolha: Restaurante 12', exact: true }).waitFor()
    check(true, `${width}px: trocar de conversa não reutiliza cards de outra seleção`)
    await page.keyboard.press('Escape')
    await page.reload()
    await input.waitFor()
    if (await page.getByRole('button', { name: 'Abrir conversas', exact: true }).isVisible()) await page.getByRole('button', { name: 'Abrir conversas', exact: true }).click()
    await page.getByRole('button', { name: 'Abrir conversa: Jantar em Marília', exact: true }).click()
    await page.getByRole('button', { name: 'Ver recomendações (4)', exact: true }).waitFor()
    check(errors.length === 0, `${width}px: sem erros JavaScript: ${errors.join('; ')}`)
    await context.close()
  }
  console.log(`${checks} verificações passaram.`)
} finally { await browser.close() }
