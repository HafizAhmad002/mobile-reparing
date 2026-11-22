// Front-end-only data store (localStorage). It stands in for the Django REST API:
// replace the functions in this file with fetch() calls later and the pages will not need to change.
import { useMemo, useSyncExternalStore } from 'react'

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
  return getOrders().find(
    (o) => clean(o.id) === clean(ref) && clean(o.customer?.phone) === clean(phone),
  )
}

/* ------------------------------ messages ------------------------------ */

export const MESSAGES_KEY = 'fp_messages'
export const useMessages = () => useStored(MESSAGES_KEY, [])
export function addMessage(msg) {
  const all = parse(readRaw(MESSAGES_KEY), [])
  write(MESSAGES_KEY, [{ id: `MSG-${Date.now()}`, createdAt: new Date().toISOString(), ...msg }, ...all])
}

/* -------------------------------- users -------------------------------- */
// Demo-only sign-in. Passwords are hashed (SHA-256) before being stored, but this is NOT real
// security: real accounts must be handled by the Django API.

const USERS_KEY = 'fp_users'
const SESSION_KEY = 'fp_session'

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const useSession = () => useStored(SESSION_KEY, null)
export const getSession = () => parse(readRaw(SESSION_KEY), null)

export async function signUp({ name, email, phone, password }) {
  const users = parse(readRaw(USERS_KEY), [])
  const mail = email.trim().toLowerCase()
  if (users.some((u) => u.email === mail)) throw new Error('An account with this email already exists.')
  const user = { name: name.trim(), email: mail, phone: phone.trim(), passwordHash: await hash(password) }
  write(USERS_KEY, [...users, user])
  write(SESSION_KEY, { name: user.name, email: user.email, phone: user.phone })
}

export async function logIn({ email, password }) {
  const users = parse(readRaw(USERS_KEY), [])
  const mail = email.trim().toLowerCase()
  const user = users.find((u) => u.email === mail)
  if (!user || user.passwordHash !== (await hash(password))) throw new Error('Email or password is not correct.')
  write(SESSION_KEY, { name: user.name, email: user.email, phone: user.phone })
}

export const logOut = () => {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(EVENT))
}

/* ------------------------------ admin gate ----------------------------- */
export const isAdminUnlocked = () => sessionStorage.getItem('fp_admin') === '1'
export const unlockAdmin = () => sessionStorage.setItem('fp_admin', '1')
export const lockAdmin = () => sessionStorage.removeItem('fp_admin')
