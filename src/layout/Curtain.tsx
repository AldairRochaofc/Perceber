import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/motion'
import { INFINITY_PATH } from '../ui/Logo'
import { curtainCovered, curtainRevealed, useCurtain } from './curtainStore'

export function Curtain() {
  const { phase, message } = useCurtain()
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      if (phase === 'covering') {
        gsap.set(el, { autoAlpha: 1, yPercent: 0 })
        const tl = gsap.timeline({ onComplete: curtainCovered })
        tl.fromTo(el, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: 0.8, ease: 'power3.inOut' })
          .fromTo('[data-c-mark]', { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0.3)
          .fromTo('[data-c-path]', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.35)
          .fromTo('[data-c-msg]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.45)
      } else if (phase === 'revealing') {
        gsap.timeline({ onComplete: curtainRevealed })
          .to('[data-c-content]', { autoAlpha: 0, y: -16, duration: 0.35, ease: 'power2.in' })
          .to(el, { yPercent: -100, duration: 0.8, ease: 'power3.inOut' }, '-=0.05')
          .set(el, { autoAlpha: 0, yPercent: 0, clearProps: 'clipPath' })
      }
    },
    { dependencies: [phase], scope: root },
  )

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="grain invisible fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-linear-to-br from-[#2563eb] via-[#17318a] to-[#0a1a47] text-on-deep opacity-0"
    >
      <div className="pointer-events-none absolute -top-1/3 -left-1/4 h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,rgb(122_162_255/0.35),transparent_60%)]" />
      <div data-c-content className="relative grid justify-items-center gap-8 px-6 text-center">
        <span data-c-mark className="grid h-24 w-24 place-items-center rounded-[30%] border border-white/25 bg-white/10 backdrop-blur">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path data-c-path d={INFINITY_PATH} pathLength={1} strokeDasharray="1" />
          </svg>
        </span>
        <p data-c-msg className="max-w-xl font-display text-display-sm font-light text-balance text-on-deep">
          {message}
        </p>
      </div>
    </div>
  )
}
