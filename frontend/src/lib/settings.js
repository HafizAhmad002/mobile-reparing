// Business settings the owner can change in Admin → Settings:
// working hours, repair length, start location, service area and prices.
//
// The defaults live in data/schedule.js, data/areas.js and data/prices.js. Saved changes are kept
// in the browser (localStorage) and copied INTO those objects, so every page that already uses
// SCHEDULE / SERVICE_AREA / the price rows sees the new values without any other code changes.
// With the Django API, load and save these through the API instead.
import { useStored } from './store'
import { SCHEDULE } from '../data/schedule'
import { SERVICE_AREA } from '../data/areas'
import { BUSINESS } from '../data/business'
import { androidRows, extraRows, iphoneRows } from '../data/prices'

const KEY = 'fp_settings'
const EVENT = 'fp-store'
const PRICE_FIELDS = ['free', 'min', 'max', 'fixed', 'from', 'hidden'] // hidden: not shown on the website

export const PRICE_GROUPS = [
  { id: 'iphone', label: 'iPhone', rows: iphoneRows },
  { id: 'android', label: 'Samsung & Android', rows: androidRows },
  { id: 'extras', label: 'Extra services', rows: extraRows },
]
const allRows = PRICE_GROUPS.flatMap((g) => g.rows)

const clone = (v) => JSON.parse(JSON.stringify(v))
const pricePart = (row) => Object.fromEntries(PRICE_FIELDS.filter((k) => row[k] !== undefined).map((k) => [k, row[k]]))

// The original values, kept before anything is changed (for "Reset to defaults")
export const DEFAULTS = {
  schedule: clone(SCHEDULE),
  area: clone(SERVICE_AREA),
  business: clone(BUSINESS),
  prices: Object.fromEntries(allRows.map((r) => [r.id, pricePart(r)])),
}

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

// Copy settings into the shared objects (defaults first, then the saved changes)
function apply(s) {
  Object.assign(SCHEDULE, clone(DEFAULTS.schedule), s.schedule || {})
  Object.assign(SERVICE_AREA, clone(DEFAULTS.area), s.area || {})
  Object.assign(BUSINESS, clone(DEFAULTS.business), s.business || {})
  allRows.forEach((row) => {
    PRICE_FIELDS.forEach((k) => delete row[k])
    Object.assign(row, DEFAULTS.prices[row.id], s.prices?.[row.id] || {})
  })
}

export const getSettings = read
export const useSettings = () => useStored(KEY, {})

// Current values as one editable object (what the Settings form starts from)
export function currentSettings() {
  return {
    schedule: clone(SCHEDULE),
    area: clone(SERVICE_AREA),
    business: clone(BUSINESS),
    prices: Object.fromEntries(allRows.map((r) => [r.id, pricePart(r)])),
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
  apply(s)
  window.dispatchEvent(new Event(EVENT))
}

export function resetSettings() {
  localStorage.removeItem(KEY)
  apply({})
  window.dispatchEvent(new Event(EVENT))
}

// Apply saved settings as soon as the app starts (imported first in main.jsx)
apply(read())
// Another tab saved settings: pick them up here too
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === KEY) apply(read()) })

// Change part of the schedule settings (e.g. time off) without touching the rest
export function updateSchedule(patch) {
  const now = currentSettings()
  saveSettings({ ...now, schedule: { ...now.schedule, ...patch } })
}
