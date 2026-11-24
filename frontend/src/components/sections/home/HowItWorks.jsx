import { Stagger, StaggerItem } from '../../Reveal'
import { steps } from '../../../data/content'

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">How it works</p>
          <h2 className="text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            Fixed in three easy steps
          </h2>
        </div>
        <p className="max-w-[300px] text-[15px] leading-relaxed text-muted">
          No queues, no leaving your phone at a shop for days. Book in under a minute.
        </p>
      </div>

      <Stagger className="mt-8 grid gap-3 sm:gap-4 md:mt-10 md:grid-cols-3">
        {steps.map((s, i) => {
          const dark = i === 2
          return (
            <StaggerItem key={s.n}>
              <div
                className={`h-full rounded-[24px] border p-6 transition md:rounded-[28px] md:p-[30px] duration-200 hover:-translate-y-1 ${
                  dark ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-[#C9D6FF]'
                }`}
              >
                <p className={`text-sm font-extrabold ${dark ? 'text-sky' : 'text-accent'}`}>{s.n}</p>
                <h3 className="mt-4 text-xl md:mt-10 md:text-[22px] font-extrabold leading-tight tracking-[-0.02em]">{s.title}</h3>
                <p className={`mt-3 text-[15px] leading-relaxed ${dark ? 'text-[#C9CCD6]' : 'text-muted'}`}>{s.text}</p>
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>
    </section>
  )
}
