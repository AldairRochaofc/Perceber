// Fluxo completo do PERCEBER em navegador real + verificação de acessibilidade (axe, WCAG 2.2 AA).
// Uso: npm run build && node e2e/run.mjs [--motion]   (padrão: movimento reduzido, para ir mais rápido)
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const withMotion = process.argv.includes('--motion')
const OUT = 'e2e/out'
await mkdir(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0])
  const file = join('dist', path === '/' ? 'index.html' : path)
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end()
  }
}).listen(0)
const BASE = `http://localhost:${server.address().port}/`

const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {})
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion: withMotion ? 'no-preference' : 'reduce', acceptDownloads: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

const report = { steps: [], axe: {} }
const step = (name) => {
  report.steps.push(name)
  console.log('→', name)
}
const go = async (route) => {
  await page.goto(`${BASE}#${route}`)
  await page.waitForTimeout(500)
}
const shot = (name, full = true) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
async function axe(name) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  report.axe[name] = results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }))
  const n = results.violations.length
  console.log(`   axe ${name}: ${n ? `${n} violação(ões): ${results.violations.map((v) => v.id).join(', ')}` : 'ok'}`)
}
const clickText = (role, name) => page.getByRole(role, { name, exact: true }).first().click()

// 1. Página inicial
step('Página inicial')
await go('/')
await page.waitForTimeout(withMotion ? 2200 : 400)
await axe('inicio')
await shot('01-inicio')

// 2. Consentimentos
step('Consentimentos')
await page.getByRole('link', { name: 'Começar avaliação' }).first().click()
await page.waitForTimeout(400)
await axe('consentimentos')
await clickText('button', 'Registrar e continuar') // valida erros
await page.waitForTimeout(200)
await shot('02-consentimentos-erros')
const choose = async (name, label) => page.locator(`input[name="consent-${name}"]`).locator('xpath=..').filter({ hasText: label }).click()
await choose('account', 'Sim, autorizo')
await choose('modules', 'Sim, autorizo')
await choose('research', 'Não autorizo')
await choose('contact', 'Sim, autorizo')
await choose('secondary', 'Não autorizo')
await clickText('button', 'Registrar e continuar')
await page.waitForTimeout(400)

// 3. Sobre você
step('Sobre você')
await axe('sobre-voce')
await page.getByLabel('Como você quer ser chamado(a)?').fill('Ana')
await page.getByLabel('Faixa etária').selectOption('25-34')
await page.getByLabel('Gênero').selectOption('mulher')
await clickText('button', 'Criar perfil')
await page.waitForTimeout(500)

