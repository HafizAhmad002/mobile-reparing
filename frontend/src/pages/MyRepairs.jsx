import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, CalendarClock, LogIn, Search, ShieldAlert, FileText, MapPin, MessageSquare, RotateCcw, ShieldCheck, ShoppingBag, Smartphone, Star, X } from 'lucide-react'
import Button from '../components/ui/Button'
import { RescheduleModal, CancelOrderModal } from '../components/CustomerOrderActions'
import { StatusBadge, issueName } from '../components/admin/shared'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { STATUSES, useOrders, useSession } from '../lib/store'
import { FLOW } from '../lib/orders'
import { claimWarranty, customerCanChange, warrantyUntil } from '../lib/orders'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import { toast } from '../components/ui/Toast'
import { deviceLabel, formatDate, orderPriceLabel, samePhone } from '../lib/format'
import { BUSINESS } from '../data/business'

const ACTIVE = ['new', 'confirmed', 'on-the-way', 'repairing']

// Small 5-step progress bar on each booking card
function Progress({ o }) {
  if (o.status === 'cancelled') return <p className="mt-4 rounded-2xl bg-[#FDECEA] px-4 py-2.5 text-sm font-semibold text-danger">Cancelled{o.cancelReason ? ` (${o.cancelReason.toLowerCase()})` : ''}</p>
  const at = FLOW.indexOf(o.status)
  return (
    <ol className="mt-4 grid grid-cols-5 gap-1.5" aria-label={`Progress: ${STATUSES.find((s) => s.id === o.status)?.label}`}>
      {FLOW.map((id, i) => {
        const done = i <= at
        return (
          <li key={id} className="min-w-0">
            <span className={`block h-1.5 rounded-full ${done ? 'bg-accent' : 'bg-line'}`} />
            <span className={`mt-1.5 hidden items-center gap-1 truncate text-xs font-bold sm:flex ${i === at ? 'text-accent' : done ? 'text-ink' : 'text-muted'}`}>
              {done && i < at && <Check size={11} strokeWidth={3} aria-hidden="true" className="shrink-0" />}
              {stepName(o, id)}
            </span>
          </li>
        )
      })}
      {/* Phones: one line instead of five squeezed labels */}
      <li className="col-span-5 text-xs font-bold text-accent sm:hidden">{stepName(o, o.status)} · step {at + 1} of {FLOW.length}</li>
    </ol>
  )
}
const stepName = (o, id) => (o.type === 'accessory' && id === 'repairing' ? 'Fitting' : STATUSES.find((s) => s.id === id)?.label)

// Not logged in: log in, or find one booking with its reference
function LoggedOut() {
  return (
    <div className="mx-auto max-w-[560px] px-6 py-16 text-center">
      <h1 className="text-[clamp(30px,4vw,42px)] font-extrabold tracking-[-0.03em]">My bookings</h1>
      <p className="mt-3 text-muted">Log in to see all your repairs and accessory orders in one place.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button to="/login" state={{ from: '/my-bookings' }} variant="dark"><LogIn size={16} /> Log in</Button>
        <Button to="/track" variant="secondary"><Search size={16} /> Track with a reference</Button>
      </div>
    </div>
  )
}

