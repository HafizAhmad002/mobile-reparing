// Front-end-only data store (localStorage). It stands in for the Django REST API:
// replace the functions in this file with fetch() calls later and the pages will not need to change.
import { useMemo, useSyncExternalStore } from 'react'
import { samePhone } from './format'

const EVENT = 'fp-store'

const readRaw = (key) => localStorage.getItem(key) || ''
const parse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(EVENT))
}

// React hook: re-renders when the stored value changes (this tab or another tab).
export function useStored(key, fallback) {
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb)
      window.addEventListener('storage', cb)
      return () => {
        window.removeEventListener(EVENT, cb)
        window.removeEventListener('storage', cb)
      }
    },
    () => readRaw(key),
    () => '',
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => parse(raw, fallback), [raw])
}

/* ------------------------------- orders ------------------------------- */

export const STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'on-the-way', label: 'On the way' },
  { id: 'repairing', label: 'Repairing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]
export const statusLabel = (id) => STATUSES.find((s) => s.id === id)?.label || id

export const ORDERS_KEY = 'fp_orders'
export const getOrders = () => parse(readRaw(ORDERS_KEY), [])
export const useOrders = () => useStored(ORDERS_KEY, [])

const makeRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `FP-${s}`
}

// order: { type: 'repair' | 'accessory', customer, device, issues, issueNote, slot, items, price }
export function addOrder(order) {
  const full = {
    id: makeRef(),
    createdAt: new Date().toISOString(),
    status: 'new',
    price: null,
    ...order,
  }
  write(ORDERS_KEY, [full, ...getOrders()])
  // Tell the admin (not for demo data or bookings the admin made)
  if (!full.demo && full.source !== 'phone' && full.source !== 'warranty') {
    const what = full.type === 'accessory' ? `${full.items?.length || 0} accessories` : [full.device?.model, full.issues?.[0]].filter(Boolean).join(' · ')
    notifyAdmin('new_order', full.type === 'accessory' ? 'New accessory order' : 'New booking', `${full.customer?.name || 'Customer'} · ${what}`, `/admin?tab=orders&open=${full.id}`)
  }
  return full
}

export function updateOrder(id, patch) {
  write(ORDERS_KEY, getOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)))
}

export function deleteOrder(id) {
  write(ORDERS_KEY, getOrders().filter((o) => o.id !== id))
}

export const clearDemoOrders = () => write(ORDERS_KEY, getOrders().filter((o) => !o.demo))

export function findOrder(ref, phone) {
  const clean = (v) => String(v || '').replace(/\s+/g, '').toLowerCase()
  return getOrders().find((o) => clean(o.id) === clean(ref) && samePhone(o.customer?.phone, phone))
}

/* ------------------------------ messages ------------------------------ */

export const MESSAGES_KEY = 'fp_messages'
export const useMessages = () => useStored(MESSAGES_KEY, [])
// msg: { name, contact, topic, message, userEmail? } (userEmail when sent from a logged-in account)
export function addMessage(msg) {
  const all = parse(readRaw(MESSAGES_KEY), [])
  const item = { id: `MSG-${Date.now()}`, createdAt: new Date().toISOString(), replies: [], ...msg }
  write(MESSAGES_KEY, [item, ...all])
  notifyAdmin('new_message', 'New message', `${msg.name} · ${String(msg.message || '').slice(0, 80)}`, `/admin?tab=messages&open=${item.id}`)
}

// Admin answers a message; the customer sees the reply in their account
export function replyToMessage(id, text) {
  const all = parse(readRaw(MESSAGES_KEY), [])
  write(MESSAGES_KEY, all.map((m) => (m.id === id ? { ...m, replies: [...(m.replies || []), { at: new Date().toISOString(), text }] } : m)))
}

export function setMessageRead(id, read = true) {
  const all = parse(readRaw(MESSAGES_KEY), [])
  write(MESSAGES_KEY, all.map((m) => (m.id === id ? { ...m, read } : m)))
}

/* -------------------------------- users -------------------------------- */
// Demo-only sign-in. Passwords are hashed (SHA-256) before being stored, but this is NOT real
// security: real accounts must be handled by the Django API.

const USERS_KEY = 'fp_users'
const SESSION_KEY = 'fp_session'

export async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const useSession = () => useStored(SESSION_KEY, null)
export const getSession = () => parse(readRaw(SESSION_KEY), null)

// marketingConsent: the customer ticked "Send me repair tips and offers" (never ticked for them)
export async function signUp({ name, email, phone, password, marketingConsent = false }) {
  const users = parse(readRaw(USERS_KEY), [])
  const mail = email.trim().toLowerCase()
  if (users.some((u) => u.email === mail)) throw new Error('An account with this email already exists.')
  const now = new Date().toISOString()
  const user = { name: name.trim(), email: mail, phone: phone.trim(), passwordHash: await hash(password), createdAt: now, signupSource: 'website', marketingConsent: Boolean(marketingConsent), consentAt: marketingConsent ? now : null }
  write(USERS_KEY, [...users, user])
  const { passwordHash: _hash, ...profile } = user
  write(SESSION_KEY, profile)
  notifyAdmin('new_signup', 'New sign-up', `${user.name} · ${user.email}`, `/admin?tab=customers&id=${encodeURIComponent(`u:${mail}`)}`)
}

