import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import AddressField from '../AddressField'
import Select from '../ui/Select'
import Field from '../ui/Field'
import { photoPreview } from '../../lib/attachments'
import Button from '../ui/Button'
import { DEFAULTS, PRICE_GROUPS, currentSettings, resetSettings, saveSettings } from '../../lib/settings'
import { reverseGeocode } from '../../lib/geo'
import { timeLabel, toHHMM, toMin } from '../../lib/schedule'
import { Card } from './shared'
import TemplatesCard from './TemplatesCard'
import StockCard from './StockCard'
import { NotificationSettings } from './Notifications'
import { setAdminPrefs, useAdminPrefs } from '../../lib/store'

const LocationMap = lazy(() => import('../LocationMap'))

const TIMES = Array.from({ length: 33 }, (_, i) => 6 * 60 + i * 30).map((m) => ({ value: toHHMM(m), label: timeLabel(m) })) // 6am – 10pm
const LENGTHS = [30, 45, 60, 75, 90, 120].map((m) => ({ value: m, label: m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`.replace('1.25 hours', '1 h 15 min').replace('1.5 hours', '1 h 30 min') }))
const STEPS = [15, 30, 60].map((m) => ({ value: m, label: `Every ${m} minutes` }))
const LEADS = [15, 30, 45, 60, 90, 120, 180].map((m) => ({ value: m, label: m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}` }))
const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']]
const KINDS = [
  { value: 'range', label: 'Price range' },
  { value: 'fixed', label: 'Fixed price' },
  { value: 'from', label: 'From (starting price)' },
  { value: 'free', label: 'Free' },
]
const kindOf = (p) => (p.free ? 'free' : p.from != null ? 'from' : p.fixed != null ? 'fixed' : 'range')

const Help = ({ children }) => <p className="mt-1.5 text-xs leading-relaxed text-muted">{children}</p>
const numCls = 'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent'

