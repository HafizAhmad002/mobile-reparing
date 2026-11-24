import { useState } from 'react'
import { Palmtree, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Field from '../ui/Field'
import DatePicker, { todayISO } from '../ui/DatePicker'
import { toast } from '../ui/Toast'
import { SCHEDULE } from '../../data/schedule'
import { updateSchedule } from '../../lib/settings'
import { formatDate } from '../../lib/format'

// "Block time": holidays and days off. Customers can't book these days.
export default function BlockTimeModal({ open, onClose, orders }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('Holiday')
  const [error, setError] = useState('')
  const list = [...(SCHEDULE.timeOff || [])].sort((a, b) => a.start.localeCompare(b.start))
  const last = end && end >= start ? end : start
  const clash = start ? orders.filter((o) => o.type === 'repair' && !['cancelled', 'completed'].includes(o.status) && o.slot?.date >= start && o.slot?.date <= last) : []

  const save = (e) => {
    e.preventDefault()
    if (!start) return setError('Choose the first day.')
    const item = { id: `T-${Date.now()}`, start, end: last, reason: reason.trim() || 'Time off' }
    updateSchedule({ timeOff: [...(SCHEDULE.timeOff || []), item] })
    toast(`Blocked ${formatDate(item.start)}${item.end !== item.start ? ` – ${formatDate(item.end)}` : ''}`)
    setStart(''); setEnd(''); setReason('Holiday'); setError('')
  }
  const remove = (id) => {
    updateSchedule({ timeOff: (SCHEDULE.timeOff || []).filter((t) => t.id !== id) })
    toast('Time off removed', { tone: 'info' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Block time" text="Holidays and days off. Customers can’t book these days." width={560}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker label="From" min={todayISO()} value={start} onChange={(v) => { setStart(v); setError(''); if (end && end < v) setEnd(v) }} />
          <DatePicker label="To (optional)" min={start || todayISO()} value={end} onChange={setEnd} placeholder="Same day" />
        </div>
        <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Holiday, Training, Van service" />
        {error && <p className="text-xs font-semibold text-danger">{error}</p>}
        {clash.length > 0 && (
          <p className="rounded-2xl bg-[#FFF4DB] px-4 py-3 text-sm text-[#7A5600]">
            <b>{clash.length} visit{clash.length > 1 ? 's are' : ' is'} already booked</b> in these days. Blocking the time does not move them: open each one and reschedule it.
          </p>
        )}
        <div className="flex justify-end"><Button type="submit" disabled={!start}><Palmtree size={16} /> Block these days</Button></div>
      </form>

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-extrabold">Blocked days</h3>
        {list.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing blocked yet.</p> : (
          <ul className="mt-3 space-y-2">
            {list.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF6EC] px-4 py-3 text-sm">
                <span className="min-w-0"><b className="text-[#9A4A00]">{t.reason}</b><span className="block text-xs text-muted">{formatDate(t.start, { year: true })}{t.end !== t.start ? ` – ${formatDate(t.end, { year: true })}` : ''}</span></span>
                <button type="button" onClick={() => remove(t.id)} aria-label={`Remove ${t.reason}`} className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-white hover:text-danger"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