// 4. Antes de começar
step('Antes de começar')
await axe('antes-de-comecar')
await shot('03-antes-de-comecar')
const radio = (name, label) => page.locator(`input[name="${name}"]`).locator('xpath=..').filter({ hasText: label }).first().click()
await radio('adult', 'Sim')
await radio('understands', 'Sim, entendi')
await radio('language', 'Sim')
await radio('distress', 'Não')
await clickText('button', 'Começar o módulo')
await page.waitForURL(/avaliacao\//, { timeout: 8000 })
await page.waitForTimeout(withMotion ? 2600 : 400)

// 5. Questionário (perfil com sinal em 4 domínios centrais e impacto frequente)
step('Questionário')
await axe('questionario')
await shot('04-questionario', false)
const pattern = { s: 4, c: 3, e: 4, r: 1, o: 3, i: 2, m: 3, f: 3 }
let answered = 0
for (let guard = 0; guard < 60; guard++) {
  const ctxTitle = await page.getByRole('heading', { name: 'Quer acrescentar algum contexto?' }).count()
  if (ctxTitle) break
  const radios = page.locator('input[type="radio"][name^="q-"]')
  const name = await radios.first().getAttribute('name')
  const id = name.slice(2)
  let v = pattern[id[0]] ?? 2
  if (id === 'c3' || id === 'o3') v = 4 - v // itens invertidos coerentes
  if (id === 'r2') {
    await page.getByRole('button', { name: 'Prefiro não responder' }).click()
  } else {
    await page.keyboard.press(String(v + 1))
  }
  answered++
  await page.waitForFunction((prev) => !document.querySelector(`input[name="${prev}"]`), name, { timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(120)
  if (answered === 6) {
    // volta uma pergunta e confere que a resposta salva aparece
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(250)
    const checked = await page.locator('input[type="radio"][name^="q-"]:checked').count()
    report.backKeepsAnswer = checked === 1
    await page.getByRole('button', { name: 'Salvar e seguir' }).click()
    await page.waitForTimeout(250)
  }
}
report.questionsAnswered = answered
console.log('   perguntas respondidas:', answered)

// 6. Contexto
step('Contexto')
await axe('contexto')
await page.getByText('Dormi mal ou estou com sono').click()
await page.getByLabel('Comentário para o relatório').fill('Desde criança evito festas; prefiro conversar por mensagem.')
await shot('05-contexto')
await clickText('button', 'Ver meu resultado')
await page.waitForURL(/resultado\//, { timeout: 10000 })
await page.waitForTimeout(withMotion ? 3500 : 600)

// 7. Resultado
step('Resultado')
await axe('resultado')
await shot('06-resultado')
report.signal = await page.locator('#sinal-title').locator('xpath=..').innerText().catch(() => '')

// 8. Relatório
step('Relatório')
await page.getByRole('link', { name: 'Abrir relatório' }).click()
await page.waitForTimeout(500)
await axe('relatorio')
const [download] = await Promise.all([page.waitForEvent('download'), clickText('button', 'Baixar arquivo')])
await download.saveAs(`${OUT}/relatorio-exportado.html`)
await page.waitForTimeout(300)
await shot('07-relatorio')

// 9. Compartilhar
step('Compartilhar')
await page.getByRole('link', { name: 'Compartilhar' }).first().click()
await page.waitForTimeout(500)
await axe('compartilhar')
await page.getByLabel('Para quem é este acesso?').selectOption('pro-b')
await page.locator('input[name="scope"][value="full"]').check()
await page.getByText('Compartilhar com um profissional que eu escolher').click()
await clickText('button', 'Gerar código de acesso')
await page.waitForTimeout(400)
const code = (await page.locator('dialog[open] .font-mono').first().innerText()).trim()
report.code = code
console.log('   código:', code)
await shot('08-codigo', false)
await clickText('button', 'Entendi')

// 10. Profissional
step('Portal profissional')
const switchRole = async (label) => {
  await page.getByRole('button', { name: /Perfil de acesso/ }).first().click()
  await page.locator('dialog[open] input[name="role"]').locator('xpath=..').filter({ hasText: label }).first().click()
  await page.getByRole('button', { name: `Entrar como ${label}` }).click()
  await page.waitForTimeout(500)
}
await switchRole('Profissional')
await axe('portal')
await page.getByLabel('Código de acesso').fill(code.toLowerCase().replace(/-/g, ' '))
await clickText('button', 'Abrir relatório')
await page.waitForTimeout(500)
await page.getByLabel('Nova observação').fill('Sugiro agendarmos uma conversa inicial. Leve exemplos do dia a dia.')
await clickText('button', 'Registrar observação')
await page.waitForTimeout(300)
await axe('portal-relatorio')
await shot('09-portal-relatorio')

// 11. Relatório BI (profissional)
step('Relatório BI')
await go('/bi')
await axe('bi')
await shot('10-relatorio-bi')

// 12. Governança
step('Governança')
await switchRole('Administração')
await axe('participantes')
await shot('10-participantes')
report.participants = await page.getByText(/de d+ pessoas/).first().innerText().catch(() => '')
await go('/governanca')
await page.getByRole('tab', { name: 'Auditoria' }).click()
await clickText('button', 'Verificar integridade do log')
await page.waitForTimeout(200)
report.auditVerification = await page.locator('[role="status"]').first().innerText().catch(() => '')
await axe('governanca-auditoria')
await shot('11-governanca-auditoria')
await page.getByRole('tab', { name: 'Liberação' }).click()
await page.waitForTimeout(200)
await axe('governanca-liberacao')
await shot('12-governanca-liberacao')

// 13. Participante: painel, revogação, perfil, ajuda, referências
step('Painel e revogação')
await switchRole('Participante')
await go('/painel')
await axe('painel')
await shot('13-painel')
await go('/compartilhar')
await clickText('button', 'Revogar')
await page.getByRole('button', { name: 'Revogar acesso' }).click()
await page.waitForTimeout(300)
await switchRole('Profissional')
await page.getByLabel('Código de acesso').fill(code)
await clickText('button', 'Abrir relatório')
await page.waitForTimeout(300)
report.revokedMessage = await page.getByText('Este acesso foi revogado pela pessoa avaliada.').count()
await switchRole('Participante')

for (const [route, name] of [
  ['/perfil', 'perfil'],
  ['/avaliacoes', 'avaliacoes'],
  ['/ajuda', 'ajuda'],
  ['/referencias', 'referencias'],
  ['/profissionais', 'profissionais'],
]) {
  step(name)
  await go(route)
  await axe(name)
  await shot(`14-${name}`)
}

// 14. Tema escuro suave + alto contraste + texto 150%
step('Temas e escala de texto')
const lastResult = await page.evaluate(() => JSON.parse(localStorage.getItem('perceber:v2')).sessions.find((s) => s.status === 'completed').id)
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('perceber:v2'))
  s.prefs.theme = 'dusk'
  localStorage.setItem('perceber:v2', JSON.stringify(s))
})
await page.reload()
await go(`/resultado/${lastResult}`)
await axe('resultado-escuro')
await shot('15-resultado-escuro')
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('perceber:v2'))
  s.prefs.theme = 'light'
  s.prefs.contrast = 'high'
  s.prefs.fontScale = 1.5
  localStorage.setItem('perceber:v2', JSON.stringify(s))
})
await page.reload()
await go('/painel')
report.fontScale = await page.evaluate(() => ({
  root: getComputedStyle(document.documentElement).fontSize,
  body: getComputedStyle(document.querySelector('main p') ?? document.body).fontSize,
}))
await axe('painel-alto-contraste-150')
await shot('16-painel-hc-150', false)