export async function logIn({ email, password }) {
  const users = parse(readRaw(USERS_KEY), [])
  const mail = email.trim().toLowerCase()
  const user = users.find((u) => u.email === mail)
  if (!user || user.passwordHash !== (await hash(password))) throw new Error('Email or password is not correct.')
  const { passwordHash: _hash, ...profile } = user // everything except the password
  write(SESSION_KEY, profile)
}

// Logged-in customer edits their details. Email stays the same (it is the login).
// patch: { name, phone, address, postcode, location, device: { brand, model }, photo (small data URL) }
export function updateProfile(patch) {
  const session = parse(readRaw(SESSION_KEY), null)
  if (!session) return
  const users = parse(readRaw(USERS_KEY), [])
  write(USERS_KEY, users.map((u) => (u.email === session.email ? { ...u, ...patch } : u)))
  write(SESSION_KEY, { ...session, ...patch })
}

export const logOut = () => {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(EVENT))
}

/* ------------------------------ admin gate ----------------------------- */
// Admin lock (browser only until the Django staff login exists): auto-locks after 12 hours
const ADMIN_HOURS = 12
export const isAdminUnlocked = () => {
  if (sessionStorage.getItem('fp_admin') !== '1') return false
  const at = Number(sessionStorage.getItem('fp_admin_at') || Date.now())
  if (Date.now() - at > ADMIN_HOURS * 3600000) { lockAdmin(); return false }
  return true
}
export const unlockAdmin = () => { sessionStorage.setItem('fp_admin', '1'); sessionStorage.setItem('fp_admin_at', String(Date.now())) }
export const lockAdmin = () => { sessionStorage.removeItem('fp_admin'); sessionStorage.removeItem('fp_admin_at') }

// Wrong passcode attempts: at most 5 in 15 minutes
const TRIES_KEY = 'fp_admin_tries'
export function adminLockedFor() {
  const tries = parse(readRaw(TRIES_KEY), []).filter((t) => Date.now() - t < 15 * 60000)
  return tries.length >= 5 ? Math.ceil((15 * 60000 - (Date.now() - tries[0])) / 60000) : 0
}
export function recordAdminTry(ok) {
  if (ok) { localStorage.removeItem(TRIES_KEY); return }
  const tries = parse(readRaw(TRIES_KEY), []).filter((t) => Date.now() - t < 15 * 60000)
  localStorage.setItem(TRIES_KEY, JSON.stringify([...tries, Date.now()]))
}

/* ---------------------------- order history ---------------------------- */
// Adds an entry to an order's history: { at, by, what, from?, to? }
export function addOrderHistory(id, entry, patch = {}) {
  write(ORDERS_KEY, getOrders().map((o) => (o.id === id ? { ...o, ...patch, history: [...(o.history || []), { at: new Date().toISOString(), ...entry }] } : o)))
}

/* ---------------------------- notifications ---------------------------- */
// One list for everyone. to: 'admin' or a customer's email / phone.
// type: new_order | new_message | new_signup | order_cancelled | order_rescheduled | follow_up_due | status | low_stock
//       | quote | quote_approved | quote_declined | warranty_claim
export const NOTIFS_KEY = 'fp_notifications'
export const getNotifications = () => parse(readRaw(NOTIFS_KEY), [])
export const useNotifications = () => useStored(NOTIFS_KEY, [])
export function addNotification(n) {
  const all = getNotifications()
  const item = { id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), read: false, ...n }
  write(NOTIFS_KEY, [item, ...all].slice(0, 500))
  return item
}
export const notifyAdmin = (type, title, body, link) => addNotification({ to: 'admin', type, title, body, link })
// The customer of an order (account email, else phone)
export const notifyCustomer = (o, type, title, body, link = `/track/${o.id}`) =>
  addNotification({ to: o.userEmail || o.customer?.phone || '', orderId: o.id, type, title, body, link })
export function markNotificationRead(id) {
  write(NOTIFS_KEY, getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)))
}
export function markAllNotificationsRead(to) {
  write(NOTIFS_KEY, getNotifications().map((n) => (n.to === to ? { ...n, read: true } : n)))
}

/* --------------------------- admin preferences -------------------------- */
// desktop: show browser notifications when the tab is hidden; sound: play a short sound;
// emailOrders: email the admin for new orders (needs the online server to send emails)
export const PREFS_KEY = 'fp_admin_prefs'
export const useAdminPrefs = () => useStored(PREFS_KEY, { desktop: false, sound: false, emailOrders: false })
export const getAdminPrefs = () => parse(readRaw(PREFS_KEY), { desktop: false, sound: false, emailOrders: false })
export const setAdminPrefs = (patch) => write(PREFS_KEY, { ...getAdminPrefs(), ...patch })
