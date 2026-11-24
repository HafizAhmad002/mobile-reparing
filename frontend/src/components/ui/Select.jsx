import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import Popover from './Popover'

/*
  Custom dropdown (replaces the browser's <select>).
  options: [{ value, label, group?, hint? }]   group = heading the option sits under (e.g. "Phones")
  onChange(value) gets the value, not an event.
  variant: "field" (forms) | "quote" (home hero bar, label inside) | "compact" (admin tables)
  A search box is added automatically for long lists (more than 8 options).
*/
const SEARCH_FROM = 8

const TRIGGER = {
  field: 'min-h-12 w-full rounded-[14px] border bg-white px-4 text-[15px]',
  compact: 'min-h-10 w-full rounded-xl border bg-white px-3 text-sm font-semibold',
  quote: 'w-full rounded-[20px] border border-transparent bg-[#F6F7F9] px-4 py-2.5',
}

export default function Select({
  label, hideLabel = false, value, onChange, options, placeholder = 'Select…', disabled = false,
  searchable, variant = 'field', invalid = false, className = '', ariaLabel,
}) {
  const uid = useId()
  const ids = { label: `${uid}-label`, button: `${uid}-btn`, list: `${uid}-list`, opt: (i) => `${uid}-opt-${i}` }
  const trigger = useRef(null)
  const search = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const canSearch = searchable ?? options.length > SEARCH_FROM
  const q = query.trim().toLowerCase()
  const shown = useMemo(() => (q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options), [options, q])
  const selected = options.find((o) => o.value === value)

  const openList = () => {
    if (disabled) return
    setQuery('')
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const close = (focusBack = true) => {
    setOpen(false)
    if (focusBack) trigger.current?.focus()
  }
  const choose = (o) => {
    if (o.value !== value) onChange(o.value)
    close()
  }

  // Focus the search box (or the list) when it opens, and keep the active option in view
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => (canSearch ? search.current : listRef.current)?.focus({ preventScroll: true }), 0)
    return () => clearTimeout(t)
  }, [open, canSearch])
  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, uid])

  const onListKey = (e) => {
    const last = shown.length - 1
    const keys = {
      ArrowDown: () => setActive((a) => Math.min(last, a + 1)),
      ArrowUp: () => setActive((a) => Math.max(0, a - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      PageDown: () => setActive((a) => Math.min(last, a + 8)),
      PageUp: () => setActive((a) => Math.max(0, a - 8)),
      Enter: () => shown[active] && choose(shown[active]),
      Escape: () => close(),
      Tab: () => close(false),
    }
    if (e.key === ' ' && !canSearch) return (e.preventDefault(), shown[active] && choose(shown[active]))
    if (!keys[e.key]) {
      // Type to jump (list without a search box)
      if (!canSearch && e.key.length === 1) {
        const i = shown.findIndex((o, j) => j > active && String(o.label).toLowerCase().startsWith(e.key.toLowerCase()))
        const k = i >= 0 ? i : shown.findIndex((o) => String(o.label).toLowerCase().startsWith(e.key.toLowerCase()))
        if (k >= 0) setActive(k)
      }
      return
    }
    if (e.key !== 'Tab') e.preventDefault()
    e.stopPropagation()
    keys[e.key]()
  }

  const onTriggerKey = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      openList()
    }
  }

  const quote = variant === 'quote'
  const stateCls = invalid ? 'border-danger' : open ? 'border-accent ring-2 ring-accent' : 'border-field hover:border-[#B9BECB]'
  let lastGroup

  return (
    <div className={className}>
      {!quote && label && (
        <span id={ids.label} className={hideLabel ? 'sr-only' : 'mb-1.5 block text-[13px] font-bold text-body'}>{label}</span>
      )}
      <button
        ref={trigger}
        id={ids.button}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? ids.list : undefined}
        aria-labelledby={ariaLabel ? undefined : `${quote ? '' : ids.label} ${ids.button}`.trim()}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
        className={`flex items-center gap-2 text-left text-ink outline-none transition focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 ${TRIGGER[variant]} ${quote ? (open ? 'ring-2 ring-accent' : 'hover:bg-[#EEF0F4]') : stateCls}`}
      >
        <span className="min-w-0 flex-1">
          {quote && <span id={ids.label} className="block text-xs font-bold text-muted">{label}</span>}
          <span className={`block truncate ${quote ? 'mt-0.5 text-[15px] font-bold leading-8' : ''} ${selected ? '' : 'text-muted'}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown size={18} strokeWidth={2} className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180 text-accent' : ''}`} aria-hidden="true" />
      </button>

      <Popover anchorRef={trigger} open={open} onClose={() => close(false)} width={quote ? 240 : 'anchor'}>
        {canSearch && (
          <div className="relative mb-1.5 shrink-0">
            <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              ref={search}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onListKey}
              placeholder="Search…"
              aria-label={`Search ${label || ariaLabel || 'options'}`}
              aria-controls={ids.list}
              aria-activedescendant={shown[active] ? ids.opt(active) : undefined}
              className="h-11 w-full rounded-[12px] bg-[#F6F7F9] pl-9 pr-3 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
        <ul
          ref={listRef}
          id={ids.list}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={ariaLabel ? undefined : ids.label}
          aria-label={ariaLabel}
          aria-activedescendant={!canSearch && shown[active] ? ids.opt(active) : undefined}
          onKeyDown={canSearch ? undefined : onListKey}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none [scrollbar-width:thin]"
        >
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{query}”</li>}
          {shown.map((o, i) => {
            const heading = o.group && o.group !== lastGroup ? o.group : null
            lastGroup = o.group
            const isSel = o.value === value
            return [
              heading && (
                <li key={`g-${heading}`} role="presentation" className="px-3 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted first:pt-1">{heading}</li>
              ),
              <li
                key={`o-${o.value}`}
                id={ids.opt(i)}
                role="option"
                aria-selected={isSel}
                onPointerMove={() => active !== i && setActive(i)}
                onClick={() => choose(o)}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 text-[15px] ${i === active ? 'bg-tint' : ''} ${isSel ? 'font-bold text-accent' : 'text-ink'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.label}</span>
                  {o.hint && <span className="block text-xs font-normal text-muted">{o.hint}</span>}
                </span>
                {isSel && <Check size={16} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />}
              </li>,
            ]
          })}
        </ul>
      </Popover>
    </div>
  )
}
