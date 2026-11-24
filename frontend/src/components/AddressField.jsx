import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, LocateFixed, MapPin } from 'lucide-react'
import Popover from './ui/Popover'
import { currentPosition, reverseGeocode, searchAddress } from '../lib/geo'

/*
  Address box with suggestions while you type, plus "Use my current location".
  value / onChange(text): the address text (the customer can still type it freely).
  onPick(place): a suggestion or the current location was chosen -> { address, postcode, lat, lon }
*/
export default function AddressField({ label, value, onChange, onPick, invalid = false }) {
  const uid = useId()
  const wrap = useRef(null)
  const input = useRef(null)
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [note, setNote] = useState('') // error / help message
  const typed = useRef(null) // the text the customer last typed; we only search for that (not for text set by a pick or the map pin)

  // Search 300ms after the last key; cancel the previous search
  useEffect(() => {
    const q = value.trim()
    if (typed.current !== value || q.length < 3) { setResults([]); setOpen(false); return }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await searchAddress(q, ctrl.signal)
        setResults(r)
        setActive(-1)
        setOpen(true)
        setNote('')
      } catch (e) {
        if (e.name !== 'AbortError') { setResults([]); setOpen(false); setNote('Address suggestions are not available right now. You can still type your address.') }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 300)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [value])

  const pick = (place) => {
    typed.current = null
    setOpen(false)
    setNote('')
    onPick(place)
  }

  const useLocation = async () => {
    setLocating(true)
    setNote('')
    try {
      const pos = await currentPosition()
      const place = await reverseGeocode(pos.lat, pos.lon).catch(() => null)
      pick(place ? { ...place, lat: pos.lat, lon: pos.lon, source: 'gps' } : { address: value, postcode: '', ...pos, source: 'gps' })
      if (!place) setNote('We found your location on the map. Please type your address too.')
    } catch (e) {
      setNote(e.message)
    } finally {
      setLocating(false)
    }
  }

  const onKey = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick({ ...results[active], source: 'address' }) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false) }
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <label htmlFor={`${uid}-in`} className="block text-[13px] font-bold text-body">{label}</label>
        <button
          type="button"
          onClick={useLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-accent hover:underline disabled:opacity-60"
        >
          {locating ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <LocateFixed size={15} strokeWidth={2.2} aria-hidden="true" />}
          {locating ? 'Finding you…' : 'Use my current location'}
        </button>
      </div>
      <div ref={wrap} className="relative">
        <MapPin size={18} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true" />
        <input
          ref={input}
          id={`${uid}-in`}
          value={value}
          onChange={(e) => { typed.current = e.target.value; onChange(e.target.value) }}
          onKeyDown={onKey}
          onFocus={() => results.length && typed.current === value && setOpen(true)}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-activedescendant={active >= 0 ? `${uid}-o${active}` : undefined}
          aria-invalid={invalid || undefined}
          placeholder="Start typing your street or postcode"
          className={`min-h-12 w-full rounded-[14px] border bg-white pl-11 pr-11 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent ${invalid ? 'border-danger' : 'border-field'}`}
        />
        {loading && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted" aria-hidden="true" />}
      </div>
      {note && <p className="mt-1.5 text-xs font-semibold text-body" role="status">{note}</p>}

      <Popover anchorRef={wrap} open={open} onClose={() => setOpen(false)} maxHeight={340}>
        <ul id={`${uid}-list`} role="listbox" aria-label="Address suggestions" className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          {results.length === 0 && <li className="px-3 py-5 text-center text-sm text-muted">No matching address. Keep typing, or add your postcode.</li>}
          {results.map((r, i) => (
            <li
              key={r.id + i}
              id={`${uid}-o${i}`}
              role="option"
              aria-selected={i === active}
              onPointerMove={() => active !== i && setActive(i)}
              onPointerDown={(e) => e.preventDefault()} // keep focus in the input
              onClick={() => pick({ ...r, source: 'address' })}
              className={`flex cursor-pointer items-start gap-3 rounded-[12px] px-3 py-2.5 ${i === active ? 'bg-tint' : ''}`}
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#F1F3F7] text-muted"><MapPin size={15} strokeWidth={2} aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-ink">{r.title}</span>
                {r.subtitle && <span className="block truncate text-[13px] text-muted">{r.subtitle}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="shrink-0 border-t border-line px-3 pb-1 pt-2 text-[11px] text-muted">Suggestions © OpenStreetMap contributors</p>
      </Popover>
    </div>
  )
}
