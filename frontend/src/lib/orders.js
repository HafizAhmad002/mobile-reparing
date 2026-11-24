// Order status workflow: new -> confirmed -> on-the-way -> repairing -> completed (+ cancelled).
// One function changes the status and runs everything that goes with it (history, customer
// messages, location sharing, receipt). With the Django API this becomes POST /api/admin/orders/<id>/status/.
import { addOrder, getOrders, notifyAdmin, notifyCustomer, ORDERS_KEY } from './store'
import { BUSINESS } from '../data/business'
import { formatDate } from './format'
import { takeFromStock } from './stock'

export const FLOW = ['new', 'confirmed', 'on-the-way', 'repairing', 'completed']
export const nextStatus = (s) => FLOW[FLOW.indexOf(s) + 1] || null
export const canCancel = (s) => !['completed', 'cancelled'].includes(s)
export const UNDO_MIN = 10
export const CANCEL_REASONS = ['Customer cancelled', 'No answer at the door', 'Not repairable', 'Other']

const write = (list) => { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); window.dispatchEvent(new Event('fp-store')) }
const patchOrder = (id, fn) => write(getOrders().map((o) => (o.id === id ? fn(o) : o)))

/* ---------------------------- customer messages --------------------------- */
const visitText = (o) => (o.slot?.date ? `${formatDate(o.slot.date)}, ${o.slot.time || ''}`.trim() : 'to be arranged')
export const trackLink = (o) => `${window.location.origin}/track/${o.id}`
export const MESSAGES = {
  confirmed: (o) => `Your repair request ${o.id} is accepted. Technician visit: ${visitText(o)}.`,
  'on-the-way': (o) => `Your technician is on the way. Track the visit live: ${trackLink(o)}`,
  repairing: () => 'Your repair has started.',
  completed: (o) => `Your repair is complete. Receipt ${o.receipt?.number}.${BUSINESS.reviewLink ? ` We would love a review: ${BUSINESS.reviewLink}` : ''}`,
  cancelled: (o) => `Your booking ${o.id} has been cancelled${o.cancelReason ? ` (${o.cancelReason.toLowerCase()})` : ''}.`,
}
const TITLES = { confirmed: 'Repair request accepted', 'on-the-way': 'Technician on the way', repairing: 'Repair started', completed: 'Repair completed', cancelled: 'Booking cancelled' }

// WhatsApp link with a ready message for the customer
export const whatsappLink = (o, text) => {
  const digits = String(o.customer?.phone || '').replace(/\D/g, '').replace(/^0/, '44')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null
}

/* ------------------------------ live location ----------------------------- */
export const TECH_KEY = 'fp_tech_locations' // { [orderId]: { lat, lon, accuracy, heading, speed, at } }
export const SHARE_KEY = 'fp_sharing' // { orderId, startedAt } while the technician shares the location
const readJson = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d } catch { return d } }
export const getSharing = () => readJson(SHARE_KEY, null)
export function startSharing(orderId) { localStorage.setItem(SHARE_KEY, JSON.stringify({ orderId, startedAt: new Date().toISOString() })); window.dispatchEvent(new Event('fp-store')) }
export function stopSharing() { localStorage.removeItem(SHARE_KEY); window.dispatchEvent(new Event('fp-store')) }
export function saveTechLocation(orderId, p) {
  const all = readJson(TECH_KEY, {})
  all[orderId] = { ...p, at: new Date().toISOString() }
  localStorage.setItem(TECH_KEY, JSON.stringify(all))
  window.dispatchEvent(new Event('fp-store'))
}
// Privacy: the technician's points are deleted as soon as the repair starts
export function clearTechLocation(orderId) {
  const all = readJson(TECH_KEY, {}); delete all[orderId]
  localStorage.setItem(TECH_KEY, JSON.stringify(all)); window.dispatchEvent(new Event('fp-store'))
}

// Straight-line distance (km) and an approximate drive time: distance x 1.4 road factor at 30 km/h
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
export const etaMinutes = (a, b) => Math.max(1, Math.round((distanceKm(a, b) * 1.4 / 30) * 60))

/* ------------------------------ status change ----------------------------- */
function nextReceiptNumber() {
  const year = new Date().getFullYear()
  const n = Number(localStorage.getItem(`fp_receipt_${year}`) || 0) + 1
  localStorage.setItem(`fp_receipt_${year}`, String(n))
  return `R-${year}-${String(n).padStart(4, '0')}`
}

