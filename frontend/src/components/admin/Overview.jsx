import { lazy, Suspense, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarDays, CheckCircle2, Clock, PoundSterling, ShoppingBag, Smartphone } from 'lucide-react'
import { STATUSES } from '../../lib/store'
import { timeLabel, toMin } from '../../lib/schedule'
import { formatDate } from '../../lib/format'
import { useCustomers } from '../../lib/customers'
import { useNotifications } from '../../lib/store'
import { SCHEDULE } from '../../data/schedule'
import { formatDateTime } from '../../lib/format'
import { TYPE_STYLE } from './Notifications'

const RouteMap = lazy(() => import('./RouteMap'))
import { Card, DemoTag, OPEN, Stat, StatusBadge, dayKey, issueName, money, orderProblem, orderWhat } from './shared'

// Vertical bar chart. data = [{ key, label, value }]
function BarChart({ data, format = String, tone = 'bg-accent' }) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-[200px] items-end gap-[3px] sm:gap-2" role="img" aria-label={`Bar chart: ${data.map((d) => `${d.label} ${format(d.value)}`).join(', ')}`}>
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
          {/* Phones: just the day number, so labels fit under thin bars */}
          <span className="mt-1.5 truncate text-[10px] text-muted">
            <span className="sm:hidden">{d.short ?? d.label}</span><span className="hidden sm:inline">{d.label}</span>
          </span>
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

/* ------------------------------- overview ------------------------------ */

