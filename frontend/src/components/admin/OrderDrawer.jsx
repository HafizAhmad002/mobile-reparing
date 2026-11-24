import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Mail, MapPin, MessageCircle, Phone, Trash2, X } from 'lucide-react'
import { deleteOrder, updateOrder } from '../../lib/store'
import { mapsLink } from '../../lib/geo'
import StatusFlow from './StatusFlow'
import Select from '../ui/Select'
import { sendQuote } from '../../lib/orders'
import { toast } from '../ui/Toast'
import OrderChat from '../OrderChat'
import { Attachments, DemoTag, StatusBadge, issueName, longDate, money } from './shared'
import { deviceLabel, formatDateTime, formatUkPhone, orderPriceLabel } from '../../lib/format'

const LocationMap = lazy(() => import('../LocationMap'))


// UK mobile "07…" -> WhatsApp "447…"
const waLink = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.startsWith('0') ? `44${digits.slice(1)}` : digits}`
}

const Section = ({ title, children, className = '' }) => (
  <section className={`border-t border-line px-5 py-5 sm:px-6 ${className}`}>
    <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-muted">{title}</h3>
    {children}
  </section>
)
const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm">
    <dt className="shrink-0 text-muted">{label}</dt>
    <dd className="min-w-0 text-right font-semibold">{children}</dd>
  </div>
)

/*
  Side panel with everything about one order. Changes save straight away.
  onViewDay(date): jump to that day in the Schedule.
*/
// Send the customer a new price (e.g. a different part is needed). They approve or decline on the track page.
function QuoteBox({ o }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const q = o.quote
  const send = () => {
    if (!(Number(amount) > 0)) return toast('Enter the new price.', { tone: 'error' })
    sendQuote(o, amount, note); setOpen(false); setAmount(''); setNote('')
    toast('Quote sent to the customer.')
  }
  const tone = { pending: 'bg-[#FFF4DB] text-[#7A5600]', approved: 'bg-success-tint text-success', declined: 'bg-[#FDECEA] text-danger' }
  return (
    <div className="mt-4 border-t border-line pt-4">
      {q && <p className={`mb-3 rounded-2xl px-4 py-2.5 text-sm font-semibold ${tone[q.status]}`}>Quote £{q.amount}: {q.status === 'pending' ? 'waiting for the customer' : q.status}{q.note ? ` · ${q.note}` : ''}</p>}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="h-9 rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent">{q ? 'Send a new quote' : 'Send a quote for approval'}</button>
      ) : (
        <div className="space-y-2">
          <input aria-label="New price (£)" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="New price £" className="h-11 w-full rounded-[14px] border border-field px-4 text-[15px] outline-none focus:border-accent sm:w-48" />
          <textarea aria-label="Why the price changed" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why (e.g. the charging port also needs replacing)" className="w-full rounded-[14px] border border-field px-4 py-2.5 text-sm outline-none focus:border-accent" />
          <div className="flex gap-2">
            <button type="button" onClick={send} className="h-9 rounded-full bg-ink px-4 text-sm font-bold text-white">Send to customer</button>
            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-full px-4 text-sm font-bold text-muted">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderDrawer({ order: o, onClose, onViewDay }) {
  const reduce = useReducedMotion()
  const panel = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const open = Boolean(o)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && !e.defaultPrevented && closeRef.current()
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => panel.current?.focus(), 50)
    return () => { clearTimeout(t); document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [open])

  const set = (patch) => updateOrder(o.id, patch)
  const savePrice = (raw) => {
    const v = raw === '' ? null : Number(raw)
    if (v !== o.price && (v === null || Number.isFinite(v))) set({ price: v })
  }
  const remove = () => { if (window.confirm(`Delete order ${o.id}? This cannot be undone.`)) { deleteOrder(o.id); onClose() } }

  return createPortal(
    <AnimatePresence>
      {o && (
        <div className="fixed inset-0 z-[120]">
          <motion.div className="absolute inset-0 bg-ink/40" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true" />
          <motion.aside
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${o.id}`}
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col bg-white shadow-[0_0_60px_-10px_rgba(14,15,19,0.35)] outline-none"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{o.type === 'accessory' ? 'Accessory order' : 'Repair booking'} · {formatDateTime(o.createdAt)}</p>
                <h2 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-[-0.02em]">{o.id}{o.demo && <DemoTag />}</h2>
                <div className="mt-2"><StatusBadge status={o.status} /></div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-[#F1F3F7] hover:text-ink"><X size={20} strokeWidth={2} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* Quick contact */}
              <div className="flex flex-wrap gap-2 px-5 pb-5 sm:px-6">
                {o.customer?.phone && <a href={`tel:${String(o.customer.phone).replace(/\s/g, '')}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent"><Phone size={15} strokeWidth={2} aria-hidden="true" /> Call</a>}
                {waLink(o.customer?.phone) && <a href={waLink(o.customer.phone)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-bold hover:border-whatsapp hover:text-whatsapp"><MessageCircle size={15} strokeWidth={2} aria-hidden="true" /> WhatsApp</a>}
                {o.customer?.email && <a href={`mailto:${o.customer.email}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent"><Mail size={15} strokeWidth={2} aria-hidden="true" /> Email</a>}
                {o.location && <a href={mapsLink(o.location)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent"><MapPin size={15} strokeWidth={2} aria-hidden="true" /> Directions</a>}
              </div>

              {o.manualCheck && (
                <p className="mx-5 mb-4 rounded-2xl bg-[#FFF4DB] px-4 py-3 text-sm text-[#7A5600] sm:mx-6"><b>Check this address.</b> The postcode could not be checked automatically when this was booked.</p>
              )}

              {/* Status steps */}
              <Section title="Status">
                <StatusFlow o={o} />
              </Section>

              {/* Visit */}
              {o.slot && (
                <Section title="Visit">
                  <dl>
                    <Row label="Day">{longDate(o.slot.date)}</Row>
                    <Row label="Arrive">{o.slot.time || '—'}</Row>
                    {o.slot.travelMin != null && <Row label="Drive there">about {o.slot.travelMin} min</Row>}
                  </dl>
                  {onViewDay && o.slot.date && (
                    <button type="button" onClick={() => onViewDay(o.slot.date)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline">
                      <CalendarDays size={15} strokeWidth={2} aria-hidden="true" /> See this day in the schedule
                    </button>
                  )}
                </Section>
              )}

              {/* Customer + map */}
              <Section title="Customer">
                <dl>
                  <Row label="Name">{o.customer?.name || '—'}</Row>
                  <Row label="Phone">{formatUkPhone(o.customer?.phone) || '—'}</Row>
                  {o.customer?.email && <Row label="Email">{o.customer.email}</Row>}
                  <Row label="Address">{[o.customer?.address, o.customer?.postcode].filter(Boolean).join(', ') || '—'}</Row>
                </dl>
                {o.location ? (
                  <Suspense fallback={<div className="mt-3 h-[200px] animate-pulse rounded-[18px] bg-[#E9EDF2]" />}>
                    <LocationMap point={o.location} readOnly label={`Map of ${o.customer?.name || 'the customer'}'s address`} className="mt-3 h-[200px]" />
                  </Suspense>
                ) : <p className="mt-2 text-xs text-muted">No map pin for this order.</p>}
              </Section>

              {/* What */}
              {o.type === 'accessory' ? (
                <Section title="Items">
                  {o.device && <p className="mb-2 text-sm text-muted">For: <b className="text-ink">{deviceLabel(o.device.brand, o.device.model)}</b></p>}
                  <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
                    {(o.items || []).map((it) => (
                      <li key={it.id} className="flex justify-between gap-3 px-4 py-2.5"><span>{it.qty}× {it.name}</span><b>{it.price != null ? money(it.price * it.qty) : 'Price to confirm'}</b></li>
                    ))}
                  </ul>
                </Section>
              ) : (
                <Section title="Phone & problem">
                    {o.warrantyOf && <p className="mb-2 rounded-2xl bg-[#FFF4DB] px-4 py-2.5 text-sm text-[#7A5600]"><b>Warranty claim</b> for {o.warrantyOf}. No charge if the fault is covered.</p>}
                <p className="text-base font-extrabold">{deviceLabel(o.device?.brand, o.device?.model)}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {(o.issues || []).map((i) => <li key={i} className="rounded-full bg-[#F6F7F9] px-3 py-1 text-xs font-semibold">{issueName(i)}</li>)}
                  </ul>
                  {o.issueNote && <blockquote className="mt-3 rounded-2xl bg-[#F6F7F9] px-4 py-3 text-sm leading-relaxed">“{o.issueNote}”</blockquote>}
                  {o.notes && <p className="mt-2 text-sm text-muted">Access notes: <span className="text-ink">{o.notes}</span></p>}
                  {o.attachments?.length > 0 && (
                    <>
                      <p className="mt-4 text-xs font-bold text-muted">Customer photos / video ({o.attachments.length})</p>
                      <Attachments list={o.attachments} size="lg" />
                      {o.attachments.some((a) => !a.preview) && <p className="mt-2 text-xs text-muted">Videos are listed by name only until the website has its online server.</p>}
                    </>
                  )}
                </Section>
              )}

              {o.type === 'repair' && (
                <Section title="Messages with the customer">
                  <OrderChat order={o} side="admin" />
                </Section>
              )}

              {/* Price */}
              <Section title="Price">
                {o.estimate && <p className="mb-2 text-sm text-muted">Estimate when booked: <b className="text-ink">{orderPriceLabel({ estimate: o.estimate }).replace('est. ', '')}</b></p>}
                <label htmlFor={`price-${o.id}`} className="mb-1.5 block text-[13px] font-bold text-body">Final price (£)</label>
                <input
                  id={`price-${o.id}`} key={`${o.id}-${o.price ?? 'none'}`} type="number" min="0" step="0.01" inputMode="decimal" placeholder="Not set yet"
                  defaultValue={o.price ?? ''}
                  onBlur={(e) => savePrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="h-12 w-full rounded-[14px] border border-field px-4 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent sm:w-48"
                />
                <p className="mt-1.5 text-xs text-muted">Counted in sales when the order is completed.</p>
                {/* Payment */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {[['paid', 'Paid'], ['unpaid', 'Not paid']].map(([k, t]) => {
                    const on = k === 'paid' ? Boolean(o.paid) : !o.paid
                    return <button key={k} type="button" aria-pressed={on} onClick={() => set(k === 'paid' ? { paid: true, paidAt: o.paidAt || new Date().toISOString(), payMethod: o.payMethod || o.receipt?.payment || 'cash' } : { paid: false, paidAt: null })}
                      className={`h-9 rounded-full border px-4 text-sm font-bold ${on ? (k === 'paid' ? 'border-success bg-success-tint text-success' : 'border-danger bg-[#FDECEA] text-danger') : 'border-line text-muted'}`}>{t}</button>
                  })}
                  {o.paid && (
                    <Select ariaLabel="Payment method" variant="compact" className="w-40" value={o.payMethod || o.receipt?.payment || 'cash'} onChange={(v) => set({ payMethod: v })} options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank transfer' }]} />
                  )}
                  {o.paidAt && <span className="text-xs text-muted">Paid {formatDateTime(o.paidAt)}</span>}
                </div>
                {o.type === 'repair' && !['completed', 'cancelled'].includes(o.status) && <QuoteBox o={o} />}
                {o.receipt && <a href={`/receipt/${o.id}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-accent hover:underline">Open receipt {o.receipt.number}</a>}
              </Section>

              {/* Private notes */}
              <Section title="Admin notes (only you see these)">
                <textarea
                  key={o.id}
                  defaultValue={o.adminNote || ''}
                  onBlur={(e) => e.target.value !== (o.adminNote || '') && set({ adminNote: e.target.value })}
                  rows={3}
                  placeholder="e.g. Needs a screen ordered. Parking at the back."
                  className="w-full rounded-[14px] border border-field px-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                />
              </Section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
              <button type="button" onClick={remove} className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-danger hover:bg-[#FDECEA]"><Trash2 size={16} strokeWidth={2} aria-hidden="true" /> Delete</button>
              <button type="button" onClick={onClose} className="h-11 rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-black">Done</button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
