import { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Popover from './Popover'

/*
  Custom date picker (replaces <input type="date">).
  value / min are "YYYY-MM-DD" strings (local time). onChange(isoString).
  Weeks start on Monday (UK). Keyboard: arrows move a day / week, PageUp/PageDown a month,
  Home/End the start/end of the week, Enter picks, Escape closes.
*/
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
const fromISO = (s) => {
  const [y, m, d] = (s || '').split('-').map(Number)
  return y ? new Date(y, m - 1, d) : null
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const addMonths = (d, n) => {
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last))
}
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const long = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

// isDisabled(date) -> true greys out a day (e.g. fully booked); disabledText is read out for it.
export default function DatePicker({ label, value, onChange, min, max, isDisabled, disabledText = 'not available', placeholder = 'Choose a day', invalid = false, className = '' }) {
  const uid = useId()
  const trigger = useRef(null)
  const gridRef = useRef(null)
  const [open, setOpen] = useState(false)
  const minDate = fromISO(min)
  const selected = fromISO(value)
  const today = new Date()
  const [cursor, setCursor] = useState(() => selected || minDate || today) // the focused day

  const maxDate = fromISO(max)
  // Outside the allowed range: before `min` (past) or after `max` (too far ahead)
  const isPast = (d) => (minDate && d < minDate) || (maxDate && d > maxDate)
  const reasonFor = (d) => isDisabled?.(toISO(d))
  const isOff = (d) => isPast(d) || Boolean(reasonFor(d))
  const clamp = (d) => (minDate && d < minDate ? minDate : maxDate && d > maxDate ? maxDate : d)

  const openCal = () => { setCursor(selected || minDate || new Date()); setOpen(true) }
  const close = (focusBack = true) => { setOpen(false); if (focusBack) trigger.current?.focus() }
  const pick = (d) => { if (isOff(d)) return; onChange(toISO(d)); close() }

  // Move keyboard focus to the focused day
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => gridRef.current?.querySelector('[data-cursor="true"]')?.focus({ preventScroll: true }), 0)
    return () => clearTimeout(t)
  }, [open, cursor])

  const onKey = (e) => {
    const moves = {
      ArrowLeft: () => addDays(cursor, -1), ArrowRight: () => addDays(cursor, 1),
      ArrowUp: () => addDays(cursor, -7), ArrowDown: () => addDays(cursor, 7),
      PageUp: () => addMonths(cursor, -1), PageDown: () => addMonths(cursor, 1),
      Home: () => addDays(cursor, -((cursor.getDay() + 6) % 7)), End: () => addDays(cursor, 6 - ((cursor.getDay() + 6) % 7)),
    }
    if (moves[e.key]) { e.preventDefault(); setCursor(clamp(moves[e.key]())); return }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(cursor); return }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
  }

  // Days of the month on screen, with blanks before the 1st so Monday is the first column
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))]
  const prevOff = minDate && new Date(first.getFullYear(), first.getMonth(), 0) < minDate
  const nextOff = maxDate && new Date(first.getFullYear(), first.getMonth() + 1, 1) > maxDate
  const monthName = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const tomorrow = addDays(today, 1)

  const navBtn = 'grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-[#F1F3F7] disabled:pointer-events-none disabled:opacity-30'

  return (
    <div className={className}>
      {label && <span id={`${uid}-label`} className="mb-1.5 block text-[13px] font-bold text-body">{label}</span>}
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${uid}-label ${uid}-value`}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : openCal())}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCal() } }}
        className={`flex min-h-12 w-full items-center gap-3 rounded-[14px] border bg-white px-4 text-left text-[15px] text-ink outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent ${invalid ? 'border-danger' : open ? 'border-accent ring-2 ring-accent' : 'border-field hover:border-[#B9BECB]'}`}
      >
        <CalendarDays size={18} strokeWidth={2} className="shrink-0 text-accent" aria-hidden="true" />
        <span id={`${uid}-value`} className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-muted'}`}>{selected ? long(selected) : placeholder}</span>
        <ChevronDown size={18} strokeWidth={2} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`} aria-hidden="true" />
      </button>

      <Popover anchorRef={trigger} open={open} onClose={() => close(false)} width={312} maxHeight={400} role="dialog" aria-label={`Choose ${label || 'a date'}`} className="!p-3">
        <div className="flex items-center justify-between">
          <button type="button" className={navBtn} onClick={() => setCursor(clamp(addMonths(cursor, -1)))} disabled={prevOff} aria-label="Previous month"><ChevronLeft size={18} strokeWidth={2} /></button>
          <p className="text-[15px] font-extrabold tracking-[-0.01em]" aria-live="polite">{monthName}</p>
          <button type="button" className={navBtn} onClick={() => setCursor(clamp(addMonths(cursor, 1)))} disabled={nextOff} aria-label="Next month"><ChevronRight size={18} strokeWidth={2} /></button>
        </div>
        <div ref={gridRef} role="grid" aria-label={monthName} onKeyDown={onKey} className="mt-1.5 grid grid-cols-7 gap-y-0.5 text-center">
          {WEEKDAYS.map((w) => <span key={w} role="columnheader" className="pb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-muted">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={`b${i}`} />
            const off = isOff(d)
            const sel = sameDay(d, selected)
            const isCursor = sameDay(d, cursor)
            const isToday = sameDay(d, today)
            return (
              <button
                key={toISO(d)}
                type="button"
                role="gridcell"
                tabIndex={isCursor ? 0 : -1}
                data-cursor={isCursor}
                aria-selected={sel}
                aria-disabled={off || undefined}
                aria-label={`${long(d)}${isToday ? ', today' : ''}${off ? `, ${isPast(d) ? 'not available' : typeof reasonFor(d) === 'string' ? reasonFor(d) : disabledText}` : ''}`}
                title={off && !isPast(d) ? (typeof reasonFor(d) === 'string' ? reasonFor(d) : disabledText) : undefined}
                onClick={() => pick(d)}
                className={`relative mx-auto grid size-9 place-items-center rounded-full text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                  sel ? 'bg-accent font-bold text-white' : off ? `cursor-not-allowed text-[#C3C7D1] ${isPast(d) ? '' : 'line-through'}` : 'font-semibold text-ink hover:bg-tint'
                } ${isCursor && !sel ? 'ring-1 ring-field' : ''}`}
              >
                {d.getDate()}
                {isToday && <span className={`absolute bottom-1 size-1 rounded-full ${sel ? 'bg-white' : 'bg-accent'}`} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        <div className="mt-2.5 flex shrink-0 gap-2 border-t border-line pt-2.5">
          {[['Today', today], ['Tomorrow', tomorrow]].map(([t, d]) => (
            <button key={t} type="button" disabled={isOff(new Date(d.getFullYear(), d.getMonth(), d.getDate()))} onClick={() => pick(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
              className="h-9 flex-1 rounded-full border border-line text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40">
              {t}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}
