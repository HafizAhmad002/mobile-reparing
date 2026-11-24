import { useMemo, useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Select from './ui/Select'
import Field from './ui/Field'
import DatePicker, { todayISO } from './ui/DatePicker'
import { toast } from './ui/Toast'
import { getOrders } from '../lib/store'
import { customerCancel, customerReschedule } from '../lib/orders'
import { freeSlots, isWorkDay, timeLabel, timeOffOn, toHHMM } from '../lib/schedule'
import { lastBookableDay } from '../lib/format'
import { SCHEDULE } from '../data/schedule'

// Customer moves their visit to another free time (same rules as booking)
export function RescheduleModal({ order: o, onClose }) {
  const [date, setDate] = useState('')
  const [start, setStart] = useState(null)
  const others = useMemo(() => getOrders().filter((x) => x.id !== o.id), [o.id])
  const point = o.location || SCHEDULE.BASE
  const slots = useMemo(() => (date ? freeSlots({ orders: others, date, point }) : []), [others, date, point])
  const chosen = slots.find((s) => s.start === start)
  const save = () => {
    if (!chosen) return
    const slot = { ...o.slot, date, start: toHHMM(chosen.start), end: toHHMM(chosen.end), travelMin: chosen.travel, time: `${timeLabel(chosen.start)} – ${timeLabel(chosen.end)}` }
    const r = customerReschedule(o, slot)
    if (!r.ok) return toast(r.error, { tone: 'error' })
    toast('Your visit has been moved. We have been told.')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Change the time" text="Pick a new day and time. You can change it until 2 hours before the visit." width={540}>
      <div className="space-y-4">
        <DatePicker label="New day" min={todayISO()} max={lastBookableDay()} value={date} onChange={(v) => { setDate(v); setStart(null) }}
          isDisabled={(iso) => (!isWorkDay(iso) ? 'closed' : timeOffOn(iso) ? 'not available' : false)} />
        {date && (
          <div>
            <p className="text-[13px] font-bold text-body">Arrival time</p>
            {!slots.length ? <p className="mt-2 text-sm text-muted">No free times that day. Try another day.</p> : (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button key={s.start} type="button" aria-pressed={start === s.start} onClick={() => setStart(s.start)}
                    className={`h-11 rounded-xl border text-sm font-bold transition-colors ${start === s.start ? 'border-accent bg-accent text-white' : 'border-field hover:border-accent'}`}>{s.label}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Keep my time</Button>
          <Button onClick={save} disabled={!chosen}>Move my visit</Button>
        </div>
      </div>
    </Modal>
  )
}

const REASONS = ['I no longer need the repair', 'The time doesn’t suit me', 'I found another repairer', 'Other']

// Customer cancels (a reason is required)
export function CancelOrderModal({ order: o, onClose }) {
  const [reason, setReason] = useState('')
  const [other, setOther] = useState('')
  const final = reason === 'Other' ? other.trim() : reason
  const save = () => {
    const r = customerCancel(o, final)
    if (!r.ok) return toast(r.error, { tone: 'error' })
    toast('Your booking has been cancelled.', { tone: 'info' })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Cancel your booking?" width={480}>
      <div className="space-y-4">
        <Select label="Why are you cancelling?" placeholder="Choose a reason" value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: r }))} />
        {reason === 'Other' && <Field label="Tell us more" value={other} onChange={(e) => setOther(e.target.value)} />}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Keep my booking</Button>
          <Button onClick={save} disabled={!final} className="!bg-danger hover:!bg-[#8f1c13]">Cancel booking</Button>
        </div>
      </div>
    </Modal>
  )
}
