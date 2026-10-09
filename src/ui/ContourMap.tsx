import { useMemo, useRef, type ReactNode } from 'react'
import { gsap, useGSAP, useReducedMotion } from '../lib/motion'
import { contourPaths, type Peak } from './contours'
import { cx } from './cx'

/**
 * Mapa de curvas de nível com moldura de coordenadas (graticule).
 * `children` recebe o SVG de sobreposição (nós, rótulos) no mesmo sistema
 * de coordenadas. O desenho entra uma vez; com movimento reduzido, já aparece pronto.
 */
export function ContourMap({
  width,
  height,
  peaks,
  levels,
  ripple = 0,
  animate = true,
  tone = 'light',
  frame = true,
  className,
  children,
  title,
  description,
}: {
  width: number
  height: number
  peaks: Peak[]
  levels: number[]
  ripple?: number
  animate?: boolean
  tone?: 'light' | 'deep'
  frame?: boolean
  className?: string
  children?: ReactNode
  title?: string
  description?: string
}) {
  const ref = useRef<SVGSVGElement>(null)
  const reduced = useReducedMotion()
  const lines = useMemo(() => contourPaths({ width, height, peaks, levels, ripple }), [width, height, peaks, levels, ripple])
  const maxLevel = Math.max(...levels)

  useGSAP(
    () => {
      if (!animate || reduced || !ref.current) return
      const paths = ref.current.querySelectorAll('[data-contour]')
      gsap.fromTo(
        paths,
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out', stagger: { each: 0.025, from: 'end' } },
      )
      gsap.fromTo(ref.current.querySelectorAll('[data-node]'), { opacity: 0, scale: 0.6, transformOrigin: 'center' }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.06, delay: 0.5 })
    },
    { scope: ref, dependencies: [animate, reduced, lines] },
  )

  const stroke = tone === 'deep' ? 'var(--color-accent-on-deep)' : 'var(--color-accent)'
  const tick = tone === 'deep' ? 'var(--color-on-deep-line)' : 'var(--color-line-strong)'

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className={cx('block h-auto w-full', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {description && <desc>{description}</desc>}
      {frame && (
        <g aria-hidden="true" style={{ stroke: tick }} strokeWidth="1">
          {Array.from({ length: 13 }, (_, i) => {
            const x = (width / 12) * i
            return <line key={`t${i}`} x1={x} y1={0} x2={x} y2={i % 3 === 0 ? 10 : 5} />
          })}
          {Array.from({ length: 13 }, (_, i) => {
            const x = (width / 12) * i
            return <line key={`b${i}`} x1={x} y1={height} x2={x} y2={height - (i % 3 === 0 ? 10 : 5)} />
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const y = (height / 8) * i
            return <line key={`l${i}`} x1={0} y1={y} x2={i % 2 === 0 ? 10 : 5} y2={y} />
          })}
          {Array.from({ length: 9 }, (_, i) => {
            const y = (height / 8) * i
            return <line key={`r${i}`} x1={width} y1={y} x2={width - (i % 2 === 0 ? 10 : 5)} y2={y} />
          })}
        </g>
      )}
      <g fill="none" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
        {lines.map((l, i) => {
          const strength = 0.18 + 0.62 * (l.level / maxLevel)
          return (
            <path
              key={i}
              data-contour
              d={l.d}
              pathLength={1}
              strokeDasharray="1"
              style={{ stroke, strokeOpacity: strength }}
              strokeWidth={l.level === maxLevel ? 1.4 : 1}
            />
          )
        })}
      </g>
      {children}
    </svg>
  )
}
