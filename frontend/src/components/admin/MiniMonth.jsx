import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { timeOffOn } from '../../lib/schedule'
import { addDays, visitsOn } from './plan'
import { dayKey } from './shared'

// Small month calendar for the Schedule sidebar: a dot under days with visits, click to jump there
export default function MiniMonth({ orders, date, onDate }) {
  const today = dayKey(new Date())
  const [month, setMonth] = useState(date.slice(0, 7))
  const [shownFor, setShownFor] = useState(date)
  if (shownFor !== date) { setShownFor(date); setMonth(date.slice(0, 7)) } // follow the main calendar
  const first = new Date(`${month}-01T12:00:00`)
  const start = addDays(`${month}-01`, -((first.getDay() + 6) % 7))
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const shift = (n) => { const d = new Date(`${month}-01T12:00:00`); d.setMonth(d.getMonth() + n); setMonth(dayKey(d).slice(0, 7)) }
  const nav = 'grid size-8 place-items-center rounded-full text-ink transition-colors hover:bg-[#F1F3F7]'

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-extrabold">{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
        <div className="flex gap-1">
          <button type="button" className={nav} onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <button type="button" className={nav} onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="pb-1 text-[10px] font-bold text-muted">{d}</span>)}
        {cells.map((iso) => {
          const n = visitsOn(orders, iso).length
          const inMonth = iso.slice(0, 7) === month
          const sel = iso === date
          return (
            <button key={iso} type="button" onClick={() => onDate(iso)} aria-label={`${iso}${n ? `, ${n} visits` : ''}`} aria-current={sel ? 'date' : undefined}
              className={`relative mx-auto grid size-8 place-items-center rounded-full text-[12px] font-semibold transition-colors ${sel ? 'bg-ink text-white' : iso === today ? 'bg-tint text-accent' : inMonth ? 'text-ink hover:bg-[#F1F3F7]' : 'text-[#B5BAC6] hover:bg-[#F1F3F7]'} ${timeOffOn(iso) && !sel ? 'line-through' : ''}`}>
              {Number(iso.slice(8))}
              {n > 0 && <span className={`absolute bottom-0.5 size-1 rounded-full ${sel ? 'bg-white' : 'bg-accent'}`} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
