import { Link, Navigate } from 'react-router-dom'
import { LogOut, Smartphone, ShoppingBag } from 'lucide-react'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { logOut, statusLabel, useOrders, useSession } from '../lib/store'

export default function Account() {
  useDocumentTitle('My Account — FixPoint', 'See your FixPoint repairs and orders.')
  const session = useSession()
  const orders = useOrders()
  if (!session) return <Navigate to="/login" replace />

  const mine = orders.filter((o) => o.userEmail === session.email || (session.phone && o.customer?.phone === session.phone))

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">My account</p>
          <h1 className="text-[clamp(32px,4.4vw,48px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Hi, {session.name.split(' ')[0]}</h1>
          <p className="mt-1 text-[15px] text-muted">{session.email}</p>
        </div>
        <Button variant="secondary" onClick={logOut}><LogOut size={16} strokeWidth={2} /> Log out</Button>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-[-0.02em]">My repairs &amp; orders</h2>
        <Button to="/book" variant="dark">New repair</Button>
      </div>

      {mine.length === 0 ? (
        <div className="mt-4 rounded-[28px] border border-line bg-white p-10 text-center">
          <p className="text-base font-bold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">Your bookings will show up here when you book while logged in.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {mine.map((o) => {
            const Icon = o.type === 'accessory' ? ShoppingBag : Smartphone
            return (
              <li key={o.id} className="flex flex-wrap items-center gap-4 rounded-[24px] border border-line bg-white p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-tint text-accent"><Icon size={22} strokeWidth={2} aria-hidden="true" /></span>
                <div className="min-w-[200px] flex-1">
                  <p className="text-base font-extrabold tracking-[-0.02em]">{o.type === 'accessory' ? o.items.map((i) => `${i.qty}× ${i.name}`).join(', ') + (o.device ? ` — for ${o.device.brand} ${o.device.model}` : '') : `${o.device.brand} ${o.device.model}`}</p>
                  <p className="text-sm text-muted">{o.id} · {new Date(o.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
                <span className="rounded-full bg-tint px-3.5 py-1.5 text-xs font-bold text-accent">{statusLabel(o.status)}</span>
                <Link to="/track" className="text-sm font-bold text-accent hover:underline">Track</Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
