import { useSettings } from '../../lib/settings'
import { useEffect, useMemo, useState } from 'react'
import { Car, Palmtree } from 'lucide-react'
import { SCHEDULE } from '../../data/schedule'
import { isWorkDay, timeLabel, timeOffOn, toMin } from '../../lib/schedule'
import { formatUkPhone } from '../../lib/format'
import { addDays, planDay } from './plan'
import { STATUS_TONE, dayKey, orderProblem, orderWhat } from './shared'

const HOUR = 72 // pixels per hour (30-minute rows are 36px)
const SNAP = 15 // dropped visits snap to 15 minutes
const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`

function useNowMin() {
  const get = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() }
  const [now, setNow] = useState(get)
  useEffect(() => { const t = setInterval(() => setNow(get()), 60000); return () => clearInterval(t) }, [])
  return now
}

// Time-off periods that touch these days, as column ranges for the bars over the day headings
export function timeOffBars(days) {
  return (SCHEDULE.timeOff || []).map((t) => {
    const cols = days.map((d, i) => (d.iso >= t.start && d.iso <= t.end ? i : -1)).filter((i) => i >= 0)
    return cols.length ? { ...t, from: cols[0], to: cols[cols.length - 1] } : null
  }).filter(Boolean)
}
export const timeOffText = (t) => {
  const a = new Date(`${t.start}T12:00:00`)
  const b = new Date(`${t.end}T12:00:00`)
  const m = (d) => d.toLocaleDateString('en-GB', { month: 'short' })
  const range = t.start === t.end ? `${a.getDate()} ${m(a)}` : `${a.getDate()}${m(a) === m(b) ? '' : ` ${m(a)}`}–${b.getDate()} ${m(b)}`
  return `${t.reason || 'Time off'} · ${range}`
}

/*
  Week calendar: days across, hours down. Visits are coloured by status, the drive before each one is
  striped. visible(order) hides filtered-out visits. untimedFor(iso) lists orders without a time.
  Drag a visit to another day / time -> onMove(order, date, startMin) (the parent confirms and checks it).
*/
export default function WeekCalendar({ orders, date, visible = () => true, untimedFor = () => [], onDay, onOpen, onMove }) {
  const settings = useSettings() // re-draw when time off / hours change
  const today = dayKey(new Date())
  const nowMin = useNowMin()
  const [drag, setDrag] = useState(null) // { id, over: { iso, min } }

  const days = useMemo(() => {
    const d = new Date(`${date}T12:00:00`)
    const monday = addDays(date, -((d.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(monday, i)
      const dd = new Date(`${iso}T12:00:00`)
      const plan = planDay(orders, iso)
      return { iso, plan, off: timeOffOn(iso), open: isWorkDay(iso), untimed: untimedFor(iso), name: dd.toLocaleDateString('en-GB', { weekday: 'short' }), num: dd.getDate(), count: plan.jobs.filter(visible).length }
    })
  }, [orders, date, visible, untimedFor, settings])

  const { from, to } = useMemo(() => {
    let a = toMin(SCHEDULE.dayStart)
    let b = toMin(SCHEDULE.dayEnd)
    days.forEach((d) => d.plan.steps.forEach((s) => { if (s.kind === 'job' || s.kind === 'drive') { a = Math.min(a, s.from); b = Math.max(b, s.to) } }))
    return { from: Math.floor(a / 60) * 60, to: Math.ceil(b / 60) * 60 }
  }, [days])
  const hours = Array.from({ length: (to - from) / 60 }, (_, i) => from / 60 + i)
  const y = (min) => ((min - from) / 60) * HOUR
  const workFrom = toMin(SCHEDULE.dayStart)
  const workTo = toMin(SCHEDULE.dayEnd)
  const bars = timeOffBars(days)
  const anyUntimed = days.some((d) => d.untimed.length)
  const cols = 'grid grid-cols-[60px_repeat(7,minmax(0,1fr))]'

  const minAt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const raw = from + ((e.clientY - r.top) / HOUR) * 60
    return Math.max(from, Math.min(to - SCHEDULE.serviceMin, Math.round(raw / SNAP) * SNAP))
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white">
      <div className="relative overflow-x-auto">
        <div className="min-w-[860px]">
          {/* Day headings */}
          <div className={`${cols} border-b border-line bg-white`}>
            <div className="sticky left-0 z-[4] bg-white" aria-hidden="true" />
            {days.map((d) => {
              const isToday = d.iso === today
              return (
                <button key={d.iso} type="button" onClick={() => onDay(d.iso)} title="Open this day’s plan"
                  className={`border-l border-line px-2 py-3 text-center transition-colors hover:bg-[#F6F7F9] ${d.iso === date ? 'bg-tint/60' : ''}`}>
                  <span className={`block text-[11px] font-bold uppercase tracking-[0.06em] ${isToday ? 'text-accent' : 'text-muted'}`}>{d.name}</span>
                  <span className={`mx-auto mt-1 grid size-9 place-items-center rounded-full text-lg font-extrabold ${isToday ? 'bg-accent text-white' : 'text-ink'}`}>{d.num}</span>
                  <span className={`mt-1 block text-[11px] font-semibold ${d.off || !d.open ? 'text-muted' : d.count ? 'text-accent' : 'text-success'}`}>
                    {d.off ? 'Time off' : !d.open ? 'Closed' : d.count ? `${d.count} visit${d.count > 1 ? 's' : ''}` : 'Free'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Time-off bars (like campaign bars) */}
          {bars.length > 0 && (
            <div className={`${cols} gap-y-1 border-b border-line bg-[#FAFBFC] py-1.5`}>
              <div className="sticky left-0 z-[4] bg-[#FAFBFC]" aria-hidden="true" />
              {bars.map((t) => (
                <div key={t.id} className="mx-1 flex items-center gap-1.5 truncate rounded-full bg-[#FFE9D6] px-3 py-1 text-[11px] font-bold text-[#9A4A00]" style={{ gridColumn: `${t.from + 2} / ${t.to + 3}` }} title={timeOffText(t)}>
                  <Palmtree size={12} aria-hidden="true" className="shrink-0" />{timeOffText(t)}
                </div>
              ))}
            </div>
          )}

          {/* Orders without an exact time */}
          {anyUntimed && (
            <div className={`${cols} border-b border-line bg-[#FAFBFC]`}>
              <div className="sticky left-0 z-[4] flex items-center justify-end bg-[#FAFBFC] pr-2 text-[10px] font-semibold leading-tight text-muted">No time</div>
              {days.map((d) => (
                <div key={d.iso} className="min-w-0 space-y-1 border-l border-line p-1.5">
                  {d.untimed.map((o) => (
                    <button key={o.id} type="button" onClick={() => onOpen(o.id)} className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold ${STATUS_TONE[o.status]?.soft || ''}`}>
                      {o.type === 'accessory' ? 'Accessories' : o.slot?.time} · {o.customer?.name?.split(' ')[0]}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Time grid */}
          <div className={`${cols} relative`} style={{ height: hours.length * HOUR }}>
            <div className="sticky left-0 z-[4] bg-white">
              {hours.map((h) => (
                <span key={h} className={`absolute right-2 text-[11px] font-semibold text-muted ${h * 60 === from ? 'translate-y-1' : '-translate-y-1/2'}`} style={{ top: y(h * 60) }}>{hourLabel(h)}</span>
              ))}
            </div>

            {days.map((d) => {
              const closed = !d.open || d.off
              const over = drag?.over?.iso === d.iso ? drag.over.min : null
              return (
                <div key={d.iso} className="relative border-l border-line"
                  onDragOver={(e) => { if (!drag) return; e.preventDefault(); const min = minAt(e); if (drag.over?.iso !== d.iso || drag.over?.min !== min) setDrag({ ...drag, over: { iso: d.iso, min } }) }}
                  onDragLeave={() => drag && setDrag({ ...drag, over: null })}
                  onDrop={(e) => { e.preventDefault(); const o = orders.find((x) => x.id === drag?.id); const min = minAt(e); setDrag(null); if (o) onMove?.(o, d.iso, min) }}
                  style={{
                    backgroundImage: closed
                      ? 'repeating-linear-gradient(135deg, #F6F7F9 0 8px, #EEF0F4 8px 16px)'
                      : `linear-gradient(to bottom, #EEF0F4 1px, transparent 1px), linear-gradient(to bottom, transparent ${HOUR / 2}px, #F5F6F9 ${HOUR / 2}px, #F5F6F9 ${HOUR / 2 + 1}px, transparent ${HOUR / 2 + 1}px)`,
                    backgroundSize: closed ? 'auto' : `100% ${HOUR}px`,
                  }}>
                  {!closed && workFrom > from && <div className="absolute inset-x-0 top-0 bg-[#F6F7F9]/80" style={{ height: y(workFrom) }} aria-hidden="true" />}
                  {!closed && workTo < to && <div className="absolute inset-x-0 bg-[#F6F7F9]/80" style={{ top: y(workTo), bottom: 0 }} aria-hidden="true" />}
                  {closed && <p className="absolute inset-x-0 top-4 text-center text-xs font-bold text-muted">{d.off ? 'Time off' : 'Closed'}</p>}

                  {d.plan.steps.map((s, i) => {
                    if (s.kind === 'drive' && s.to > s.from && visible(d.plan.steps[i + 1]?.order || {})) {
                      const h = y(s.to) - y(s.from)
                      return (
                        <div key={`drive-${i}`} className={`absolute inset-x-1.5 flex items-center justify-center gap-1 overflow-hidden rounded-md text-[10px] font-semibold ${s.late ? 'bg-[#FDECEA] text-danger' : 'text-muted'}`}
                          style={{ top: y(s.from) + 1, height: Math.max(h - 2, 2), backgroundImage: s.late ? undefined : 'repeating-linear-gradient(135deg, #F1F3F7 0 5px, #E7EAF0 5px 10px)' }}
                          title={`Drive about ${s.min} min${s.late ? ' (not enough time!)' : ''}`}>
                          {h >= 18 && <><Car size={11} aria-hidden="true" />{s.min}m</>}
                        </div>
                      )
                    }
                    if (s.kind !== 'job' || !visible(s.order)) return null
                    const o = s.order
                    const tone = STATUS_TONE[o.status] || STATUS_TONE.new
                    const h = y(s.to) - y(s.from)
                    const movable = onMove && !['completed', 'cancelled'].includes(o.status)
                    return (
                      <button key={o.id} type="button" onClick={() => onOpen(o.id)}
                        draggable={movable}
                        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', o.id); setDrag({ id: o.id, over: null }) }}
                        onDragEnd={() => setDrag(null)}
                        className={`absolute inset-x-1 z-[1] overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-[0_6px_16px_-12px_rgba(14,15,19,0.6)] transition duration-150 hover:z-[2] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-12px_rgba(14,15,19,0.55)] ${movable ? 'cursor-grab active:cursor-grabbing' : ''} ${drag?.id === o.id ? 'opacity-40' : ''} ${tone.soft} ${tone.bar}`}
                        style={{ top: y(s.from) + 1, height: Math.max(h - 2, 22) }}
                        title={`${timeLabel(s.from)} – ${timeLabel(s.to)}\n${o.customer?.name} · ${formatUkPhone(o.customer?.phone)}\n${orderWhat(o)} · ${orderProblem(o)}\n${[o.customer?.address, o.customer?.postcode].filter(Boolean).join(', ')}${movable ? '\nDrag to move' : ''}`}>
                        <p className="truncate text-[11px] font-bold">{timeLabel(s.from)} – {timeLabel(s.to)}</p>
                        {h >= 40 && <p className="truncate text-[12.5px] font-extrabold text-ink">{o.customer?.name?.split(' ')[0]} · {orderWhat(o)}</p>}
                        {h >= 58 && <p className="truncate text-[11px] text-body">{o.customer?.postcode || ''} · {orderProblem(o)}</p>}
                      </button>
                    )
                  })}

                  {/* Where the dragged visit would land */}
                  {over != null && (
                    <div className="pointer-events-none absolute inset-x-1 z-[3] rounded-lg border-2 border-dashed border-accent bg-tint/70 px-2 py-1 text-[11px] font-bold text-accent" style={{ top: y(over), height: y(over + SCHEDULE.serviceMin) - y(over) }}>
                      {timeLabel(over)}
                    </div>
                  )}

                  {d.iso === today && nowMin >= from && nowMin <= to && (
                    <div className="pointer-events-none absolute inset-x-0 z-[2] flex items-center" style={{ top: y(nowMin) }} aria-label={`Now, ${timeLabel(nowMin)}`}>
                      <span className="-ml-1.5 size-3 rounded-full bg-danger" />
                      <span className="h-0.5 flex-1 bg-danger" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
