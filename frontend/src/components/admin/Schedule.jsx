import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Hourglass, Palmtree, Plus } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import { toast } from '../ui/Toast'
import { SCHEDULE } from '../../data/schedule'
import { STATUSES, addOrderHistory, notifyCustomer } from '../../lib/store'
import { fitsAt, freeSlots, isWorkDay, timeLabel, timeOffOn, toHHMM, toMin } from '../../lib/schedule'
import { formatDate } from '../../lib/format'
import { addDays, visitsOn } from './plan'
import WeekCalendar from './WeekCalendar'
import MonthCalendar from './MonthCalendar'
import AgendaList, { areaOf } from './AgendaList'
import DayView from './DayView'
import MiniMonth from './MiniMonth'
import BlockTimeModal from './BlockTimeModal'
import NewBookingModal from './NewBookingModal'
import { STATUS_TONE, dayKey, orderWhat } from './shared'

const VIEWS = [['week', 'Week'], ['month', 'Month'], ['list', 'List'], ['day', 'Day']]
const mondayOf = (iso) => addDays(iso, -((new Date(`${iso}T12:00:00`).getDay() + 6) % 7))
const shortRange = (a, b) => {
  const da = new Date(`${a}T12:00:00`); const db = new Date(`${b}T12:00:00`)
  const m = (d) => d.toLocaleDateString('en-GB', { month: 'short' })
  return `${da.getDate()}${m(da) === m(db) ? '' : ` ${m(da)}`} – ${db.getDate()} ${m(db)} ${db.getFullYear()}`
}

