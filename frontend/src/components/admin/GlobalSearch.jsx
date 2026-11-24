import { useEffect, useMemo, useRef, useState } from 'react'
import { Inbox, Mail, Search, Users } from 'lucide-react'
import Modal from '../ui/Modal'
import { useMessages, useOrders } from '../../lib/store'
import { useCustomers } from '../../lib/customers'
import { formatUkPhone, orderDevice } from '../../lib/format'

// Ctrl / Cmd + K: search orders, customers and messages from anywhere in the admin panel
export default function GlobalSearch({ open, onClose, onOrder, onCustomer, onMessages }) {
  const orders = useOrders()
  const customers = useCustomers()
  const messages = useMessages()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef(null)
  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => input.current?.focus(), 50) } }, [open])

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return []
    const hit = (text) => words.every((w) => text.toLowerCase().includes(w))
    return [
      ...orders.filter((o) => hit(`${o.id} ${o.customer?.name} ${o.customer?.phone} ${formatUkPhone(o.customer?.phone)} ${o.customer?.postcode} ${orderDevice(o)}`)).slice(0, 6)
        .map((o) => ({ key: o.id, icon: Inbox, title: `${o.id} · ${o.customer?.name}`, sub: `${orderDevice(o) || 'Accessories'} · ${o.customer?.postcode || ''}`, go: () => onOrder(o.id) })),
      ...customers.filter((c) => hit(`${c.name} ${c.email} ${c.phone} ${formatUkPhone(c.phone)} ${c.postcode}`)).slice(0, 5)
        .map((c) => ({ key: c.id, icon: Users, title: c.name, sub: `${formatUkPhone(c.phone) || c.email} · ${c.orderCount} orders`, go: () => onCustomer(c.id) })),
      ...messages.filter((m) => hit(`${m.name} ${m.contact} ${m.message}`)).slice(0, 4)
        .map((m) => ({ key: m.id, icon: Mail, title: `Message from ${m.name}`, sub: m.message.slice(0, 70), go: () => onMessages() })),
    ]
  }, [q, orders, customers, messages, onOrder, onCustomer, onMessages])

  const choose = (r) => { onClose(); r.go() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    if (e.key === 'Enter' && results[active]) { e.preventDefault(); choose(results[active]) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Search" width={600}>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setActive(0) }} onKeyDown={onKey} placeholder="Order reference, name, phone, postcode or phone model"
          aria-label="Search orders, customers and messages" className="h-12 w-full rounded-full bg-[#F6F7F9] pl-11 pr-4 text-[15px] outline-none focus:bg-white focus:ring-2 focus:ring-accent" />
      </div>
      <ul className="mt-3 max-h-[50vh] overflow-y-auto" role="listbox" aria-label="Results">
        {q.trim() && results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Nothing found for “{q}”.</li>}
        {results.map((r, i) => {
          const Icon = r.icon
          return (
            <li key={r.key} role="option" aria-selected={i === active}>
              <button type="button" onClick={() => choose(r)} onMouseEnter={() => setActive(i)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${i === active ? 'bg-tint' : ''}`}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#F1F3F7] text-muted"><Icon size={16} aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold">{r.title}</span><span className="block truncate text-xs text-muted">{r.sub}</span></span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Tip: press Ctrl + K (or ⌘ + K) anywhere in the admin panel.</p>
    </Modal>
  )
}
