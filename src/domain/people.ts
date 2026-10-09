import type { AgeBand } from './types'

/** Gênero declarado no cadastro e agregados do público pesquisado. */
export type Gender = 'mulher' | 'homem' | 'nao-binario' | 'prefer-not'

export const GENDERS: Gender[] = ['mulher', 'homem', 'nao-binario', 'prefer-not']

export const GENDER_LABEL: Record<Gender, string> = {
  mulher: 'Mulher',
  homem: 'Homem',
  'nao-binario': 'Não binário',
  'prefer-not': 'Prefere não informar',
}

export const AGE_BANDS: AgeBand[] = ['18-24', '25-34', '35-44', '45-59', '60+', 'prefer-not']

export const AGE_LABEL: Record<AgeBand, string> = {
  '18-24': '18 a 24 anos',
  '25-34': '25 a 34 anos',
  '35-44': '35 a 44 anos',
  '45-59': '45 a 59 anos',
  '60+': '60 anos ou mais',
  'prefer-not': 'Prefere não informar',
}

type WithDemographics = { gender?: Gender; ageBand: AgeBand }

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0)

export function genderBreakdown(people: WithDemographics[]) {
  const total = people.length
  return GENDERS.map((g) => {
    const n = people.filter((p) => (p.gender ?? 'prefer-not') === g).length
    return { gender: g, label: GENDER_LABEL[g], n, pct: pct(n, total) }
  })
}

/** Público pesquisado: homens e mulheres, quantidade e porcentagem entre os dois. */
export function binaryAudience(people: WithDemographics[]) {
  const men = people.filter((p) => p.gender === 'homem').length
  const women = people.filter((p) => p.gender === 'mulher').length
  const total = men + women
  return {
    men,
    women,
    total,
    menPct: pct(men, total),
    womenPct: pct(women, total),
    /** Razão de gênero: homens para cada 100 mulheres (convenção do IBGE). */
    ratio: women ? Math.round((men / women) * 1000) / 10 : null,
  }
}

export function ageBreakdown(people: WithDemographics[]) {
  const total = people.length
  return AGE_BANDS.map((a) => {
    const n = people.filter((p) => p.ageBand === a).length
    return { ageBand: a, label: AGE_LABEL[a], n, pct: pct(n, total) }
  })
}

/** Faixa etária mais frequente, ignorando "prefere não informar". */
export function predominantAge(people: WithDemographics[]) {
  const rows = ageBreakdown(people).filter((r) => r.ageBand !== 'prefer-not' && r.n > 0)
  return rows.sort((a, b) => b.n - a.n)[0] ?? null
}
