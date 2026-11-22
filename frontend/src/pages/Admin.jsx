import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock, Lock, PoundSterling, ShoppingBag, Smartphone, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { ADMIN_PASSCODE } from '../data/site'
import { services } from '../data/services'
import {
  STATUSES, clearDemoOrders, deleteOrder, isAdminUnlocked, lockAdmin,
  unlockAdmin, updateOrder, useMessages, useOrders,
} from '../lib/store'
import { seedDemoOrders } from '../lib/demo'

const money = (n) => `£${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const OPEN = ['new', 'confirmed', 'on-the-way', 'repairing']
const issueName = (id) => services.find((s) => s.id === id)?.name || (id === 'unsure' ? 'Not sure (free check)' : id === 'Other' ? 'Other problem' : id)

/* ---------------------------- small pieces ---------------------------- */

function Stat({ icon: Icon, label, value, hint, tone = 'bg-tint text-accent' }) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-5">
      <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={18} strokeWidth={2} aria-hidden="true" /></span>
      <p className="mt-4 text-[13px] font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-[28px] font-extrabold leading-tight tracking-[-0.03em]">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

// Vertical bar chart. data = [{ key, label, value }]
function BarChart({ data, format = String, tone = 'bg-accent' }) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-[200px] items-end gap-1.5 sm:gap-2" role="img" aria-label={`Bar chart: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`}>
      {data.map((d, i) => (
        <div key={d.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end text-center">
          <span className="mb-1 text-[10px] font-bold text-muted opacity-0 transition-opacity group-hover:opacity-100">{d.value ? format(d.value) : ''}</span>
          <motion.div
            className={`w-full rounded-t-lg ${d.value ? tone : 'bg-line'}`}
            initial={reduce ? false : { height: 0 }}
            animate={{ height: `${Math.max(d.value ? 4 : 2, (d.value / max) * 100)}%` }}
            transition={{ duration: 0.6, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="mt-1.5 truncate text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function HBars({ rows, empty = 'No data yet' }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm"><span className="font-semibold">{r.label}</span><b>{r.value}</b></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.6 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-[28px] border border-line bg-white p-6 ${className}`}>
    <h2 className="mb-5 text-base font-extrabold tracking-[-0.02em]">{title}</h2>
    {children}
  </section>
)

/* ------------------------------- overview ------------------------------ */

function Overview({ orders }) {
  const [range, setRange] = useState(14)

  const s = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'cancelled')
    const today = dayKey(new Date())
    const since = (days) => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); d.setHours(0, 0, 0, 0); return d }
    const inRange = (o, from) => new Date(o.createdAt) >= from
    const paid = (o) => (o.status === 'completed' && typeof o.price === 'number' ? o.price : 0)

    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (range - 1 - i))
      return { key: dayKey(d), label: range > 14 ? String(d.getDate()) : d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2) + ' ' + d.getDate(), orders: 0, revenue: 0 }
    })
    const byDay = Object.fromEntries(days.map((d) => [d.key, d]))
    live.forEach((o) => {
      const k = dayKey(new Date(o.createdAt))
      if (byDay[k]) { byDay[k].orders += 1; byDay[k].revenue += paid(o) }
    })

    const count = (list, fn) => {
      const m = {}
      list.forEach((o) => fn(o).forEach((k) => { m[k] = (m[k] || 0) + 1 }))
      return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
    }
    const repairs = live.filter((o) => o.type === 'repair')
    const rangeOrders = live.filter((o) => inRange(o, since(range)))

    return {
      today: live.filter((o) => dayKey(new Date(o.createdAt)) === today).length,
      week: live.filter((o) => inRange(o, since(7))).length,
      revenueRange: rangeOrders.reduce((n, o) => n + paid(o), 0),
      revenueAll: live.reduce((n, o) => n + paid(o), 0),
      open: orders.filter((o) => OPEN.includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      repairsCount: rangeOrders.filter((o) => o.type === 'repair').length,
      accessoryCount: rangeOrders.filter((o) => o.type === 'accessory').length,
      accessoryRevenue: rangeOrders.filter((o) => o.type === 'accessory').reduce((n, o) => n + paid(o), 0),
      days,
      status: STATUSES.map((st) => ({ label: st.label, value: orders.filter((o) => o.status === st.id).length })).filter((r) => r.value),
      problems: count(repairs, (o) => (o.issues || []).map(issueName)).slice(0, 6),
      brands: count(repairs, (o) => [o.device?.brand]).slice(0, 6),
      unpriced: orders.filter((o) => o.status === 'completed' && typeof o.price !== 'number').length,
    }
  }, [orders, range])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarDays} label="Orders today" value={s.today} hint={`${s.week} in the last 7 days`} />
        <Stat icon={PoundSterling} label={`Sales (last ${range} days)`} value={money(s.revenueRange)} hint={`${money(s.revenueAll)} in total · completed jobs with a price`} tone="bg-success-tint text-success" />
        <Stat icon={Clock} label="Open orders" value={s.open} hint="New, confirmed, on the way or repairing" tone="bg-[#FFF4DB] text-[#9A6A00]" />
        <Stat icon={CheckCircle2} label="Completed" value={s.completed} hint={s.unpriced ? `${s.unpriced} completed without a price` : 'All completed jobs are priced'} tone="bg-success-tint text-success" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-[-0.02em]">Trends</h2>
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Date range">
          {[7, 14, 30].map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={`min-h-9 rounded-full px-4 text-sm font-bold ${range === r ? 'bg-ink text-white' : 'text-body'}`}>{r} days</button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Orders per day"><BarChart data={s.days.map((d) => ({ key: d.key, label: d.label, value: d.orders }))} /></Card>
        <Card title="Sales per day (completed jobs)"><BarChart tone="bg-success" format={money} data={s.days.map((d) => ({ key: d.key, label: d.label, value: d.revenue }))} /></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Repairs vs accessories">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F6F7F9] p-4"><Smartphone size={18} strokeWidth={2} className="text-accent" aria-hidden="true" /><p className="mt-2 text-2xl font-extrabold">{s.repairsCount}</p><p className="text-xs text-muted">Repairs</p></div>
            <div className="rounded-2xl bg-[#F6F7F9] p-4"><ShoppingBag size={18} strokeWidth={2} className="text-accent" aria-hidden="true" /><p className="mt-2 text-2xl font-extrabold">{s.accessoryCount}</p><p className="text-xs text-muted">Accessory orders</p></div>
          </div>
          <p className="mt-4 text-sm text-muted">Accessory sales: <b className="text-ink">{money(s.accessoryRevenue)}</b></p>
        </Card>
        <Card title="Orders by status"><HBars rows={s.status} /></Card>
        <Card title="Most common problems"><HBars rows={s.problems} /></Card>
      </div>
      <Card title="Most repaired brands"><HBars rows={s.brands} /></Card>
    </div>
  )
}

