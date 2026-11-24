import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Search, Smartphone, Tablet } from 'lucide-react'
import Pill from './ui/Pill'
import Button from './ui/Button'
import { brands, phoneBrands, tabletBrands } from '../data/catalog'

const MAX_SEARCH = 60 // cap for search results across all brands
// Card grid: 2 per row on phones, then as many 220px cards as fit
const GRID = 'grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3'

// "Find your phone": Phones/Tablets switch, brand pills, live search across ALL brands.
// Cards show only an icon and the model name. Clicking a model opens the booking page for that device.
// Before "Show all", only ONE row of models is shown (as many as fit across the screen).
export default function DeviceFinder() {
  const reduce = useReducedMotion()
  const grid = useRef(null)
  const [cols, setCols] = useState(4) // cards in one row; measured from the grid below
  const [kind, setKind] = useState('phone')
  const [brandId, setBrandId] = useState(phoneBrands[0].id)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const brandList = kind === 'phone' ? phoneBrands : tabletBrands
  const q = query.trim().toLowerCase()

  // How many cards fit in one row (re-measured when the screen size changes)
  useEffect(() => {
    const el = grid.current
    if (!el) return
    const measure = () => setCols(Math.max(1, getComputedStyle(el).gridTemplateColumns.split(' ').length))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // all = every match (search capped at MAX_SEARCH); items = what is on screen now
  const { all, total } = useMemo(() => {
    if (q) {
      const hits = brands.flatMap((b) =>
        b.models
          .filter((m) => `${b.name} ${m.name}`.toLowerCase().includes(q))
          .map((m) => ({ ...m, kind: b.kind, brand: b.name })),
      )
      return { all: hits.slice(0, MAX_SEARCH), total: hits.length }
    }
    const brand = brands.find((b) => b.id === brandId)
    const list = (brand ? brand.models : []).map((m) => ({ ...m, kind: brand.kind, brand: brand.name }))
    return { all: list, total: list.length }
  }, [q, brandId])
  const items = showAll ? all : all.slice(0, cols)

  const switchKind = (k) => {
    setKind(k)
    setBrandId((k === 'phone' ? phoneBrands : tabletBrands)[0].id)
    setShowAll(false)
    setQuery('')
  }

  const bookUrl = (m) =>
    `/book?${new URLSearchParams({ kind: m.kind, brand: m.brand, model: m.name }).toString()}`

  return (
    <div>
      {/* Phones / Tablets */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Device type">
          {[['phone', 'Phones', Smartphone], ['tablet', 'Tablets', Tablet]].map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => switchKind(k)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold transition-colors ${
                kind === k ? 'bg-ink text-white' : 'text-body hover:text-ink'
              }`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by brand">
        {brandList.map((b) => (
          <Pill key={b.id} active={!q && b.id === brandId} onClick={() => { setQuery(''); setBrandId(b.id); setShowAll(false) }}>
            {b.name}
          </Pill>
        ))}
      </div>

      <div className="relative mx-auto mt-5 max-w-[460px]">
        <label htmlFor="finder-search" className="sr-only">Search your phone or tablet model</label>
        <Search size={18} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id="finder-search"
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowAll(false) }}
          placeholder="Search any model, e.g. Galaxy S24 or iPad Air"
          className="min-h-12 w-full rounded-full border border-field bg-white pl-11 pr-4 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>
      {q && (
        <p className="mt-3 text-center text-[13px] text-muted" role="status">
          {total} {total === 1 ? 'model' : 'models'} found{total > MAX_SEARCH ? ` — showing the first ${MAX_SEARCH}, type more to narrow down` : ''}
        </p>
      )}

      {/* Measures the columns; same grid as the cards (kept outside the fade so it always exists) */}
      <div ref={grid} className={`${GRID} invisible h-0 overflow-hidden`} aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div
          key={q ? 'search' : brandId}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`mt-8 ${GRID}`}
        >
          {items.map((m) => {
            const Icon = m.kind === 'tablet' ? Tablet : Smartphone
            return (
              <Link
                key={m.id}
                to={bookUrl(m)}
                className="flex min-h-[64px] items-center gap-2.5 rounded-[18px] border border-line bg-white p-3 transition sm:min-h-[72px] sm:gap-3.5 sm:rounded-[20px] sm:p-3.5 duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint text-accent sm:size-11" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  {q && <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-accent">{m.brand}</span>}
                  <span className="block text-sm font-extrabold leading-tight tracking-[-0.02em] sm:text-[15px]">{m.name}</span>
                </span>
                <ArrowRight size={16} strokeWidth={2} className="hidden shrink-0 text-accent sm:block" aria-hidden="true" />
              </Link>
            )
          })}
          {items.length === 0 && (
            <p className="col-span-full py-8 text-center text-muted">
              Can’t find your device? <Link to="/book" className="font-bold text-accent">Book anyway</Link> and type it in, or <Link to="/contact" className="font-bold text-accent">message us</Link>.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {all.length > cols && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer models' : `Show all ${all.length} models`}
          </Button>
        </div>
      )}
    </div>
  )
}
