import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { PenLine } from 'lucide-react'
import Reveal from '../components/Reveal'
import Button from '../components/ui/Button'
import Photo from '../components/ui/Photo'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { services } from '../data/services'
import { extraRows, priceText } from '../data/prices'
import SectionHeading from '../components/ui/SectionHeading'
import { OTHER } from '../data/content'

const EASE = [0.22, 1, 0.36, 1]
const promises = ['[X]-day warranty', 'Repaired in front of you', 'Quality local parts', 'Price agreed first']

// Card where the customer describes a problem that is not in the list
function OtherProblem() {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const q = new URLSearchParams({ issue: OTHER })
    if (note.trim()) q.set('note', note.trim())
    navigate(`/book?${q.toString()}`)
  }
  return (
    <form onSubmit={submit} className="rounded-[28px] border-2 border-dashed border-field bg-white p-6 transition-colors hover:border-accent md:p-8">
      <div className="flex flex-wrap items-start gap-6">
        <span className="grid size-[88px] shrink-0 place-items-center rounded-[24px] bg-tint text-accent"><PenLine size={34} strokeWidth={2} aria-hidden="true" /></span>
        <div className="min-w-[240px] flex-1">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Other problem</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Not in the list? Describe the problem in your own words and we will look at it. Diagnosis is free.</p>
          <label htmlFor="svc-other" className="sr-only">Describe your problem</label>
          <textarea
            id="svc-other"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. The phone turns off when I make a call"
            className="mt-4 w-full rounded-[14px] border border-field bg-white px-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex w-full flex-col justify-end sm:w-[210px]">
          <Button type="submit">Book this repair</Button>
        </div>
      </div>
    </form>
  )
}

export default function Services() {
  const reduce = useReducedMotion()
  useDocumentTitle(
    'Phone Repair Services — FixPoint Manchester',
    'Screen, battery, charging port, camera, back glass, water damage and more — repaired at your door in Manchester.',
  )

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      {/* 1. Hero */}
      <section className="grid items-center gap-10 pt-12 md:grid-cols-2 md:pt-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Services</p>
          <h1 className="text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
            Every repair your phone needs, done at your door
          </h1>
          <p className="mt-5 max-w-[480px] text-[17px] leading-relaxed text-muted">
            From cracked screens to water damage, we repair phones and tablets in front of you across Manchester — with the price agreed first and a warranty.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/book" variant="dark" size="lg">Book a repair</Button>
            <Button to="/prices" variant="secondary" size="lg">See price list</Button>
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Photo src="/images/services/screen.webp" alt="Technician’s tools next to a phone with a cracked screen" rounded="rounded-[32px]" className="h-[300px] md:h-[420px]" />
        </motion.div>
      </section>

      {/* 2. Service list */}
      <section className="mt-16 space-y-4 lg:mt-[100px]" aria-label="All repair services">
        {services.map((s) => (
          <Reveal key={s.id}>
            <article className="group flex flex-wrap gap-6 rounded-[28px] border border-line bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF] md:p-6">
              <Photo src={s.image} alt={`${s.name}: repair in progress`} rounded="rounded-[20px]" className="h-[200px] w-full sm:w-[260px]" />
              <div className="min-w-[240px] flex-1 py-1">
                <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{s.name}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.long}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <li key={t} className="rounded-full bg-[#F6F7F9] px-3 py-1.5 text-xs font-semibold text-body">{t}</li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col justify-center gap-1 py-1 sm:w-[210px] sm:border-l sm:border-line sm:pl-6">
                <p className="text-[13px] font-semibold text-muted">{s.priceLabel}</p>
                <p className="text-2xl font-extrabold tracking-[-0.02em]">{s.price}</p>
                <p className="text-[13px] text-muted">Time: about [time]</p>
                <Button to={`/book?issue=${s.id}`} className="mt-3">Book this repair</Button>
              </div>
            </article>
          </Reveal>
        ))}
        <Reveal><OtherProblem /></Reveal>
      </section>

      {/* Extra services (from the client's price list) */}
      <Reveal className="mt-16 lg:mt-[100px]">
        <section aria-label="Extra services">
          <SectionHeading eyebrow="Extras" title="Extra services" text="Small jobs and helpful extras. Collection and delivery are free locally." />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {extraRows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 rounded-[20px] border border-line bg-white p-5">
                <span className="text-[15px] font-bold leading-snug">{r.label}</span>
                <span className={`whitespace-nowrap text-base font-extrabold ${r.free ? 'text-success' : ''}`}>{priceText(r)}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      {/* 3. Promise band */}
      <Reveal className="mt-16 lg:mt-[100px]">
        <section className="grid items-center gap-8 rounded-[36px] bg-ink p-8 text-white md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Our repair promise</h2>
            <p className="mt-4 max-w-[380px] text-base leading-relaxed text-[#C9CCD6]">
              If we can't fix it, you don't pay for the repair.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {promises.map((p) => (
              <li key={p} className="flex min-h-[88px] items-center rounded-[20px] bg-[#1A1C24] p-5 text-[15px] font-bold">{p}</li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  )
}
