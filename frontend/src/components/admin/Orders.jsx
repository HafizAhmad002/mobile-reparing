import { useMemo, useState } from 'react'
import { ChevronRight, ImageIcon, Search } from 'lucide-react'
import Select from '../ui/Select'
import { STATUSES } from '../../lib/store'
import { DemoTag, StatusBadge, orderProblem, orderWhat } from './shared'
import { formatDate, formatUkPhone, orderPriceLabel } from '../../lib/format'

const TYPES = [['all', 'All'], ['repair', 'Repairs'], ['accessory', 'Accessories'], ['unpaid', 'Unpaid']]
const SORTS = [
  { value: 'new', label: 'Newest first' },
  { value: 'visit', label: 'Visit date (soonest)' },
  { value: 'old', label: 'Oldest first' },
]

const visitText = (o) => (o.slot ? `${formatDate(o.slot.date)} · ${o.slot.time || ''}` : '—')

// Orders list: search, filters, table (desktop) / cards (phones). Click an order to open it.
export default function Orders({ orders, onOpen }) {
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('new')
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const out = orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      // "Unpaid": completed jobs that are not marked as paid
      if (type === 'unpaid') { if (!(o.status === 'completed' && !o.paid)) return false } else if (type !== 'all' && o.type !== type) return false
      const hay = `${o.id} ${o.customer?.name} ${o.customer?.phone} ${o.customer?.postcode} ${o.customer?.address} ${orderWhat(o)} ${orderProblem(o)} ${o.issueNote || ''}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
    const visitKey = (o) => (o.slot ? `${o.slot.date} ${o.slot.start || '99'}` : '9999')
    if (sort === 'old') out.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    else if (sort === 'visit') out.sort((a, b) => visitKey(a).localeCompare(visitKey(b)))
    else out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return out
  }, [orders, status, type, sort, q])

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.id, orders.filter((o) => o.status === s.id).length])), [orders])
  const statusOptions = [{ value: 'all', label: `All statuses (${orders.length})` }, ...STATUSES.map((s) => ({ value: s.id, label: `${s.label} (${counts[s.id]})` }))]

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-[24px] border border-line bg-white p-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="orders-q" className="sr-only">Search orders</label>
          <Search size={18} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="orders-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, name, phone, postcode or phone model"
            className="h-11 w-full rounded-full bg-[#F6F7F9] pl-11 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-accent" />
        </div>
        <div className="inline-flex shrink-0 rounded-full bg-[#F6F7F9] p-1" role="group" aria-label="Order type">
          {TYPES.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)} className={`h-9 flex-1 rounded-full px-4 text-sm font-bold transition-colors ${type === k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{label}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <Select variant="compact" className="lg:w-[190px]" ariaLabel="Filter by status" value={status} onChange={setStatus} options={statusOptions} searchable={false} />
          <Select variant="compact" className="lg:w-[190px]" ariaLabel="Sort orders" value={sort} onChange={setSort} options={SORTS} />
        </div>
      </div>
      <p className="mt-3 px-1 text-sm text-muted" role="status">{list.length} order{list.length === 1 ? '' : 's'}{list.length > 150 ? ' · showing the first 150' : ''}</p>

      {/* Phones */}
      <ul className="mt-3 space-y-3 md:hidden">
        {list.length === 0 && <li className="rounded-[24px] border border-line bg-white px-4 py-10 text-center text-sm text-muted">No orders match.</li>}
        {list.slice(0, 150).map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => onOpen(o.id)} className="w-full rounded-[22px] border border-line bg-white p-4 text-left transition-colors hover:border-accent">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">{o.id}{o.demo && <DemoTag />}</p>
                  <p className="mt-0.5 truncate text-sm">{o.customer?.name} · <span className="text-muted">{o.customer?.postcode}</span></p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-2 truncate text-sm font-semibold">{orderWhat(o)}</p>
              {orderProblem(o) && <p className="truncate text-xs text-muted">{orderProblem(o)}</p>}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                <span>{visitText(o)}</span>
                <span className="font-bold text-ink">{orderPriceLabel(o)}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="relative mt-3 hidden overflow-x-auto rounded-[24px] border border-line bg-white md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-[#FAFBFC] text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {['Order', 'Customer', 'Phone & problem', 'Visit', 'Status', 'Price', ''].map((h) => <th key={h} scope="col" className="px-4 py-3">{h || <span className="sr-only">Open</span>}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">No orders match.</td></tr>}
            {list.slice(0, 150).map((o) => (
              <tr key={o.id} onClick={() => onOpen(o.id)} className="cursor-pointer border-b border-line align-top transition-colors last:border-0 hover:bg-[#F8F9FC]">
                <td className="px-4 py-3.5">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(o.id) }} className="font-extrabold hover:text-accent">{o.id}</button>{o.demo && <DemoTag />}
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </td>
                <td className="px-4 py-3.5"><p className="font-semibold">{o.customer?.name}</p><p className="text-xs text-muted">{formatUkPhone(o.customer?.phone)} · {o.customer?.postcode}</p></td>
                <td className="max-w-[280px] px-4 py-3.5">
                  <p className="truncate font-semibold">{orderWhat(o)}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted">
                    {orderProblem(o)}
                    {o.attachments?.length > 0 && <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-tint px-1.5 py-0.5 font-bold text-accent"><ImageIcon size={11} aria-hidden="true" />{o.attachments.length}</span>}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">{visitText(o)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                <td className="whitespace-nowrap px-4 py-3.5 font-bold">{o.price != null ? orderPriceLabel(o) : <span className="font-normal text-muted">{orderPriceLabel(o)}</span>}</td>
                <td className="px-3 py-3.5 text-muted"><ChevronRight size={18} aria-hidden="true" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
