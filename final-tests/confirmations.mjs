// UI isolada: confirmações nunca devem disparar a operação ao cancelar ou fechar.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const FRONT = process.env.FRONT_URL || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
const paginated = results => ({ count: results.length, results, next: null, previous: null })
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++; console.log(`✓ ${message}`) }

try {
  if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true })
  for (const width of [390, 1440, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } })
    await context.addInitScript(() => localStorage.setItem('datafood.session', '1'))
    const page = await context.newPage()
    const errors = [], writes = []
    let nativeDialogs = 0, customer = false, failSend = true, removed = false
    page.on('pageerror', error => errors.push(error.message))
    page.on('dialog', dialog => { nativeDialogs++; void dialog.dismiss() })
    const restaurant = {
      id: 1, owner: 2, name: 'Casa dos Temperos', slug: 'casa-dos-temperos', description: 'Comida para bons encontros.',
      cover_image: '', average_rating: '4.8', total_reviews: 1, cuisines: [], ambients: [], price_ranges: [],
      service_models: [], target_audiences: [], business_models: [], physical_formats: [],
      address: null, images: [], business_hours: [], has_reviewed: true, is_open_now: true, is_favorited: false,
      phone: '', whatsapp_number: '', email: '', website: '', menu_url: '', cnpj: null, sources: [], is_demo: true,
      has_dine_in: true, has_delivery: false, has_take_out: false, has_drive_thru: false, has_reservation: false,
      accepts_vale_refeicao: false, accepts_online_order: false,
      items: [{ id: 11, name: 'Massa da casa', description: 'Massa fresca.', price: '49.00' }],
    }
    let reviews = [{ id: 31, author: 1, author_name: 'Ana', title: 'Muito bom', description: 'Adorei.', rating: 5, created_at: '2026-11-23T12:00:00Z' }]
    let promotions = [21, 22].map(id => ({
      id, title: id === 21 ? 'Jantar especial' : 'Brinde da casa', message: 'Uma boa oferta para hoje.',
      coupon_code: '', valid_until: null, send_telegram: true, send_email: true, status: id === 21 ? 'draft' : 'sent',
      scheduled_for: null, sent_at: null, share_text: 'Oferta', whatsapp_url: 'https://wa.me/?text=Oferta',
      stats: { pending: 0, sending: 0, sent: 0, failed: 0, skipped: 0, unknown: 0 },
    }))
    await page.route('**/api/**', route => {
      const request = route.request(), path = new URL(request.url()).pathname, method = request.method()
      const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (method !== 'GET') writes.push({ path, method })
      if (path === '/api/users/me/') return respond({ id: customer ? 1 : 2, name: 'Ana', email: 'ana@example.test', role: customer ? 'customer' : 'owner', level: 1, allow_info: false, choice_mode: false })
      if (path === '/api/restaurants/favorites/') return respond(paginated([]))
      if (path === '/api/restaurants/mine/') return respond(paginated(removed ? [] : [restaurant]))
      if (path === '/api/restaurants/taxonomies/') return respond({ cuisines: [], ambients: [], price_ranges: [], service_models: [], target_audiences: [], business_models: [], physical_formats: [] })
      if (path === '/api/restaurants/1/' && method === 'DELETE') { removed = true; return respond({}) }
      if (path === '/api/restaurants/1/' || path === '/api/restaurants/by-slug/casa-dos-temperos/') return respond(restaurant)
      if (path === '/api/restaurants/1/items/11/' && method === 'DELETE') { restaurant.items = []; return respond({}) }
      if (path === '/api/restaurants/1/reviews/31/' && method === 'DELETE') { reviews = []; restaurant.has_reviewed = false; return respond({}) }
      if (path === '/api/restaurants/1/reviews/') return respond(paginated(reviews))
      if (path === '/api/restaurants/1/promotions/active/') return respond(paginated([]))
      if (path === '/api/restaurants/1/promotions/audience/') return respond({ favorites: 5, opted_in: 5, telegram: 2, email: 3, telegram_configured: true })
      if (path === '/api/restaurants/1/promotions/') return respond(paginated(promotions))
      if (path === '/api/restaurants/1/promotions/21/send/') {
        if (failSend) { failSend = false; return respond({ detail: 'Envio indisponível. Tente novamente.' }, 503) }
        promotions[0].status = 'sent'; return respond({})
      }
      const promotion = path.match(/^\/api\/restaurants\/1\/promotions\/(21|22)\/$/)
      if (promotion && method === 'DELETE') { promotions = promotions.filter(row => row.id !== Number(promotion[1])); return respond({}) }
      if (path === '/api/insights/events/') return respond({})
      throw new Error(`Requisição não prevista: ${method} ${path}`)
    })
    const mutations = () => writes.filter(write => write.path !== '/api/insights/events/')
    const dialog = title => page.getByRole('alertdialog', { name: title, exact: true })

    await page.goto(`${FRONT}/painel?r=1&aba=cardapio`)
    const removeDish = page.getByRole('button', { name: 'Remover', exact: true })
    await removeDish.click()
    const dishDialog = dialog('Remover prato?')
    await dishDialog.waitFor()
    check(await dishDialog.getByRole('button', { name: 'Cancelar', exact: true }).evaluate(element => element === document.activeElement), `${width}px: cancelar recebe o foco inicial`)
    const bounds = await dishDialog.boundingBox()
    check(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 844, `${width}px: confirmação cabe na tela`)
    check((await dishDialog.getAttribute('aria-describedby')) !== null, `${width}px: confirmação identifica sua descrição`)
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/confirmation-${width}.png`, animations: 'disabled' })
    await page.keyboard.press('Tab')
    check(await dishDialog.evaluate(element => element.contains(document.activeElement)), `${width}px: teclado permanece no modal`)
    await page.keyboard.press('Escape')
    await dishDialog.waitFor({ state: 'detached' })
    check(mutations().length === 0, `${width}px: Escape não remove o prato`)
    check(await removeDish.evaluate(element => element === document.activeElement), `${width}px: foco retorna à ação de origem`)
    await removeDish.click()
    await dishDialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    check(mutations().length === 0, `${width}px: cancelar não envia requisições`)
    await removeDish.click()
    await page.mouse.click(4, 4)
    await dishDialog.waitFor({ state: 'detached' })
    check(mutations().length === 0, `${width}px: clicar no fundo apenas cancela`)
    await removeDish.click()
    await dishDialog.getByRole('button', { name: 'Remover prato', exact: true }).evaluate(button => { button.click(); button.click() })
    await page.getByText('Prato removido.', { exact: true }).waitFor()
    check(mutations().filter(write => write.path.endsWith('/items/11/')).length === 1, `${width}px: confirmar duas vezes executa uma única remoção`)

    await page.goto(`${FRONT}/painel?r=1&aba=promocoes`)
    const draft = page.locator('li').filter({ has: page.getByRole('heading', { name: 'Jantar especial', exact: true }) })
    await draft.getByRole('button', { name: 'Enviar agora', exact: true }).click()
    const sendDialog = dialog('Publicar promoção agora?')
    check(await sendDialog.getByText(/até 5 mensagens/).isVisible(), `${width}px: envio informa o alcance antes de confirmar`)
    await sendDialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    check(!mutations().some(write => write.path.endsWith('/send/')), `${width}px: cancelar publicação não envia a campanha`)
    await draft.getByRole('button', { name: 'Enviar agora', exact: true }).click()
    await sendDialog.getByRole('button', { name: 'Publicar agora', exact: true }).click()
    await page.getByText('Envio indisponível. Tente novamente.', { exact: true }).waitFor()
    check(await draft.getByRole('button', { name: 'Enviar agora', exact: true }).isEnabled(), `${width}px: erro de envio permite tentar novamente`)
    await draft.getByRole('button', { name: 'Remover', exact: true }).click()
    await dialog('Remover promoção?').getByRole('button', { name: 'Cancelar', exact: true }).click()
    check(!mutations().some(write => write.path.endsWith('/promotions/21/')), `${width}px: cancelar exclusão mantém o rascunho`)
    await draft.getByRole('button', { name: 'Enviar agora', exact: true }).click()
    await sendDialog.getByRole('button', { name: 'Publicar agora', exact: true }).click()
    await draft.getByRole('link', { name: 'Compartilhar no WhatsApp', exact: true }).waitFor()
    check(mutations().filter(write => write.path.endsWith('/send/')).length === 2, `${width}px: cada publicação confirmada gera somente uma tentativa`)
    const sent = page.locator('li').filter({ has: page.getByRole('heading', { name: 'Brinde da casa', exact: true }) })
    await sent.getByRole('button', { name: 'Tirar da página', exact: true }).click()
    const sentDialog = dialog('Tirar promoção da página?')
    check(await sentDialog.getByText(/mensagens já enviadas não serão desfeitas/).isVisible(), `${width}px: retirada explica o que acontece com mensagens enviadas`)
    await sentDialog.getByRole('button', { name: 'Tirar da página', exact: true }).click()
    await sent.waitFor({ state: 'detached' })
    check(mutations().filter(write => write.path.endsWith('/promotions/22/')).length === 1, `${width}px: retirada confirmada remove a promoção uma vez`)

    await page.goto(`${FRONT}/painel?r=1&aba=info`)
    const removeRestaurant = page.getByRole('button', { name: 'Remover restaurante', exact: true })
    await removeRestaurant.click()
    await page.goBack()
    await page.getByRole('heading', { name: 'Nova promoção', exact: true }).waitFor()
    check(await page.getByRole('alertdialog').count() === 0 && !removed, `${width}px: sair da tela cancela a confirmação pendente`)
    await page.goto(`${FRONT}/painel?r=1&aba=info`)
    await removeRestaurant.click()
    await dialog('Remover restaurante?').getByRole('button', { name: 'Cancelar', exact: true }).click()
    check(!removed, `${width}px: cancelar mantém o restaurante`)
    await removeRestaurant.click()
    await dialog('Remover restaurante?').getByRole('button', { name: 'Remover restaurante', exact: true }).click()
    await page.getByRole('heading', { name: 'Cadastre seu restaurante', exact: true }).waitFor()
    check(mutations().filter(write => write.path === '/api/restaurants/1/').length === 1 && !mutations().some(write => write.method === 'PATCH'), `${width}px: confirmação dentro do formulário só remove, sem salvar alterações`)

    customer = true
    await page.goto(`${FRONT}/restaurante/casa-dos-temperos`)
    const deleteReview = page.getByRole('button', { name: 'Excluir minha avaliação', exact: true })
    await deleteReview.click()
    await dialog('Excluir sua avaliação?').getByRole('button', { name: 'Cancelar', exact: true }).click()
    check(reviews.length === 1, `${width}px: cancelar preserva a avaliação`)
    await deleteReview.click()
    await dialog('Excluir sua avaliação?').getByRole('button', { name: 'Excluir avaliação', exact: true }).click()
    await page.getByText('Avaliação excluída.', { exact: true }).waitFor()
    check(mutations().filter(write => write.path.endsWith('/reviews/31/')).length === 1, `${width}px: exclusão de avaliação exige confirmação e ocorre uma vez`)
    check(nativeDialogs === 0, `${width}px: nenhuma interação abre mensagens do navegador`)
    check(errors.length === 0, `${width}px: sem erros JavaScript: ${errors.join('; ')}`)
    await context.close()
  }
  console.log(`${checks} verificações de confirmação passaram.`)
} finally { await browser.close() }
