// Shared UK formatting and validation helpers (dates, phones, postcodes, device names, prices).
// Use these everywhere so the whole site shows things the same way.

/* -------------------------------- dates -------------------------------- */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "YYYY-MM-DD" or Date -> local Date (noon, so time zones never shift the day)
const toDate = (v) => (v instanceof Date ? v : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(`${v}T12:00:00`) : new Date(v))

// Timestamps are stored in UTC and always shown in UK time (Europe/London), wherever the browser is
const LONDON = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
function london(d) {
  const p = Object.fromEntries(LONDON.formatToParts(d).map((x) => [x.type, x.value]))
  const local = new Date(Number(p.year), Number(p.month) - 1, Number(p.day), 12)
  return { y: local.getFullYear(), m: local.getMonth(), d: local.getDate(), wd: local.getDay(), h: Number(p.hour), min: Number(p.minute) }
}
const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v))

// "Thu 26 Nov" (or "Thu 26 Nov 2026" with { year: true }). Returns '' for empty / invalid dates.
// "YYYY-MM-DD" days are shown as they are; timestamps in UK time.
export function formatDate(value, { year = false } = {}) {
  if (!value) return ''
  const raw = toDate(value)
  if (Number.isNaN(raw.getTime())) return ''
  const t = isDay(value) ? { y: raw.getFullYear(), m: raw.getMonth(), d: raw.getDate(), wd: raw.getDay() } : london(raw)
  return `${WD[t.wd]} ${t.d} ${MON[t.m]}${year ? ` ${t.y}` : ''}`
}

// "Thu 26 Nov, 2:15pm" for timestamps (orders created, messages), in UK time
export function formatDateTime(value) {
  const raw = toDate(value)
  if (Number.isNaN(raw.getTime())) return ''
  const t = london(raw)
  return `${WD[t.wd]} ${t.d} ${MON[t.m]}, ${((t.h + 11) % 12) + 1}:${String(t.min).padStart(2, '0')}${t.h < 12 ? 'am' : 'pm'}`
}

export const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Bookings can be made from today up to this many days ahead
export const MAX_DAYS_AHEAD = 60
export const lastBookableDay = () => { const d = new Date(); d.setDate(d.getDate() + MAX_DAYS_AHEAD); return isoDay(d) }

/* -------------------------------- phones ------------------------------- */
// Any phone number is accepted (UK or another country).
//  - UK numbers (07700 900123, +44 7700 900123, 0044…, 0161 496 0000) are saved as "+447700900123"
//  - International with + or 00 (+92 300 1234567) are saved as "+923001234567"
//  - Anything else with 7–15 digits (e.g. 03001234567) is saved as typed, without spaces
// Returns null only when it cannot be a phone number (letters, too short or too long).
export function normaliseUkPhone(input) {
  const raw = String(input || '').trim()
  if (!raw || !/^\+?[\d\s().-]+$/.test(raw)) return null
  let digits = raw.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return null
  const intl = raw.startsWith('+') || digits.startsWith('00')
  if (!raw.startsWith('+') && digits.startsWith('00')) digits = digits.slice(2)
  // UK first, so the same number is always saved the same way
  const uk = intl ? (digits.startsWith('44') ? digits.slice(2) : null) : (digits.startsWith('0') ? digits.slice(1) : null)
  // (a local "03…" number is left as typed: it is also how Pakistani mobiles are written)
  if (uk && (/^7\d{9}$/.test(uk) || (intl ? /^[1238]\d{8,9}$/ : /^[128]\d{8,9}$/).test(uk))) return `+44${uk}`
  return intl ? `+${digits}` : digits
}

// Stored "+447700900123" (or an older raw number) -> "07700 900123" for display
export function formatUkPhone(value) {
  const e164 = normaliseUkPhone(value)
  if (!e164 || !e164.startsWith('+44')) return value || '' // other countries: shown as entered
  const n = `0${e164.slice(3)}`
  if (n.startsWith('07') || n.startsWith('08')) return `${n.slice(0, 5)} ${n.slice(5)}`
  if (n.startsWith('02')) return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`
}

// Same number written two ways ("07700 900123" and "+447700900123")?
export function samePhone(a, b) {
  const na = normaliseUkPhone(a) || String(a || '').replace(/\D/g, '')
  const nb = normaliseUkPhone(b) || String(b || '').replace(/\D/g, '')
  return Boolean(na) && na === nb
}

export const PHONE_ERROR = 'Please enter a valid phone number, e.g. 07700 900123 or +92 300 1234567.'

/* ------------------------------- postcodes ----------------------------- */
// Full UK postcode, e.g. "M60 2LA", "SW1A 1AA", "OL1 3BE"
const POSTCODE_RE = /^(GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})$/i
export const isUkPostcode = (v) => POSTCODE_RE.test(String(v || '').trim())
// "m602la" -> "M60 2LA"
export function normalisePostcode(v) {
  const s = String(v || '').replace(/\s+/g, '').toUpperCase()
  return s.length > 3 ? `${s.slice(0, -3)} ${s.slice(-3)}` : s
}
export const POSTCODE_ERROR = 'Please enter a full UK postcode, e.g. M60 2LA.'

/* ----------------------------- device names ---------------------------- */
// "Redmi" + "Redmi Note 11 Pro" -> "Redmi Note 11 Pro"; "Apple iPad" + "iPad Air" -> "iPad Air";
// "Samsung" + "Galaxy S24" -> "Samsung Galaxy S24"
export function deviceLabel(brand, model) {
  const b = String(brand || '').trim()
  const m = String(model || '').trim()
  if (!b) return m
  if (!m) return b
  const lower = m.toLowerCase()
  const lastWord = b.split(/\s+/).pop().toLowerCase()
  if (lower.startsWith(b.toLowerCase()) || lower.startsWith(`${lastWord} `) || lower === lastWord) return m
  return `${b} ${m}`
}
export const orderDevice = (o) => deviceLabel(o?.device?.brand, o?.device?.model)

/* -------------------------------- prices ------------------------------- */
const gbp = (n) => `£${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
// Price shown for an order: the final price when set, otherwise the estimate ("est. £25", "Free check")
export function orderPriceLabel(o) {
  if (typeof o?.price === 'number') return gbp(o.price)
  const e = o?.estimate
  if (!e) return '—'
  if (!e.max) return 'Free check'
  return e.min === e.max ? `est. ${gbp(e.min)}` : `est. ${gbp(e.min)}–${gbp(e.max)}`
}

// "just now", "2 min ago", "3 h ago", "yesterday", else the date
export function timeAgo(value, now = Date.now()) {
  const t = new Date(value).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 45) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  if (s < 172800) return 'yesterday'
  return formatDate(value)
}
