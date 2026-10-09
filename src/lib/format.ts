const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const dateShort = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('pt-BR')

export const fmtDateTime = (iso: string) => dateTime.format(new Date(iso))
export const fmtDate = (iso: string) => dateOnly.format(new Date(iso))
export const fmtDateShort = (iso: string) => dateShort.format(new Date(iso))
export const fmtDecimal = (n: number) => decimal.format(n)
export const fmtInt = (n: number) => integer.format(n)

export function plural(n: number, one: string, many: string) {
  return `${fmtInt(n)} ${n === 1 ? one : many}`
}

export function daysUntil(iso: string, now = Date.now()) {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000)
}

export function addDays(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString()
}

export function minutesLabel(min: number, max: number) {
  return min === max ? `cerca de ${min} minutos` : `entre ${min} e ${max} minutos`
}
