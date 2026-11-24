import { lazy, Suspense, useMemo, useState } from 'react'
import { Check, MessageCircle, Navigation, Radio, Square, Undo2, X } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import Field from '../ui/Field'
import DatePicker, { todayISO } from '../ui/DatePicker'
import { toast } from '../ui/Toast'
import { STATUSES, getOrders, updateOrder, useStored } from '../../lib/store'
import { BUSINESS } from '../../data/business'
import { SCHEDULE } from '../../data/schedule'
import { CANCEL_REASONS, FLOW, MESSAGES, TECH_KEY, UNDO_MIN, canCancel, canUndo, changeStatus, distanceKm, etaMinutes, nextStatus, startSharing, undoStatus, whatsappLink } from '../../lib/orders'
import { useSharingState } from '../../lib/liveLocation'
import { freeSlots, isWorkDay, timeLabel, timeOffOn, toHHMM, toMin } from '../../lib/schedule'
import { formatDate, formatDateTime, lastBookableDay, timeAgo } from '../../lib/format'

const TrackMap = lazy(() => import('../TrackMap'))
const label = (id) => STATUSES.find((s) => s.id === id)?.label || id
const NEXT_TEXT = { confirmed: 'Confirm the visit', 'on-the-way': 'I’m on the way', repairing: 'Start the repair', completed: 'Complete the repair' }
const PAYMENTS = [{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'bank', label: 'Bank transfer' }, { value: 'unpaid', label: 'Not paid yet' }]