export default function Overview({ orders, onOpen, onSchedule, onCustomer }) {
  const customers = useCustomers()
  const [range, setRange] = useState(14)

  const s = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'cancelled')
    const today = dayKey(new Date())
    const since = (days) => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); d.setHours(0, 0, 0, 0); return d }
    const inRange = (o, from) => new Date(o.createdAt) >= from
    const paid = (o) => (o.status === 'completed' && typeof o.price === 'number' ? o.price : 0)

    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (range - 1 - i))
      return { key: dayKey(d), short: String(d.getDate()), label: range > 14 ? String(d.getDate()) : d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2) + ' ' + d.getDate(), orders: 0, revenue: 0 }
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

  // Today's visits (with an exact time) and new orders that still need a reply
  const today = dayKey(new Date())
  const visits = orders
    .filter((o) => o.type === 'repair' && o.status !== 'cancelled' && o.slot?.date === today && o.slot.start)
    .sort((a, b) => a.slot.start.localeCompare(b.slot.start))
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const next = visits.find((o) => toMin(o.slot.start) >= nowMin && o.status !== 'completed')
  const activity = useNotifications().filter((n) => n.to === 'admin').slice(0, 10)
  // Today's route: start location, then each visit in time order (Google Maps multi-stop link)
  const stopsKey = JSON.stringify(visits.filter((o) => o.location && o.status !== 'completed').map((o) => ({ lat: o.location.lat, lon: o.location.lon, title: o.customer?.name })))
  const stops = useMemo(() => JSON.parse(stopsKey), [stopsKey]) // same list -> the map is not redrawn
  const routeUrl = stops.length ? `https://www.google.com/maps/dir/?api=1&origin=${SCHEDULE.BASE.lat},${SCHEDULE.BASE.lon}&destination=${stops[stops.length - 1].lat},${stops[stops.length - 1].lon}${stops.length > 1 ? `&waypoints=${stops.slice(0, -1).map((p) => `${p.lat},${p.lon}`).join('|')}` : ''}&travelmode=driving` : null
  const dueFollowUps = customers.filter((c) => c.followUpDate && c.followUpDate <= today)
  const fresh = orders.filter((o) => o.status === 'new').sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat icon={CalendarDays} label="Visits today" value={visits.length} hint={next ? `Next: ${timeLabel(toMin(next.slot.start))} · ${next.customer?.name}` : `${s.today} new orders today · ${s.week} this week`} />
        <Stat icon={PoundSterling} label={`Sales (last ${range} days)`} value={money(s.revenueRange)} hint={`${money(s.revenueAll)} in total · completed jobs with a price`} tone="bg-success-tint text-success" />
        <Stat icon={Clock} label="Open orders" value={s.open} hint="New, confirmed, on the way or repairing" tone="bg-[#FFF4DB] text-[#9A6A00]" />
        <Stat icon={CheckCircle2} label="Completed" value={s.completed} hint={s.unpriced ? `${s.unpriced} completed without a price` : 'All completed jobs are priced'} tone="bg-success-tint text-success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card title="Today’s visits" action={<button type="button" onClick={() => onSchedule(today)} className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline">Open schedule <ArrowRight size={14} aria-hidden="true" /></button>}>
          {visits.length === 0 ? <p className="rounded-2xl border border-dashed border-field px-4 py-6 text-center text-sm text-muted">No visits booked for today.</p> : (
            <ul className="space-y-2">
              {visits.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpen(o.id)} className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors hover:border-accent ${o === next ? 'border-accent bg-tint/50' : 'border-line'}`}>
                    <span className="w-[68px] shrink-0 text-sm font-extrabold">{timeLabel(toMin(o.slot.start))}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{o.customer?.name}{o.demo && <DemoTag />}</span>
                      <span className="block truncate text-xs text-muted">{orderWhat(o)} · {orderProblem(o)} · {o.customer?.postcode}</span>
                    </span>
                    <StatusBadge status={o.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={`New orders to confirm${fresh.length ? ` (${fresh.length})` : ''}`}>
          {fresh.length === 0 ? <p className="rounded-2xl border border-dashed border-field px-4 py-6 text-center text-sm text-muted">All caught up. No new orders.</p> : (
            <ul className="space-y-2">
              {fresh.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpen(o.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left transition-colors hover:border-accent">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{o.customer?.name}{o.demo && <DemoTag />}</span>
                      <span className="block truncate text-xs text-muted">{orderWhat(o)}{o.slot ? ` · ${formatDate(o.slot.date)}` : ''}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-accent" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card title="Today’s route" action={routeUrl && <a href={routeUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-accent hover:underline">Open full route in Google Maps</a>}>
          {stops.length === 0 ? <p className="rounded-2xl border border-dashed border-field px-4 py-6 text-center text-sm text-muted">No visits left to drive to today.</p> : (
            <Suspense fallback={<div className="h-[260px] animate-pulse rounded-[18px] bg-[#E9EDF2]" />}>
              <RouteMap start={SCHEDULE.BASE} stops={stops} className="h-[260px]" />
            </Suspense>
          )}
        </Card>
        <Card title="Recent activity">
          {activity.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
            <ul className="space-y-2.5">
              {activity.map((n) => {
                const st = TYPE_STYLE[n.type] || TYPE_STYLE.new_order
                const Icon = st.icon
                return (
                  <li key={n.id} className="flex items-start gap-3 text-sm">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full ${st.cls}`}><Icon size={14} aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="block truncate font-semibold">{n.title} · <span className="font-normal text-muted">{n.body}</span></span><span className="text-xs text-muted">{formatDateTime(n.createdAt)}</span></span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {dueFollowUps.length > 0 && (
        <Card title={`Follow-ups due today (${dueFollowUps.length})`}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {dueFollowUps.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => onCustomer(c.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left transition-colors hover:border-accent">
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold">{c.name}</span><span className={`block text-xs font-bold ${c.followUpDate < today ? 'text-danger' : 'text-accent'}`}>{c.followUpDate < today ? `Overdue since ${formatDate(c.followUpDate)}` : 'Due today'}</span></span>
                  <ArrowRight size={16} className="shrink-0 text-accent" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-[-0.02em]">Trends</h2>
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Date range">
          {[7, 14, 30].map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={`min-h-9 rounded-full px-4 text-sm font-bold ${range === r ? 'bg-ink text-white' : 'text-body'}`}>{r} days</button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Orders per day"><BarChart data={s.days.map((d) => ({ key: d.key, label: d.label, short: d.short, value: d.orders }))} /></Card>
        <Card title="Sales per day (completed jobs)"><BarChart tone="bg-success" format={money} data={s.days.map((d) => ({ key: d.key, label: d.label, short: d.short, value: d.revenue }))} /></Card>
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
