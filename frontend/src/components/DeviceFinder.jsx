import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Search, Smartphone, Tablet } from 'lucide-react'
import Pill from './ui/Pill'
import Button from './ui/Button'
import { brands, phoneBrands, tabletBrands } from '../data/catalog'

const INITIAL = 12 // cards shown before "Show all"
const MAX_SEARCH = 60 // cap for search results across all brands

// "Find your phone": Phones/Tablets switch, brand pills, live search across ALL brands.
// Cards show only an icon and the model name. Clicking a model opens the booking page for that device.
export default function DeviceFinder({ initial = INITIAL }) {
  const reduce = useReducedMotion()
  const [kind, setKind] = useState('phone')
  const [brandId, setBrandId] = useState(phoneBrands[0].id)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const brandList = kind === 'phone' ? phoneBrands : tabletBrands
  const q = query.trim().toLowerCase()

  const { items, total } = useMemo(() => {
    if (q) {
      const hits = brands.flatMap((b) =>
        b.models
          .filter((m) => `${b.name} ${m.name}`.toLowerCase().includes(q))
          .map((m) => ({ ...m, kind: b.kind, brand: b.name })),
      )
      return { items: hits.slice(0, MAX_SEARCH), total: hits.length }
    }
    const brand = brands.find((b) => b.id === brandId)
    const all = (brand ? brand.models : []).map((m) => ({ ...m, kind: brand.kind, brand: brand.name }))
    return { items: showAll ? all : all.slice(0, initial), total: all.length }
  }, [q, brandId, showAll, initial])

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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any model, e.g. Galaxy S24 or iPad Air"
          className="min-h-12 w-full rounded-full border border-field bg-white pl-11 pr-4 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>
      {q && (
        <p className="mt-3 text-center text-[13px] text-muted" role="status">
          {total} {total === 1 ? 'model' : 'models'} found{total > MAX_SEARCH ? ` — showing the first ${MAX_SEARCH}, type more to narrow down` : ''}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={q ? 'search' : brandId}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3"
        >
          {items.map((m) => {
            const Icon = m.kind === 'tablet' ? Tablet : Smartphone
            return (
              <Link
                key={m.id}
                to={bookUrl(m)}
                className="flex min-h-[72px] items-center gap-3.5 rounded-[20px] border border-line bg-white p-3.5 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint text-accent" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  {q && <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-accent">{m.brand}</span>}
                  <span className="block text-[15px] font-extrabold leading-tight tracking-[-0.02em]">{m.name}</span>
                </span>
                <ArrowRight size={16} strokeWidth={2} className="shrink-0 text-accent" aria-hidden="true" />
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

      {!q && total > initial && (
        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer models' : `Show all ${total} models`}
          </Button>
        </div>
      )}
    </div>
  )
}
