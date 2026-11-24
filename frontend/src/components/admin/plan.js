// Day planning shared by the Day and Week views of the admin Schedule.
import { SCHEDULE } from '../../data/schedule'
import { toMin, travelMinutes } from '../../lib/schedule'
import { dayKey } from './shared'

export const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return dayKey(d) }
export const dur = (min) => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min} min`)

// Repair visits with an exact time on `date`, in time order (cancelled ones are left out)
export const visitsOn = (orders, date) => orders
  .filter((o) => o.type === 'repair' && o.status !== 'cancelled' && o.slot?.date === date && o.slot.start)
  .sort((a, b) => a.slot.start.localeCompare(b.slot.start))

/*
  The day as the technician lives it: leave from the start location, drive, repair, drive, …
  Returns { steps, jobs, driveMin, workMin, freeMin, finish, clash }
*/
export function planDay(orders, date) {
  const dayStart = toMin(SCHEDULE.dayStart)
  const dayEnd = toMin(SCHEDULE.dayEnd)
  const jobs = visitsOn(orders, date)
  const steps = [{ kind: 'start', at: dayStart }]
  let prevEnd = dayStart
  let prevLoc = SCHEDULE.BASE
  let driveMin = 0
  let workMin = 0
  let freeMin = 0
  let clash = false
  jobs.forEach((o) => {
    const start = toMin(o.slot.start)
    const end = toMin(o.slot.end) || start + SCHEDULE.serviceMin
    const drive = travelMinutes(prevLoc, o.location || SCHEDULE.BASE)
    const leave = start - drive
    if (leave - prevEnd >= 5) { steps.push({ kind: 'free', from: prevEnd, to: leave }); freeMin += leave - prevEnd }
    const late = leave < prevEnd - 2 // can't make it in time (only if bookings were changed by hand)
    clash = clash || late
    steps.push({ kind: 'drive', from: Math.max(leave, prevEnd), to: start, min: drive, late })
    steps.push({ kind: 'job', order: o, from: start, to: end })
    driveMin += drive
    workMin += end - start
    prevEnd = end
    prevLoc = o.location || SCHEDULE.BASE
  })
  if (dayEnd - prevEnd >= 5) { steps.push({ kind: 'free', from: prevEnd, to: dayEnd, last: true }); freeMin += dayEnd - prevEnd }
  return { steps, jobs, driveMin, workMin, freeMin, finish: prevEnd, clash }
}

// Google Maps route: start location -> each customer in order
export const routeLink = (jobs) => {
  const pts = [SCHEDULE.BASE, ...jobs.map((o) => o.location).filter(Boolean)].map((p) => `${p.lat},${p.lon}`)
  return pts.length > 1 ? `https://www.google.com/maps/dir/${pts.join('/')}` : null
}
