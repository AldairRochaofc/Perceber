/** Identificadores e códigos. Usa a API criptográfica do navegador quando disponível. */
function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(out)
  else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256)
  return out
}

export function uid(prefix = ''): string {
  const hex = Array.from(randomBytes(10), (b) => b.toString(16).padStart(2, '0')).join('')
  return prefix ? `${prefix}_${hex}` : hex
}

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L) para ditar ou digitar com segurança. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function accessCode(): string {
  const bytes = randomBytes(8)
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length])
  return `PRC-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

export function normalizeCode(input: string): string {
  const clean = input.toUpperCase().replace(/[^0-9A-Z]/g, '')
  const body = clean.startsWith('PRC') ? clean.slice(3) : clean
  if (body.length !== 8) return input.trim().toUpperCase()
  return `PRC-${body.slice(0, 4)}-${body.slice(4)}`
}

/** Pseudônimo estável para a área de pesquisa: não reversível sem a chave. */
export function pseudonym(id: string, salt: string): string {
  let h = 2166136261
  for (const ch of salt + id) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return `P-${(h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`
}
