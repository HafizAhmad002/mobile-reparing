import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import Reveal, { Stagger, StaggerItem } from '../components/Reveal'
import Pill from '../components/ui/Pill'
import AccessoryImage from '../components/ui/AccessoryImage'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Select from '../components/ui/Select'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { accessories, accessoryCategories } from '../data/accessories'
import { phoneBrands, tabletBrands } from '../data/catalog'
import { SITE } from '../data/site'
import { addOrder, useSession } from '../lib/store'
import { inStock, useStock } from '../lib/stock'
import { PHONE_ERROR, POSTCODE_ERROR, formatUkPhone, isUkPostcode, normalisePostcode, normaliseUkPhone } from '../lib/format'

const money = (n) => `£${n.toFixed(2)}`
const NOT_LISTED = '__other__'
const allBrands = [...phoneBrands, ...tabletBrands]
const BRAND_OPTIONS = [
  ...phoneBrands.map((b) => ({ value: b.name, label: b.name, group: 'Phones' })),
  ...tabletBrands.map((b) => ({ value: b.name, label: b.name, group: 'Tablets' })),
  { value: NOT_LISTED, label: 'My brand is not listed', group: 'Other' },
]
const HERO_ITEMS = ['case-clear', 'cable-usbc', 'earphones', 'charger-wall'].map((id) => `/images/accessories/${id}.webp`)