/* --------------------------------- confirm -------------------------------- */
function ConfirmModal({ o, onClose }) {
  const [date, setDate] = useState(o.slot?.date || '')
  const [start, setStart] = useState(o.slot?.start ? toMin(o.slot.start) : null)
  const others = useMemo(() => getOrders().filter((x) => x.id !== o.id), [o.id])
  const point = o.location || SCHEDULE.BASE
  const slots = useMemo(() => (date ? freeSlots({ orders: others, date, point, now: new Date() }) : []), [others, date, point])
  // The booked time is always offered (it was free when the customer booked it)
  const options = useMemo(() => {
    const list = [...slots]
    if (o.slot?.start && date === o.slot.date && !list.some((s) => s.start === toMin(o.slot.start))) list.unshift({ start: toMin(o.slot.start), end: toMin(o.slot.end || o.slot.start) + 0, label: timeLabel(toMin(o.slot.start)), travel: o.slot.travelMin })
    return list.sort((a, b) => a.start - b.start)
  }, [slots, o.slot, date])
  const chosen = options.find((s) => s.start === start)

  const save = () => {
    if (!chosen) return
    const end = chosen.start + SCHEDULE.serviceMin
    const slot = { ...o.slot, date, start: toHHMM(chosen.start), end: toHHMM(end), travelMin: chosen.travel ?? o.slot?.travelMin, time: `${timeLabel(chosen.start)} – ${timeLabel(end)}` }
    const r = changeStatus(o, 'confirmed', { slot })
    if (!r.ok) return toast(r.error, { tone: 'error' })
    const wa = whatsappLink(r.order, MESSAGES.confirmed(r.order))
    toast('Confirmed. The customer has been told.', { action: wa ? { label: 'WhatsApp', onClick: () => window.open(wa, '_blank', 'noopener') } : undefined })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Confirm the visit" text="Check the time with the customer, then confirm. They get a message straight away." width={560}>
      <div className="space-y-4">
        <DatePicker label="Day" min={todayISO()} max={lastBookableDay()} value={date} onChange={(v) => { setDate(v); setStart(null) }} isDisabled={(iso) => (!isWorkDay(iso) ? 'closed' : timeOffOn(iso) ? 'time off' : false)} />
        <div>
          <p className="text-[13px] font-bold text-body">Arrival time</p>
          {!options.length ? <p className="mt-2 text-sm text-muted">No free times that day.</p> : (
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((s) => (
                <button key={s.start} type="button" aria-pressed={start === s.start} onClick={() => setStart(s.start)}
                  className={`h-10 rounded-xl border px-3.5 text-sm font-bold transition-colors ${start === s.start ? 'border-accent bg-accent text-white' : 'border-field hover:border-accent'}`}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
        {chosen && <p className="rounded-2xl bg-[#F6F7F9] p-3.5 text-sm text-body">Message: “{MESSAGES.confirmed({ ...o, slot: { date, time: `${timeLabel(chosen.start)} – ${timeLabel(chosen.start + SCHEDULE.serviceMin)}` } })}”</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!chosen}><Check size={16} /> Confirm visit</Button>
        </div>
      </div>
    </Modal>
  )
}

/* -------------------------------- complete -------------------------------- */
function CompleteModal({ o, onClose }) {
  const [f, setF] = useState({ price: o.price ?? o.estimate?.max ?? '', parts: '', partsCost: '', payment: 'cash', warrantyMonths: BUSINESS.warrantyMonths || 3, notes: '' })
  const [error, setError] = useState('')
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = () => {
    if (f.price === '' || Number(f.price) < 0) return setError('Enter the final price.')
    const r = changeStatus(o, 'completed', { completion: f })
    if (!r.ok) return setError(r.error)
    const wa = whatsappLink(r.order, MESSAGES.completed(r.order))
    toast(`Completed. Receipt ${r.order.receipt.number}`, { action: wa ? { label: 'WhatsApp', onClick: () => window.open(wa, '_blank', 'noopener') } : undefined })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Complete the repair" text="This creates a receipt and sends the customer a thank-you with the review link." width={560}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Final price (£)" type="number" min="0" step="0.01" inputMode="decimal" value={f.price} onChange={(e) => { set({ price: e.target.value }); setError('') }} />
          <Select label="Payment" value={f.payment} onChange={(v) => set({ payment: v })} options={PAYMENTS} />
          <Field label="Parts used (optional)" value={f.parts} onChange={(e) => set({ parts: e.target.value })} placeholder="e.g. Screen, adhesive" />
          <Field label="Parts cost (£, optional)" type="number" min="0" step="0.01" value={f.partsCost} onChange={(e) => set({ partsCost: e.target.value })} />
          <Select label="Warranty" value={f.warrantyMonths} onChange={(v) => set({ warrantyMonths: v })} options={[1, 3, 6, 12].map((m) => ({ value: m, label: `${m} month${m > 1 ? 's' : ''}` }))} />
          <Field label="Notes (optional)" value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Work done" />
        </div>
        {error && <p className="text-sm font-semibold text-danger">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Not yet</Button>
          <Button onClick={save}><Check size={16} /> Complete</Button>
        </div>
      </div>
    </Modal>
  )
}

/* --------------------------------- cancel --------------------------------- */
function CancelModal({ o, onClose }) {
  const [reason, setReason] = useState('')
  const [other, setOther] = useState('')
  const final = reason === 'Other' ? other.trim() : reason
  const save = () => {
    const r = changeStatus(o, 'cancelled', { reason: final })
    if (!r.ok) return toast(r.error, { tone: 'error' })
    toast('Order cancelled. The customer has been told.', { tone: 'info' })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Cancel this order?" width={480}>
      <div className="space-y-4">
        <Select label="Reason" placeholder="Choose a reason" value={reason} onChange={setReason} options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))} />
        {reason === 'Other' && <Field label="What happened?" value={other} onChange={(e) => setOther(e.target.value)} />}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Keep the order</Button>
          <Button onClick={save} disabled={!final} className="!bg-danger hover:!bg-[#8f1c13]">Cancel order</Button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------ on the way box ----------------------------- */
function OnTheWay({ o }) {
  const sharing = useSharingState()
  const locations = useStored(TECH_KEY, {})
  const tech = locations[o.id] || null
  const home = o.location
  const mine = sharing.orderId === o.id
  const dist = tech && home ? distanceKm(tech, home) : null
  const nav = home ? `https://www.google.com/maps/dir/?api=1&destination=${home.lat},${home.lon}&travelmode=driving` : null
  const waze = home ? `https://waze.com/ul?ll=${home.lat},${home.lon}&navigate=yes` : null
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {mine && sharing.status === 'on' && <span className="inline-flex items-center gap-2 rounded-full bg-success-tint px-3 py-1.5 text-xs font-bold text-success"><span className="size-2 animate-pulse rounded-full bg-success" />Sharing live location</span>}
        {mine && sharing.status === 'starting' && <span className="rounded-full bg-[#F1F3F7] px-3 py-1.5 text-xs font-bold text-muted">Starting location…</span>}
        {mine && ['denied', 'error'].includes(sharing.status) && <span className="rounded-full bg-[#FDECEA] px-3 py-1.5 text-xs font-bold text-danger">Live location off</span>}
        {mine && <button type="button" onClick={sharing.stop} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold hover:border-danger hover:text-danger"><Square size={11} fill="currentColor" /> Stop</button>}
        {(!mine || ['denied', 'error'].includes(sharing.status)) && <button type="button" onClick={() => startSharing(o.id)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-bold text-white"><Radio size={12} /> {mine ? 'Share again' : 'Share my live location'}</button>}
      </div>
      {mine && sharing.message && <p className="text-xs text-danger">{sharing.message}</p>}
      {home ? (
        <Suspense fallback={<div className="h-[220px] animate-pulse rounded-[18px] bg-[#E9EDF2]" />}>
          <TrackMap home={home} tech={tech} className="h-[220px]" label="Map of you and the customer" />
        </Suspense>
      ) : <p className="text-xs text-muted">This order has no map pin.</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">{dist != null ? <>About <b className="text-ink">{dist.toFixed(1)} km</b> away · approx. <b className="text-ink">{etaMinutes(tech, home)} min</b></> : 'Distance shows once your location is shared.'}{tech && <span className="block text-xs">Updated {timeAgo(tech.at)}</span>}</span>
        <span className="flex gap-2">
          {nav && <a href={nav} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-white"><Navigation size={14} /> Navigate</a>}
          {waze && <a href={waze} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full border border-field px-4 text-sm font-bold hover:border-accent">Waze</a>}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------- status flow ------------------------------- */
export default function StatusFlow({ o }) {
  const [modal, setModal] = useState(null) // 'confirm' | 'complete' | 'cancel'
  const next = nextStatus(o.status)
  const cancelled = o.status === 'cancelled'
  const idx = FLOW.indexOf(o.status)
  const msg = MESSAGES[o.status] && o.status !== 'new' ? MESSAGES[o.status](o) : null
  const wa = msg ? whatsappLink(o, msg) : null

  const advance = () => {
    if (next === 'confirmed') return setModal('confirm')
    if (next === 'completed') return setModal('complete')
    const r = changeStatus(o, next)
    if (!r.ok) return toast(r.error, { tone: 'error' })
    if (next === 'on-the-way') { if (o.location) startSharing(o.id); toast('On the way. The customer can now track you.') }
    if (next === 'repairing') toast('Repair started. Location sharing stopped.')
  }

  return (
    <div>
      {/* Steps */}
      <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
        {FLOW.map((s, i) => {
          const done = !cancelled && i <= idx
          return (
            <li key={s} className="text-center">
              <span className={`mx-auto grid size-8 place-items-center rounded-full text-xs font-bold ${done ? 'bg-accent text-white' : 'bg-line text-muted'} ${i === idx && !cancelled ? 'ring-4 ring-tint' : ''}`}>{done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
              <span className={`mt-1 block text-[11px] font-bold leading-tight ${done ? 'text-ink' : 'text-muted'}`}>{label(s)}</span>
            </li>
          )
        })}
      </ol>

      {cancelled && <p className="mt-4 rounded-2xl bg-[#FDECEA] px-4 py-3 text-sm text-danger"><b>Cancelled</b>{o.cancelReason ? ` · ${o.cancelReason}` : ''}</p>}

      {/* Only the next step can be pressed */}
      {next && !cancelled && (
        <button type="button" onClick={advance} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-base font-extrabold text-white shadow-[0_12px_28px_-14px_rgba(30,79,216,0.8)] transition-colors hover:bg-accent-dark">
          {NEXT_TEXT[next]}
        </button>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canUndo(o) && <button type="button" onClick={() => { undoStatus(o); toast('Last step undone', { tone: 'info' }) }} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold hover:border-ink"><Undo2 size={13} /> Undo last step</button>}
        {canCancel(o.status) && <button type="button" onClick={() => setModal('cancel')} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-danger hover:bg-[#FDECEA]"><X size={13} /> Cancel order</button>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold hover:border-whatsapp hover:text-whatsapp"><MessageCircle size={13} /> Send update on WhatsApp</a>}
      </div>
      {canUndo(o) && <p className="mt-1 text-[11px] text-muted">You can undo for {UNDO_MIN} minutes after a change.</p>}

      {o.status === 'on-the-way' && <OnTheWay o={o} />}

      {o.receipt && (
        <div className="mt-4 rounded-2xl bg-success-tint p-4 text-sm">
          <p className="font-extrabold text-success">Receipt {o.receipt.number}</p>
          <p className="mt-1 text-body">Paid by {PAYMENTS.find((p) => p.value === o.receipt.payment)?.label.toLowerCase()} · warranty {o.receipt.warrantyMonths} months (until {formatDate(new Date(new Date(o.receipt.issuedAt).setMonth(new Date(o.receipt.issuedAt).getMonth() + o.receipt.warrantyMonths)).toISOString(), { year: true })})</p>
          {o.receipt.parts && <p className="text-xs text-muted">Parts: {o.receipt.parts}{o.receipt.partsCost != null ? ` (£${o.receipt.partsCost})` : ''}</p>}
          {BUSINESS.reviewLink && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a href={whatsappLink(o, `Hi ${o.customer?.name?.split(' ')[0] || ''}, thanks for choosing FixPoint! Could you leave us a quick review? ${BUSINESS.reviewLink}`) || BUSINESS.reviewLink} target="_blank" rel="noreferrer"
                onClick={() => updateOrder(o.id, { reviewRequestedAt: new Date().toISOString() })} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-xs font-bold text-ink hover:text-accent">Request review</a>
              {o.reviewRequestedAt && <span className="text-xs text-muted">Requested {formatDate(o.reviewRequestedAt)}</span>}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {o.statusHistory?.length > 0 && (
        <ol className="mt-4 space-y-2 border-l-2 border-line pl-4">
          {[...o.statusHistory].reverse().map((h, i) => (
            <li key={i} className="relative text-xs">
              <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-accent" aria-hidden="true" />
              <b className="text-ink">{label(h.to)}</b> <span className="text-muted">· {formatDateTime(h.at)}{h.note ? ` · ${h.note}` : ''}</span>
            </li>
          ))}
        </ol>
      )}

      {modal === 'confirm' && <ConfirmModal o={o} onClose={() => setModal(null)} />}
      {modal === 'complete' && <CompleteModal o={o} onClose={() => setModal(null)} />}
      {modal === 'cancel' && <CancelModal o={o} onClose={() => setModal(null)} />}
    </div>
  )
}
