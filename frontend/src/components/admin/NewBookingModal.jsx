import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field from '../ui/Field'
import Select from '../ui/Select'
import DatePicker, { todayISO } from '../ui/DatePicker'
import AddressField from '../AddressField'
import { toast } from '../ui/Toast'
import { brands } from '../../data/catalog'
import { services } from '../../data/services'
import { OTHER } from '../../data/content'
import { addOrder, getOrders, notifyCustomer } from '../../lib/store'
import { lookupPostcode } from '../../lib/geo'
import { serviceStatus } from '../../lib/areaCheck'
import { freeSlots, isWorkDay, timeLabel, timeOffOn, toHHMM } from '../../lib/schedule'
import { estimate as getEstimate } from '../../lib/pricing'
import { PHONE_ERROR, POSTCODE_ERROR, isUkPostcode, lastBookableDay, normalisePostcode, normaliseUkPhone } from '../../lib/format'

const BRAND_OPTIONS = brands.map((b) => ({ value: b.name, label: b.name, group: b.kind === 'tablet' ? 'Tablets' : 'Phones' }))
const ISSUE_OPTIONS = [...services.map((s) => ({ value: s.id, label: s.name })), { value: 'unsure', label: 'Not sure (free check)' }, { value: OTHER, label: 'Other problem' }]
const EMPTY = { name: '', phone: '', address: '', postcode: '', brand: '', model: '', issue: '', note: '', date: '', start: null }

