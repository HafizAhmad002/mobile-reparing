import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Search } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { STATUSES, findOrder, statusLabel } from '../lib/store'
import { SITE } from '../data/site'

const FLOW = STATUSES.filter((s) => s.id !== 'cancelled')

export default function Track() {
  useDocumentTitle('Track Your Repair — FixPoint', 'Enter your booking reference and phone number to see the status of your repair.')
  const [ref, setRef] = useState('')
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState(null)
  const [searched, setSearched] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setOrder(findOrder(ref, phone) || null)
    setSearched(true)
  }

  const idx = order ? FLOW.findIndex((s) => s.id === order.status) : -1

  return (
    <div className="mx-auto max-w-[760px] px-6 py-12 md:py-16">
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Track repair</p>
      <h1 className="text-[clamp(34px,4.6vw,54px)] font-extrabold leading-[1.05] tracking-[-0.035em]">Where is my repair?</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">Enter the reference we gave you (it looks like FP-AB12CD) and the phone number you booked with.</p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-[28px] border border-line bg-white p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Booking reference" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="FP-XXXXXX" required />
        <Field label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Button type="submit" variant="dark"><Search size={16} strokeWidth={2} /> Track</Button>
      </form>

      {searched && !order && (
        <p role="status" className="mt-6 rounded-2xl bg-white p-5 text-[15px] text-body">
          We couldn’t find that booking. Check the reference and phone number, or <a href={SITE.whatsapp} className="font-bold text-accent underline">message us</a>.
        </p>
      )}

      {order && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[28px] border border-line bg-white p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{order.id}</p>
              <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{order.type === 'accessory' ? `Accessories${order.device ? ` for ${order.device.brand} ${order.device.model}` : ''}` : `${order.device.brand} ${order.device.model}`}</h2>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${order.status === 'completed' ? 'bg-success-tint text-success' : order.status === 'cancelled' ? 'bg-[#FDECEA] text-danger' : 'bg-tint text-accent'}`}>
              {statusLabel(order.status)}
            </span>
          </div>

          {order.status !== 'cancelled' && (
            <ol className="mt-8 grid gap-4 sm:grid-cols-5">
              {FLOW.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 sm:block">
                  <span className={`grid size-9 place-items-center rounded-full text-sm font-bold ${i <= idx ? 'bg-accent text-white' : 'bg-line text-muted'}`}>
                    {i <= idx ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={`text-sm font-bold sm:mt-2 sm:block ${i <= idx ? 'text-ink' : 'text-muted'}`}>{s.label}</span>
                </li>
              ))}
            </ol>
          )}

          <dl className="mt-8 divide-y divide-line rounded-[20px] border border-line text-[15px]">
            {order.slot && <div className="flex justify-between gap-4 px-5 py-3.5"><dt className="text-muted">Visit</dt><dd className="font-bold">{order.slot.date} · {order.slot.time}</dd></div>}
            <div className="flex justify-between gap-4 px-5 py-3.5"><dt className="text-muted">Price</dt><dd className="font-bold">{order.price != null ? `£${Number(order.price).toFixed(2)}` : 'To be confirmed with you'}</dd></div>
          </dl>
        </motion.div>
      )}

      <p className="mt-8 text-sm text-muted">No booking yet? <Link to="/book" className="font-bold text-accent">Book a repair</Link></p>
    </div>
  )
}
