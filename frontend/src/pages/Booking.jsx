import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Pencil, Smartphone, Tablet } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Select from '../components/ui/Select'
import DatePicker, { todayISO } from '../components/ui/DatePicker'
import Icon from '../components/ui/Icon'
import { ProblemBox } from '../components/MediaUpload'
import AddressField from '../components/AddressField'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brands } from '../data/catalog'
import { services } from '../data/services'
import { OTHER } from '../data/content'
import { addOrder, getOrders, signUp, useOrders, useSession } from '../lib/store'
import { checkArea, listedDistrict, serviceStatus } from '../lib/areaCheck'
import { isVideo, toStored } from '../lib/attachments'
import { estimate as getEstimate, estimateText } from '../lib/pricing'
import { extraRows, freeFirst, priceText } from '../data/prices'
import { lookupPostcode, reverseGeocode } from '../lib/geo'
import { downloadIcs } from '../lib/orders'
import { PHONE_ERROR, POSTCODE_ERROR, formatDate, isUkPostcode, lastBookableDay, normalisePostcode, normaliseUkPhone } from '../lib/format'
import { SITE } from '../data/site'
import { freeSlots, isWorkDay, timeLabel, timeOffOn, toHHMM, toMin } from '../lib/schedule'
import { SCHEDULE } from '../data/schedule'

// The map (Leaflet) is only downloaded when the "Your details" step opens
const LocationMap = lazy(() => import('../components/LocationMap'))

const STEPS = ['Your device', 'The problem', 'Your details', 'Review']
const NOT_LISTED = '__other__'
const UNSURE = 'unsure'

// Issue tiles: the 8 services + "Not sure". Anything else goes in the "Tell us more" box below them.
const ISSUE_TILES = [
  ...services.map((s) => ({ id: s.id, label: s.name, text: s.short, icon: s.icon })),
  { id: UNSURE, label: 'Not sure – free check', text: 'We will find the fault for you.', icon: 'ClipboardList' },
]
// Extra services (from the price list), shown under the repairs
const EXTRA_TILES = freeFirst(extraRows).filter((r) => !r.hidden).map((r) => ({ id: r.id, label: r.label, text: priceText(r), icon: r.icon, free: r.free }))
const ALL_TILES = [...ISSUE_TILES, ...EXTRA_TILES]
const issueLabel = (id) => (id === OTHER ? 'Other problem' : ALL_TILES.find((t) => t.id === id)?.label || id)

// Turns the text sent by the hero form (e.g. "Cracked screen") into a tile id
const HERO_ISSUE_MAP = {
  'cracked screen': 'screen', 'battery drains fast': 'battery', 'not charging': 'charging-port',
  'camera issue': 'camera', 'back glass broken': 'back-glass', 'water damage': 'water-damage',
  'not sure – free check': UNSURE, other: OTHER,
}
const toTileId = (v) => (ALL_TILES.some((t) => t.id === v) ? v : HERO_ISSUE_MAP[(v || '').toLowerCase()] || null)


