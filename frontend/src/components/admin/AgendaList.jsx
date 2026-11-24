import { useSettings } from '../../lib/settings'
import { useMemo } from 'react'
import { ChevronRight, Palmtree } from 'lucide-react'
import { timeLabel, timeOffOn, toMin } from '../../lib/schedule'
import { formatDate, orderPriceLabel } from '../../lib/format'
import { addDays, visitsOn } from './plan'
import { DemoTag, StatusBadge, dayKey, orderProblem, orderWhat } from './shared'

const DAYS = 14

// "M20 6AG" -> "M20"; or the district saved with the booking
export const areaOf = (o) => o.customer?.district || (o.customer?.postcode || '').split(' ')[0] || ''

/*
  List view: an agenda for the next 14 days from the chosen date, grouped by day.
  Each row: time, status, customer, phone & problem, area, price. Click a row to open the order.
*/
export default function AgendaList({ orders, date, visible = () => true, untimedFor = () => [], onOpen }) {
  const settings = useSettings() // re-draw when time off / hours change
  const today = dayKey(new Date())
  const groups = useMemo(() => Array.from({ length: DAYS }, (_, i) => {
    const iso = addDays(date, i)
    return { iso, off: timeOffOn(iso), items: [...visitsOn(orders, iso).filter(visible), ...untimedFor(iso)] }
  }).filter((g) => g.items.length || g.off), [orders, date, visible, untimedFor, settings])

  if (!groups.length) {
    return <p className="rounded-[24px] border border-dashed border-field bg-white px-6 py-14 text-center text-sm text-muted">Nothing booked in the next {DAYS} days from {formatDate(date)}.</p>
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.iso} className="overflow-hidden rounded-[24px] border border-line bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-[#FAFBFC] px-5 py-3">
            <h3 className="text-sm font-extrabold">{formatDate(g.iso, { year: true })}{g.iso === today && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">TODAY</span>}</h3>
            <span className="text-xs font-semibold text-muted">{g.items.length} {g.items.length === 1 ? 'visit' : 'visits'}</span>
          </header>
          {g.off && <p className="flex items-center gap-2 border-b border-line bg-[#FFF6EC] px-5 py-2.5 text-xs font-bold text-[#9A4A00]"><Palmtree size={13} aria-hidden="true" />{g.off.reason || 'Time off'}</p>}
          <ul className="divide-y divide-line">
            {g.items.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => onOpen(o.id)} className="grid w-full grid-cols-[72px_1fr_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#F8F9FC] sm:grid-cols-[84px_120px_1fr_90px_90px_20px]">
                  <span className="text-sm font-extrabold">{o.slot?.start ? timeLabel(toMin(o.slot.start)) : o.type === 'accessory' ? 'Shop' : o.slot?.time || '—'}</span>
                  <span className="hidden sm:block"><StatusBadge status={o.status} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{o.customer?.name}{o.demo && <DemoTag />}</span>
                    <span className="block truncate text-xs text-muted">{orderWhat(o)}{orderProblem(o) ? ` · ${orderProblem(o)}` : ''}</span>
                  </span>
                  <span className="hidden truncate text-sm text-muted sm:block">{areaOf(o) || '—'}</span>
                  <span className="text-right text-sm font-bold sm:text-left">{orderPriceLabel(o)}</span>
                  <ChevronRight size={16} className="hidden text-muted sm:block" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