/*
  "+ New booking" for customers who phone or WhatsApp. Same rules as the website:
  UK phone and postcode, service area, working days, time off and free slots.
*/
export default function NewBookingModal({ open, onClose, preset }) {
  const [f, setF] = useState(EMPTY)
  const [spot, setSpot] = useState(null)
  const [pc, setPc] = useState(null)
  const [errors, setErrors] = useState({})
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  // Start each opening fresh (a free slot from the sidebar can preset the date)
  const [openedWith, setOpenedWith] = useState(null)
  if (open && openedWith !== (preset?.key || 'new')) { setOpenedWith(preset?.key || 'new'); setF({ ...EMPTY, date: preset?.date || '' }); setSpot(null); setPc(null); setErrors({}) }
  if (!open && openedWith) setOpenedWith(null)

  useEffect(() => {
    if (!isUkPostcode(f.postcode)) { setPc(null); return }
    const c = new AbortController()
    lookupPostcode(f.postcode, c.signal).then(setPc).catch(() => {})
    return () => c.abort()
  }, [f.postcode])

  const brandObj = brands.find((b) => b.name === f.brand)
  const point = spot || (pc?.status === 'ok' ? { lat: pc.lat, lon: pc.lon } : null)
  const out = point && serviceStatus({ point }) === 'out'
  const slots = useMemo(() => (point && !out && f.date ? freeSlots({ orders: getOrders(), date: f.date, point }) : []), [point, out, f.date])
  const chosen = slots.find((s) => s.start === f.start)

  const save = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.name.trim()) err.name = 'Enter the customer’s name.'
    if (!normaliseUkPhone(f.phone)) err.phone = PHONE_ERROR
    if (!isUkPostcode(f.postcode)) err.postcode = POSTCODE_ERROR
    else if (pc?.status === 'notfound') err.postcode = 'That postcode does not exist.'
    if (out) err.postcode = 'This address is outside your service area.'
    if (!f.brand || !f.model) err.device = 'Choose the phone.'
    if (!f.issue) err.issue = 'Choose the problem.'
    if (!f.date) err.date = 'Choose a day.'
    else if (!chosen) err.start = 'Choose a time.'
    setErrors(err)
    if (Object.keys(err).length) return
    const est = getEstimate({ kind: brandObj?.kind || 'phone', brand: f.brand, model: f.model, issues: [f.issue] })
    const order = addOrder({
      type: 'repair',
      source: 'phone',
      status: 'confirmed',
      customer: { name: f.name.trim(), phone: normaliseUkPhone(f.phone), email: '', address: f.address.trim(), postcode: pc?.status === 'ok' ? pc.postcode : normalisePostcode(f.postcode), district: pc?.district || '' },
      manualCheck: pc?.status !== 'ok',
      location: point,
      device: { kind: brandObj?.kind || 'phone', brand: f.brand, model: f.model },
      issues: [f.issue],
      issueNote: f.note.trim(),
      slot: { date: f.date, start: toHHMM(chosen.start), end: toHHMM(chosen.end), travelMin: chosen.travel, time: `${timeLabel(chosen.start)} – ${timeLabel(chosen.end)}` },
      estimate: est ? { min: est.min, max: est.max } : null,
      history: [{ at: new Date().toISOString(), by: 'admin', what: 'Booked by phone / WhatsApp' }],
    })
    notifyCustomer(order, 'status', 'Booking confirmed', `Your repair ${order.id} is booked for ${order.slot.time}.`)
    toast(`Booked ${order.id} · ${timeLabel(chosen.start)}`)
    onClose()
  }

  const err = (k) => errors[k] && <p className="mt-1 text-xs font-semibold text-danger">{errors[k]}</p>
  return (
    <Modal open={open} onClose={onClose} title="New booking" text="For customers who phone or message you. The same rules as the website apply." width={680}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Field label="Customer name" value={f.name} onChange={(e) => set({ name: e.target.value })} />{err('name')}</div>
          <div><Field label="Phone number" type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="07700 900123" />{err('phone')}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-end">
          <AddressField label="Address" value={f.address} onChange={(v) => set({ address: v })}
            onPick={(p) => { set({ address: p.address || f.address, postcode: p.postcode || f.postcode }); if (p.lat != null) setSpot({ lat: p.lat, lon: p.lon }) }} />
          <div><Field label="Postcode" value={f.postcode} onChange={(e) => set({ postcode: e.target.value })} />{err('postcode')}</div>
        </div>
        {out && <p className="text-xs font-semibold text-danger">Sorry, this address is outside your service area.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Brand" placeholder="Brand" value={f.brand} onChange={(v) => set({ brand: v, model: '' })} options={BRAND_OPTIONS} />
          <div>
            <Select label="Model" placeholder={brandObj ? 'Model' : 'Choose a brand first'} value={f.model} onChange={(v) => set({ model: v })} disabled={!brandObj} options={brandObj ? brandObj.models.map((m) => ({ value: m.name, label: m.name })) : []} />
            {err('device')}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Select label="Problem" placeholder="Choose the problem" value={f.issue} onChange={(v) => set({ issue: v })} options={ISSUE_OPTIONS} />{err('issue')}</div>
          <Field label="Notes (optional)" value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="What the customer told you" />
        </div>
        <div>
          <DatePicker label="Day" min={todayISO()} max={lastBookableDay()} value={f.date} onChange={(v) => set({ date: v, start: null })}
            isDisabled={(iso) => (!isWorkDay(iso) ? 'closed' : timeOffOn(iso) ? 'time off' : false)} />
          {err('date')}
        </div>
        <div>
          <p className="text-[13px] font-bold text-body">Arrival time</p>
          {!point ? <p className="mt-2 text-sm text-muted">Enter the postcode to see free times.</p>
            : !f.date ? <p className="mt-2 text-sm text-muted">Choose a day to see free times.</p>
              : !slots.length ? <p className="mt-2 text-sm text-muted">No free times that day.</p> : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button key={s.start} type="button" aria-pressed={f.start === s.start} onClick={() => set({ start: s.start })}
                      className={`h-10 rounded-xl border px-3.5 text-sm font-bold transition-colors ${f.start === s.start ? 'border-accent bg-accent text-white' : 'border-field hover:border-accent hover:text-accent'}`}>{s.label}</button>
                  ))}
                </div>
              )}
          {err('start')}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="dark">Book and confirm</Button>
        </div>
      </form>
    </Modal>
  )
}