/*
  Change an order's status. extra: { slot, reason, completion: { price, parts, partsCost, payment, warrantyMonths, notes } }
  Returns { ok: true, order } or { ok: false, error }.
*/
export function changeStatus(order, to, extra = {}) {
  const from = order.status
  const allowed = to === nextStatus(from) || (to === 'cancelled' && canCancel(from))
  if (!allowed) return { ok: false, error: `Can’t go from “${from}” to “${to}”.` }
  if (to === 'cancelled' && !extra.reason) return { ok: false, error: 'Choose a reason for cancelling.' }
  if (to === 'completed' && !(Number(extra.completion?.price) >= 0 && extra.completion?.price !== '' && extra.completion?.price != null)) return { ok: false, error: 'Enter the final price.' }

  const at = new Date().toISOString()
  let updated
  patchOrder(order.id, (o) => {
    const next = { ...o, status: to, statusHistory: [...(o.statusHistory || []), { from, to, at, by: 'admin', note: extra.reason || '' }] }
    if (extra.slot) next.slot = extra.slot
    if (to === 'cancelled') next.cancelReason = extra.reason
    if (to === 'completed') {
      const c = extra.completion
      next.price = Number(c.price)
      next.receipt = { number: nextReceiptNumber(), issuedAt: at, parts: c.parts || '', partsCost: c.partsCost === '' || c.partsCost == null ? null : Number(c.partsCost), payment: c.payment, warrantyMonths: Number(c.warrantyMonths), notes: c.notes || '' }
      next.paid = c.payment !== 'unpaid'
      next.paidAt = next.paid ? at : null
    }
    updated = next
    return next
  })

  // Side effects
  if (to === 'completed' && order.type === 'accessory') takeFromStock(order.items || [])
  if (to === 'repairing' || to === 'completed' || to === 'cancelled') {
    if (getSharing()?.orderId === order.id) stopSharing()
    clearTechLocation(order.id)
  }
  notifyCustomer(updated, 'status', TITLES[to], MESSAGES[to](updated))
  return { ok: true, order: updated }
}

// "Undo last step" within 10 minutes (e.g. tapped the wrong button)
export function canUndo(order) {
  const last = order.statusHistory?.[order.statusHistory.length - 1]
  return Boolean(last && last.to === order.status && Date.now() - new Date(last.at).getTime() < UNDO_MIN * 60000)
}
export function undoStatus(order) {
  if (!canUndo(order)) return false
  const last = order.statusHistory[order.statusHistory.length - 1]
  patchOrder(order.id, (o) => ({ ...o, status: last.from, statusHistory: o.statusHistory.slice(0, -1), ...(last.to === 'completed' ? { receipt: null, paid: false, paidAt: null } : {}), ...(last.to === 'cancelled' ? { cancelReason: null } : {}) }))
  return true
}

/* ------------------------- messages for one order ------------------------- */
// order.messages: [{ id, from: 'customer' | 'admin', text, photo?, at, readAt? }]
export function addOrderMessage(order, from, text, photo = null) {
  const msg = { id: `OM-${Date.now()}`, from, text: text.trim(), photo, at: new Date().toISOString(), readAt: null }
  patchOrder(order.id, (o) => ({ ...o, messages: [...(o.messages || []), msg] }))
  if (from === 'customer') notifyAdmin('new_message', `Message about ${order.id}`, `${order.customer?.name || 'Customer'} · ${text.slice(0, 80) || 'Photo'}`, `/admin?tab=orders&open=${order.id}`)
  else notifyCustomer(order, 'new_message', 'New message from your technician', text.slice(0, 120) || 'Photo', `/track/${order.id}`)
  return msg
}
// Mark the other side's messages as read
export function markOrderMessagesRead(order, reader) {
  if (!(order.messages || []).some((m) => m.from !== reader && !m.readAt)) return
  patchOrder(order.id, (o) => ({ ...o, messages: (o.messages || []).map((m) => (m.from !== reader && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m)) }))
}

/* --------------------- customer: reschedule and cancel --------------------- */
export const CHANGE_LIMIT_HOURS = 2
// Customers can change or cancel until 2 hours before the visit (not once the technician is on the way)
export function customerCanChange(o) {
  if (!['new', 'confirmed'].includes(o.status) || !o.slot?.date) return false
  const start = new Date(`${o.slot.date}T${o.slot.start || '08:00'}:00`)
  return start.getTime() - Date.now() > CHANGE_LIMIT_HOURS * 3600000
}
export function customerReschedule(o, slot) {
  if (!customerCanChange(o)) return { ok: false, error: 'It is too late to change this visit online. Please call or message us.' }
  const at = new Date().toISOString()
  patchOrder(o.id, (x) => ({ ...x, slot, history: [...(x.history || []), { at, by: 'customer', what: 'Rescheduled', from: `${o.slot.date} ${o.slot.time}`, to: `${slot.date} ${slot.time}` }] }))
  notifyAdmin('order_rescheduled', 'Customer moved a visit', `${o.customer?.name} · ${o.id} → ${formatDate(slot.date)}, ${slot.time}`, `/admin?tab=orders&open=${o.id}`)
  return { ok: true }
}
export function customerCancel(o, reason) {
  if (!customerCanChange(o)) return { ok: false, error: 'It is too late to cancel online. Please call or message us.' }
  if (!reason) return { ok: false, error: 'Please tell us why.' }
  patchOrder(o.id, (x) => ({ ...x, status: 'cancelled', cancelReason: reason, statusHistory: [...(x.statusHistory || []), { from: x.status, to: 'cancelled', at: new Date().toISOString(), by: 'customer', note: reason }] }))
  notifyAdmin('order_cancelled', 'Customer cancelled', `${o.customer?.name} · ${o.id} · ${reason}`, `/admin?tab=orders&open=${o.id}`)
  return { ok: true }
}

