// Uso: node e2e/shot.mjs <rota> [largura] [nome] [--full] [--setup=script.js]
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const [route = '/', width = '1440', name = 'shot', ...flags] = process.argv.slice(2)
const full = flags.includes('--full')
const dark = flags.includes('--dark')
const reduce = flags.includes('--reduce')
const setupFlag = flags.find((f) => f.startsWith('--state='))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  const p = join('dist', decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]))
  try {
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end()
  }
}).listen(0)
const port = server.address().port
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: Number(width), height: Number(width) < 600 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light', reducedMotion: reduce ? 'reduce' : 'no-preference' })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
if (setupFlag) {
  const state = await readFile(setupFlag.slice(8), 'utf8')
  await page.addInitScript((s) => localStorage.setItem('perceber:v2', s), state)
}
await page.goto(`http://localhost:${port}/#${route}`)
await page.waitForTimeout(2600)
await page.screenshot({ path: `e2e/out/${name}.png`, fullPage: full })
console.log('saved', name, errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no errors')
await browser.close()
server.close()