// 15. Mobile
step('Mobile')
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('perceber:v2'))
  s.prefs.contrast = 'normal'
  s.prefs.fontScale = 1
  localStorage.setItem('perceber:v2', JSON.stringify(s))
})
await page.reload()
await page.setViewportSize({ width: 390, height: 844 })
for (const [route, name] of [
  ['/', 'm-inicio'],
  [`/resultado/${lastResult}`, 'm-resultado'],
  ['/painel', 'm-painel'],
  ['/compartilhar', 'm-compartilhar'],
]) {
  await go(route)
  await page.waitForTimeout(300)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  report[`overflow-${name}`] = overflow
  if (overflow > 0) {
    report[`overflow-culprits-${name}`] = await page.evaluate(() => {
      const w = document.documentElement.clientWidth
      const clipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX
          if (o !== 'visible' && p.getBoundingClientRect().right <= w + 1) return true
        }
        return false
      }
      return [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > w + 1 && !clipped(el))
        .filter((el) => (el.parentElement?.getBoundingClientRect().right ?? 0) <= w + 1)
        .slice(0, 8)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 90)} → ${Math.round(el.getBoundingClientRect().right)}px · "${(el.textContent || '').trim().slice(0, 40)}"`)
    })
  }
  await axe(name)
  await shot(name)
}
const id2 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('perceber:v2'))
  return s.sessions.find((x) => x.moduleId === 'central').id
})
report.centralSession = id2

report.errors = errors
await writeFile(`${OUT}/state.json`, await page.evaluate(() => localStorage.getItem('perceber:v2')))
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2))
const totalViolations = Object.values(report.axe).reduce((a, v) => a + v.length, 0)
console.log(`\nViolações axe: ${totalViolations} · erros de página: ${errors.length}`)
await browser.close()
server.close()
process.exit(totalViolations || errors.length ? 1 : 0)