// One editable price row
function PriceRow({ row, value, onChange }) {
  const kind = kindOf(value)
  const setKind = (k) => {
    const n = value.min ?? value.fixed ?? value.from ?? 0
    const keep = value.hidden ? { hidden: true } : {}
    onChange(k === 'free' ? { free: true, ...keep } : k === 'fixed' ? { fixed: n, ...keep } : k === 'from' ? { from: n, ...keep } : { min: n, max: value.max ?? n, ...keep })
  }
  const num = (field) => (
    <input
      type="number" min="0" step="1" inputMode="numeric" aria-label={`${row.label}: ${field}`}
      value={value[field] ?? ''}
      onChange={(e) => onChange({ ...value, [field]: e.target.value === '' ? 0 : Number(e.target.value) })}
      className={numCls}
    />
  )
  const changed = JSON.stringify(value) !== JSON.stringify(DEFAULTS.prices[row.id])
  return (
    <li className={`grid gap-2 border-b border-line py-3 last:border-0 sm:grid-cols-[1fr_170px_200px_70px] sm:items-center sm:gap-3 ${value.hidden ? 'opacity-50' : ''}`}>
      <p className="text-sm font-semibold">{row.label}{changed && <span className="ml-1.5 rounded bg-tint px-1.5 py-0.5 text-[10px] font-bold text-accent">CHANGED</span>}</p>
      <Select variant="compact" ariaLabel={`${row.label}: price type`} value={kind} onChange={setKind} options={KINDS} />
      <div className="flex items-center gap-2">
        {kind === 'free' && <span className="text-sm font-extrabold text-success">FREE</span>}
        {kind === 'fixed' && <><span className="text-sm text-muted">£</span>{num('fixed')}</>}
        {kind === 'from' && <><span className="whitespace-nowrap text-sm text-muted">From £</span>{num('from')}</>}
        {kind === 'range' && <><span className="text-sm text-muted">£</span>{num('min')}<span className="text-sm text-muted">to</span>{num('max')}</>}
      </div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted"><input type="checkbox" checked={Boolean(value.hidden)} onChange={(e) => { const { hidden: _h, ...rest } = value; onChange(e.target.checked ? { ...rest, hidden: true } : rest) }} className="size-4 accent-[#1e4fd8]" />Hide</label>
    </li>
  )
}

export default function Settings() {
  const [form, setForm] = useState(currentSettings)
  const [saved, setSaved] = useState(false)
  const [baseText, setBaseText] = useState(form.schedule.BASE.label || '')
  const [priceTab, setPriceTab] = useState('iphone')
  const job = useRef(0)
  const [baseline, setBaseline] = useState(() => JSON.stringify(currentSettings())) // last saved values

  const dirty = JSON.stringify(form) !== baseline
  const s = form.schedule
  const setSchedule = (patch) => { setSaved(false); setForm((f) => ({ ...f, schedule: { ...f.schedule, ...patch } })) }
  const setArea = (patch) => { setSaved(false); setForm((f) => ({ ...f, area: { ...f.area, ...patch } })) }
  const setBusiness = (patch) => { setSaved(false); setForm((f) => ({ ...f, business: { ...f.business, ...patch } })) }
  const setPrice = (id, v) => { setSaved(false); setForm((f) => ({ ...f, prices: { ...f.prices, [id]: v } })) }

  // Problems that block saving
  const errors = useMemo(() => {
    const e = []
    if (toMin(s.dayEnd) - toMin(s.dayStart) < s.serviceMin) e.push('The working day is shorter than one repair. Make the end time later.')
    if (!s.workDays.length) e.push('Choose at least one working day.')
    Object.entries(form.prices).forEach(([id, p]) => {
      if (p.min != null && p.max != null && p.max < p.min) {
        const row = PRICE_GROUPS.flatMap((g) => g.rows).find((r) => r.id === id)
        e.push(`“${row?.label}”: the highest price is lower than the lowest price.`)
      }
    })
    return e
  }, [form, s])

  const save = () => {
    if (errors.length) return
    saveSettings(form)
    setBaseline(JSON.stringify(form))
    setSaved(true)
  }
  const reset = () => {
    if (!window.confirm('Put every setting and price back to the original values?')) return
    resetSettings()
    const fresh = currentSettings()
    setForm(fresh)
    setBaseText(fresh.schedule.BASE.label || '')
    setBaseline(JSON.stringify(fresh))
    setSaved(true)
  }
  const undo = () => { const back = JSON.parse(baseline); setForm(back); setBaseText(back.schedule.BASE.label || ''); setSaved(false) }

  const pickBase = (p) => {
    if (p.lat == null) return
    setBaseText(p.address || baseText)
    setSchedule({ BASE: { lat: p.lat, lon: p.lon, label: p.address || baseText } })
  }
  const dragBase = async (p) => {
    setSchedule({ BASE: { ...s.BASE, lat: p.lat, lon: p.lon } })
    const n = ++job.current
    const place = await reverseGeocode(p.lat, p.lon).catch(() => null)
    if (n !== job.current || !place) return
    setBaseText(place.address)
    setForm((f) => ({ ...f, schedule: { ...f.schedule, BASE: { lat: p.lat, lon: p.lon, label: place.address } } }))
  }
  const same = (a, b) => Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lon - b.lon) < 1e-6
  // "My start location" only when the circle follows a start location that is not the city centre
  const centreOnBase = same(form.area, s.BASE) && !same(form.area, DEFAULTS.area)

  const group = PRICE_GROUPS.find((g) => g.id === priceTab)

  return (
    <div className="space-y-5 pb-28">
      {/* Working hours */}
      <Card title="Working hours">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><Select label="Start of the day" value={s.dayStart} onChange={(v) => setSchedule({ dayStart: v })} options={TIMES} /><Help>You leave your start location at this time.</Help></div>
          <div><Select label="End of the day" value={s.dayEnd} onChange={(v) => setSchedule({ dayEnd: v })} options={TIMES} /><Help>The last repair must be finished by this time.</Help></div>
          <div><Select label="Time for one repair" value={s.serviceMin} onChange={(v) => setSchedule({ serviceMin: v })} options={LENGTHS} /><Help>Each booking blocks this much time, plus the drive.</Help></div>
          <div><Select label="Times shown to customers" value={s.stepMin} onChange={(v) => setSchedule({ stepMin: v })} options={STEPS} /><Help>After the first free time, e.g. 9:00, 9:30, 10:00.</Help></div>
          <div><Select label="Same-day notice" value={s.leadMin} onChange={(v) => setSchedule({ leadMin: v })} options={LEADS} /><Help>For bookings today, the earliest time is at least this far from now.</Help></div>
        </div>
        <fieldset className="mt-6">
          <legend className="text-[13px] font-bold text-body">Working days</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS.map(([n, label]) => {
              const on = s.workDays.includes(n)
              return (
                <button key={n} type="button" aria-pressed={on}
                  onClick={() => setSchedule({ workDays: on ? s.workDays.filter((d) => d !== n) : [...s.workDays, n].sort() })}
                  className={`inline-flex h-11 min-w-[64px] items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-field bg-white text-muted hover:border-accent'}`}>
                  {on && <Check size={14} strokeWidth={3} aria-hidden="true" />}{label}
                </button>
              )
            })}
          </div>
          <Help>Customers can’t book days that are switched off.</Help>
        </fieldset>
      </Card>

      {/* Start location + service area */}
      <Card title="Start location and service area">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <div className="min-w-0 space-y-5">
            <div>
              <AddressField label="Where you start the day" value={baseText} onChange={setBaseText} onPick={pickBase} />
              <Help>Usually your home or shop. The drive to the first customer is counted from here. You can also drag the pin.</Help>
            </div>
            <div>
              <label htmlFor="radius" className="flex items-center justify-between text-[13px] font-bold text-body">
                Service area size <span className="text-base font-extrabold text-accent">{form.area.radiusKm} km</span>
              </label>
              <input id="radius" type="range" min="3" max="40" step="1" value={form.area.radiusKm} onChange={(e) => setArea({ radiusKm: Number(e.target.value) })} className="mt-3 w-full accent-[#1e4fd8]" />
              <div className="flex justify-between text-[11px] text-muted"><span>3 km</span><span>40 km</span></div>
              <Help>Customers outside the blue circle see “Service out of area” and can’t book.</Help>
            </div>
            <div>
              <Select
                label="Centre of the circle"
                value={centreOnBase ? 'base' : 'default'}
                onChange={(v) => setArea(v === 'base' ? { lat: s.BASE.lat, lon: s.BASE.lon } : { lat: DEFAULTS.area.lat, lon: DEFAULTS.area.lon })}
                options={[{ value: 'default', label: 'Manchester city centre' }, { value: 'base', label: 'My start location' }]}
              />
            </div>
          </div>
          <Suspense fallback={<div className="h-[340px] animate-pulse rounded-[18px] bg-[#E9EDF2]" />}>
            <LocationMap point={{ lat: s.BASE.lat, lon: s.BASE.lon }} area={form.area} fitArea onMove={dragBase} label="Map of your start location and service area" className="h-[340px] lg:h-full lg:min-h-[340px]" />
          </Suspense>
        </div>
        {/* Extra postcode districts with a call-out fee */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[13px] font-bold text-body">Extra postcode districts</p>
          <Help>Districts you also cover, even outside the circle, with an optional call-out fee. Example: WA14 (Altrincham) with £10.</Help>
          <ul className="mt-3 space-y-2">
            {(form.area.districts || []).map((d, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <input aria-label="Postcode district" value={d.code} onChange={(e) => setArea({ districts: form.area.districts.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase().replace(/\s/g, '') } : x)) })} placeholder="e.g. WA14" className={`${numCls} !w-28`} />
                <span className="text-sm text-muted">Call-out fee £</span>
                <input aria-label="Call-out fee" type="number" min="0" value={d.fee ?? 0} onChange={(e) => setArea({ districts: form.area.districts.map((x, j) => (j === i ? { ...x, fee: Math.max(0, Number(e.target.value)) } : x)) })} className={`${numCls} !w-24`} />
                <button type="button" onClick={() => setArea({ districts: form.area.districts.filter((_, j) => j !== i) })} className="h-10 rounded-full px-3 text-sm font-bold text-muted hover:text-danger">Remove</button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setArea({ districts: [...(form.area.districts || []), { code: '', fee: 0 }] })} className="mt-2 h-10 rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent">+ Add district</button>
        </div>
      </Card>

      {/* Business: shown to customers and on receipts */}
      <Card title="Business details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Field label="Technician first name" value={form.business.techName} onChange={(e) => setBusiness({ techName: e.target.value })} /><Help>Shown to customers on their tracking page.</Help></div>
          <div><Select label="Default warranty" value={form.business.warrantyMonths} onChange={(v) => setBusiness({ warrantyMonths: v })} options={[1, 3, 6, 12].map((m) => ({ value: m, label: `${m} month${m > 1 ? 's' : ''}` }))} /><Help>Filled in when you complete a repair.</Help></div>
          <div className="sm:col-span-2"><Field label="Review link" value={form.business.reviewLink} onChange={(e) => setBusiness({ reviewLink: e.target.value })} placeholder="e.g. https://g.page/r/…/review" /><Help>Sent to customers when a repair is completed.</Help></div>
          <div className="flex items-center gap-4 sm:col-span-2">
            {form.business.techPhoto ? <img src={form.business.techPhoto} alt="" className="size-14 rounded-full object-cover" /> : <span className="grid size-14 place-items-center rounded-full bg-[#F1F3F7] text-xs text-muted">Photo</span>}
            <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent">
              Upload technician photo
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const img = await photoPreview(f, 240, 0.82); if (img) setBusiness({ techPhoto: img }) } }} />
            </label>
            {form.business.techPhoto && <button type="button" onClick={() => setBusiness({ techPhoto: '' })} className="text-sm font-bold text-muted hover:text-danger">Remove</button>}
          </div>
        </div>
      </Card>

      {/* Prices */}
      <Card title="Prices" action={<span className="text-xs text-muted">Shown on the Prices page and used for booking estimates</span>}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Price list">
          {PRICE_GROUPS.map((g) => (
            <button key={g.id} type="button" aria-pressed={priceTab === g.id} onClick={() => setPriceTab(g.id)}
              className={`h-10 rounded-full px-4 text-sm font-bold transition-colors ${priceTab === g.id ? 'bg-ink text-white' : 'bg-[#F6F7F9] text-body hover:bg-line'}`}>{g.label}</button>
          ))}
        </div>
        {/* Bulk change for this list */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[#F6F7F9] px-4 py-3 text-sm">
          <span className="font-semibold text-body">Change all {group.label} prices:</span>
          {[-10, -5, 5, 10].map((p) => (
            <button key={p} type="button" onClick={() => group.rows.forEach((row) => {
              const v = form.prices[row.id]
              const k = (n) => (n == null ? n : Math.max(0, Math.round(n * (1 + p / 100))))
              setPrice(row.id, { ...v, ...(v.min != null ? { min: k(v.min) } : {}), ...(v.max != null ? { max: k(v.max) } : {}), ...(v.fixed != null ? { fixed: k(v.fixed) } : {}), ...(v.from != null ? { from: k(v.from) } : {}) })
            })} className="h-9 rounded-full border border-line bg-white px-3 font-bold hover:border-accent hover:text-accent">{p > 0 ? `+${p}` : p}%</button>
          ))}
          <span className="text-xs text-muted">Then press Save settings.</span>
        </div>
        <ul className="mt-2">
          {group.rows.map((row) => <PriceRow key={row.id} row={row} value={form.prices[row.id]} onChange={(v) => setPrice(row.id, v)} />)}
        </ul>
      </Card>

      <TemplatesCard />

      <StockCard />

      <NotificationsCard />

      <div className="flex justify-end">
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted hover:bg-white hover:text-danger">
          <RotateCcw size={15} aria-hidden="true" /> Reset everything to the original values
        </button>
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-line bg-white/95 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="min-w-0 text-sm" role="status">
            {errors.length ? <span className="font-semibold text-danger">{errors[0]}</span>
              : dirty ? <span className="font-semibold text-body">You have unsaved changes.</span>
                : saved ? <span className="inline-flex items-center gap-1.5 font-semibold text-success"><Check size={16} strokeWidth={2.5} aria-hidden="true" /> Saved. The website now uses these settings.</span>
                  : <span className="text-muted">Changes apply to the website as soon as you save.</span>}
          </div>
          <div className="flex gap-2">
            {dirty && <Button variant="secondary" onClick={undo}>Undo changes</Button>}
            <Button onClick={save} disabled={!dirty || errors.length > 0}>Save settings</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings > Notifications (saved straight away, separate from the Save button)
function NotificationsCard() {
  const prefs = useAdminPrefs()
  return <Card title="Notifications"><NotificationSettings prefs={prefs} onChange={setAdminPrefs} /></Card>
}