/*
  Admin Schedule ("publishing calendar" style): stats, Week / Month / List / Day views, status and area
  filters, a mini month, "Up next" and today's free slots. Visits can be dragged to a new time (Week view).
  view and date live in the URL (?tab=schedule&view=week&day=2026-11-24).
*/
export default function Schedule({ orders, date, view, onDate, onView, onOpen }) {
  const reduce = useReducedMotion()
  const today = dayKey(new Date())
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('repairs')
  const [area, setArea] = useState('all')
  const [blocking, setBlocking] = useState(false)
  const [booking, setBooking] = useState(null) // null | { key, date }
  const [moving, setMoving] = useState(null) // { order, date, min }

  // ---- filters
  const visible = useCallback((o) => type === 'repairs' && (status === 'all' || o.status === status) && (area === 'all' || areaOf(o) === area), [type, status, area])
  const untimedFor = useCallback((iso) => (type === 'accessories'
    ? orders.filter((o) => o.type === 'accessory' && dayKey(new Date(o.createdAt)) === iso && (status === 'all' || o.status === status))
    : orders.filter((o) => o.type === 'repair' && o.status !== 'cancelled' && o.slot?.date === iso && !o.slot.start && visible(o))), [orders, type, status, visible])
  const areas = useMemo(() => [...new Set(orders.map(areaOf).filter(Boolean))].sort(), [orders])

  // ---- stats
  const monday = mondayOf(date)
  const stats = useMemo(() => {
    const inWeek = orders.filter((o) => o.type === 'repair' && o.slot?.date >= monday && o.slot?.date <= addDays(monday, 6))
    const next7 = Array.from({ length: 7 }, (_, i) => addDays(today, i))
    return {
      week: inWeek.filter((o) => o.status !== 'cancelled').length,
      waiting: orders.filter((o) => o.status === 'new').length,
      done: inWeek.filter((o) => o.status === 'completed').length,
      free: next7.filter((iso) => isWorkDay(iso) && !timeOffOn(iso) && !visitsOn(orders, iso).length).length,
    }
  }, [orders, monday, today])

  // ---- sidebar
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const upNext = useMemo(() => orders
    .filter((o) => o.type === 'repair' && o.slot?.start && !['completed', 'cancelled'].includes(o.status) && (o.slot.date > today || (o.slot.date === today && toMin(o.slot.end || o.slot.start) >= nowMin)))
    .sort((a, b) => `${a.slot.date} ${a.slot.start}`.localeCompare(`${b.slot.date} ${b.slot.start}`))
    .slice(0, 3), [orders, today, nowMin])
  const freeToday = useMemo(() => freeSlots({ orders, date: today, point: SCHEDULE.BASE }), [orders, today])

  // ---- navigation
  const step = (dir) => {
    if (view === 'month') { const d = new Date(`${date.slice(0, 7)}-01T12:00:00`); d.setMonth(d.getMonth() + dir); onDate(dayKey(d)) }
    else onDate(addDays(date, view === 'day' ? dir : view === 'list' ? dir * 14 : dir * 7))
  }
  const label = view === 'month' ? new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : view === 'day' ? formatDate(date, { year: true })
      : view === 'list' ? shortRange(date, addDays(date, 13))
        : shortRange(monday, addDays(monday, 6))

  // ---- drag and drop
  const askMove = (order, iso, min) => {
    if (order.slot?.date === iso && toMin(order.slot.start) === min) return
    setMoving({ order, date: iso, min })
  }
  const confirmMove = () => {
    const { order, date: iso, min } = moving
    const check = fitsAt({ orders, date: iso, start: min, point: order.location || SCHEDULE.BASE, ignoreId: order.id })
    setMoving(null)
    if (iso < today) { toast('Can’t move a visit to a day that has passed.', { tone: 'error' }); return }
    if (!check.ok) { toast(`Can’t move it there: ${check.reason}`, { tone: 'error' }); return }
    const end = min + SCHEDULE.serviceMin
    const slot = { ...order.slot, date: iso, start: toHHMM(min), end: toHHMM(end), travelMin: check.travel, time: `${timeLabel(min)} – ${timeLabel(end)}` }
    addOrderHistory(order.id, { by: 'admin', what: 'Rescheduled', from: `${order.slot.date} ${order.slot.time}`, to: `${iso} ${slot.time}` }, { slot })
    notifyCustomer(order, 'order_rescheduled', 'Your visit has moved', `New time: ${formatDate(iso)}, ${slot.time}.`)
    toast(`Moved to ${formatDate(iso)}, ${timeLabel(min)}. The customer has been notified.`)
  }

  const tile = 'flex items-center gap-3 rounded-[20px] border border-line bg-white px-4 py-3.5'
  const navBtn = 'grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:border-accent hover:text-accent'

  return (
    <div className="space-y-4">
      {/* Stats + actions */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [CalendarDays, stats.week, 'Visits this week'],
            [Hourglass, stats.waiting, 'Awaiting confirmation'],
            [CheckCircle2, stats.done, 'Completed this week'],
            [CalendarCheck, stats.free, 'Free days in the next 7'],
          ].map(([Icon, n, text]) => (
            <div key={text} className={tile}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F1F3F7] text-ink"><Icon size={17} strokeWidth={2} aria-hidden="true" /></span>
              <div className="min-w-0"><dd className="text-xl font-extrabold leading-tight">{n}</dd><dt className="truncate text-xs text-muted">{text}</dt></div>
            </div>
          ))}
      </dl>

      {/* Toolbar */}
      <div className="rounded-[24px] border border-line bg-white p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative inline-flex rounded-full bg-[#F1F3F7] p-1" role="group" aria-label="Calendar view">
            {VIEWS.map(([k, text]) => (
              <button key={k} type="button" aria-pressed={view === k} onClick={() => onView(k)}
                className={`relative h-9 flex-1 rounded-full px-4 text-sm font-bold transition-colors sm:flex-none ${view === k ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                {view === k && <motion.span layoutId="schedule-view-pill" className="absolute inset-0 rounded-full bg-white shadow-sm" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">{text}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onDate(today)} className="h-10 rounded-full border border-line px-4 text-sm font-bold transition-colors hover:border-accent hover:text-accent">Today</button>
            <button type="button" className={navBtn} onClick={() => step(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
            <button type="button" className={navBtn} onClick={() => step(1)} aria-label="Next"><ChevronRight size={18} /></button>
            <h2 className="ml-1 min-w-0 truncate text-lg font-extrabold tracking-[-0.02em]" aria-live="polite">{label}</h2>
          </div>
          <div className="flex gap-2 lg:ml-auto">
            <Button variant="secondary" onClick={() => setBlocking(true)} className="!h-10 flex-1 !px-4 !text-sm lg:flex-none"><Palmtree size={15} /> Block time</Button>
            <Button variant="dark" onClick={() => setBooking({ key: `new-${Date.now()}` })} className="!h-10 flex-1 !px-4 !text-sm lg:flex-none"><Plus size={15} /> New booking</Button>
          </div>
        </div>

        {/* Filters */}
        {view !== 'day' && (
          <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {[{ id: 'all', label: 'All' }, ...STATUSES].map((s) => (
                <button key={s.id} type="button" aria-pressed={status === s.id} onClick={() => setStatus(s.id)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold transition-colors ${status === s.id ? 'border-ink bg-ink text-white' : 'border-line bg-white text-body hover:border-field'}`}>
                  {s.id !== 'all' && <span className={`size-2 rounded-full ${STATUS_TONE[s.id].dot}`} aria-hidden="true" />}{s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 lg:ml-auto">
              <div className="inline-flex rounded-full bg-[#F1F3F7] p-1" role="group" aria-label="Order type">
                {[['repairs', 'Repairs'], ['accessories', 'Accessories']].map(([k, text]) => (
                  <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)}
                    className={`h-8 rounded-full px-3 text-[13px] font-bold ${type === k ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>{text}</button>
                ))}
              </div>
              <Select variant="compact" className="w-[140px]" ariaLabel="Area" value={area} onChange={setArea}
                options={[{ value: 'all', label: 'All areas' }, ...areas.map((a) => ({ value: a, label: a }))]} />
            </div>
          </div>
        )}
      </div>

      {/* Calendar + sidebar */}
      <div className="grid items-start gap-4 min-[1600px]:grid-cols-[1fr_300px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${view}-${view === 'month' ? date.slice(0, 7) : view === 'day' ? date : monday}`} className="min-w-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {view === 'week' && <WeekCalendar orders={orders} date={date} visible={visible} untimedFor={untimedFor} onOpen={onOpen} onDay={(iso) => { onDate(iso); onView('day') }} onMove={askMove} />}
            {view === 'month' && <MonthCalendar orders={orders} date={date} visible={visible} untimedFor={untimedFor} onOpen={onOpen} onDay={(iso) => { onDate(iso); onView('day') }} />}
            {view === 'list' && <AgendaList orders={orders} date={date} visible={visible} untimedFor={untimedFor} onOpen={onOpen} />}
            {view === 'day' && <DayView orders={orders} date={date} onDate={onDate} onOpen={onOpen} />}
          </motion.div>
        </AnimatePresence>

        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1600px]:grid-cols-1">
          <section className="rounded-[24px] border border-line bg-white p-4"><MiniMonth orders={orders} date={date} onDate={onDate} /></section>
          <section className="rounded-[24px] border border-line bg-white p-4">
            <h3 className="text-[15px] font-extrabold">Up next</h3>
            {upNext.length === 0 ? <p className="mt-2 text-sm text-muted">No visits coming up.</p> : (
              <ul className="mt-3 space-y-2">
                {upNext.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => onOpen(o.id)} className="flex w-full items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-left transition-colors hover:border-accent">
                      <span className={`h-9 w-1 shrink-0 rounded-full ${STATUS_TONE[o.status]?.dot || 'bg-accent'}`} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-muted">{o.slot.date === today ? 'Today' : formatDate(o.slot.date)} · {timeLabel(toMin(o.slot.start))}</span>
                        <span className="block truncate text-sm font-semibold">{o.customer?.name}</span>
                        <span className="block truncate text-xs text-muted">{orderWhat(o)} · {o.customer?.postcode}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-[24px] border border-line bg-white p-4 sm:col-span-2 lg:col-span-1">
            <h3 className="flex items-center gap-1.5 text-[15px] font-extrabold"><Clock size={15} aria-hidden="true" /> Free slots today</h3>
            {freeToday.length === 0 ? <p className="mt-2 text-sm text-muted">{isWorkDay(today) && !timeOffOn(today) ? 'No free time left today.' : 'Not working today.'}</p> : (
              <>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {freeToday.slice(0, 10).map((s) => (
                    <button key={s.start} type="button" onClick={() => setBooking({ key: `slot-${s.start}`, date: today })}
                      className="h-8 rounded-full bg-success-tint px-3 text-xs font-bold text-success transition-colors hover:bg-success hover:text-white">{s.label}</button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted">From your start location. Click one to book a phone customer.</p>
              </>
            )}
          </section>
        </aside>
      </div>

      {/* Confirm a dragged visit */}
      <Modal open={Boolean(moving)} onClose={() => setMoving(null)} title="Move this visit?" width={460}>
        {moving && (
          <div>
            <p className="text-[15px] leading-relaxed">
              Move <b>{moving.order.customer?.name}</b>’s visit to <b>{formatDate(moving.date)}, {timeLabel(moving.min)}</b>? The customer will be notified.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setMoving(null)}>Keep the old time</Button>
              <Button onClick={confirmMove}>Move visit</Button>
            </div>
          </div>
        )}
      </Modal>
      <BlockTimeModal open={blocking} onClose={() => setBlocking(false)} orders={orders} />
      <NewBookingModal open={Boolean(booking)} preset={booking} onClose={() => setBooking(null)} />
    </div>
  )
}
