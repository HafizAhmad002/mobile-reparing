import { useSettings } from '../../lib/settings'
import { useMemo } from 'react'
import { AlertTriangle, Car, Clock, Coffee, Flag, Home, MapPin, Route } from 'lucide-react'
import { SCHEDULE } from '../../data/schedule'
import { isWorkDay, timeLabel, timeOffOn, toMin } from '../../lib/schedule'
import { addDays, dur, planDay, routeLink, visitsOn } from './plan'
import { mapsLink } from '../../lib/geo'
import { formatDate } from '../../lib/format'
import { Card, DemoTag, STATUS_TONE, StatusBadge, dayKey, orderProblem, orderWhat } from './shared'

// Day view: the technician's day step by step (leave, drive, repair, free time), with a week strip
export default function DayView({ orders, date, onDate, onOpen }) {
  const settings = useSettings() // re-draw when time off / hours change
  const today = dayKey(new Date())
  const plan = useMemo(() => planDay(orders, date), [orders, date])
  const off = timeOffOn(date)
  const open = isWorkDay(date) && !off
  // Bookings on this day without an exact time (older bookings / demo data)
  const untimed = orders.filter((o) => o.type === 'repair' && o.status !== 'cancelled' && o.slot?.date === date && !o.slot.start)

  // Week strip (Monday to Sunday around the chosen day)
  const week = useMemo(() => {
    const d = new Date(`${date}T12:00:00`)
    const monday = addDays(date, -((d.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(monday, i)
      const dd = new Date(`${iso}T12:00:00`)
      return { iso, day: dd.toLocaleDateString('en-GB', { weekday: 'short' }), num: dd.getDate(), count: visitsOn(orders, iso).length, open: isWorkDay(iso) && !timeOffOn(iso) }
    })
  }, [orders, date, settings])

  const route = routeLink(plan.jobs)

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="This week">
        {week.map((d) => (
          <li key={d.iso}>
            <button type="button" onClick={() => onDate(d.iso)} aria-current={d.iso === date ? 'date' : undefined}
              className={`flex w-full flex-col items-center rounded-[16px] border px-1 py-2.5 transition-colors ${d.iso === date ? 'border-accent bg-accent text-white' : 'border-line bg-white hover:border-accent'} ${d.open ? '' : 'opacity-60'}`}>
              <span className={`text-[11px] font-bold uppercase ${d.iso === date ? 'text-white/80' : 'text-muted'}`}>{d.day}</span>
              <span className="text-lg font-extrabold leading-tight">{d.num}</span>
              <span className={`mt-1 rounded-full px-1.5 text-[10px] font-bold ${d.iso === date ? 'bg-white/20' : d.count ? 'bg-tint text-accent' : 'text-muted'}`}>
                {!d.open ? 'Closed' : d.count ? `${d.count} job${d.count > 1 ? 's' : ''}` : 'Free'}
              </span>
              {d.iso === today && <span className="sr-only">(today)</span>}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Day plan */}
        <Card title={formatDate(date, { year: true })} className="order-2 lg:order-1">
          {!open && <p className="mb-4 rounded-2xl bg-[#F6F7F9] px-4 py-3 text-sm text-body">{off ? <><b>Time off: {off.reason || 'blocked'}.</b> Customers can’t book this day.</> : <><b>Closed.</b> This is not a working day, so customers can’t book it. Change working days in Settings.</>}</p>}
          {plan.clash && (
            <p className="mb-4 flex items-start gap-2 rounded-2xl bg-[#FDECEA] px-4 py-3 text-sm text-danger" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> Two visits are too close: there isn’t enough time to drive between them. Call one customer to move the time.
            </p>
          )}
          {plan.jobs.length === 0 && open && (
            <p className="mb-4 rounded-2xl border border-dashed border-field px-4 py-6 text-center text-sm text-muted">No visits booked for this day yet. The whole day is free.</p>
          )}
          <ol className="relative">
            {plan.steps.map((s, i) => {
              const last = i === plan.steps.length - 1
              const line = !last && <span className="absolute left-[19px] top-10 h-[calc(100%-28px)] w-0.5 bg-line" aria-hidden="true" />
              if (s.kind === 'job') {
                const o = s.order
                const tone = STATUS_TONE[o.status] || STATUS_TONE.new
                return (
                  <li key={o.id} className="relative flex gap-4 pb-4">
                    {line}
                    <span className={`relative z-[1] grid size-10 shrink-0 place-items-center rounded-full text-white ${tone.dot}`}><MapPin size={17} strokeWidth={2} aria-hidden="true" /></span>
                    <button type="button" onClick={() => onOpen(o.id)} className={`min-w-0 flex-1 rounded-[18px] border border-l-4 border-line ${tone.bar} bg-white p-4 text-left transition-shadow hover:shadow-[0_12px_30px_-18px_rgba(14,15,19,0.45)]`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[15px] font-extrabold">{timeLabel(s.from)} – {timeLabel(s.to)}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 font-semibold">{o.customer?.name}{o.demo && <DemoTag />}</p>
                      <p className="text-sm text-muted">{orderWhat(o)} · {orderProblem(o)}</p>
                      <p className="mt-1 truncate text-xs text-muted">{[o.customer?.address, o.customer?.postcode].filter(Boolean).join(', ')}</p>
                    </button>
                  </li>
                )
              }
              const icon = { start: Home, drive: Car, free: Coffee }[s.kind]
              const Icon = icon
              let text = ''
              if (s.kind === 'start') text = `${timeLabel(s.at)} · Start from ${SCHEDULE.BASE.label || 'your start location'}`
              if (s.kind === 'drive') text = `${timeLabel(s.from)} · Drive about ${dur(s.min)}`
              if (s.kind === 'free') text = `${timeLabel(s.from)} – ${timeLabel(s.to)} · ${s.last ? 'Free until the end of the day' : 'Free'} (${dur(s.to - s.from)})`
              return (
                <li key={`${s.kind}-${i}`} className="relative flex items-center gap-4 pb-4">
                  {line}
                  <span className={`relative z-[1] grid size-10 shrink-0 place-items-center rounded-full ${s.late ? 'bg-[#FDECEA] text-danger' : s.kind === 'free' ? 'bg-success-tint text-success' : 'bg-[#F1F3F7] text-muted'}`}><Icon size={17} strokeWidth={2} aria-hidden="true" /></span>
                  <p className={`text-sm ${s.late ? 'font-bold text-danger' : s.kind === 'free' ? 'font-semibold text-success' : 'text-muted'}`}>{text}{s.late ? ' (not enough time!)' : ''}</p>
                </li>
              )
            })}
            <li className="relative flex items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white"><Flag size={16} strokeWidth={2} aria-hidden="true" /></span>
              <p className="text-sm text-muted">{timeLabel(toMin(SCHEDULE.dayEnd))} · End of the working day</p>
            </li>
          </ol>

          {untimed.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-sm font-extrabold">Booked without an exact time ({untimed.length})</h3>
              <p className="text-xs text-muted">Older bookings that only chose morning / afternoon / evening.</p>
              <ul className="mt-3 space-y-2">
                {untimed.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => onOpen(o.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left text-sm hover:border-accent">
                      <span className="min-w-0"><b>{o.slot.time}</b> · {o.customer?.name}{o.demo && <DemoTag />}<span className="block truncate text-xs text-muted">{orderWhat(o)} · {orderProblem(o)}</span></span>
                      <StatusBadge status={o.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Day summary */}
        <div className="order-1 space-y-5 lg:order-2">
          <Card title="Day summary">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Visits', plan.jobs.length, MapPin],
                ['Driving', dur(plan.driveMin), Car],
                ['Repairing', dur(plan.workMin), Clock],
                ['Free time', open ? dur(plan.freeMin) : '—', Coffee],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-2xl bg-[#F6F7F9] p-3.5">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Icon size={13} aria-hidden="true" />{label}</dt>
                  <dd className="mt-1 text-lg font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
            {plan.jobs.length > 0 && <p className="mt-4 text-sm text-muted">Last repair ends at <b className="text-ink">{timeLabel(plan.finish)}</b>.</p>}
            {route && (
              <a href={route} target="_blank" rel="noreferrer" className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white hover:bg-black">
                <Route size={16} strokeWidth={2} aria-hidden="true" /> Open the day’s route in Maps
              </a>
            )}
            {plan.jobs.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {plan.jobs.filter((o) => o.location).map((o) => (
                  <li key={o.id}><a href={mapsLink(o.location)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-accent hover:underline"><MapPin size={13} aria-hidden="true" />{o.slot.time?.split(' – ')[0]} · {o.customer?.postcode || o.customer?.name}</a></li>
                ))}
              </ul>
            )}
          </Card>
          <p className="px-1 text-xs leading-relaxed text-muted">
            Working hours {timeLabel(toMin(SCHEDULE.dayStart))} – {timeLabel(toMin(SCHEDULE.dayEnd))}, {SCHEDULE.serviceMin} min per repair. Driving times are estimates. Change these in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
