import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, PenLine, Search, SearchX, X } from 'lucide-react'
import Reveal from '../components/Reveal'
import Button from '../components/ui/Button'
import Photo from '../components/ui/Photo'
import Modal from '../components/ui/Modal'
import { ProblemBox } from '../components/MediaUpload'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { services } from '../data/services'
import { extraRows, freeFirst, priceText } from '../data/prices'
import SectionHeading from '../components/ui/SectionHeading'
import { OTHER } from '../data/content'

const EASE = [0.22, 1, 0.36, 1]

// Search: every word typed must appear in the service's text (name, description, tags, extra words)
const EXTRA_WORDS = {
  screen: 'display glass lcd oled smashed broken touch lines black',
  battery: 'charge drains dies dead power swollen percentage',
  'charging-port': 'charger cable usb plug socket lightning type-c not charging',
  camera: 'photo picture blurry lens focus selfie video',
  'back-glass': 'rear back cover housing cracked back',
  'water-damage': 'wet water liquid rain toilet drink dropped in water',
  'speaker-mic': 'sound audio volume call hear microphone earpiece loudspeaker',
  'software-data': 'slow frozen stuck update virus apps data transfer backup boot loop restart',
}
const words = (q) => q.toLowerCase().split(/\s+/).filter(Boolean)
const matches = (text, q) => words(q).every((w) => text.toLowerCase().includes(w))
const serviceText = (s) => [s.name, s.short, s.long, ...s.tags, EXTRA_WORDS[s.id] || ''].join(' ')
const promises = ['[X]-day warranty', 'Repaired in front of you', 'Quality parts', 'Price agreed first']

// Form inside the "Describe your problem" window: own words + photos / video, then go to booking.
// initialNote: the search text, when the search found nothing.
function OtherProblem({ id, initialNote = '' }) {
  const navigate = useNavigate()
  const [note, setNote] = useState(initialNote)
  const [files, setFiles] = useState([])
  const ready = note.trim().length > 0 || files.length > 0
  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    const q = new URLSearchParams({ issue: OTHER })
    if (note.trim()) q.set('note', note.trim())
    // Files cannot go in the URL, so they travel in the router state
    navigate(`/book?${q.toString()}`, { state: { files } })
  }
  return (
    <form onSubmit={submit}>
      <ProblemBox
        id={id}
        label="What is happening?"
        note={note}
        onNote={setNote}
        files={files}
        onFiles={setFiles}
        placeholder="e.g. The phone turns off when I make a call"
      />
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-semibold text-body">
          {['Free diagnosis', 'Price agreed before we start'].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check size={16} strokeWidth={2.5} className="text-success" aria-hidden="true" />{t}</li>
          ))}
        </ul>
        {/* Grey until there is a description, a photo or a video */}
        <Button type="submit" size="lg" disabled={!ready} title={ready ? undefined : 'Describe the problem or add a photo or video first'} className="w-full sm:w-auto">Book this repair <ArrowRight size={18} strokeWidth={2} aria-hidden="true" /></Button>
      </div>
    </form>
  )
}

export default function Services() {
  const reduce = useReducedMotion()
  const [query, setQuery] = useState('')
  const [describe, setDescribe] = useState(false) // "Describe your problem" window
  const q = query.trim()
  const shownServices = useMemo(() => (q ? services.filter((s) => matches(serviceText(s), q)) : services), [q])
  const shownExtras = useMemo(() => freeFirst(extraRows).filter((r) => !r.hidden && (!q || matches(r.label, q))), [q])
  const nothing = q && !shownServices.length && !shownExtras.length
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

      {/* 2. Search */}
      <section className="mt-14 lg:mt-20" aria-label="Search services">
        <div className="flex flex-col gap-3 rounded-[24px] border border-line bg-white p-3 sm:flex-row sm:items-center sm:rounded-full sm:p-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="svc-search" className="sr-only">Search our services</label>
            <Search size={19} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="svc-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a repair, e.g. cracked screen, battery, not charging"
              className="h-12 w-full rounded-full bg-[#F6F7F9] pl-12 pr-11 text-[15px] text-ink outline-none placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-line hover:text-ink">
                <X size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDescribe(true)}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-field bg-white px-5 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <PenLine size={16} strokeWidth={2} aria-hidden="true" /> Can’t find it? Describe it
          </button>
        </div>
        <p className="mt-3 px-2 text-sm text-muted" role="status">
          {q ? (nothing ? '' : `${shownServices.length + shownExtras.length} result${shownServices.length + shownExtras.length === 1 ? '' : 's'} for “${q}”`) : 'Search our repairs and extras, or describe your own problem and add photos or a video.'}
        </p>
      </section>

      {/* 3. Service list */}
      {nothing && (
        <div className="mt-6 rounded-[28px] border-2 border-dashed border-field bg-white px-6 py-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-tint text-accent"><SearchX size={26} strokeWidth={2} aria-hidden="true" /></span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">No service matches “{q}”</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-[15px] leading-relaxed text-muted">No problem. Describe it in your own words and add a photo or video. We will check it for free and tell you the price.</p>
          <Button onClick={() => setDescribe(true)} className="mt-6"><PenLine size={16} strokeWidth={2} /> Describe your problem</Button>
        </div>
      )}
      <section className={`space-y-4 ${shownServices.length ? 'mt-6' : ''}`} aria-label="All repair services">
        {shownServices.map((s) => (
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
      </section>

      {/* Extra services (from the client's price list) */}
      {shownExtras.length > 0 && <Reveal className={q ? 'mt-12' : 'mt-16 lg:mt-[100px]'}>
        <section aria-label="Extra services">
          <SectionHeading eyebrow="Extras" title="Extra services" text="Small jobs and helpful extras. Tap one to book it. Collection and delivery are free locally." />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shownExtras.map((r) => (
              <li key={r.id}>
                {/* Opens the booking with this extra service already chosen */}
                <Link to={`/book?issue=${r.id}`} aria-label={`Book: ${r.label}, ${priceText(r)}`}
                  className="group flex h-full items-center gap-4 rounded-[20px] border border-line bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-snug">{r.label}</span>
                    <span className={`mt-0.5 block text-sm font-extrabold ${r.free ? 'text-success' : ''}`}>{priceText(r)}</span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint text-accent transition-colors group-hover:bg-accent group-hover:text-white" aria-hidden="true">
                    <ArrowRight size={16} strokeWidth={2} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>}

      {/* 3. Promise band */}
      <Reveal className="mt-16 lg:mt-[100px]">
        <section className="grid items-center gap-8 rounded-[28px] bg-ink p-6 text-white sm:rounded-[36px] sm:p-8 md:grid-cols-2 md:p-12">
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

      {/* "Can't find it? Describe it": the search text is copied into the description */}
      <Modal open={describe} onClose={() => setDescribe(false)} title="Describe your problem" text="Tell us what is happening and add a photo or video if you can. Diagnosis is free.">
        <OtherProblem key={describe ? q : 'closed'} id="svc-describe" initialNote={nothing ? q : ''} />
      </Modal>
    </div>
  )
}
