import { useMemo, useState } from 'react'
import { Download, PoundSterling, Percent, Receipt, TrendingUp } from 'lucide-react'
import Button from '../ui/Button'
import DatePicker from '../ui/DatePicker'
import { STATUSES } from '../../lib/store'
import { formatDate, formatDateTime } from '../../lib/format'
import { Card, Stat, dayKey, issueName, money, orderWhat } from './shared'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d) }
const monday = (iso) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d) }

function Bars({ rows, format = String }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="text-sm text-muted">No data in this period.</p>
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-sm"><span className="truncate font-semibold">{r.label}</span><b className="shrink-0">{format(r.value)}</b></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}

const count = (list, fn, val = () => 1) => {
  const m = {}
  list.forEach((o) => fn(o).forEach((k) => { if (k) m[k] = (m[k] || 0) + val(o) }))
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

/* Reports: money and jobs for a date range, plus the activity log. Export as CSV. */
export default function Reports({ orders }) {
  const [from, setFrom] = useState(daysAgo(29))
  const [to, setTo] = useState(dayKey(new Date()))
  const [by, setBy] = useState('week')

  const r = useMemo(() => {
    const inRange = orders.filter((o) => { const d = dayKey(new Date(o.createdAt)); return d >= from && d <= to })
    const done = inRange.filter((o) => o.status === 'completed' && typeof o.price === 'number')
    const revenue = done.reduce((n, o) => n + o.price, 0)
    const parts = done.reduce((n, o) => n + (o.receipt?.partsCost || 0), 0)
    const repairs = inRange.filter((o) => o.type === 'repair')
    const bucket = (o) => (by === 'week' ? `Week of ${formatDate(monday(dayKey(new Date(o.createdAt))))}` : new Date(o.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))
    return {
      revenue, parts, profit: revenue - parts,
      avg: done.length ? revenue / done.length : 0,
      jobs: done.length,
      conversion: repairs.length ? Math.round((repairs.filter((o) => o.status === 'completed').length / repairs.length) * 100) : 0,
      byPeriod: count(done, (o) => [bucket(o)], (o) => o.price).reverse(),
      byProblem: count(repairs, (o) => (o.issues || []).map(issueName)).slice(0, 8),
      byBrand: count(repairs, (o) => [o.device?.brand]).slice(0, 8),
      cancels: count(inRange.filter((o) => o.status === 'cancelled'), (o) => [o.cancelReason || 'No reason given']),
      busiest: count(repairs.filter((o) => o.slot?.date), (o) => [DOW[new Date(`${o.slot.date}T12:00:00`).getDay()]]),
      rows: inRange,
    }
  }, [orders, from, to, by])

  // Who changed what and when (status changes and reschedules)
  const log = useMemo(() => orders.flatMap((o) => [
    ...(o.statusHistory || []).map((h) => ({ at: h.at, who: h.by === 'customer' ? 'Customer' : 'Admin', text: `${o.id}: ${STATUSES.find((s) => s.id === h.from)?.label || h.from} → ${STATUSES.find((s) => s.id === h.to)?.label || h.to}${h.note ? ` (${h.note})` : ''}` })),
    ...(o.history || []).map((h) => ({ at: h.at, who: h.by === 'customer' ? 'Customer' : 'Admin', text: `${o.id}: ${h.what}${h.to ? ` → ${h.to}` : ''}` })),
  ]).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50), [orders])

  const exportCsv = () => {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const head = ['Reference', 'Created', 'Type', 'Status', 'Customer', 'Postcode', 'Device', 'Problem', 'Visit date', 'Price (GBP)', 'Parts cost (GBP)', 'Payment', 'Cancel reason']
    const lines = r.rows.map((o) => [o.id, o.createdAt.slice(0, 10), o.type, o.status, o.customer?.name, o.customer?.postcode, orderWhat(o), (o.issues || []).map(issueName).join('; '), o.slot?.date, o.price, o.receipt?.partsCost, o.receipt?.payment || o.payMethod, o.cancelReason])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([[head, ...lines].map((l) => l.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    a.download = `fixpoint-report-${from}-to-${to}.csv`
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[24px] border border-line bg-white p-3 lg:flex-row lg:items-end">
        <DatePicker label="From" className="lg:w-[250px]" value={from} max={to} onChange={setFrom} />
        <DatePicker label="To" className="lg:w-[250px]" value={to} min={from} onChange={setTo} />
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          {[['Last 7 days', 6], ['Last 30 days', 29], ['Last 90 days', 89]].map(([t, n]) => <button key={t} type="button" onClick={() => { setFrom(daysAgo(n)); setTo(dayKey(new Date())) }} className="h-10 rounded-full border border-line px-4 text-sm font-bold hover:border-accent">{t}</button>)}
          <Button variant="secondary" onClick={exportCsv} className="!h-10 !text-sm"><Download size={15} /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={PoundSterling} label="Revenue" value={money(r.revenue)} hint={`${r.jobs} completed jobs`} tone="bg-success-tint text-success" />
        <Stat icon={Receipt} label="Average job" value={money(Math.round(r.avg))} />
        <Stat icon={TrendingUp} label="Profit after parts" value={money(r.profit)} hint={`Parts cost ${money(r.parts)}`} />
        <Stat icon={Percent} label="Booked → completed" value={`${r.conversion}%`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Revenue" action={<div className="inline-flex rounded-full bg-[#F1F3F7] p-1">{[['week', 'By week'], ['month', 'By month']].map(([k, t]) => <button key={k} type="button" aria-pressed={by === k} onClick={() => setBy(k)} className={`h-8 rounded-full px-3 text-xs font-bold ${by === k ? 'bg-white shadow-sm' : 'text-muted'}`}>{t}</button>)}</div>}>
          <Bars rows={r.byPeriod} format={money} />
        </Card>
        <Card title="Jobs by problem"><Bars rows={r.byProblem} /></Card>
        <Card title="Jobs by brand"><Bars rows={r.byBrand} /></Card>
        <Card title="Busiest days"><Bars rows={r.busiest} /></Card>
        <Card title="Cancellations by reason"><Bars rows={r.cancels} /></Card>
        <Card title="Activity log">
          {log.length === 0 ? <p className="text-sm text-muted">No changes yet.</p> : (
            <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1 text-sm">
              {log.map((l, i) => <li key={i}><b>{l.who}</b> · {l.text}<span className="block text-xs text-muted">{formatDateTime(l.at)}</span></li>)}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
