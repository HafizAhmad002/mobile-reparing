import { useParams, useSearchParams } from 'react-router-dom'
import { Printer, Smartphone } from 'lucide-react'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { isAdminUnlocked, useOrders, useSession } from '../lib/store'
import { warrantyUntil } from '../lib/orders'
import { deviceLabel, formatDate, formatUkPhone, samePhone } from '../lib/format'
import { issueName } from '../components/admin/shared'
import { SITE } from '../data/site'

const PAY = { cash: 'Cash', card: 'Card', bank: 'Bank transfer', unpaid: 'Not paid yet' }
const gbp = (n) => `£${Number(n).toFixed(2)}`

/*
  Printable receipt (/receipt/FP-XXXX). "Print or save as PDF" uses the browser's print window.
  Shown to the order's customer (logged in, or with ?p=<last 4 digits>) and to the admin.
*/
export default function Receipt() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const session = useSession()
  const o = useOrders().find((x) => x.id === id)
  useDocumentTitle(`Receipt ${o?.receipt?.number || ''} — FixPoint`, 'Repair receipt')
  const allowed = o && (isAdminUnlocked() || (session && (o.userEmail === session.email || samePhone(o.customer?.phone, session.phone))) || (params.get('p') && String(o.customer?.phone || '').replace(/\D/g, '').endsWith(params.get('p'))))

  if (!o?.receipt || !allowed) {
    return <div className="grid min-h-screen place-items-center bg-page p-6 text-center"><p className="max-w-[360px] text-muted">This receipt is not available. Log in to your account or open the link from your messages.</p></div>
  }
  const r = o.receipt
  const until = warrantyUntil(o)
  return (
    <div className="min-h-screen bg-page px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[720px] justify-end print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white"><Printer size={16} /> Print or save as PDF</button>
      </div>
      <article className="mx-auto max-w-[720px] rounded-[24px] border border-line bg-white p-8 print:rounded-none print:border-0">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[12px] bg-ink text-white"><Smartphone size={20} /></span>
            <div><p className="text-xl font-extrabold">FixPoint</p><p className="text-xs text-muted">Doorstep phone repair · Manchester</p></div>
          </div>
          <div className="text-right text-sm"><p className="text-lg font-extrabold">Receipt</p><p className="font-bold">{r.number}</p><p className="text-muted">{formatDate(r.issuedAt, { year: true })}</p></div>
        </header>
        <section className="grid gap-6 py-6 sm:grid-cols-2 text-sm">
          <div><p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Customer</p><p className="mt-1 font-semibold">{o.customer?.name}</p><p>{[o.customer?.address, o.customer?.postcode].filter(Boolean).join(', ')}</p><p>{formatUkPhone(o.customer?.phone)}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Booking</p><p className="mt-1 font-semibold">{o.id}</p><p>{deviceLabel(o.device?.brand, o.device?.model)}</p>{o.slot?.date && <p>Visit {formatDate(o.slot.date, { year: true })}</p>}</div>
        </section>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-y border-line text-xs font-bold uppercase tracking-[0.08em] text-muted"><th className="py-2.5">Work done</th><th className="py-2.5 text-right">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b border-line"><td className="py-3"><p className="font-semibold">{(o.issues || []).map(issueName).join(', ') || 'Repair'}</p>{r.parts && <p className="text-xs text-muted">Parts: {r.parts}</p>}{r.notes && <p className="text-xs text-muted">{r.notes}</p>}</td><td className="py-3 text-right font-semibold">{gbp(o.price)}</td></tr>
          </tbody>
          <tfoot><tr><td className="pt-4 text-base font-extrabold">Total</td><td className="pt-4 text-right text-base font-extrabold">{gbp(o.price)}</td></tr></tfoot>
        </table>
        <section className="mt-6 grid gap-2 rounded-2xl bg-[#F6F7F9] p-4 text-sm sm:grid-cols-2">
          <p><span className="text-muted">Payment:</span> <b>{PAY[r.payment] || r.payment}</b></p>
          <p><span className="text-muted">Warranty:</span> <b>{r.warrantyMonths} months{until ? `, until ${formatDate(until, { year: true })}` : ''}</b></p>
        </section>
        <p className="mt-6 text-xs text-muted">Thank you for choosing FixPoint. Questions about this repair? Message us on WhatsApp ({SITE.phone}). The warranty covers the part fitted and the work, not new damage.</p>
      </article>
    </div>
  )
}