/* "My bookings": every repair and accessory order of the logged-in customer, with what they can do on each one */
export default function MyRepairs() {
  useDocumentTitle('My Bookings — FixPoint', 'Your repairs and orders: track them, change the time, receipts and warranty.')
  const session = useSession()
  const orders = useOrders()
  const [tab, setTab] = useState('active')
  const [kind, setKind] = useState('all')
  const [modal, setModal] = useState(null) // { kind, order }
  const mine = useMemo(() => (session ? orders.filter((o) => o.userEmail === session.email || (session.phone && samePhone(o.customer?.phone, session.phone))) : []), [orders, session])
  if (!session) return <LoggedOut />
  const ofKind = mine.filter((o) => kind === 'all' || o.type === kind)
  const list = ofKind.filter((o) => (tab === 'active' ? ACTIVE.includes(o.status) : !ACTIVE.includes(o.status)))
  const pill = (on) => `h-10 rounded-full px-4 text-sm font-bold sm:px-5 ${on ? 'bg-ink text-white' : 'text-body'}`
  const action = 'inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold transition-colors hover:border-accent hover:text-accent'

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 md:py-14">
      <Link to="/account" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"><ArrowLeft size={15} /> My account</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(30px,4vw,42px)] font-extrabold tracking-[-0.03em]">My bookings</h1>
          <p className="mt-1 text-sm text-muted">What you booked, where it is now, and what you can change.</p>
        </div>
        <Button to="/book" variant="dark">Book a repair</Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Show">
          {[['active', `Active (${ofKind.filter((o) => ACTIVE.includes(o.status)).length})`], ['past', `Past (${ofKind.filter((o) => !ACTIVE.includes(o.status)).length})`]].map(([k, text]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={pill(tab === k)}>{text}</button>
          ))}
        </div>
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Type">
          {[['all', 'All'], ['repair', 'Repairs'], ['accessory', 'Accessories']].map(([k, text]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={pill(kind === k)}>{text}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-field bg-white px-6 py-12 text-center">
          <p className="font-bold">{tab === 'active' ? 'Nothing in progress' : 'Nothing here yet'}</p>
          <p className="mt-1 text-sm text-muted">{tab === 'active' && mine.length > 0 ? 'Your earlier bookings are under “Past”.' : 'When you book a repair or order accessories, it shows here.'}</p>
          <Button to="/book" variant="dark" className="mt-4">Book a repair</Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((o) => {
            const Icon = o.type === 'accessory' ? ShoppingBag : Smartphone
            const until = warrantyUntil(o)
            const underWarranty = until && until > new Date()
            const again = o.device ? `/book?${new URLSearchParams({ kind: o.device.kind || 'phone', brand: o.device.brand, model: o.device.model })}` : '/book'
            return (
              <li key={o.id} className="rounded-[24px] border border-line bg-white p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Icon size={22} aria-hidden="true" /></span>
                  <div className="min-w-[200px] flex-1">
                    <p className="text-base font-extrabold">{o.type === 'accessory' ? `Accessories (${o.items?.length || 0})` : deviceLabel(o.device?.brand, o.device?.model)}</p>
                    <p className="text-sm text-muted">{o.type === 'accessory' ? (o.items || []).map((it) => `${it.qty > 1 ? `${it.qty}× ` : ''}${it.name}`).join(', ') : (o.issues || []).map(issueName).join(', ')} · {o.id}</p>
                    {o.slot?.date && <p className="mt-1 flex items-center gap-1.5 text-sm"><CalendarClock size={14} className="text-accent" aria-hidden="true" />{formatDate(o.slot.date, { year: true })}{o.slot.time ? `, ${o.slot.time}` : ''}</p>}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <p className="mt-2 text-sm font-bold">{orderPriceLabel(o)}</p>
                  </div>
                </div>
                <Progress o={o} />
                {until && <p className={`mt-3 flex items-center gap-1.5 text-xs font-bold ${underWarranty ? 'text-success' : 'text-muted'}`}><ShieldCheck size={14} aria-hidden="true" /> Warranty until {formatDate(until, { year: true })}</p>}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Link to={`/track/${o.id}`} className={`${action} !border-accent !bg-accent !text-white hover:!bg-accent-dark`}><MapPin size={13} /> Track</Link>
                  {customerCanChange(o) && <button type="button" onClick={() => setModal({ kind: 'move', order: o })} className={action}><CalendarClock size={13} /> Reschedule</button>}
                  {customerCanChange(o) && <button type="button" onClick={() => setModal({ kind: 'cancel', order: o })} className={`${action} hover:!border-danger hover:!text-danger`}><X size={13} /> Cancel</button>}
                  {o.type === 'repair' && <Link to={`/track/${o.id}#messages`} className={action}><MessageSquare size={13} /> Message technician</Link>}
                  {o.receipt && <Link to={`/receipt/${o.id}`} className={action}><FileText size={13} /> Receipt</Link>}
                  {o.status === 'completed' && BUSINESS.reviewLink && <a href={BUSINESS.reviewLink} target="_blank" rel="noreferrer" className={action}><Star size={13} /> Leave a review</a>}
                  {underWarranty && o.status === 'completed' && <button type="button" onClick={() => setModal({ kind: 'warranty', order: o })} className={action}><ShieldAlert size={13} /> Problem again? Claim warranty</button>}
                  {o.type === 'repair' && !ACTIVE.includes(o.status) && <Link to={again} className={action}><RotateCcw size={13} /> Book again</Link>}
                </div>
                {ACTIVE.includes(o.status) && !customerCanChange(o) && o.slot?.date && <p className="mt-2 text-[11px] text-muted">Changes are possible online until 2 hours before the visit. After that, please call or message us.</p>}
              </li>
            )
          })}
        </ul>
      )}
      {modal?.kind === 'move' && <RescheduleModal order={modal.order} onClose={() => setModal(null)} />}
      {modal?.kind === 'cancel' && <CancelOrderModal order={modal.order} onClose={() => setModal(null)} />}
      {modal?.kind === 'warranty' && <WarrantyModal order={modal.order} onClose={() => setModal(null)} />}
    </div>
  )
}

// Free follow-up visit for a repair still under warranty
function WarrantyModal({ order: o, onClose }) {
  const [text, setText] = useState('')
  const send = () => {
    const claim = claimWarranty(o, text)
    toast(`Warranty claim sent (${claim.id}). We will call you to arrange a visit.`)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Claim warranty" width={480}>
      <div className="space-y-4">
        <p className="text-sm text-muted">Repair {o.id}. Tell us what is wrong. If the fault is covered, there is no charge.</p>
        <Field as="textarea" rows={4} label="What is happening?" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. The new screen has stopped responding at the top" />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={send} disabled={text.trim().length < 5}>Send claim</Button>
        </div>
      </div>
    </Modal>
  )
}