/* ------------------------------ new quote ------------------------------ */
// order.quote: { amount, note, status: 'pending' | 'approved' | 'declined', sentAt, answeredAt? }
export function sendQuote(o, amount, note = '') {
  const quote = { amount: Number(amount), note: note.trim(), status: 'pending', sentAt: new Date().toISOString() }
  patchOrder(o.id, (x) => ({ ...x, quote, history: [...(x.history || []), { at: quote.sentAt, by: 'admin', what: 'New quote sent', to: `£${quote.amount}` }] }))
  notifyCustomer(o, 'quote', 'New price for your repair', `£${quote.amount}${quote.note ? ` · ${quote.note.slice(0, 80)}` : ''}. Please approve or decline.`)
}
export function answerQuote(o, yes) {
  if (o.quote?.status !== 'pending') return
  const at = new Date().toISOString()
  patchOrder(o.id, (x) => ({
    ...x,
    ...(yes ? { price: x.quote.amount } : {}),
    quote: { ...x.quote, status: yes ? 'approved' : 'declined', answeredAt: at },
    history: [...(x.history || []), { at, by: 'customer', what: yes ? 'Quote approved' : 'Quote declined', to: `£${x.quote.amount}` }],
  }))
  notifyAdmin(yes ? 'quote_approved' : 'quote_declined', yes ? 'Quote approved' : 'Quote declined', `${o.customer?.name || 'Customer'} · ${o.id} · £${o.quote.amount}`, `/admin?tab=orders&open=${o.id}`)
}

/* ---------------------------- warranty claim ---------------------------- */
// A free follow-up visit linked to the original repair
export function claimWarranty(o, text) {
  const claim = addOrder({
    type: 'repair', source: 'warranty', warrantyOf: o.id,
    device: o.device, issues: o.issues || [], issueNote: text.trim(),
    customer: o.customer, location: o.location || null, userEmail: o.userEmail || null,
    price: 0, estimate: null, slot: null,
  })
  notifyAdmin('warranty_claim', 'Warranty claim', `${o.customer?.name || 'Customer'} · ${o.id} · ${text.slice(0, 80)}`, `/admin?tab=orders&open=${claim.id}`)
  return claim
}

// "Warranty until Tue 24 May 2027" (or null)
export function warrantyUntil(o) {
  if (!o.receipt?.issuedAt || !o.receipt.warrantyMonths) return null
  const d = new Date(o.receipt.issuedAt)
  d.setMonth(d.getMonth() + Number(o.receipt.warrantyMonths))
  return d
}

/* ------------------------------ calendar file ------------------------------ */
// .ics file for "Add to calendar" (times in UK local time)
export function icsFor(o) {
  const d = o.slot?.date?.replace(/-/g, '')
  const t = (hhmm) => `${hhmm.replace(':', '')}00`
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FixPoint//Booking//EN', 'BEGIN:VEVENT',
    `UID:${o.id}@fixpoint`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    o.slot?.start ? `DTSTART;TZID=Europe/London:${d}T${t(o.slot.start)}` : `DTSTART;VALUE=DATE:${d}`,
    o.slot?.end ? `DTEND;TZID=Europe/London:${d}T${t(o.slot.end)}` : '',
    `SUMMARY:FixPoint phone repair (${o.id})`,
    `LOCATION:${[o.customer?.address, o.customer?.postcode].filter(Boolean).join(', ').replace(/,/g, '\\,')}`,
    `DESCRIPTION:Track your repair: ${trackLink(o)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean)
  return lines.join('\r\n')
}
export function downloadIcs(o) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([icsFor(o)], { type: 'text/calendar' }))
  a.download = `fixpoint-${o.id}.ics`
  a.click()
  URL.revokeObjectURL(a.href)
}
