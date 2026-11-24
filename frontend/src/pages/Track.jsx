import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Check, MapPin, MessageCircle, Phone, Search, Wallet } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Avatar from '../components/ui/Avatar'
import { toast } from '../components/ui/Toast'
import OrderChat from '../components/OrderChat'
import { RescheduleModal, CancelOrderModal } from '../components/CustomerOrderActions'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { STATUSES, statusLabel, useOrders, useSession, useStored } from '../lib/store'
import { FLOW, TECH_KEY, answerQuote, customerCanChange, distanceKm, etaMinutes, warrantyUntil } from '../lib/orders'
import { deviceLabel, formatDate, formatDateTime, orderPriceLabel, samePhone, timeAgo } from '../lib/format'
import { BUSINESS } from '../data/business'
import { SITE } from '../data/site'

const TrackMap = lazy(() => import('../components/TrackMap'))
const label = (id) => STATUSES.find((s) => s.id === id)?.label || id
const last4 = (phone) => String(phone || '').replace(/\D/g, '').slice(-4)

// Steps with the time each one happened
function Timeline({ o }) {
  const reduce = useReducedMotion()
  const idx = FLOW.indexOf(o.status)
  const when = (s) => (s === 'new' ? o.createdAt : [...(o.statusHistory || [])].reverse().find((h) => h.to === s)?.at)
  const pct = idx <= 0 ? 0 : (idx / (FLOW.length - 1)) * 100
  return (
    <div className="relative">
      <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-line sm:left-4 sm:right-4 sm:top-[17px] sm:bottom-auto sm:h-0.5 sm:w-auto" aria-hidden="true" />
      {/* Progress line (desktop): grows when the status moves on */}
      <motion.div className="absolute left-4 top-[17px] hidden h-0.5 bg-accent sm:block" aria-hidden="true"
        initial={false} animate={{ width: `calc(${pct}% * 0.8)` }} transition={{ duration: reduce ? 0 : 0.6 }} />
      <ol className="relative grid gap-4 sm:grid-cols-5">
        {FLOW.map((s, i) => {
          const done = i <= idx
          const current = i === idx
          return (
            <li key={s} className="flex items-center gap-3 sm:block sm:text-center">
              <span className={`relative grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold sm:mx-auto ${done ? 'bg-accent text-white' : 'bg-white text-muted ring-2 ring-line'}`}>
                {current && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" aria-hidden="true" />}
                <span className="relative">{done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}</span>
              </span>
              <span className="sm:mt-2 sm:block">
                <span className={`block text-sm font-bold ${done ? 'text-ink' : 'text-muted'}`}>{label(s)}</span>
                {done && when(s) && <span className="block text-xs text-muted">{formatDateTime(when(s))}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function LiveMap({ o }) {
  const all = useStored(TECH_KEY, {})
  const [, tick] = useState(0)
  // Re-read every 10 s while the page is visible (other devices update the location)
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') { window.dispatchEvent(new Event('fp-store')); tick((n) => n + 1) } }, 10000)
    return () => clearInterval(t)
  }, [])
  const tech = all[o.id] || null
  const stale = tech && Date.now() - new Date(tech.at).getTime() > 120000
  return (
    <section className="rounded-[24px] border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><span className="size-2.5 animate-pulse rounded-full bg-success" aria-hidden="true" /> Your technician is on the way</h2>
      <p className="mt-1 text-sm text-muted">
        {tech && o.location ? <>About <b className="text-ink">{etaMinutes(tech, o.location)} min</b> away (approx., {distanceKm(tech, o.location).toFixed(1)} km). {stale ? `Last updated ${timeAgo(tech.at)}.` : `Updated ${timeAgo(tech.at)}.`}</> : 'The live location will show here in a moment.'}
      </p>
      {o.location && (
        <Suspense fallback={<div className="mt-4 h-[280px] animate-pulse rounded-[18px] bg-[#E9EDF2]" />}>
          <TrackMap home={o.location} tech={tech} className="mt-4 h-[280px] sm:h-[340px]" />
        </Suspense>
      )}
    </section>
  )
}

function OrderView({ o }) {
  const [modal, setModal] = useState(null)
  const prev = useRef(o.status)
  // Tell the customer when the status changes while the page is open
  useEffect(() => {
    if (prev.current !== o.status) { toast(`Update: ${label(o.status)}`, { tone: 'info' }); prev.current = o.status }
  }, [o.status])
  const until = warrantyUntil(o)
  const wa = `${SITE.whatsapp}${SITE.whatsapp.includes('?') ? '&' : '?'}text=${encodeURIComponent(`Hi, it’s about my repair ${o.id}`)}`

  return (
    <div className="mt-8 space-y-5">
      <section className="rounded-[28px] border border-line bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{o.id}</p>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{o.type === 'accessory' ? 'Accessories order' : deviceLabel(o.device?.brand, o.device?.model)}</h2>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${o.status === 'completed' ? 'bg-success-tint text-success' : o.status === 'cancelled' ? 'bg-[#FDECEA] text-danger' : 'bg-tint text-accent'}`}>{statusLabel(o.status)}</span>
        </div>
        {o.status === 'cancelled'
          ? <p className="mt-6 rounded-2xl bg-[#FDECEA] p-4 text-sm text-danger">This booking was cancelled{o.cancelReason ? ` (${o.cancelReason.toLowerCase()})` : ''}.</p>
          : <div className="mt-8"><Timeline o={o} /></div>}
      </section>

      {o.quote?.status === 'pending' && (
        <section className="rounded-[24px] border-2 border-[#F2C94C] bg-[#FFFBEF] p-5">
          <h2 className="text-lg font-extrabold">New price for your repair: £{Number(o.quote.amount).toFixed(2)}</h2>
          {o.quote.note && <p className="mt-1 text-sm text-body">{o.quote.note}</p>}
          <p className="mt-1 text-xs text-muted">Nothing extra is done until you approve.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => { answerQuote(o, true); toast('Thanks, the new price is approved.') }} className="!h-10 !text-sm">Approve £{Number(o.quote.amount).toFixed(2)}</Button>
            <button type="button" onClick={() => { answerQuote(o, false); toast('Quote declined. We will be in touch.', { tone: 'info' }) }} className="h-10 rounded-full px-4 text-sm font-bold text-danger hover:bg-[#FDECEA]">Decline</button>
          </div>
        </section>
      )}

      {o.status === 'on-the-way' && <LiveMap o={o} />}

      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        <section className="rounded-[24px] border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">Your visit</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex gap-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-accent" /><div><dt className="sr-only">When</dt><dd className="font-semibold">{o.slot?.date ? `${formatDate(o.slot.date, { year: true })}, ${o.slot.time || ''}` : 'We will call you to arrange a time'}</dd></div></div>
            <div className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-accent" /><div><dt className="sr-only">Address</dt><dd className="font-semibold">{[o.customer?.address, o.customer?.postcode].filter(Boolean).join(', ') || '—'}</dd>{o.notes && <dd className="text-xs text-muted">Access notes: {o.notes}</dd>}</div></div>
            <div className="flex gap-3"><Wallet size={17} className="mt-0.5 shrink-0 text-accent" /><div><dt className="sr-only">Price</dt><dd className="font-semibold">{o.price != null ? `£${Number(o.price).toFixed(2)}` : orderPriceLabel(o) === '—' ? 'Confirmed with you before we start' : orderPriceLabel(o)}</dd>{o.price == null && <dd className="text-xs text-muted">Final price agreed before any work starts.</dd>}</div></div>
          </dl>
          {o.receipt && (
            <div className="mt-4 rounded-2xl bg-success-tint p-3.5 text-sm">
              <b className="text-success">Receipt {o.receipt.number}</b>
              {until && <p className="text-body">Warranty until {formatDate(until, { year: true })}</p>}
              <Link to={`/receipt/${o.id}`} className="mt-1 inline-block font-bold text-accent underline">View or download receipt</Link>
            </div>
          )}
          {customerCanChange(o) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setModal('move')} className="!h-10 !text-sm">Change the time</Button>
              <button type="button" onClick={() => setModal('cancel')} className="h-10 rounded-full px-4 text-sm font-bold text-danger hover:bg-[#FDECEA]">Cancel booking</button>
            </div>
          )}
        </section>
        <section className="rounded-[24px] border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">Your technician</h2>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={BUSINESS.techName} photo={BUSINESS.techPhoto} size="md" />
            <div><p className="font-bold">{BUSINESS.techName}</p><p className="text-xs text-muted">FixPoint, Manchester</p></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`tel:${SITE.phone}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-field text-sm font-bold hover:border-accent hover:text-accent"><Phone size={14} /> Call</a>
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-field text-sm font-bold hover:border-whatsapp hover:text-whatsapp"><MessageCircle size={14} /> WhatsApp</a>
          </div>
        </section>
      </div>

      {o.type === 'repair' && (
        <section id="messages" className="scroll-mt-24 rounded-[24px] border border-line bg-white p-5">
          <h2 className="mb-3 text-lg font-extrabold">Messages</h2>
          <OrderChat order={o} side="customer" />
        </section>
      )}

      {modal === 'move' && <RescheduleModal order={o} onClose={() => setModal(null)} />}
      {modal === 'cancel' && <CancelOrderModal order={o} onClose={() => setModal(null)} />}
    </div>
  )
}

/*
  /track/FP-XXXXXX: logged-in customers see their own orders straight away. Anyone else enters the
  reference and the last 4 digits of the phone number used to book.
*/
export default function Track() {
  useDocumentTitle('Track Your Repair — FixPoint', 'See the status of your repair and where your technician is.')
  const { ref: routeRef } = useParams()
  const [params] = useSearchParams()
  const session = useSession()
  const orders = useOrders()
  const [ref, setRef] = useState(routeRef || params.get('ref') || '')
  const [digits, setDigits] = useState(params.get('p') || '')
  const [unlocked, setUnlocked] = useState(null) // order id opened with ref + digits
  const [error, setError] = useState('')

  const clean = (v) => String(v || '').replace(/\s+/g, '').toUpperCase()
  const own = (o) => session && ((o.userEmail && o.userEmail === session.email) || (session.phone && samePhone(o.customer?.phone, session.phone)))
  const wanted = clean(routeRef || params.get('ref'))
  const order = useMemo(() => {
    const id = unlocked || wanted
    const o = id ? orders.find((x) => clean(x.id) === id) : null
    if (!o) return null
    if (own(o) || unlocked === clean(o.id) || (params.get('p') && last4(o.customer?.phone) === params.get('p'))) return o
    return null
  }, [orders, unlocked, wanted, session, params]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault()
    const o = orders.find((x) => clean(x.id) === clean(ref))
    if (!o || last4(o.customer?.phone) !== digits.replace(/\D/g, '').slice(-4)) { setError('We couldn’t find that booking. Check the reference and the last 4 digits of your phone number.'); return }
    setError('')
    setUnlocked(clean(o.id))
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 md:py-16">
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Track repair</p>
      <h1 className="text-[clamp(34px,4.6vw,54px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Where is my repair?</h1>
      {!order && (
        <>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">Enter your booking reference (like FP-AB12CD) and the last 4 digits of the phone number you booked with.{!session && <> Have an account? <Link to="/login" className="font-bold text-accent">Log in</Link> to see all your repairs.</>}</p>
          <form onSubmit={submit} className="mt-8 grid gap-4 rounded-[28px] border border-line bg-white p-6 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <Field label="Booking reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="FP-XXXXXX" />
            <Field label="Last 4 digits of phone" inputMode="numeric" maxLength={4} value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0123" />
            <Button type="submit" variant="dark"><Search size={16} strokeWidth={2} /> Track</Button>
          </form>
          {error && <p role="alert" className="mt-4 rounded-2xl bg-white p-5 text-[15px] text-body">{error} Or <a href={SITE.whatsapp} className="font-bold text-accent underline">message us</a>.</p>}
        </>
      )}
      {order && <OrderView o={order} />}
    </div>
  )
}