export default function Shop() {
  useDocumentTitle('Phone Accessories — FixPoint Manchester', 'Simple, locally sourced phone accessories: cases, screen glass, cables and chargers. No big brands.')
  const reduce = useReducedMotion()
  const session = useSession()
  const [cat, setCat] = useState('all')
  const [cart, setCart] = useState({}) // { productId: qty }
  const [device, setDevice] = useState({ brand: '', model: '', customBrand: '', customModel: '' })
  const [form, setForm] = useState({ name: session?.name || '', phone: formatUkPhone(session?.phone) || '', address: session?.address || '', postcode: session?.postcode || '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const [sheet, setSheet] = useState(false) // order panel as a bottom sheet on small screens

  const stock = useStock()
  // Items at 0 stock are hidden
  const list = accessories.filter((a) => (cat === 'all' || a.category === cat) && inStock(stock, a.id))
  const lines = useMemo(() => Object.entries(cart).map(([id, qty]) => ({ ...accessories.find((a) => a.id === id), qty })), [cart])
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const priced = lines.every((l) => l.price != null)
  const total = lines.reduce((n, l) => n + (l.price || 0) * l.qty, 0)

  const brandObj = allBrands.find((b) => b.name === device.brand)
  const finalBrand = device.brand === NOT_LISTED ? device.customBrand.trim() : device.brand
  const finalModel = device.brand === NOT_LISTED || device.model === NOT_LISTED ? device.customModel.trim() : device.model

  const change = (id, d) => setCart((c) => {
    const qty = (c[id] || 0) + d
    const next = { ...c }
    if (qty <= 0) delete next[id]; else next[id] = qty
    return next
  })
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setD = (k) => (e) => setDevice((d) => ({ ...d, [k]: e.target.value }))

  // lock page scroll while the bottom sheet is open
  useEffect(() => {
    if (!sheet) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setSheet(false)
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey) }
  }, [sheet])

  const checkout = (e) => {
    e.preventDefault()
    if (!finalBrand || !finalModel) return setError('Please choose your phone brand and model so we bring the right accessories.')
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.postcode.trim()) {
      return setError('Please fill in your name, phone number, address and postcode.')
    }
    if (!normaliseUkPhone(form.phone)) return setError(PHONE_ERROR)
    if (!isUkPostcode(form.postcode)) return setError(POSTCODE_ERROR)
    const order = addOrder({
      type: 'accessory',
      userEmail: session?.email || null,
      customer: { name: form.name.trim(), phone: normaliseUkPhone(form.phone), email: '', address: form.address.trim(), postcode: normalisePostcode(form.postcode) },
      device: { kind: brandObj?.kind || 'phone', brand: finalBrand, model: finalModel }, // the phone the accessories are for
      items: lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty, price: l.price })),
      price: priced ? total : null,
    })
    setDone(order)
    setCart({})
    setError('')
  }

  /* The order panel (shown in the sticky side box on desktop and in the bottom sheet on small screens) */
  const panel = (
    <>
      <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em]">
        <ShoppingBag size={18} strokeWidth={2} aria-hidden="true" /> Your order
        {count > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">{count}</span>}
      </h2>

      {done ? (
        <div className="mt-4 text-center" role="status">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-tint text-success"><Check size={22} strokeWidth={2.5} aria-hidden="true" /></span>
          <p className="mt-3 font-extrabold">Order sent</p>
          <p className="mt-1 text-sm text-muted">Reference <b className="text-ink">{done.id}</b>. We will contact you to confirm the price and delivery.</p>
          <Button variant="secondary" className="mt-4" onClick={() => { setDone(null); setSheet(false) }}>Order more</Button>
        </div>
      ) : count === 0 ? (
        <p className="mt-3 text-sm text-muted">Add an accessory to start your order. We will then ask which phone it is for.</p>
      ) : (
        <form onSubmit={checkout} className="mt-4" noValidate>
          <ul className="divide-y divide-line text-sm">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>{l.qty} × {l.name}</span>
                <span className="flex items-center gap-2">
                  <b className="whitespace-nowrap">{l.price != null ? money(l.price * l.qty) : SITE.price}</b>
                  <button type="button" aria-label={`Remove ${l.name}`} onClick={() => change(l.id, -l.qty)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-page hover:text-danger"><X size={14} strokeWidth={2} /></button>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between text-base font-extrabold"><span>Total</span><span>{priced ? money(total) : 'To be confirmed'}</span></p>

          {/* Which phone is it for? */}
          <fieldset className="mt-5 rounded-2xl bg-tint p-4">
            <legend className="px-1 text-[13px] font-extrabold text-accent">Which phone is it for?</legend>
            <div className="space-y-3">
              <Select label="Brand" placeholder="Select brand" value={device.brand} onChange={(v) => setDevice({ brand: v, model: '', customBrand: '', customModel: '' })} options={BRAND_OPTIONS} />
              {device.brand === NOT_LISTED ? (
                <>
                  <Field label="Your brand" value={device.customBrand} onChange={setD('customBrand')} placeholder="Type your brand" />
                  <Field label="Your model" value={device.customModel} onChange={setD('customModel')} placeholder="Type your model" />
                </>
              ) : (
                <>
                  <Select label="Model" placeholder={brandObj ? 'Select model' : 'Choose a brand first'} value={device.model} onChange={(v) => setDevice((d) => ({ ...d, model: v }))} disabled={!brandObj}
                    options={brandObj ? [...brandObj.models.map((m) => ({ value: m.name, label: m.name })), { value: NOT_LISTED, label: 'My model is not listed' }] : []} />
                  {device.model === NOT_LISTED && <Field label="Your model" value={device.customModel} onChange={setD('customModel')} placeholder="Type your model" />}
                </>
              )}
            </div>
          </fieldset>

          <div className="mt-4 space-y-3">
            <Field label="Name" value={form.name} onChange={setF('name')} autoComplete="name" />
            <Field label="Phone number" type="tel" value={form.phone} onChange={setF('phone')} autoComplete="tel" />
            <Field label="Address" value={form.address} onChange={setF('address')} autoComplete="street-address" />
            <Field label="Postcode" value={form.postcode} onChange={setF('postcode')} autoComplete="postal-code" />
          </div>
          {error && <p role="alert" className="mt-3 text-xs font-semibold text-danger">{error}</p>}
          <Button type="submit" variant="dark" className="mt-4 w-full">Send order</Button>
          <p className="mt-2 text-xs text-muted">We confirm the price first. You pay when we hand it over.</p>
        </form>
      )}
    </>
  )

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="grid items-center gap-8 pt-10 md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:pt-16 [&>*]:min-w-0">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Accessories</p>
          <h1 className="max-w-[760px] text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Simple accessories, fair prices</h1>
          <p className="mt-5 max-w-[600px] text-[17px] leading-relaxed text-muted">
            Cases, screen glass, cables and chargers sourced locally. We don’t sell big-brand products — just good-quality basics. Order here and we will confirm the price and bring it to you.
          </p>
        </div>
        {/* Hero picture: four of our accessories. Loaded first (eager), not lazily. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden="true">
          {HERO_ITEMS.map((src, i) => (
            <div key={src} className={`overflow-hidden rounded-[24px] border border-line bg-white ${i % 2 ? 'translate-y-4 sm:translate-y-6' : ''}`}>
              <img src={src} alt="" width="400" height="400" loading="eager" fetchPriority={i < 2 ? 'high' : 'auto'} decoding="async" className="aspect-square w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-2 md:mt-16" role="group" aria-label="Filter accessories">
        {accessoryCategories.map((c) => <Pill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Pill>)}
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Stagger key={cat} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          {list.map((a) => {
            const qty = cart[a.id] || 0
            return (
              <StaggerItem key={a.id}>
                <article className="group flex h-full min-w-0 flex-col rounded-[20px] border border-line bg-white p-2.5 pb-3 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF] sm:rounded-[24px] sm:p-4 sm:pb-6">
                  <AccessoryImage item={a} className="aspect-square w-full rounded-[14px] sm:aspect-[4/5] sm:rounded-[18px]" />
                  <h2 className="mt-3 px-1 text-[15px] font-extrabold leading-tight tracking-[-0.02em] sm:mt-4 sm:px-2 sm:text-lg">{a.name}</h2>
                  <p className="mt-1.5 flex-1 px-1 text-[13px] leading-relaxed text-muted sm:px-2 sm:text-sm">{a.text}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 sm:mt-5 sm:gap-3 sm:px-2">
                    <p className="text-[15px] font-extrabold sm:text-base">{a.price != null ? money(a.price) : SITE.price}</p>
                    {qty === 0 ? (
                      <Button onClick={() => change(a.id, 1)} className="!h-11 !px-5 !text-sm max-sm:w-full">Add</Button>
                    ) : (
                      <div className="inline-flex items-center rounded-full border border-field max-sm:w-full max-sm:justify-between">
                        <button type="button" aria-label={`Remove one ${a.name}`} onClick={() => change(a.id, -1)} className="grid size-11 place-items-center"><Minus size={16} strokeWidth={2} /></button>
                        <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">{qty}</span>
                        <button type="button" aria-label={`Add one more ${a.name}`} onClick={() => change(a.id, 1)} className="grid size-11 place-items-center"><Plus size={16} strokeWidth={2} /></button>
                      </div>
                    )}
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </Stagger>

        {/* Desktop: the order box stays in view while you scroll. If it is taller than the screen it scrolls inside itself. */}
        <aside
          aria-label="Your order"
          className="sticky top-24 hidden max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-[28px] border border-line bg-white p-6 lg:block"
        >
          {panel}
        </aside>
      </div>

      {/* Small screens: a bar at the bottom opens the order as a sheet */}
      <AnimatePresence>
        {count > 0 && !sheet && (
          <motion.div
            key="bar"
            initial={reduce ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-24 z-40 lg:hidden"
          >
            <button type="button" onClick={() => setSheet(true)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-full bg-ink px-5 text-left text-white shadow-[0_16px_40px_-20px_rgba(14,15,19,0.6)]">
              <span className="flex items-center gap-2 text-sm font-bold"><ShoppingBag size={18} strokeWidth={2} aria-hidden="true" /> {count} {count === 1 ? 'item' : 'items'}</span>
              <span className="text-sm font-extrabold">View order</span>
            </button>
          </motion.div>
        )}
        {sheet && (
          <>
            <motion.div key="ov" className="fixed inset-0 z-50 bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.aside
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Your order"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-white p-6 pb-10 lg:hidden"
              initial={reduce ? { opacity: 0 } : { y: '100%' }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" aria-label="Close order" onClick={() => setSheet(false)} className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-field bg-white"><X size={18} strokeWidth={2} /></button>
              {panel}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Reveal className="mt-16 lg:mt-[100px]">
        <div className="rounded-[28px] bg-ink p-8 text-white md:p-10">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Looking for something else?</h2>
          <p className="mt-2 max-w-[520px] text-[15px] text-[#C9CCD6]">Tell us what you need and we will try to get it for you.</p>
          <Button href={SITE.whatsapp} variant="white" className="mt-5">Message us</Button>
        </div>
      </Reveal>
    </div>
  )
}