/* -------------------------------- orders ------------------------------- */

function Orders({ orders }) {
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const list = orders.filter((o) => {
    if (status !== 'all' && o.status !== status) return false
    const hay = `${o.id} ${o.customer?.name} ${o.customer?.phone} ${o.device?.brand || ''} ${o.device?.model || ''} ${(o.items || []).map((i) => i.name).join(' ')}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-[220px] flex-1" label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Reference, name, phone or device" />
        <Field className="w-[200px]" label="Status" as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
        </Field>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[24px] border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-bold uppercase tracking-[0.06em] text-muted">
              {['Order', 'Customer', 'What', 'Visit', 'Status', 'Price (£)', ''].map((h) => <th key={h} scope="col" className="px-4 py-3.5">{h || <span className="sr-only">Delete</span>}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No orders to show.</td></tr>}
            {list.slice(0, 100).map((o) => (
              <tr key={o.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3.5"><b>{o.id}</b>{o.demo && <span className="ml-1.5 rounded bg-[#FFF4DB] px-1.5 py-0.5 text-[10px] font-bold text-[#9A6A00]">DEMO</span>}<br /><span className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString('en-GB')}</span></td>
                <td className="px-4 py-3.5">{o.customer?.name}<br /><span className="text-xs text-muted">{o.customer?.phone} · {o.customer?.postcode}</span></td>
                <td className="max-w-[240px] px-4 py-3.5">
                  {o.type === 'accessory' ? <><b>Accessories</b>{o.device && <span className="text-xs font-semibold text-accent"> · for {o.device.brand} {o.device.model}</span>}<br /><span className="text-xs text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span></>
                    : <><b>{o.device.brand} {o.device.model}</b><br /><span className="text-xs text-muted">{(o.issues || []).map(issueName).join(', ')}{o.issueNote ? ` — “${o.issueNote}”` : ''}</span></>}
                </td>
                <td className="px-4 py-3.5 text-xs text-muted">{o.slot ? <>{o.slot.date}<br />{o.slot.time}</> : '—'}</td>
                <td className="px-4 py-3.5">
                  <label className="sr-only" htmlFor={`st-${o.id}`}>Status for {o.id}</label>
                  <select id={`st-${o.id}`} value={o.status} onChange={(e) => updateOrder(o.id, { status: e.target.value })} className="min-h-10 rounded-xl border border-field bg-white px-2.5 text-sm font-semibold">
                    {STATUSES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3.5">
                  <label className="sr-only" htmlFor={`pr-${o.id}`}>Price for {o.id}</label>
                  {o.estimate && <span className="mb-1 block text-[11px] text-muted">Est. £{o.estimate.min}{o.estimate.max !== o.estimate.min ? `–£${o.estimate.max}` : ''}</span>}
                  <input
                    id={`pr-${o.id}`} key={o.price ?? 'none'} type="number" min="0" step="0.01" inputMode="decimal" placeholder="—"
                    defaultValue={o.price ?? ''}
                    onBlur={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); if (v !== o.price) updateOrder(o.id, { price: v }) }}
                    className="min-h-10 w-24 rounded-xl border border-field px-2.5 text-sm"
                  />
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button type="button" aria-label={`Delete ${o.id}`} onClick={() => window.confirm(`Delete order ${o.id}?`) && deleteOrder(o.id)} className="grid size-10 place-items-center rounded-full text-muted hover:bg-[#FDECEA] hover:text-danger"><Trash2 size={16} strokeWidth={2} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length > 100 && <p className="mt-3 text-xs text-muted">Showing the newest 100 of {list.length}. Use search to narrow down.</p>}
    </div>
  )
}

function Messages() {
  const messages = useMessages()
  if (!messages.length) return <p className="rounded-[24px] border border-line bg-white p-10 text-center text-muted">No messages yet.</p>
  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li key={m.id} className="rounded-[24px] border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><b>{m.name}</b><span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString('en-GB')}</span></div>
          <p className="text-sm text-muted">{m.contact} · <span className="font-semibold text-accent">{m.topic}</span></p>
          <p className="mt-2 text-[15px] leading-relaxed">{m.message}</p>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------- page --------------------------------- */

export default function Admin() {
  useDocumentTitle('Admin — FixPoint', 'FixPoint admin dashboard')
  const [unlocked, setUnlocked] = useState(isAdminUnlocked)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const orders = useOrders()
  const hasDemo = orders.some((o) => o.demo)

  if (!unlocked) {
    return (
      <div className="grid min-h-screen place-items-center bg-page px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); if (code === ADMIN_PASSCODE) { unlockAdmin(); setUnlocked(true) } else setError('That passcode is not correct.') }}
          className="w-full max-w-[400px] rounded-[28px] border border-line bg-white p-8"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-ink text-white"><Lock size={20} strokeWidth={2} aria-hidden="true" /></span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">Admin</h1>
          <p className="mt-1 text-sm text-muted">Enter the admin passcode to continue.</p>
          <Field className="mt-5" label="Passcode" type="password" value={code} onChange={(e) => { setCode(e.target.value); setError('') }} autoComplete="current-password" />
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
          <Button type="submit" variant="dark" className="mt-5 w-full">Unlock</Button>
          <Link to="/" className="mt-4 block text-center text-sm font-bold text-accent">Back to site</Link>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[11px] bg-ink text-white"><Smartphone size={18} strokeWidth={2} aria-hidden="true" /></span>
            <span className="text-lg font-extrabold tracking-[-0.02em]">FixPoint <span className="ml-1 rounded-full bg-tint px-2.5 py-0.5 text-xs font-bold text-accent">Admin</span></span>
          </div>
          <nav className="flex gap-1" aria-label="Admin sections">
            {[['overview', 'Overview'], ['orders', 'Orders'], ['messages', 'Messages']].map(([k, label]) => (
              <button key={k} type="button" aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)} className={`min-h-11 rounded-full px-4 text-sm font-bold ${tab === k ? 'bg-ink text-white' : 'text-body hover:bg-page'}`}>{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-body hover:bg-page">View site</Link>
            <button type="button" onClick={() => { lockAdmin(); setUnlocked(false) }} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-field px-4 text-sm font-bold"><Lock size={14} strokeWidth={2} aria-hidden="true" /> Lock</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[clamp(28px,3.4vw,38px)] font-extrabold leading-tight tracking-[-0.03em]">{tab === 'overview' ? 'Overview' : tab === 'orders' ? 'Orders' : 'Messages'}</h1>
          <div className="flex flex-wrap gap-2">
            {hasDemo
              ? <Button variant="secondary" onClick={clearDemoOrders}>Remove demo data</Button>
              : <Button variant="secondary" onClick={() => seedDemoOrders(30)}>Load demo data</Button>}
          </div>
        </div>
        {hasDemo && <p className="mb-6 rounded-2xl bg-[#FFF4DB] px-4 py-3 text-sm text-[#7A5600]"><b>Demo data is showing.</b> These are made-up orders and prices so you can preview the dashboard. Remove them before going live.</p>}
        {orders.length === 0 && tab === 'overview' && (
          <p className="mb-6 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-body">No orders yet. New bookings and accessory orders will appear here. Use “Load demo data” to preview the charts.</p>
        )}

        {tab === 'overview' && <Overview orders={orders} />}
        {tab === 'orders' && <Orders orders={orders} />}
        {tab === 'messages' && <Messages />}
      </main>
    </div>
  )
}
