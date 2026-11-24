import { useSettings } from '../../lib/settings'
import { useMemo } from 'react'
import { Palmtree } from 'lucide-react'
import { isWorkDay, timeLabel, timeOffOn, toMin } from '../../lib/schedule'
import { addDays, visitsOn } from './plan'
import { timeOffBars, timeOffText } from './WeekCalendar'
import { STATUS_TONE, dayKey } from './shared'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/*
  Month view: one cell per day with up to 3 visit chips and "+2 more".
  Time off shows as a bar across the days it covers. Click a day number or "+ more" to open that day.
*/
export default function MonthCalendar({ orders, date, visible = () => true, untimedFor = () => [], onDay, onOpen }) {
  const settings = useSettings() // re-draw when time off / hours change
  const today = dayKey(new Date())
  const month = date.slice(0, 7)

  const weeks = useMemo(() => {
    const first = new Date(`${month}-01T12:00:00`)
    const start = addDays(`${month}-01`, -((first.getDay() + 6) % 7))
    return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => {
      const iso = addDays(start, w * 7 + i)
      const visits = visitsOn(orders, iso).filter(visible)
      return { iso, num: Number(iso.slice(8)), inMonth: iso.slice(0, 7) === month, visits, extra: untimedFor(iso), off: timeOffOn(iso), open: isWorkDay(iso) }
    })).filter((wk, i) => i < 5 || wk.some((d) => d.inMonth))
  }, [orders, month, visible, untimedFor, settings])

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white">
      <div className="relative overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((d) => <p key={d} className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted">{d}</p>)}
          </div>
          {weeks.map((wk) => {
            const bars = timeOffBars(wk)
            return (
              <div key={wk[0].iso} className="relative grid grid-cols-7 border-b border-line last:border-0">
                {wk.map((d) => {
                  const chips = [...d.visits, ...d.extra]
                  const shown = chips.slice(0, 3)
                  const closed = !d.open || d.off
                  return (
                    <div key={d.iso} className={`min-h-[124px] border-l border-line p-1.5 first:border-l-0 ${d.inMonth ? '' : 'bg-[#FAFBFC]'}`}
                      style={closed && d.inMonth ? { backgroundImage: 'repeating-linear-gradient(135deg, #FAFBFC 0 8px, #F3F4F7 8px 16px)' } : undefined}>
                      <button type="button" onClick={() => onDay(d.iso)} aria-label={`Open ${d.iso}`}
                        className={`grid size-7 place-items-center rounded-full text-[13px] font-bold transition-colors ${d.iso === today ? 'bg-accent text-white' : d.inMonth ? 'text-ink hover:bg-[#F1F3F7]' : 'text-[#B5BAC6] hover:bg-[#F1F3F7]'}`}>
                        {d.num}
                      </button>
                      <div className={`space-y-1 ${bars.length ? 'mt-7' : 'mt-1'}`}>
                        {shown.map((o) => {
                          const tone = STATUS_TONE[o.status] || STATUS_TONE.new
                          return (
                            <button key={o.id} type="button" onClick={() => onOpen(o.id)} title={`${o.customer?.name} · ${o.slot?.time || ''}`}
                              className={`flex w-full items-center gap-1 truncate rounded-md px-1.5 py-1 text-left text-[11px] font-semibold transition hover:-translate-y-px ${tone.soft}`}>
                              <span className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                              <span className="truncate">{o.slot?.start ? timeLabel(toMin(o.slot.start)) : o.type === 'accessory' ? 'Shop' : 'No time'} {o.customer?.name?.split(' ')[0]}</span>
                            </button>
                          )
                        })}
                        {chips.length > 3 && <button type="button" onClick={() => onDay(d.iso)} className="px-1.5 text-[11px] font-bold text-muted hover:text-accent">+{chips.length - 3} more</button>}
                      </div>
                    </div>
                  )
                })}
                {/* Time-off bars across the days they cover */}
                {bars.map((t, i) => (
                  <div key={t.id} className="pointer-events-none absolute flex items-center gap-1.5 truncate rounded-full bg-[#FFE9D6] px-3 py-0.5 text-[11px] font-bold text-[#9A4A00]"
                    style={{ left: `calc(${(t.from / 7) * 100}% + 40px)`, width: `calc(${((t.to - t.from + 1) / 7) * 100}% - 46px)`, top: 8 + i * 22 }}>
                    <Palmtree size={11} aria-hidden="true" className="shrink-0" />{timeOffText(t)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