export default function Booking() {
  const reduce = useReducedMotion()
  const [params] = useSearchParams()
  const location = useLocation()
  // Address already checked on the Areas page ("Book a repair here")
  const fromAreas = location.state?.place
  const session = useSession()
  useDocumentTitle('Book a Repair — FixPoint Manchester', 'Tell us your phone and the problem, pick a time and we come to you in Manchester.')

  // ---- start values from the URL (set by "Find your phone", the hero form and service cards)
  const start = useMemo(() => {
    // No phone in the link: use the phone saved in the customer's profile
    const saved = !params.get('brand') && session?.device ? session.device : null
    const brandName = params.get('brand') || saved?.brand || ''
    const model = params.get('model') || saved?.model || ''
    const issueTile = toTileId(params.get('issue'))
    return {
      kind: params.get('kind') === 'tablet' || saved?.kind === 'tablet' ? 'tablet' : 'phone',
      brandName,
      model,
      issues: issueTile && issueTile !== OTHER ? [issueTile] : [],
      note: params.get('note') || '',
      hasDevice: Boolean(brandName && model),
    }
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps -- the profile is only read when the page opens

  // Answers survive a page refresh (sessionStorage), unless the link brings its own device / problem
  const [draft] = useState(() => {
    if (params.toString() || location.state) return null
    try { return JSON.parse(sessionStorage.getItem('fp_booking_draft') || 'null') } catch { return null }
  })
  const [step, setStep] = useState(draft?.step ?? (start.hasDevice ? 1 : 0))
  const [dir, setDir] = useState(1)
  const [kind, setKind] = useState(draft?.kind || start.kind)
  const [brandName, setBrandName] = useState(draft?.brandName ?? start.brandName)
  const [model, setModel] = useState(draft?.model ?? start.model)
  const [customBrand, setCustomBrand] = useState(draft?.customBrand || '')
  const [customModel, setCustomModel] = useState(draft?.customModel || '')
  const [issues, setIssues] = useState(draft?.issues || start.issues)
  const [note, setNote] = useState(draft?.note ?? start.note)
  // Photos / videos (may come from the "Other problem" card on the Services page)
  const [files, setFiles] = useState(() => (Array.isArray(location.state?.files) ? location.state.files : []))
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState(() => draft?.form ? { ...draft.form, start: null } : { name: session?.name || '', phone: session?.phone || '', email: session?.email || '', address: fromAreas?.address || session?.address || '', postcode: fromAreas?.postcode || session?.postcode || '', date: '', start: null, extra: '' })
  useEffect(() => {
    sessionStorage.setItem('fp_booking_draft', JSON.stringify({ step: Math.min(step, 2), kind, brandName, model, customBrand, customModel, issues, note, form }))
  }, [step, kind, brandName, model, customBrand, customModel, issues, note, form])
  const [spot, setSpot] = useState(fromAreas?.lat != null ? { lat: fromAreas.lat, lon: fromAreas.lon } : session?.location || null) // { lat, lon } of the address, shown on the map
  const [pinBusy, setPinBusy] = useState(false)
  const [locSource, setLocSource] = useState(fromAreas?.lat != null ? 'address' : session?.location ? 'saved' : null) // gps | address | pin | postcode
  const pinJob = useRef(0)
  // The pin was dragged: the address and postcode above follow the pin
  const movePin = async (p) => {
    setSpot(p)
    setLocSource('pin')
    const job = ++pinJob.current
    setPinBusy(true)
    const place = await reverseGeocode(p.lat, p.lon).catch(() => null)
    if (job !== pinJob.current) return // the pin was moved again meanwhile
    setPinBusy(false)
    if (place) setForm((f) => ({ ...f, address: place.address || f.address, postcode: place.postcode || '' }))
  }
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)

  const brandList = brands.filter((b) => b.kind === kind)
  const brandObj = brandList.find((b) => b.name === brandName)
  const finalBrand = brandName === NOT_LISTED ? customBrand.trim() : brandName
  const finalModel = model === NOT_LISTED || brandName === NOT_LISTED ? customModel.trim() : model
  const deviceReady = Boolean(finalBrand && finalModel)

  // One problem tile (repairs and extra services)
  const tile = (t) => {
    const on = issues.includes(t.id)
    return (
      <button key={t.id} type="button" aria-pressed={on} onClick={() => toggleIssue(t.id)}
        className={`flex min-h-[72px] items-center gap-3.5 rounded-[20px] border-2 p-3.5 text-left transition-colors ${on ? 'border-accent bg-tint' : 'border-line bg-white hover:border-field'}`}>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-accent text-white' : 'bg-[#F6F7F9] text-ink'}`}><Icon name={t.icon} size={20} /></span>
        <span>
          <span className="block text-[15px] font-extrabold leading-tight tracking-[-0.02em]">{t.label}</span>
          <span className={`block text-xs ${t.free ? 'font-bold text-success' : 'text-muted'}`}>{t.text}</span>
        </span>
      </button>
    )
  }

  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n) }
  // Typing in a field clears that field's error message
  const setF = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((er) => (er[k] ? { ...er, [k]: undefined } : er))
  }
  const toggleIssue = (id) => setIssues((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))

  // Pick at least one tile, or describe the problem in the box / add a photo or video
  const issueReady = issues.length > 0 || note.trim().length > 0 || files.length > 0
  // Saved with the order: when only the box was filled in, the problem is "Other"
  const orderIssues = issues.length ? issues : [OTHER]
  const postcodeHint = form.postcode ? checkArea(form.postcode) : null

  // ---- Arrival times (one technician: travel + 1 hour per visit, see data/schedule.js)
  const orders = useOrders()
  // Postcode looked up on postcodes.io: { status, postcode, district, lat, lon, for }
  const [pcInfo, setPcInfo] = useState(null)
  useEffect(() => {
    const pc = form.postcode.trim()
    if (!isUkPostcode(pc)) { setPcInfo(null); return }
    const ctrl = new AbortController()
    lookupPostcode(pc, ctrl.signal).then((r) => setPcInfo({ ...r, for: normalisePostcode(pc) })).catch(() => {})
    return () => ctrl.abort()
  }, [form.postcode])
  const pcPoint = pcInfo?.status === 'ok' ? { lat: pcInfo.lat, lon: pcInfo.lon } : null
  const point = spot || pcPoint
  // We only repair inside our Manchester service area (map pin first, else the looked-up postcode)
  const area = serviceStatus({ point, postcode: form.postcode })
  const outOfArea = area === 'out'
  const slots = useMemo(() => (point && !outOfArea ? freeSlots({ orders, date: form.date, point }) : []), [orders, form.date, point, outOfArea])
  const chosen = slots.find((s) => s.start === form.start) || null
  // The earliest free time on each of the next 14 days (one tap to choose)
  const earliest = useMemo(() => {
    if (!point || outOfArea) return []
    const out = []
    for (let i = 0; i < 14 && out.length < 6; i++) {
      const d = new Date(); d.setDate(d.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const first = freeSlots({ orders, date: iso, point })[0]
      if (first) out.push({ date: iso, ...first })
    }
    return out
  }, [orders, point, outOfArea])
  // A day is greyed out when it has no free time for this address
  const fullDay = (iso) => (!isWorkDay(iso) ? 'closed' : timeOffOn(iso) ? 'not available' : point && !outOfArea && freeSlots({ orders, date: iso, point }).length === 0)
  // Drop the chosen time if it is no longer free (other day, other address, or just booked)
  useEffect(() => {
    if (form.start != null && !chosen) setForm((f) => ({ ...f, start: null }))
  }, [form.start, chosen])
  // Estimate from the client's price list (null when we have no listed price)
  const est = deviceReady && issues.length ? getEstimate({ kind, brand: finalBrand, model: finalModel, issues }) : null
  const estLabel = estimateText(est)

  const [checking, setChecking] = useState(false)
  // Checks the details; looks the postcode up if needed. Resolves true when everything is fine.
  const validateDetails = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your name.'
    if (!normaliseUkPhone(form.phone)) e.phone = PHONE_ERROR
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email does not look right.'
    if (!form.address.trim()) e.address = 'Please enter the address we should visit.'
    if (!form.postcode.trim()) e.postcode = 'Please enter your postcode.'
    else if (!isUkPostcode(form.postcode)) e.postcode = POSTCODE_ERROR
    else {
      // Make sure the postcode really exists (postcodes.io). If the service is down we still accept it.
      let info = pcInfo?.for === normalisePostcode(form.postcode) ? pcInfo : null
      if (!info) {
        setChecking(true)
        info = { ...(await lookupPostcode(form.postcode)), for: normalisePostcode(form.postcode) }
        setChecking(false)
        setPcInfo(info)
      }
      if (info.status === 'notfound') e.postcode = 'We can’t find that postcode. Please check it.'
    }
    if (outOfArea) e.postcode = 'Sorry, we don’t cover this area yet.'
    // Date: today up to 60 days ahead, on a working day (also catches typed dates like 6666-06-06)
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(form.date) && !Number.isNaN(new Date(`${form.date}T12:00:00`).getTime())
    if (!form.date) e.date = 'Choose the day you would like us to visit.'
    else if (!valid || form.date < todayISO()) e.date = 'Please choose a date from today onwards.'
    else if (form.date > lastBookableDay()) e.date = 'You can book up to 60 days ahead. Please choose an earlier date.'
    else if (!isWorkDay(form.date)) e.date = 'We are closed on that day. Please choose another day.'
    else if (timeOffOn(form.date)) e.date = 'We are not working on that day. Please choose another day.'
    else if (!chosen && !outOfArea) e.start = 'Choose an arrival time.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    // Someone may have taken this time since the list was shown: check again
    const still = freeSlots({ orders: getOrders(), date: form.date, point }).find((x) => x.start === form.start)
    if (!still) {
      setForm((f) => ({ ...f, start: null }))
      setErrors({ start: 'Sorry, that time has just been booked. Please choose another time.' })
      go(2)
      return
    }
    setSending(true)
    const attachments = files.length ? await toStored(files) : []
    const base = {
      type: 'repair',
      userEmail: session?.email || null,
      customer: {
        name: form.name.trim(),
        phone: normaliseUkPhone(form.phone), // stored as +44… (E.164)
        email: form.email.trim(),
        address: form.address.trim(),
        postcode: pcInfo?.status === 'ok' ? pcInfo.postcode : normalisePostcode(form.postcode),
        district: pcInfo?.status === 'ok' ? pcInfo.district : '',
      },
      // postcodes.io could not be reached: check this address by hand
      manualCheck: pcInfo?.status !== 'ok',
      location: point, // map pin (or postcode centre) { lat, lon }
      locationSource: spot ? locSource || 'pin' : 'postcode',
      device: { kind, brand: finalBrand, model: finalModel },
      issues: orderIssues,
      issueNote: note.trim(),
      slot: { date: form.date, start: toHHMM(still.start), end: toHHMM(still.end), travelMin: still.travel, time: `${timeLabel(still.start)} – ${timeLabel(still.end)}` },
      notes: form.extra.trim(),
      estimate: est ? { min: est.min, max: est.max } : null,
      callOutFee: listedDistrict(form.postcode)?.fee || 0,
    }
    let order
    try {
      order = addOrder({ ...base, attachments })
    } catch {
      // Browser storage full: keep the booking, drop the photo previews
      order = addOrder({ ...base, attachments: attachments.map(({ preview, ...a }) => a) })
    }
    setSending(false)
    sessionStorage.removeItem('fp_booking_draft')
    setDone(order)
  }

  /* ------------------------------ success ------------------------------ */
  if (done) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-tint text-success"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></span>
        <h1 className="mt-6 text-[clamp(30px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Booking request sent</h1>
        <p className="mt-3 text-base text-muted">We will confirm your time and price shortly. Keep this reference to track your repair:</p>
        <p className="mx-auto mt-5 inline-block rounded-2xl border border-line bg-white px-6 py-3 text-2xl font-extrabold tracking-[0.04em]">{done.id}</p>
        {done.slot?.date && <p className="mt-4 text-[15px] font-semibold">{formatDate(done.slot.date, { year: true })}, {done.slot.time}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to={`/track/${done.id}?p=${String(done.customer?.phone || '').replace(/\D/g, '').slice(-4)}`} variant="dark">Track your repair</Button>
          {session && <Button to="/my-bookings" variant="secondary">See all my bookings</Button>}
          {done.slot?.date && <Button variant="secondary" onClick={() => downloadIcs(done)}>Add to calendar</Button>}
          <Button variant="secondary" href={`https://wa.me/?text=${encodeURIComponent(`My FixPoint repair is booked: ${done.id}${done.slot?.date ? `, ${formatDate(done.slot.date)} ${done.slot.time}` : ''}. Track it: ${window.location.origin}/track/${done.id}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</Button>
        </div>
        {!session && <GuestAccount order={done} />}
        <Link to="/" className="mt-6 inline-block text-sm font-bold text-accent">Back to home</Link>
      </div>
    )
  }

  const slide = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, x: 24 * dir },
    animate: { opacity: 1, x: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, x: -24 * dir },
    transition: { duration: 0.25 },
  }
  const DeviceIcon = kind === 'tablet' ? Tablet : Smartphone

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-4 pt-10 md:pt-14">
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Book a repair</p>
      <h1 className="text-[clamp(32px,4.4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Tell us about your phone</h1>

      {/* Progress */}
      {/* Steps: each one sits over its own quarter of the progress bar, and turns blue when reached */}
      <ol className="mt-6 grid grid-cols-4 gap-2 sm:gap-3" aria-label="Steps">
        {STEPS.map((s, i) => {
          const reached = i <= step
          return (
            <li key={s} className="min-w-0" aria-current={i === step ? 'step' : undefined}>
              <div className={`flex items-center gap-2 text-sm font-bold transition-colors duration-300 ${reached ? 'text-accent' : 'text-muted'}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs transition-colors duration-300 ${reached ? 'bg-accent text-white' : 'bg-line text-muted'}`}>
                  {i < step ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                {/* Phones: names are hidden here (too narrow) and the current one is shown under the bar */}
                <span className="sr-only sm:not-sr-only sm:truncate">{s}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: reached ? '100%' : '0%' }} transition={{ duration: reduce ? 0 : 0.4 }} />
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-2.5 text-sm font-bold text-accent sm:hidden" aria-hidden="true">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* Step content */}
        <div className="overflow-hidden rounded-[28px] border border-line bg-white p-6 md:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} {...slide}>
              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Which device is it?</h2>
                  <div className="mt-5 inline-flex rounded-full border border-line bg-page p-1" role="group" aria-label="Device type">
                    {[['phone', 'Phone', Smartphone], ['tablet', 'Tablet', Tablet]].map(([k, label, Ic]) => (
                      <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setBrandName(''); setModel('') }}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold ${kind === k ? 'bg-ink text-white' : 'text-body'}`}>
                        <Ic size={16} strokeWidth={2} aria-hidden="true" /> {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Select label="Brand" placeholder="Select brand" value={brandName} onChange={(v) => { setBrandName(v); setModel('') }}
                      options={[...brandList.map((b) => ({ value: b.name, label: b.name })), { value: NOT_LISTED, label: 'My brand is not listed' }]} />
                    {brandName === NOT_LISTED ? (
                      <Field label="Your brand" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} placeholder="Type your brand" />
                    ) : (
                      <Select label="Model" placeholder={brandObj ? 'Select model' : 'Choose a brand first'} value={model} onChange={setModel} disabled={!brandObj}
                        options={brandObj ? [...brandObj.models.map((m) => ({ value: m.name, label: m.name })), { value: NOT_LISTED, label: 'My model is not listed' }] : []} />
                    )}
                    {(brandName === NOT_LISTED || model === NOT_LISTED) && (
                      <Field className="sm:col-span-2" label="Your model" value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Type your model, e.g. Galaxy A07" />
                    )}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button disabled={!deviceReady} onClick={() => go(1)}>Next <ArrowRight size={16} strokeWidth={2} /></Button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">What’s wrong with it?</h2>
                  <p className="mt-1 text-sm text-muted">Choose one or more. Not listed? Describe it in the box below.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {ISSUE_TILES.map(tile)}
                  </div>
                  {/* Optional: describe a problem that is not listed, or add details / photos for any repair */}
                  <ProblemBox
                    id="book-more"
                    className="mt-6"
                    label="Tell us more (optional)"
                    hint="Problem not listed? Describe it here. You can also add details, like when it started or if the phone was dropped or got wet. Photos or a short video help us bring the right parts."
                    note={note}
                    onNote={setNote}
                    files={files}
                    onFiles={setFiles}
                    placeholder="e.g. The screen flickers since I dropped it last week, and it gets hot when charging"
                  />
                  <h3 className="mt-7 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Extra services</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {EXTRA_TILES.map(tile)}
                  </div>
                  <div className="mt-8 flex justify-between gap-3">
                    <Button variant="secondary" onClick={() => go(0)}><ArrowLeft size={16} strokeWidth={2} /> Back</Button>
                    <Button disabled={!issueReady} onClick={() => go(2)}>Next <ArrowRight size={16} strokeWidth={2} /></Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Where and when?</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Field label="Full name" value={form.name} onChange={setF('name')} autoComplete="name" aria-invalid={!!errors.name} />
                      {errors.name && <p className="mt-1 text-xs font-semibold text-danger">{errors.name}</p>}
                    </div>
                    <div>
                      <Field label="Phone number" type="tel" value={form.phone} onChange={setF('phone')} autoComplete="tel" aria-invalid={!!errors.phone} />
                      {errors.phone && <p className="mt-1 text-xs font-semibold text-danger">{errors.phone}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Email (optional)" type="email" value={form.email} onChange={setF('email')} autoComplete="email" />
                      {errors.email && <p className="mt-1 text-xs font-semibold text-danger">{errors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <AddressField
                        label="Address we should visit"
                        value={form.address}
                        invalid={!!errors.address}
                        onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                        onPick={(p) => {
                          setForm((f) => ({ ...f, address: p.address || f.address, postcode: p.postcode || f.postcode }))
                          if (p.lat != null) { setSpot({ lat: p.lat, lon: p.lon }); setLocSource(p.source || 'address') }
                        }}
                      />
                      {errors.address && <p className="mt-1 text-xs font-semibold text-danger">{errors.address}</p>}
                      <Suspense fallback={<div className="mt-3 h-[220px] animate-pulse rounded-[18px] bg-[#E9EDF2] sm:h-[260px]" />}>
                        <LocationMap point={spot} outOfArea={outOfArea} className="mt-3 h-[220px] sm:h-[260px]" onMove={movePin} />
                      </Suspense>
                      {pinBusy && <p className="mt-1.5 text-xs font-semibold text-accent" role="status">Updating the address for the new pin…</p>}
                      {outOfArea ? (
                        <div className="mt-2 rounded-[14px] border border-[#F4C7C3] bg-[#FDECEA] px-4 py-3 text-sm text-danger" role="alert">
                          <p className="font-extrabold">Sorry, we don’t cover this area yet</p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-body">We only repair phones in Manchester (inside the blue circle). If you are close by, <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="font-bold text-accent underline">message us on WhatsApp</a> and we will see if we can help.</p>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs text-muted">
                          {spot ? 'Not quite right? Drag the pin to your exact door.' : 'We cover Manchester (the blue circle). Choose an address or use your location to see it on the map.'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Field label="Postcode" value={form.postcode} onChange={setF('postcode')} autoComplete="postal-code" aria-invalid={!!errors.postcode} />
                      {errors.postcode && <p className="mt-1 text-xs font-semibold text-danger">{errors.postcode}</p>}
                      {/* With a map pin, the pin decides; without one, the postcode does */}
                      {!outOfArea && (spot ? area === 'in' : postcodeHint?.status === 'yes') && <p className="mt-1 text-xs font-semibold text-success">We visit this area.</p>}
                      {!outOfArea && !spot && postcodeHint?.status === 'maybe' && <p className="mt-1 text-xs font-semibold text-body">Just outside our main area — we will check.</p>}
                      {outOfArea && <p className="mt-1 text-xs font-semibold text-danger">Sorry, we don’t cover this area yet</p>}
                      {!outOfArea && listedDistrict(form.postcode)?.fee > 0 && <p className="mt-1 text-xs font-semibold text-body">A £{listedDistrict(form.postcode).fee} call-out fee applies to {listedDistrict(form.postcode).code}.</p>}
                    </div>
                    {earliest.length > 0 && (
                      <div className="sm:col-span-2">
                        <p className="text-[13px] font-bold text-body">Earliest free times</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {earliest.map((e) => {
                            const on = form.date === e.date && form.start === e.start
                            return (
                              <button key={e.date} type="button" aria-pressed={on} onClick={() => setForm((f) => ({ ...f, date: e.date, start: e.start }))}
                                className={`h-10 rounded-full border px-3.5 text-sm font-bold transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-field bg-white hover:border-accent hover:text-accent'}`}>
                                {formatDate(e.date)} · {e.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <DatePicker label="Preferred day" min={todayISO()} max={lastBookableDay()} value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} invalid={!!errors.date} isDisabled={fullDay} disabledText="fully booked" />
                      {errors.date && <p className="mt-1 text-xs font-semibold text-danger">{errors.date}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <TimeSlots slots={slots} value={form.start} onChange={(v) => setForm((f) => ({ ...f, start: v }))} hasPoint={!!point} hasDate={!!form.date} outOfArea={outOfArea} error={errors.start} />
                    </div>
                    <Field className="sm:col-span-2" label="Access notes (optional)" value={form.extra} onChange={setF('extra')} placeholder="e.g. Flat 4, buzzer 12, park at the back" />
                  </div>
                  <div className="mt-8 flex justify-between gap-3">
                    <Button variant="secondary" onClick={() => go(1)}><ArrowLeft size={16} strokeWidth={2} /> Back</Button>
                    {/* Stays grey while the address is outside our service area */}
                    <Button disabled={outOfArea || checking} title={outOfArea ? 'This address is outside our service area' : undefined} onClick={async () => { if (await validateDetails()) go(3) }}>{checking ? 'Checking…' : <>Review <ArrowRight size={16} strokeWidth={2} /></>}</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Check and send</h2>
                  <dl className="mt-5 divide-y divide-line rounded-[20px] border border-line text-[15px]">
                    {[
                      ['Device', `${finalBrand} ${finalModel}`],
                      ['Problem', issues.length ? issues.map(issueLabel).join(', ') : note.trim() ? 'Described in your own words' : 'Shown in your photos / video'],
                      ...(note.trim() ? [['Your notes', `“${note.trim()}”`]] : []),
                      ...(files.length ? [['Photos / video', `${files.filter((f) => !isVideo(f)).length} photo(s), ${files.filter(isVideo).length} video(s)`]] : []),
                      ['Visit', `${formatDate(form.date, { year: true })} · arrive ${chosen ? `${timeLabel(chosen.start)} (repair until ${timeLabel(chosen.end)})` : ''}`],
                      ['Address', `${form.address}, ${form.postcode.toUpperCase()}`],
                      ['Contact', `${form.name} · ${form.phone}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-5 py-3.5">
                        <dt className="font-semibold text-muted">{k}</dt>
                        <dd className="max-w-[420px] text-right font-bold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 rounded-2xl bg-tint p-4 text-sm text-body">
                    {estLabel ? <><b>Estimated price: {estLabel}.</b> </> : <b>Your price: </b>}
                    We confirm the exact price with you before any work starts, and you pay after the repair. See the full <Link to="/prices" className="font-bold text-accent underline">price list</Link>.
                  </p>
                  <div className="mt-8 flex justify-between gap-3">
                    <Button variant="secondary" onClick={() => go(2)}><ArrowLeft size={16} strokeWidth={2} /> Back</Button>
                    <Button variant="dark" onClick={submit} disabled={sending} className="disabled:opacity-60">{sending ? 'Sending…' : 'Send booking request'}</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Summary */}
        <aside className="rounded-[28px] border border-line bg-white p-6 lg:sticky lg:top-24" aria-label="Your booking so far">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Your phone</p>
          {deviceReady ? (
            <>
              <div className="mt-3 flex items-center gap-3.5">
                <span className="grid size-14 place-items-center rounded-2xl bg-tint text-accent"><DeviceIcon size={26} strokeWidth={2} aria-hidden="true" /></span>
                <div>
                  <p className="text-lg font-extrabold leading-tight tracking-[-0.02em]">{finalModel}</p>
                  <p className="text-sm text-muted">{finalBrand} · {kind === 'tablet' ? 'Tablet' : 'Phone'}</p>
                </div>
              </div>
              {step > 0 && (
                <button type="button" onClick={() => go(0)} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-accent">
                  <Pencil size={14} strokeWidth={2} aria-hidden="true" /> Change device
                </button>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Choose your device to see its details here.</p>
          )}
          <hr className="my-5 border-line" />
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Problem</p>
          {issues.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">{issues.map((i) => <li key={i} className="rounded-full bg-[#F6F7F9] px-3 py-1.5 text-xs font-semibold">{issueLabel(i)}</li>)}</ul>
          ) : <p className="mt-3 text-sm text-muted">{note.trim() ? 'Described in your own words.' : files.length ? 'Shown in your photos / video.' : 'Not chosen yet.'}</p>}
          <hr className="my-5 border-line" />
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Price</p>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">{estLabel || 'Quoted for you'}</p>
          <p className="mt-1 text-sm text-muted">
            {est ? 'Estimate from our price list. ' : 'We price this one for you after a quick look. '}
            {est && est.unknown.length > 0 && `Not included: ${est.unknown.map(issueLabel).join(', ')} (quoted separately). `}
            Final price agreed before we start. Pay after the repair.
          </p>
        </aside>
      </div>
    </div>
  )
}


// Arrival times the technician can still make on the chosen day
function TimeSlots({ slots, value, onChange, hasPoint, hasDate, outOfArea, error }) {
  const travel = slots[0]?.travel
  let msg = null
  if (outOfArea) msg = 'Times are only shown for addresses in our service area.'
  else if (!hasPoint) msg = 'Choose your address above (or enter your postcode) to see the times we can reach you.'
  else if (!hasDate) msg = 'Pick a day to see the free arrival times.'
  else if (!slots.length) msg = 'No free times on this day. Please choose another day.'
  return (
    <div role="group" aria-labelledby="slot-label">
      <p id="slot-label" className="text-[13px] font-bold text-body">Arrival time</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
        One technician, working {timeLabel(toMin(SCHEDULE.dayStart))} – {timeLabel(toMin(SCHEDULE.dayEnd))}. Each repair takes about {SCHEDULE.serviceMin} minutes{travel ? `, and it is about ${travel} min to reach you` : ''}.
      </p>
      {msg ? (
        <p className={`mt-2.5 rounded-[14px] border border-dashed px-4 py-3.5 text-sm ${error ? 'border-danger text-danger' : 'border-field text-muted'}`}>{error && !outOfArea ? error : msg}</p>
      ) : (
        <ul className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((s) => {
            const on = s.start === value
            return (
              <li key={s.start}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(s.start)}
                  className={`flex h-12 w-full flex-col items-center justify-center rounded-[14px] border text-[15px] font-bold transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-field bg-white text-ink hover:border-accent hover:text-accent'}`}
                >
                  {s.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {error && !msg && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
      {value != null && slots.some((s) => s.start === value) && (
        <p className="mt-2 text-xs font-semibold text-success">
          We arrive at {timeLabel(value)} and should be done by {timeLabel(value + SCHEDULE.serviceMin)}.
        </p>
      )}
    </div>
  )
}

// After a guest booking: save their details as an account with just a password.
// Their orders show in "My repairs" because they match the phone number.
function GuestAccount({ order }) {
  const [email, setEmail] = useState(order.customer?.email || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [made, setMade] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter your email.')
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true); setError('')
    try {
      await signUp({ name: order.customer?.name || '', email, phone: order.customer?.phone || '', password })
      setMade(true)
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  if (made) return <p className="mx-auto mt-8 max-w-[440px] rounded-2xl bg-success-tint px-5 py-4 text-sm font-semibold text-success">Account created. Your repairs are in <Link to="/my-bookings" className="underline">My repairs</Link>.</p>
  return (
    <form onSubmit={submit} noValidate className="mx-auto mt-8 max-w-[440px] rounded-[22px] border border-line bg-white p-5 text-left">
      <p className="font-extrabold">Save your details for next time?</p>
      <p className="mt-1 text-sm text-muted">Just add a password. You can then see all your repairs in one place.</p>
      <div className="mt-4 space-y-3">
        {!order.customer?.email && <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
      <Button type="submit" variant="dark" disabled={busy} className="mt-4 w-full">{busy ? 'Saving…' : 'Create account'}</Button>
    </form>
  )
}
