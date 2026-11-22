import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Pencil, Smartphone, Tablet } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Icon from '../components/ui/Icon'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brands } from '../data/catalog'
import { services } from '../data/services'
import { OTHER } from '../data/content'
import { addOrder, useSession } from '../lib/store'
import { checkArea } from '../lib/areaCheck'
import { estimate as getEstimate, estimateText } from '../lib/pricing'

const STEPS = ['Your device', 'The problem', 'Your details', 'Review']
const NOT_LISTED = '__other__'
const UNSURE = 'unsure'

// Issue tiles: the 8 services + "Not sure" + "Other" (own words)
const ISSUE_TILES = [
  ...services.map((s) => ({ id: s.id, label: s.name, text: s.short, icon: s.icon })),
  { id: UNSURE, label: 'Not sure – free check', text: 'We will find the fault for you.', icon: 'ClipboardList' },
  { id: OTHER, label: 'Other problem', text: 'Describe it in your own words.', icon: 'Wrench' },
]
const issueLabel = (id) => ISSUE_TILES.find((t) => t.id === id)?.label || id

// Turns the text sent by the hero form (e.g. "Cracked screen") into a tile id
const HERO_ISSUE_MAP = {
  'cracked screen': 'screen', 'battery drains fast': 'battery', 'not charging': 'charging-port',
  'camera issue': 'camera', 'back glass broken': 'back-glass', 'water damage': 'water-damage',
  'not sure – free check': UNSURE, other: OTHER,
}
const toTileId = (v) => (ISSUE_TILES.some((t) => t.id === v) ? v : HERO_ISSUE_MAP[(v || '').toLowerCase()] || null)

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Booking() {
  const reduce = useReducedMotion()
  const [params] = useSearchParams()
  const session = useSession()
  useDocumentTitle('Book a Repair — FixPoint Manchester', 'Tell us your phone and the problem, pick a time and we come to you in Manchester.')

  // ---- start values from the URL (set by "Find your phone", the hero form and service cards)
  const start = useMemo(() => {
    const brandName = params.get('brand') || ''
    const model = params.get('model') || ''
    const issueTile = toTileId(params.get('issue'))
    return {
      kind: params.get('kind') === 'tablet' ? 'tablet' : 'phone',
      brandName,
      model,
      issues: issueTile ? [issueTile] : [],
      note: params.get('note') || '',
      hasDevice: Boolean(brandName && model),
    }
  }, [params])

  const [step, setStep] = useState(start.hasDevice ? 1 : 0)
  const [dir, setDir] = useState(1)
  const [kind, setKind] = useState(start.kind)
  const [brandName, setBrandName] = useState(start.brandName)
  const [model, setModel] = useState(start.model)
  const [customBrand, setCustomBrand] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [issues, setIssues] = useState(start.issues)
  const [note, setNote] = useState(start.note)
  const [form, setForm] = useState({ name: session?.name || '', phone: session?.phone || '', email: session?.email || '', address: '', postcode: '', date: '', time: 'Morning', extra: '' })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)

  const brandList = brands.filter((b) => b.kind === kind)
  const brandObj = brandList.find((b) => b.name === brandName)
  const finalBrand = brandName === NOT_LISTED ? customBrand.trim() : brandName
  const finalModel = model === NOT_LISTED || brandName === NOT_LISTED ? customModel.trim() : model
  const deviceReady = Boolean(finalBrand && finalModel)

  const go = (n) => { setDir(n > step ? 1 : -1); setStep(n) }
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleIssue = (id) => setIssues((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))

  const issueReady = issues.length > 0 && (!issues.includes(OTHER) || note.trim().length > 0)
  const postcodeHint = form.postcode ? checkArea(form.postcode) : null
  // Estimate from the client's price list (null when we have no listed price)
  const est = deviceReady && issues.length ? getEstimate({ kind, brand: finalBrand, model: finalModel, issues }) : null
  const estLabel = estimateText(est)

  const validateDetails = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your name.'
    if (!/^[+\d][\d\s()-]{6,}$/.test(form.phone.trim())) e.phone = 'Enter a phone number we can reach you on.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email does not look right.'
    if (!form.address.trim()) e.address = 'Please enter the address we should visit.'
    if (!form.postcode.trim()) e.postcode = 'Please enter your postcode.'
    if (!form.date) e.date = 'Choose the day you would like us to visit.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = () => {
    const order = addOrder({
      type: 'repair',
      userEmail: session?.email || null,
      customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(), postcode: form.postcode.trim().toUpperCase() },
      device: { kind, brand: finalBrand, model: finalModel },
      issues,
      issueNote: note.trim(),
      slot: { date: form.date, time: form.time },
      notes: form.extra.trim(),
      estimate: est ? { min: est.min, max: est.max } : null,
    })
    setDone(order)
  }

  /* ------------------------------ success ------------------------------ */
  if (done) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-16 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-tint text-success"><Check size={30} strokeWidth={2.5} aria-hidden="true" /></span>
        <h1 className="mt-6 text-[clamp(30px,4vw,44px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Booking request sent</h1>
        <p className="mt-3 text-base text-muted">We will contact you to confirm the time and your price. Keep this reference to track your repair:</p>
        <p className="mx-auto mt-5 inline-block rounded-2xl border border-line bg-white px-6 py-3 text-2xl font-extrabold tracking-[0.04em]">{done.id}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/track" variant="dark">Track my repair</Button>
          <Button to="/" variant="secondary">Back to home</Button>
        </div>
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
      <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 text-sm font-bold ${i <= step ? 'text-ink' : 'text-muted'}`} aria-current={i === step ? 'step' : undefined}>
            <span className={`grid size-6 place-items-center rounded-full text-xs ${i < step ? 'bg-accent text-white' : i === step ? 'bg-ink text-white' : 'bg-line text-muted'}`}>
              {i < step ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>

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
                    <Field label="Brand" as="select" value={brandName} onChange={(e) => { setBrandName(e.target.value); setModel('') }}>
                      <option value="">Select brand</option>
                      {brandList.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                      <option value={NOT_LISTED}>My brand is not listed</option>
                    </Field>
                    {brandName === NOT_LISTED ? (
                      <Field label="Your brand" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} placeholder="Type your brand" />
                    ) : (
                      <Field label="Model" as="select" value={model} onChange={(e) => setModel(e.target.value)} disabled={!brandObj}>
                        <option value="">{brandObj ? 'Select model' : 'Choose a brand first'}</option>
                        {brandObj?.models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                        {brandObj && <option value={NOT_LISTED}>My model is not listed</option>}
                      </Field>
                    )}
                    {(brandName === NOT_LISTED || model === NOT_LISTED) && (
                      <Field className="sm:col-span-2" label="Your model" value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Type your model, e.g. Galaxy A07" />
                    )}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button disabled={!deviceReady} className="disabled:opacity-50" onClick={() => go(1)}>Next <ArrowRight size={16} strokeWidth={2} /></Button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">What’s wrong with it?</h2>
                  <p className="mt-1 text-sm text-muted">Choose one or more. If it isn’t listed, pick “Other” and describe it.</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {ISSUE_TILES.map((t) => {
                      const on = issues.includes(t.id)
                      return (
                        <button key={t.id} type="button" aria-pressed={on} onClick={() => toggleIssue(t.id)}
                          className={`flex min-h-[72px] items-center gap-3.5 rounded-[20px] border-2 p-3.5 text-left transition-colors ${on ? 'border-accent bg-tint' : 'border-line bg-white hover:border-field'}`}>
                          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-accent text-white' : 'bg-[#F6F7F9] text-ink'}`}><Icon name={t.icon} size={20} /></span>
                          <span>
                            <span className="block text-[15px] font-extrabold leading-tight tracking-[-0.02em]">{t.label}</span>
                            <span className="block text-xs text-muted">{t.text}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <AnimatePresence initial={false}>
                    {issues.includes(OTHER) && (
                      <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <Field className="pt-4" label="Describe your problem" as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us what is happening and when it started" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="mt-8 flex justify-between gap-3">
                    <Button variant="secondary" onClick={() => go(0)}><ArrowLeft size={16} strokeWidth={2} /> Back</Button>
                    <Button disabled={!issueReady} className="disabled:opacity-50" onClick={() => go(2)}>Next <ArrowRight size={16} strokeWidth={2} /></Button>
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
                      <Field label="Address we should visit" value={form.address} onChange={setF('address')} autoComplete="street-address" aria-invalid={!!errors.address} />
                      {errors.address && <p className="mt-1 text-xs font-semibold text-danger">{errors.address}</p>}
                    </div>
                    <div>
                      <Field label="Postcode" value={form.postcode} onChange={setF('postcode')} autoComplete="postal-code" aria-invalid={!!errors.postcode} />
                      {errors.postcode && <p className="mt-1 text-xs font-semibold text-danger">{errors.postcode}</p>}
                      {postcodeHint?.status === 'yes' && <p className="mt-1 text-xs font-semibold text-success">We visit this area.</p>}
                      {postcodeHint?.status === 'maybe' && <p className="mt-1 text-xs font-semibold text-body">Just outside our main area — we will check.</p>}
                    </div>
                    <div>
                      <Field label="Preferred day" type="date" min={todayISO()} value={form.date} onChange={setF('date')} aria-invalid={!!errors.date} />
                      {errors.date && <p className="mt-1 text-xs font-semibold text-danger">{errors.date}</p>}
                    </div>
                    <Field label="Time of day" as="select" value={form.time} onChange={setF('time')}>
                      <option>Morning</option><option>Afternoon</option><option>Evening</option>
                    </Field>
                    <Field label="Anything else? (optional)" value={form.extra} onChange={setF('extra')} placeholder="e.g. Ring the bell twice" />
                  </div>
                  <div className="mt-8 flex justify-between gap-3">
                    <Button variant="secondary" onClick={() => go(1)}><ArrowLeft size={16} strokeWidth={2} /> Back</Button>
                    <Button onClick={() => validateDetails() && go(3)}>Review <ArrowRight size={16} strokeWidth={2} /></Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Check and send</h2>
                  <dl className="mt-5 divide-y divide-line rounded-[20px] border border-line text-[15px]">
                    {[
                      ['Device', `${finalBrand} ${finalModel}`],
                      ['Problem', issues.map(issueLabel).join(', ') + (note.trim() ? ` — “${note.trim()}”` : '')],
                      ['Visit', `${form.date} · ${form.time}`],
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
                    <Button variant="dark" onClick={submit}>Send booking request</Button>
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
          ) : <p className="mt-3 text-sm text-muted">Not chosen yet.</p>}
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
