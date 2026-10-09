/**
 * Curvas de nível (isolinhas) por marching squares.
 * É o desenho-assinatura do PERCEBER: a "cartografia da percepção".
 * Cálculo puro e determinístico, sem dependências.
 */

export type Peak = { x: number; y: number; h: number; sigma: number }

type Pt = [number, number]

function field(peaks: Peak[], ripple: number) {
  return (x: number, y: number) => {
    let v = 0
    for (const p of peaks) {
      const dx = x - p.x
      const dy = y - p.y
      v += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.sigma * p.sigma))
    }
    if (ripple) v += ripple * (Math.sin(x * 0.021 + y * 0.013) + Math.sin(y * 0.027 - x * 0.009)) * 0.5
    return v
  }
}

const key = ([x, y]: Pt) => `${x.toFixed(2)},${y.toFixed(2)}`

function joinSegments(segments: [Pt, Pt][]): Pt[][] {
  const byPoint = new Map<string, number[]>()
  segments.forEach(([a, b], i) => {
    for (const p of [a, b]) {
      const k = key(p)
      const list = byPoint.get(k)
      if (list) list.push(i)
      else byPoint.set(k, [i])
    }
  })
  const used = new Uint8Array(segments.length)
  const lines: Pt[][] = []
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue
    used[i] = 1
    const line: Pt[] = [segments[i]![0], segments[i]![1]]
    // estende para frente e para trás
    for (const forward of [true, false]) {
      for (;;) {
        const end = forward ? line[line.length - 1]! : line[0]!
        const next = (byPoint.get(key(end)) ?? []).find((j) => !used[j])
        if (next === undefined) break
        used[next] = 1
        const [a, b] = segments[next]!
        const other = key(a) === key(end) ? b : a
        if (forward) line.push(other)
        else line.unshift(other)
      }
    }
    lines.push(line)
  }
  return lines
}

function chaikin(points: Pt[], closed: boolean, iterations = 2): Pt[] {
  let pts = points
  for (let it = 0; it < iterations; it++) {
    const out: Pt[] = []
    const n = pts.length
    if (!closed) out.push(pts[0]!)
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p = pts[i]!
      const q = pts[(i + 1) % n]!
      out.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]])
      out.push([0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]])
    }
    if (!closed) out.push(pts[n - 1]!)
    pts = out
  }
  return pts
}

export type ContourLine = { level: number; d: string }

export function contourPaths(opts: {
  width: number
  height: number
  peaks: Peak[]
  levels: number[]
  cols?: number
  ripple?: number
}): ContourLine[] {
  const { width, height, peaks, levels, cols = 90, ripple = 0 } = opts
  const rows = Math.max(8, Math.round((cols * height) / width))
  const dx = width / cols
  const dy = height / rows
  const f = field(peaks, ripple)
  const grid: number[][] = []
  for (let j = 0; j <= rows; j++) {
    const row: number[] = []
    for (let i = 0; i <= cols; i++) row.push(f(i * dx, j * dy))
    grid.push(row)
  }

  const result: ContourLine[] = []
  for (const t of levels) {
    const segs: [Pt, Pt][] = []
    const lerp = (a: number, b: number) => (t - a) / (b - a || 1e-9)
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v0 = grid[j]![i]!
        const v1 = grid[j]![i + 1]!
        const v2 = grid[j + 1]![i + 1]!
        const v3 = grid[j + 1]![i]!
        const c = (v0 > t ? 8 : 0) | (v1 > t ? 4 : 0) | (v2 > t ? 2 : 0) | (v3 > t ? 1 : 0)
        if (c === 0 || c === 15) continue
        const x = i * dx
        const y = j * dy
        const top: Pt = [x + lerp(v0, v1) * dx, y]
        const right: Pt = [x + dx, y + lerp(v1, v2) * dy]
        const bottom: Pt = [x + lerp(v3, v2) * dx, y + dy]
        const left: Pt = [x, y + lerp(v0, v3) * dy]
        switch (c) {
          case 1: case 14: segs.push([left, bottom]); break
          case 2: case 13: segs.push([bottom, right]); break
          case 3: case 12: segs.push([left, right]); break
          case 4: case 11: segs.push([top, right]); break
          case 6: case 9: segs.push([top, bottom]); break
          case 7: case 8: segs.push([left, top]); break
          case 5: segs.push([left, top], [bottom, right]); break
          case 10: segs.push([left, bottom], [top, right]); break
        }
      }
    }
    for (const line of joinSegments(segs)) {
      if (line.length < 4) continue
      const closed = key(line[0]!) === key(line[line.length - 1]!)
      const pts = chaikin(closed ? line.slice(0, -1) : line, closed)
      const d = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}${closed ? 'Z' : ''}`
      result.push({ level: t, d })
    }
  }
  return result
}
