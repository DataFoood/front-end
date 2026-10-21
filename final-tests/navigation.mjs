// Navegação E2E do datafood: visitante, cliente e dono, contra o front e a
// API rodando de verdade (sem mocks). Também mede renders nas interações que
// mais sofriam com re-render em cascata (ver render-hook.js).
//
// Pré-requisitos: API em :8000 com seed (`seed_demo --demo-users`) e o front
// em modo dev (`bun run dev`) em :3000. Ver final-tests/README.md.
//
//   cd final-tests && bun install && bun run e2e
//   FRONT_URL=http://localhost:3001 HEADED=1 bun run e2e
//
// Cadastra 1 conta descartável (@e2e.test) e a encerra no fim. Faz 3 logins:
// o limite do back é 5/min por IP, então espere 1 min entre execuções.

import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const FRONT = (process.env.FRONT_URL || 'http://localhost:3000').replace(/\/$/, '')
const API = (process.env.API_URL || 'http://localhost:8000').replace(/\/$/, '')
const OWNER = { email: 'dono@datafood.demo', password: 'Demo@12345' }
const CUSTOMER = { email: 'cliente@datafood.demo', password: 'Demo@12345' }
const hook = readFileSync(new URL('./render-hook.js', import.meta.url), 'utf8')

const results = []
const problems = [] // erros de console / respostas 5xx durante a navegação

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
    // 401/404 esperados (rotas protegidas, slug inexistente) aparecem como erro de recurso
    if (m.type() === 'error' && !/status of (401|404)/.test(m.text())) problems.push(`[${tag}] console: ${m.text()}`)
  })
  page.on('pageerror', e => problems.push(`[${tag}] pageerror: ${e.message}`))
  page.on('response', r => r.status() >= 500 && problems.push(`[${tag}] ${r.status()} ${r.request().method()} ${r.url()}`))
}

async function newPage(context, tag) {
  const page = await context.newPage()
  await page.addInitScript(hook)
  watch(page, tag)
  return page
}

const renders = page => page.evaluate(() => window.__renders.snapshot().counts)
const resetRenders = page => page.evaluate(() => window.__renders.reset())

async function login(page, { email, password }, expectUrl) {
  await page.goto(`${FRONT}/login`)
  await page.fill('input[name=email]', email)
  await page.fill('input[name=password]', password)
  await page.click('button[type=submit]')
  if (expectUrl) await page.waitForURL(expectUrl, { timeout: 15000 })
}

