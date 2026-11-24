// Free arrival times for one technician (see data/schedule.js for the rules and settings).
// Times are minutes after midnight (e.g. 9:30am = 570).
import { SCHEDULE, TRAVEL } from '../data/schedule'

export const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + (m || 0)
}
export const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
// 570 -> "9:30am"
export const timeLabel = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
}

function km(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

// Estimated driving minutes between two points, rounded up to 5 minutes
export function travelMinutes(a, b) {
  if (!a || !b) return 30
  const mins = (km(a, b) * TRAVEL.roadFactor / TRAVEL.speedKmh) * 60 + TRAVEL.parkMin
  return Math.ceil(mins / 5) * 5
}

const ceilTo = (n, step) => Math.ceil(n / step) * step

// Repair visits already booked on a day, in time order: [{ start, end, loc }]
export function bookedVisits(orders, date, ignoreId = null) {
  return orders
    .filter((o) => o.type === 'repair' && o.status !== 'cancelled' && o.slot?.date === date && o.slot.start && o.id !== ignoreId)
    .map((o) => ({ start: toMin(o.slot.start), end: toMin(o.slot.end || o.slot.start) || toMin(o.slot.start) + SCHEDULE.serviceMin, loc: o.location || SCHEDULE.BASE }))
    .sort((a, b) => a.start - b.start)
}

/*
  Arrival times a new customer at `point` can book on `date` ("YYYY-MM-DD").
  Between two booked visits a time fits only if the technician can drive from the previous customer,
  repair (serviceMin), and still drive on to the next customer in time.
  Returns [{ start, end, travel, label }] (start/end in minutes).
*/
export function freeSlots({ orders, date, point, now = new Date() }) {
  if (!date || !point) return []
  const dayStart = toMin(SCHEDULE.dayStart)
  const dayEnd = toMin(SCHEDULE.dayEnd)
  const service = SCHEDULE.serviceMin

  // Today: nothing in the past (plus a little time to get ready)
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (date < todayISO) return []
  const notBefore = date === todayISO ? now.getHours() * 60 + now.getMinutes() + SCHEDULE.leadMin : 0

  // Closed on this weekday, or a holiday / blocked day
  const weekday = new Date(`${date}T12:00:00`).getDay()
  if (SCHEDULE.workDays && !SCHEDULE.workDays.includes(weekday)) return []
  if (timeOffOn(date)) return []

  const visits = bookedVisits(orders, date)
  const slots = []
  let prev = { end: dayStart, loc: SCHEDULE.BASE }
  for (let i = 0; i <= visits.length; i++) {
    const next = visits[i]
    const travelIn = travelMinutes(prev.loc, point)
    const earliest = Math.max(prev.end + travelIn, notBefore)
    const latest = Math.min(next ? next.start - travelMinutes(point, next.loc) - service : Infinity, dayEnd - service)
    const first = ceilTo(earliest, 5)
    if (first <= latest) {
      // The first possible time, then every `stepMin` on the hour / half hour (at least 10 min later)
      const times = [first]
      for (let t = ceilTo(first + 10, SCHEDULE.stepMin); t <= latest; t += SCHEDULE.stepMin) times.push(t)
      times.forEach((t) => slots.push({ start: t, end: t + service, travel: travelIn, label: timeLabel(t) }))
    }
    if (next) prev = next
  }
  return slots
}

// Is the business open on this day ("YYYY-MM-DD")?
export const isWorkDay = (date) => !SCHEDULE.workDays || SCHEDULE.workDays.includes(new Date(`${date}T12:00:00`).getDay())

// The holiday / blocked period covering this day, or null
export const timeOffOn = (date) => (SCHEDULE.timeOff || []).find((t) => date >= t.start && date <= t.end) || null

/*
  Can a visit at `point` start at `start` (minutes) on `date`? Used when the admin moves a visit
  (drag and drop) or books a phone customer. ignoreId: the visit being moved.
  Returns { ok: true, travel } or { ok: false, reason }.
*/
export function fitsAt({ orders, date, start, point, ignoreId = null }) {
  if (!isWorkDay(date)) return { ok: false, reason: 'We are closed on that day.' }
  const off = timeOffOn(date)
  if (off) return { ok: false, reason: `That day is blocked (${off.reason || 'time off'}).` }
  const service = SCHEDULE.serviceMin
  if (start < toMin(SCHEDULE.dayStart) || start + service > toMin(SCHEDULE.dayEnd)) return { ok: false, reason: 'That is outside working hours.' }
  const visits = bookedVisits(orders, date, ignoreId)
  const prev = [...visits].reverse().find((v) => v.start <= start) || null
  const next = visits.find((v) => v.start > start) || null
  const prevEnd = prev ? prev.end : toMin(SCHEDULE.dayStart)
  const travel = travelMinutes(prev ? prev.loc : SCHEDULE.BASE, point)
  if (prevEnd + travel > start) return { ok: false, reason: prev ? 'Not enough time to get there after the visit before it.' : 'Not enough time to drive there from the start of the day.' }
  if (next && start + service + travelMinutes(point, next.loc) > next.start) return { ok: false, reason: 'It would make you late for the next visit.' }
  return { ok: true, travel }
}
