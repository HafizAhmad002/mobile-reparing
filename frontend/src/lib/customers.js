// Customers for the admin panel: people who signed up, plus guests who booked without an account.
// Admin-only extras (notes, tags, follow-ups, reminders) are kept per customer in CUSTOMER_META.
// With the Django API these become CustomerProfile / CustomerNote / FollowUp models.
import { useMemo } from 'react'
import { useStored, useOrders, getOrders, ORDERS_KEY } from './store'
import { normaliseUkPhone, samePhone } from './format'

const EVENT = 'fp-store'
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d } catch { return d } }
const write = (k, v) => { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event(EVENT)) }

export const USERS_KEY = 'fp_users'
export const META_KEY = 'fp_customer_meta'
export const TEMPLATES_KEY = 'fp_templates'
export const TAGS = ['VIP', 'Follow up', 'Business', 'Repeat', 'Difficult']

/* ------------------------------- customers ------------------------------ */
const paid = (o) => (o.status === 'completed' && typeof o.price === 'number' ? o.price : 0)

// Build the customer list from accounts and orders. id: "u:<email>" for accounts, "g:<phone>" for guests.
export function buildCustomers(users, orders, meta) {
  const list = users.map((u) => ({
    id: `u:${u.email}`, account: true, name: u.name, email: u.email, phone: u.phone, address: u.address || '', postcode: u.postcode || '',
    createdAt: u.createdAt || null, marketingConsent: Boolean(u.marketingConsent), consentAt: u.consentAt || null, source: u.signupSource || 'website',
  }))
  const own = (c, o) => (c.email && o.userEmail === c.email) || (c.phone && samePhone(o.customer?.phone, c.phone))
  // Guests: orders that belong to no account, grouped by phone
  orders.forEach((o) => {
    if (list.some((c) => own(c, o))) return
    const phone = normaliseUkPhone(o.customer?.phone) || o.customer?.phone || o.id
    list.push({
      id: `g:${phone}`, account: false, name: o.customer?.name || 'Guest', email: o.customer?.email || '', phone: o.customer?.phone || '',
      address: o.customer?.address || '', postcode: o.customer?.postcode || '', createdAt: o.createdAt, marketingConsent: false, source: o.source || 'guest booking',
    })
  })
  return list.map((c) => {
    const mine = orders.filter((o) => own(c, o)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const m = meta[c.id] || {}
    return {
      ...c,
      orders: mine,
      orderCount: mine.length,
      completed: mine.filter((o) => o.status === 'completed').length,
      spent: mine.reduce((n, o) => n + paid(o), 0),
      lastOrder: mine[0]?.createdAt || null,
      createdAt: c.createdAt || mine[mine.length - 1]?.createdAt || null,
      tags: m.tags || [],
      notes: m.notes || [],
      followUps: m.followUps || [],
      followUpDate: m.followUpDate || '',
      lastContactedAt: m.lastContactedAt || null,
      seen: c.account ? Boolean(m.seen) : true,
    }
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function useCustomers() {
  const users = useStored(USERS_KEY, [])
  const orders = useOrders()
  const meta = useStored(META_KEY, {})
  return useMemo(() => buildCustomers(users, orders, meta), [users, orders, meta])
}

export function updateMeta(id, patch) {
  const meta = read(META_KEY, {})
  write(META_KEY, { ...meta, [id]: { ...(meta[id] || {}), ...(typeof patch === 'function' ? patch(meta[id] || {}) : patch) } })
}
export const markCustomerSeen = (id) => { const m = read(META_KEY, {})[id]; if (!m?.seen) updateMeta(id, { seen: true }) }
export const addNote = (id, text) => updateMeta(id, (m) => ({ notes: [{ id: `CN-${Date.now()}`, text, at: new Date().toISOString(), author: 'Admin' }, ...(m.notes || [])] }))
export const editNote = (id, noteId, text) => updateMeta(id, (m) => ({ notes: (m.notes || []).map((n) => (n.id === noteId ? { ...n, text, editedAt: new Date().toISOString() } : n)) }))
export const deleteNote = (id, noteId) => updateMeta(id, (m) => ({ notes: (m.notes || []).filter((n) => n.id !== noteId) }))
export function logFollowUp(id, entry) {
  const at = new Date().toISOString()
  updateMeta(id, (m) => ({ followUps: [{ id: `FU-${Date.now()}`, at, ...entry }, ...(m.followUps || [])], lastContactedAt: at, followUpDate: '' }))
}

// Marketing consent (customer side). Only for accounts.
export function setMarketingConsent(email, on) {
  const users = read(USERS_KEY, [])
  const consentAt = on ? new Date().toISOString() : null
  write(USERS_KEY, users.map((u) => (u.email === email ? { ...u, marketingConsent: on, consentAt } : u)))
  const s = read('fp_session', null)
  if (s?.email === email) write('fp_session', { ...s, marketingConsent: on, consentAt })
}

/*
  UK GDPR erasure: remove the person's details from their orders (prices stay for the accounts),
  delete their account, messages, notes and follow-ups.
*/
export function eraseCustomer(c) {
  const ids = new Set(c.orders.map((o) => o.id))
  write(ORDERS_KEY, getOrders().map((o) => (ids.has(o.id) ? {
    ...o, userEmail: null, attachments: [], issueNote: '', notes: '', adminNote: '', location: null,
    customer: { name: 'Deleted customer', phone: '', email: '', address: '', postcode: o.customer?.postcode?.split(' ')[0] || '' },
  } : o)))
  if (c.account) write(USERS_KEY, read(USERS_KEY, []).filter((u) => u.email !== c.email))
  write('fp_messages', read('fp_messages', []).filter((m) => !(c.email && (m.userEmail === c.email || m.contact === c.email)) && !(c.phone && samePhone(m.contact, c.phone))))
  const meta = read(META_KEY, {}); delete meta[c.id]; write(META_KEY, meta)
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
export function customersCsv(list) {
  const head = ['Name', 'Email', 'Phone', 'Postcode', 'Account', 'Signed up', 'Orders', 'Completed', 'Total spent (GBP)', 'Last order', 'Last contacted', 'Marketing consent', 'Tags']
  const rows = list.map((c) => [c.name, c.email, c.phone, c.postcode, c.account ? 'yes' : 'guest', c.createdAt?.slice(0, 10), c.orderCount, c.completed, c.spent, c.lastOrder?.slice(0, 10), c.lastContactedAt?.slice(0, 10), c.marketingConsent ? 'yes' : 'no', c.tags.join('; ')])
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
}

/* ------------------------------- templates ------------------------------ */
// type: 'service' (always allowed) | 'marketing' (only with consent)
const DEFAULT_TEMPLATES = [
  { id: 'welcome', name: 'Welcome - not booked yet', type: 'marketing', text: 'Hi {first_name}, thanks for joining FixPoint! If your phone needs a repair, we come to you anywhere in Manchester. Book in a minute: {booking_link}' },
  { id: 'confirmed', name: 'Booking confirmed', type: 'service', text: 'Hi {first_name}, your repair {order_ref} for your {device} is confirmed. See you soon! FixPoint' },
  { id: 'checkin', name: 'Check-in 7 days after repair', type: 'service', text: 'Hi {first_name}, just checking your {device} is working well since the repair. Any problems, reply here. FixPoint' },
  { id: 'review', name: 'Review request', type: 'service', text: 'Hi {first_name}, thanks for choosing FixPoint for your {device}. Could you leave us a quick review? It really helps: {review_link}' },
  { id: 'battery', name: 'Battery health reminder after 6 months', type: 'marketing', text: 'Hi {first_name}, it has been 6 months since your repair. If your {device} battery drains fast, we can replace it at your door: {booking_link}' },
]
export const getTemplates = () => read(TEMPLATES_KEY, null) || DEFAULT_TEMPLATES
export const useTemplates = () => useStored(TEMPLATES_KEY, null) || DEFAULT_TEMPLATES
export const saveTemplates = (list) => write(TEMPLATES_KEY, list)

// Fill {first_name} etc. for one customer
export function fillTemplate(text, c, { reviewLink = '[review link]' } = {}) {
  const last = c.orders?.[0]
  const device = last?.device ? `${last.device.model || last.device.brand}` : 'phone'
  return text
    .replace(/\{first_name\}/g, (c.name || '').split(' ')[0] || 'there')
    .replace(/\{device\}/g, device)
    .replace(/\{order_ref\}/g, last?.id || '')
    .replace(/\{booking_link\}/g, `${window.location.origin}/book`)
    .replace(/\{review_link\}/g, reviewLink)
}