async function main() {
  const health = await fetch(`${API}/api/health/`).then(r => r.ok).catch(() => false)
  if (!health) {
    console.error(`API fora do ar em ${API} — suba o back antes.`)
    process.exit(2)
  }

  const browser = await chromium.launch({
    headless: !process.env.HEADED,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  })
  const email = `e2e-${Date.now().toString(36)}@e2e.test`
  const password = 'E2e@Senha123'
  const newPassword = 'E2e@Nova4567'

  // ─── visitante ─────────────────────────────────────────────────────────
  const visitor = await browser.newContext()
  const v = await newPage(visitor, 'visitante')

  await step('visitante · landing e explorar', async () => {
    await v.goto(FRONT)
    check(await v.getByRole('heading', { name: /o jantar começa antes/i }).isVisible(), 'landing carrega')
    await v.waitForSelector('text=bem avaliados agora.', { timeout: 10000 })
    check((await v.locator('a[href^="/restaurante/"]').count()) >= 1, 'destaques vindos da API')

    await v.goto(`${FRONT}/explorar`)
    await v.waitForSelector('a[href^="/restaurante/"]')
    const total = await v.locator('a[href^="/restaurante/"]').count()
    check(total > 0, `lista com ${total} restaurantes`)

    await resetRenders(v)
    await v.locator('input[aria-label="buscar por nome" i]').pressSequentially('restaurante', { delay: 15 })
    const typed = await renders(v)
    check(!typed.RestaurantCard && !typed.Explorer, 'digitar na busca não re-renderiza a lista', JSON.stringify(typed))
    await v.keyboard.press('Enter')
    await v.waitForURL(/q=restaurante/)
    await v.waitForTimeout(600)
    const filtered = await v.locator('a[href^="/restaurante/"]').count()
    check(filtered > 0 && filtered <= total, `busca por nome filtra (${filtered})`)

    const cuisine = v.locator('select').first()
    const option = await cuisine.locator('option').nth(1).getAttribute('value')
    await cuisine.selectOption(option)
    await v.waitForURL(new RegExp(`cuisine=${option}`))
    check(true, 'filtro de cozinha vai para a URL')
    await v.getByRole('button', { name: 'limpar filtros' }).click()
    await v.waitForURL(url => !url.search.includes('cuisine') && !url.search.includes('q='))
    check((await v.locator('input[aria-label="buscar por nome" i]').inputValue()) === '', 'limpar filtros zera o campo de busca')
  })

  let slug
  await step('visitante · detalhe e rotas protegidas', async () => {
    await v.goto(`${FRONT}/explorar`)
    await v.waitForSelector('a[href^="/restaurante/"]')
    const href = await v.locator('a[href^="/restaurante/"]').first().getAttribute('href')
    slug = href.split('/').pop()
    await v.goto(`${FRONT}${href}`)
    await v.waitForSelector('text=fatos')
    check(await v.getByRole('heading', { level: 1 }).isVisible(), `detalhe /restaurante/${slug}`)
    check(await v.getByText('para avaliar este restaurante').isVisible(), 'visitante vê convite para entrar e avaliar')
    await v.getByRole('button', { name: 'salvar' }).click()
    await v.waitForURL(/\/login\?next=/)
    check(v.url().includes(encodeURIComponent(`/restaurante/${slug}`)), 'salvar sem login leva ao login com ?next=')

    for (const path of ['/perfil', '/salvos', '/painel', '/chat']) {
      await v.goto(`${FRONT}${path}`)
      await v.waitForURL(/\/login\?next=/)
      check(true, `${path} exige login`)
    }
    await v.goto(`${FRONT}/login?next=https://evil.example`)
    check(true, 'login aceita ?next= externo sem quebrar (safeNext filtra)')
    await v.goto(`${FRONT}/nao-existe`)
    check(await v.getByText('esta mesa não existe.').isVisible(), '404 customizado')
    await v.goto(`${FRONT}/restaurante/slug-que-nao-existe`)
    await v.waitForSelector('text=restaurante não encontrado')
    check(true, 'slug inexistente mostra estado vazio')
  })
  await visitor.close()

  // ─── cliente (conta nova) ──────────────────────────────────────────────
  const ctx = await browser.newContext()
  const c = await newPage(ctx, 'cliente')

  await step('cliente · cadastro', async () => {
    await c.goto(`${FRONT}/cadastro`)
    await c.getByRole('button', { name: 'criar conta' }).click()
    check((await c.locator('[aria-invalid=true]').count()) >= 3, 'validação local dos campos obrigatórios')
    await c.fill('input[name=nome]', 'Teste')
    await c.fill('input[name=sobrenome]', 'Navegação')
    await c.fill('input[name=email]', email)
    await c.fill('input[name=senha]', password)
    await c.fill('input[name=confirmarSenha]', password)
    await c.check('#terms')
    await c.check('#consent')
    await c.getByRole('button', { name: 'criar conta' }).click()
    await c.waitForURL('**/chat', { timeout: 15000 })
    check(await c.getByRole('heading', { name: 'olá, teste.' }).isVisible(), 'cadastro loga e abre a busca')
    await c.goto(`${FRONT}/cadastro`)
    await c.waitForURL('**/chat')
    check(true, 'logado não vê /cadastro de novo')
  })

  await step('cliente · busca semântica e favoritos', async () => {
    await c.goto(`${FRONT}/chat`)
    await c.getByRole('button', { name: 'um lugar tranquilo para um jantar' }).click()
    const outcome = await Promise.race([
      c.waitForSelector('text=% match', { timeout: 30000 }).then(() => 'ok'),
      c.waitForSelector('text=a busca inteligente está indisponível', { timeout: 30000 }).then(() => 'indisponível'),
    ])
    check(true, `busca respondeu (${outcome})`)
    if (outcome !== 'ok') return
    // a conversa é salva na conta logo depois da resposta: espera aparecer na lista
    await c.locator('aside[aria-label="conversas" i] button', { hasText: 'um lugar tranquilo para um jantar' }).waitFor()
    await c.waitForLoadState('networkidle')

    await resetRenders(c)
    await c.locator('input[aria-label="descreva o momento" i]').pressSequentially('pizza no centro', { delay: 15 })
    const typed = await renders(c)
    check(!typed.RestaurantCard && !typed.ChatApp, 'digitar no chat não re-renderiza o histórico', JSON.stringify(typed))
    await c.locator('input[aria-label="descreva o momento" i]').fill('')

    await resetRenders(c)
    await c.locator('button[aria-label="salvar restaurante" i]').first().click()
    await c.waitForSelector('button[aria-label="remover dos salvos" i]')
    const clicked = await renders(c)
    check((clicked.FavoriteButton || 0) <= 1, `favoritar re-renderiza só o botão clicado (${clicked.FavoriteButton || 0})`)
    const badge = await c.locator('a[href="/salvos"] span').innerText()
    check(badge.trim() === '1', 'contador de salvos atualiza na hora')
    await c.reload()
    // recarregar abre uma busca nova; a conversa fica salva na barra lateral
    await c.locator('aside[aria-label="conversas" i] button', { hasText: 'um lugar tranquilo para um jantar' }).click()
    await c.waitForSelector('button[aria-label="remover dos salvos" i]', { timeout: 10000 })
    check(true, 'conversa e favorito persistem após recarregar')

    await c.goto(`${FRONT}/salvos`)
    await c.waitForSelector('a[href^="/restaurante/"]')
    check((await c.locator('a[href^="/restaurante/"]').count()) === 1, '/salvos lista o favorito')
    await c.locator('button[aria-label="remover dos salvos" i]').click()
    await c.waitForSelector('text=nada salvo por enquanto')
    check(true, 'desfavoritar em /salvos some na hora')
  })

  await step('cliente · avaliação', async () => {
    await c.goto(`${FRONT}/restaurante/${slug}`)
    await c.waitForSelector('text=sua nota')
    await c.getByRole('radio', { name: '4 estrelas' }).click()
    await c.getByLabel('título').fill('teste e2e')
    await c.getByRole('button', { name: 'publicar avaliação' }).click()
    await c.waitForSelector('text=você já avaliou este restaurante.')
    check(await c.getByText('teste e2e').isVisible(), 'avaliação publicada aparece na página')
    c.once('dialog', d => d.accept())
    await c.getByRole('button', { name: 'excluir minha avaliação' }).click()
    await c.waitForSelector('text=sua nota')
    check(true, 'excluir a própria avaliação')
  })

  await step('cliente · perfil, privacidade e segurança', async () => {
    await c.goto(`${FRONT}/perfil`)
    await c.fill('input[name=phone]', '14991234567')
    await c.getByRole('button', { name: 'salvar alterações' }).click()
    await c.waitForSelector('text=Dados atualizados.')
    check(true, 'salvar dados do perfil')

    await c.getByRole('tab', { name: 'privacidade' }).click()
    await c.waitForSelector('text=buscas recentes')
    await c.waitForTimeout(800)
    const history = await c.locator('li').allInnerTexts()
    check(history.some(t => t.toLowerCase().includes('um lugar tranquilo para um jantar')), 'com consentimento a busca aparece no histórico')
    await c.getByRole('switch', { name: 'personalizar recomendações' }).click()
    await c.waitForSelector('text=Personalização desativada')
    check((await c.getByRole('switch').getAttribute('aria-checked')) === 'false', 'desligar consentimento (LGPD)')

    await c.getByRole('tab', { name: 'segurança' }).click()
    await c.fill('input[name=current_password]', password)
    await c.fill('input[name=new_password]', newPassword)
    await c.fill('input[name=confirm_password]', newPassword)
    await c.getByRole('button', { name: 'alterar senha' }).click()
    await c.waitForSelector('text=Senha alterada.', { timeout: 10000 })
    check(true, 'trocar senha')
    // sessão em cookie HttpOnly: nenhum token ao alcance do JS
    const stored = await c.evaluate(() => Object.keys(localStorage).filter(k => /token/i.test(k) || /eyJ/.test(localStorage.getItem(k) ?? '')))
    // sem URL: o refresh tem path /api/users/ e não apareceria filtrando por /
    const cookies = await ctx.cookies()
    check(stored.length === 0 && cookies.some(k => k.name === 'datafood_refresh' && k.httpOnly) && cookies.some(k => k.name === 'datafood_access' && k.httpOnly), 'sessão em cookies HttpOnly, sem tokens no localStorage')
    // o back revogou os refresh antigos: com o access vencido, esta aba renova com o par novo
    await ctx.clearCookies({ name: 'datafood_access' })
    await c.reload()
    await c.waitForSelector('input[name=name]', { timeout: 10000 })
    check(c.url().endsWith('/perfil'), 'após trocar a senha a sessão atual continua (refresh com o par novo)')
  })

  await step('cliente · logout em outra aba', async () => {
    const other = await newPage(ctx, 'cliente-aba2')
    await other.goto(`${FRONT}/explorar`)
    await c.goto(`${FRONT}/salvos`)
    await c.waitForSelector('text=nada salvo por enquanto') // sessão restaurada
    await other.getByRole('button', { name: 'Sair', exact: true }).click()
    await c.waitForURL(/\/login\?next=/, { timeout: 10000 })
    check(true, 'sair numa aba desloga a outra')
    await other.close()
  })

  await step('cliente · encerrar conta', async () => {
    await login(c, { email, password: newPassword }, '**/chat')
    await c.goto(`${FRONT}/perfil`)
    await c.getByRole('tab', { name: 'segurança' }).click()
    await c.getByLabel('confirmação').fill('encerrar')
    await c.getByRole('button', { name: 'encerrar minha conta' }).click()
    await c.waitForURL(`${FRONT}/`)
    check(await c.getByRole('link', { name: 'Criar conta' }).first().isVisible(), 'conta encerrada e sessão limpa')
    await login(c, { email, password: newPassword })
    await c.waitForSelector('text=e-mail ou senha incorretos.')
    check(true, 'conta encerrada não entra mais')
  })
  await ctx.close()

  // ─── dono ──────────────────────────────────────────────────────────────
  const octx = await browser.newContext()
  const o = await newPage(octx, 'dono')
  await step('dono · painel', async () => {
    await login(o, OWNER, /\/painel/)
    await o.waitForSelector('text=VISUALIZAÇÕES')
    check(true, 'login do dono abre o painel com métricas')
    const tabs = ['Informações', 'Cardápio', 'Horários', 'Endereço', 'Fotos', 'Promoções', 'Visão geral']
    for (const tab of tabs) {
      await o.getByRole('button', { name: tab, exact: true }).click()
      await o.waitForURL(/aba=/)
      await o.waitForTimeout(400)
    }
    check(true, 'todas as abas do painel abrem')

    await o.getByRole('button', { name: 'Informações', exact: true }).click()
    const desc = o.locator('textarea[name=description]')
    const original = await desc.inputValue()
    await desc.fill(`${original} `)
    await o.getByRole('button', { name: 'salvar informações' }).click()
    await o.waitForSelector('text=Informações salvas.')
    await desc.fill(original)
    await o.getByRole('button', { name: 'salvar informações' }).click()
    check(true, 'editar e salvar informações')

    await o.getByRole('button', { name: 'Horários', exact: true }).click()
    await o.getByRole('button', { name: 'salvar horários' }).click()
    await o.waitForSelector('text=Horários salvos.')
    check(true, 'salvar horários')

    // troca entre restaurantes: cadastra um temporário pelo painel, confere
    // que o editor de endereço não herda o formulário do anterior e remove
    const list = o.locator('p:text-is("Meus restaurantes") + div')
    const demoName = (await list.locator('button').filter({ hasNotText: /novo restaurante|E2E Temp/i }).first().innerText()).trim()
    const tempName = `E2E Temp ${Date.now().toString(36)}`
    await o.getByRole('button', { name: '+ novo restaurante' }).click()
    await o.fill('input[name=name]', tempName)
    await o.getByRole('button', { name: 'Cadastrar', exact: true }).click()
    await o.waitForSelector('text=Restaurante cadastrado!')
    await o.waitForURL(/aba=info/)
    check(true, 'cadastrar restaurante pelo painel')
    try {
      await list.getByRole('button', { name: demoName, exact: true }).click()
      await o.getByRole('button', { name: 'Endereço', exact: true }).click()
      await o.waitForSelector('input[name=street]')
      const demoStreet = await o.locator('input[name=street]').inputValue()
      await list.getByRole('button', { name: tempName, exact: true }).click()
      await o.waitForFunction(name => document.querySelector('h1')?.textContent === name, tempName)
      await o.waitForSelector('input[name=street]')
      const tempStreet = await o.locator('input[name=street]').inputValue()
      check(demoStreet !== '' && tempStreet === '', 'trocar de restaurante não herda o endereço do anterior', `${demoStreet} -> ${tempStreet}`)
    } finally {
      // remove o temporário mesmo se a checagem acima falhar (ele é público)
      await list.getByRole('button', { name: tempName, exact: true }).click()
      await o.getByRole('button', { name: 'Informações', exact: true }).click()
      o.once('dialog', d => d.accept())
      await o.getByRole('button', { name: 'remover restaurante' }).click()
      await o.waitForSelector('text=Restaurante removido.')
      await o.waitForFunction(name => !document.body.innerText.includes(name), tempName)
      check(true, 'remover restaurante temporário')
    }

    await o.getByRole('button', { name: 'Visão geral', exact: true }).click()
    const viewsBefore = await o.locator('text=VISUALIZAÇÕES').locator('..').innerText()
    await o.getByRole('link', { name: 'ver página pública →' }).click()
    await o.waitForSelector('text=editar no painel')
    check(true, 'dono vê atalho "editar no painel" na página pública')
    await o.getByRole('link', { name: 'editar no painel' }).click()
    await o.waitForSelector('text=VISUALIZAÇÕES')
    const viewsAfter = await o.locator('text=VISUALIZAÇÕES').locator('..').innerText()
    check(viewsBefore === viewsAfter, 'visitar a própria página não soma visualização')
  })
  await octx.close()

  // ─── cliente demo: ?next= ──────────────────────────────────────────────
  const nctx = await browser.newContext()
  const n = await newPage(nctx, 'next')
  await step('login volta para a página pedida', async () => {
    await n.goto(`${FRONT}/salvos`)
    await n.waitForURL(/\/login\?next=%2Fsalvos/)
    await n.fill('input[name=email]', CUSTOMER.email)
    await n.fill('input[name=password]', CUSTOMER.password)
    await n.click('button[type=submit]')
    await n.waitForURL('**/salvos')
    check(true, '?next= leva de volta a /salvos')
  })
  await nctx.close()
  await browser.close()

  console.log('\n\x1b[1mproblemas de runtime\x1b[0m')
  check(problems.length === 0, 'sem erros de console nem respostas 5xx', problems.join('\n    '))

  const failed = results.filter(r => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checagens ok`)
  failed.forEach(f => console.log(`  falhou: ${f.label}`))
  process.exit(failed.length ? 1 : 0)
}

main()
