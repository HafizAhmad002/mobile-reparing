import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BellRing, ChevronRight, Download, Mail, MessageCircle, Pencil, Phone, Search, Send, Trash2, UserPlus, Users, Repeat, UserX, X } from 'lucide-react'
import Button from '../ui/Button'
import Select from '../ui/Select'
import Modal from '../ui/Modal'
import DatePicker, { todayISO } from '../ui/DatePicker'
import Avatar from '../ui/Avatar'
import { toast } from '../ui/Toast'
import { useMessages } from '../../lib/store'
import { TAGS, addNote, customersCsv, deleteNote, editNote, eraseCustomer, fillTemplate, logFollowUp, markCustomerSeen, updateMeta, useCustomers, useTemplates } from '../../lib/customers'
import { formatDate, formatDateTime, formatUkPhone, orderDevice, orderPriceLabel, samePhone } from '../../lib/format'
import { Card, Stat, StatusBadge, money } from './shared'

const waNumber = (phone) => String(phone || '').replace(/\D/g, '').replace(/^0/, '44')
const since = (days) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(0, 0, 0, 0); return d.toISOString() }
const CHANNELS = [{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'Email' }, { value: 'sms', label: 'Text message (SMS)' }, { value: 'call', label: 'Phone call (log only)' }]

/* ----------------------------- follow-up modal ---------------------------- */
function FollowUpModal({ open, onClose, c }) {
  const templates = useTemplates()
  const firstAllowed = templates.find((t) => t.type === 'service' || c.marketingConsent)
  const [tplId, setTplId] = useState(firstAllowed?.id || '')
  const [channel, setChannel] = useState(c.phone ? 'whatsapp' : 'email')
  const tpl = templates.find((t) => t.id === tplId)
  const [text, setText] = useState(tpl ? fillTemplate(tpl.text, c) : '')
  const pick = (id) => { setTplId(id); const t = templates.find((x) => x.id === id); if (t) setText(fillTemplate(t.text, c)) }
  const blocked = tpl?.type === 'marketing' && !c.marketingConsent

  const send = () => {
    if (blocked || !text.trim()) return
    if (channel === 'whatsapp') window.open(`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    if (channel === 'email') window.location.href = `mailto:${c.email}?subject=${encodeURIComponent('FixPoint')}&body=${encodeURIComponent(text)}`
    if (channel === 'sms') window.location.href = `sms:${c.phone}?&body=${encodeURIComponent(text)}`
    logFollowUp(c.id, { channel, template: tpl?.name || 'Custom', message: text })
    toast('Follow-up logged')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Send follow-up" text={`To ${c.name}`} width={600}>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[13px] font-bold text-body">Template</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((t) => {
              const off = t.type === 'marketing' && !c.marketingConsent
              return (
                <button key={t.id} type="button" onClick={() => !off && pick(t.id)} aria-pressed={tplId === t.id} disabled={off}
                  title={off ? 'This customer has not agreed to marketing messages, so offers can’t be sent.' : undefined}
                  className={`rounded-2xl border px-3.5 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${tplId === t.id ? 'border-accent bg-tint' : 'border-line hover:border-field'}`}>
                  <span className="block font-bold">{t.name}</span>
                  <span className={`text-[11px] font-bold uppercase tracking-[0.06em] ${t.type === 'marketing' ? 'text-[#9A6A00]' : 'text-success'}`}>{t.type}{off ? ' · no consent' : ''}</span>
                </button>
              )
            })}
          </div>
        </div>
        <Select label="Send by" value={channel} onChange={setChannel} options={CHANNELS.filter((ch) => (ch.value === 'email' ? c.email : c.phone))} />
        <div>
          <label htmlFor="fu-text" className="mb-1.5 block text-[13px] font-bold text-body">Message (you can edit it)</label>
          <textarea id="fu-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-[14px] border border-field px-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent" />
        </div>
        <p className="text-xs text-muted">WhatsApp opens in a new tab with the message filled in. Every send is saved in the customer’s timeline.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={send} disabled={blocked || !text.trim()}><Send size={15} /> {channel === 'call' ? 'Log the call' : 'Send'}</Button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------ customer page ---------------------------- */
function CustomerDetail({ c, onBack, onOpenOrder }) {
  const messages = useMessages()
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(null) // { id, text }
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => { markCustomerSeen(c.id) }, [c.id])

  const theirMessages = messages.filter((m) => (c.email && (m.userEmail === c.email || m.contact === c.email)) || (c.phone && samePhone(m.contact, c.phone)))
  const timeline = [
    ...(c.createdAt ? [{ at: c.createdAt, text: c.account ? 'Signed up' : 'First booking (no account)' }] : []),
    ...c.orders.map((o) => ({ at: o.createdAt, text: `${o.type === 'accessory' ? 'Accessory order' : 'Booked'} ${o.id} · ${orderDevice(o) || ''}`, order: o.id })),
    ...theirMessages.map((m) => ({ at: m.createdAt, text: `Message: “${m.message.slice(0, 70)}${m.message.length > 70 ? '…' : ''}”` })),
    ...c.followUps.map((f) => ({ at: f.at, text: `Follow-up by ${f.channel}: ${f.template}` })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const quick = 'inline-flex h-10 items-center gap-2 rounded-full border border-field bg-white px-4 text-sm font-bold transition-colors'
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"><ArrowLeft size={15} /> All customers</button>

      <section className="flex flex-col gap-4 rounded-[24px] border border-line bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={c.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-extrabold tracking-[-0.02em]">{c.name}</h2>
          <p className="text-sm text-muted">{c.createdAt ? `Customer since ${new Date(c.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : 'Customer'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c.account ? 'bg-tint text-accent' : 'bg-[#F1F3F7] text-muted'}`}>{c.account ? 'Account' : 'Guest'}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c.marketingConsent ? 'bg-success-tint text-success' : 'bg-[#F1F3F7] text-muted'}`}>{c.marketingConsent ? 'Offers: yes' : 'Offers: no'}</span>
            {c.tags.map((t) => <span key={t} className="rounded-full bg-[#FFF4DB] px-2.5 py-0.5 text-[11px] font-bold text-[#9A6A00]">{t}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && <a href={`tel:${c.phone}`} className={`${quick} hover:border-accent hover:text-accent`}><Phone size={15} /> Call</a>}
          {c.phone && <a href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noreferrer" className={`${quick} hover:border-whatsapp hover:text-whatsapp`}><MessageCircle size={15} /> WhatsApp</a>}
          {c.email && <a href={`mailto:${c.email}`} className={`${quick} hover:border-accent hover:text-accent`}><Mail size={15} /> Email</a>}
          <Button onClick={() => setSending(true)} className="!h-10 !text-sm"><Send size={15} /> Send follow-up</Button>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <Card title={`Orders (${c.orders.length})`}>
            {c.orders.length === 0 ? <p className="text-sm text-muted">No orders yet. A good person to send a welcome message.</p> : (
              <ul className="divide-y divide-line">
                {c.orders.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => onOpenOrder(o.id)} className="flex w-full items-center gap-3 py-3 text-left">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{orderDevice(o) || 'Accessories'}</p>
                        <p className="text-xs text-muted">{o.id} · {formatDate(o.slot?.date || o.createdAt, { year: true })}</p>
                      </div>
                      <StatusBadge status={o.status} />
                      <span className="w-20 text-right text-sm font-bold">{orderPriceLabel(o)}</span>
                      <ChevronRight size={16} className="text-muted" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Timeline">
            <ol className="space-y-3">
              {timeline.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <div className="min-w-0"><p className={t.order ? 'font-semibold' : ''}>{t.text}</p><p className="text-xs text-muted">{formatDateTime(t.at)}</p></div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Contact details">
            <dl className="space-y-2 text-sm">
              {[['Phone', formatUkPhone(c.phone)], ['Email', c.email], ['Address', [c.address, c.postcode].filter(Boolean).join(', ')], ['Signed up', formatDate(c.createdAt, { year: true })], ['Total spent', money(c.spent)], ['Last contacted', c.lastContactedAt ? formatDateTime(c.lastContactedAt) : 'Never']].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words text-right font-semibold">{v || '—'}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Follow-up reminder">
            <DatePicker min={todayISO()} value={c.followUpDate} onChange={(v) => { updateMeta(c.id, { followUpDate: v }); toast(`Reminder set for ${formatDate(v)}`) }} placeholder="Set reminder" />
            {c.followUpDate && <button type="button" onClick={() => updateMeta(c.id, { followUpDate: '' })} className="mt-2 text-sm font-bold text-muted hover:text-danger">Clear reminder</button>}
            <p className="mt-2 text-xs text-muted">Due reminders show on the Overview and in your notifications.</p>
          </Card>
          <Card title="Tags">
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const on = c.tags.includes(t)
                return (
                  <button key={t} type="button" aria-pressed={on} onClick={() => updateMeta(c.id, { tags: on ? c.tags.filter((x) => x !== t) : [...c.tags, t] })}
                    className={`h-9 rounded-full border px-3.5 text-sm font-bold transition-colors ${on ? 'border-[#E8A317] bg-[#FFF4DB] text-[#7A5600]' : 'border-line text-muted hover:border-field'}`}>{t}</button>
                )
              })}
            </div>
          </Card>
          <Card title="Private notes">
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addNote(c.id, note.trim()); setNote('') } }} className="flex gap-2">
              <label htmlFor="cust-note" className="sr-only">New note</label>
              <input id="cust-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note only you can see" className="h-11 min-w-0 flex-1 rounded-full border border-field px-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent" />
              <Button type="submit" disabled={!note.trim()} className="!h-11 !px-4 !text-sm">Add</Button>
            </form>
            <ul className="mt-3 space-y-2">
              {c.notes.map((n) => (
                <li key={n.id} className="rounded-2xl bg-[#F6F7F9] p-3 text-sm">
                  {editing?.id === n.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); editNote(c.id, n.id, editing.text); setEditing(null) }} className="space-y-2">
                      <textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} rows={2} className="w-full rounded-xl border border-field px-3 py-2 text-sm outline-none focus:border-accent" aria-label="Edit note" />
                      <div className="flex gap-2"><Button type="submit" className="!h-9 !px-4 !text-xs">Save</Button><Button variant="secondary" onClick={() => setEditing(null)} className="!h-9 !px-4 !text-xs">Cancel</Button></div>
                    </form>
                  ) : (
                    <>
                      <p className="whitespace-pre-line">{n.text}</p>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted">
                        <span>{formatDateTime(n.at)}{n.editedAt ? ' · edited' : ''}</span>
                        <span className="flex gap-1">
                          <button type="button" onClick={() => setEditing({ id: n.id, text: n.text })} aria-label="Edit note" className="grid size-8 place-items-center rounded-full hover:bg-white"><Pencil size={13} /></button>
                          <button type="button" onClick={() => deleteNote(c.id, n.id)} aria-label="Delete note" className="grid size-8 place-items-center rounded-full hover:bg-white hover:text-danger"><X size={14} /></button>
                        </span>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          <button type="button" onClick={() => setDeleting(true)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-danger hover:bg-[#FDECEA]"><Trash2 size={15} /> Delete this customer (GDPR)</button>
        </div>
      </div>

      {sending && <FollowUpModal open={sending} onClose={() => setSending(false)} c={c} />}
      <Modal open={deleting} onClose={() => setDeleting(false)} title="Delete this customer?" width={480}>
        <p className="text-[15px] leading-relaxed">This removes <b>{c.name}</b>’s account, messages and notes. Their {c.orders.length} order{c.orders.length === 1 ? '' : 's'} stay for your accounts, but the name, phone, email and address are removed. This can’t be undone.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleting(false)}>Keep</Button>
          <Button onClick={() => { eraseCustomer(c); setDeleting(false); toast('Customer deleted', { tone: 'info' }); onBack() }} className="!bg-danger hover:!bg-[#8f1c13]">Delete for good</Button>
        </div>
      </Modal>
    </div>
  )
}

/* ------------------------------ customer list ---------------------------- */
export default function Customers({ selectedId, onSelect, onOpenOrder }) {
  const customers = useCustomers()
  const [q, setQ] = useState('')
  const [joined, setJoined] = useState('all')
  const [has, setHas] = useState('all')
  const [consent, setConsent] = useState('all')
  const [tag, setTag] = useState('all')
  const [due, setDue] = useState(false)
  const today = todayISO()

  const selected = selectedId && customers.find((c) => c.id === selectedId)
  const stats = useMemo(() => ({
    total: customers.length,
    week: customers.filter((c) => c.createdAt >= since(6)).length,
    never: customers.filter((c) => c.account && !c.orderCount).length,
    repeat: customers.filter((c) => c.completed >= 2).length,
  }), [customers])

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return customers.filter((c) => {
      const hay = `${c.name} ${c.email} ${c.phone} ${formatUkPhone(c.phone)} ${c.postcode}`.toLowerCase()
      if (!words.every((w) => hay.includes(w))) return false
      if (joined !== 'all' && !(c.createdAt >= since(joined === 'today' ? 0 : Number(joined) - 1))) return false
      if (has === 'yes' && !c.orderCount) return false
      if (has === 'no' && c.orderCount) return false
      if (consent !== 'all' && c.marketingConsent !== (consent === 'yes')) return false
      if (tag !== 'all' && !c.tags.includes(tag)) return false
      if (due && !(c.followUpDate && c.followUpDate <= today)) return false
      return true
    })
  }, [customers, q, joined, has, consent, tag, due, today])

  const exportCsv = () => {
    const blob = new Blob([customersCsv(list)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `fixpoint-customers-${today}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (selectedId && selected) return <CustomerDetail key={selected.id} c={selected} onBack={() => onSelect(null)} onOpenOrder={onOpenOrder} />
  if (selectedId && !selected) return <p className="rounded-[24px] border border-line bg-white p-10 text-center text-muted">This customer no longer exists. <button type="button" className="font-bold text-accent" onClick={() => onSelect(null)}>Back to customers</button></p>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={Users} label="Total customers" value={stats.total} />
        <Stat icon={UserPlus} label="New this week" value={stats.week} tone="bg-success-tint text-success" />
        <Stat icon={UserX} label="Signed up, never booked" value={stats.never} tone="bg-[#FFF4DB] text-[#9A6A00]" />
        <Stat icon={Repeat} label="Repeat customers" value={stats.repeat} hint="2+ completed repairs" />
      </div>

      <div className="space-y-3 rounded-[24px] border border-line bg-white p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="cust-q" className="sr-only">Search customers</label>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="cust-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone or postcode" className="h-11 w-full rounded-full bg-[#F6F7F9] pl-11 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-accent" />
          </div>
          <Button variant="secondary" onClick={exportCsv} className="!h-11 !text-sm"><Download size={15} /> Export CSV</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Select variant="compact" ariaLabel="Signed up" value={joined} onChange={setJoined} options={[{ value: 'all', label: 'Signed up: any time' }, { value: 'today', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }]} />
          <Select variant="compact" ariaLabel="Orders" value={has} onChange={setHas} options={[{ value: 'all', label: 'Orders: all' }, { value: 'yes', label: 'Has orders' }, { value: 'no', label: 'No orders' }]} />
          <Select variant="compact" ariaLabel="Marketing consent" value={consent} onChange={setConsent} options={[{ value: 'all', label: 'Offers: all' }, { value: 'yes', label: 'Agreed to offers' }, { value: 'no', label: 'No offers' }]} />
          <Select variant="compact" ariaLabel="Tag" value={tag} onChange={setTag} options={[{ value: 'all', label: 'Tag: any' }, ...TAGS.map((t) => ({ value: t, label: t }))]} />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 px-1 text-sm font-semibold text-body"><input type="checkbox" checked={due} onChange={(e) => setDue(e.target.checked)} className="size-4 accent-[#1e4fd8]" /><BellRing size={14} aria-hidden="true" /> Follow-up due</label>
      </div>
      <p className="px-1 text-sm text-muted" role="status">{list.length} customer{list.length === 1 ? '' : 's'}</p>

      {/* Phones */}
      <ul className="space-y-3 md:hidden">
        {list.length === 0 && <li className="rounded-[24px] border border-line bg-white px-4 py-10 text-center text-sm text-muted">No customers match.</li>}
        {list.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onSelect(c.id)} className="flex w-full items-center gap-3 rounded-[22px] border border-line bg-white p-4 text-left hover:border-accent">
              <Avatar name={c.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold">{c.name}{!c.seen && <span className="size-2 rounded-full bg-accent" aria-label="new" />}</p>
                <p className="truncate text-xs text-muted">{formatUkPhone(c.phone) || c.email} · {c.postcode || '—'}</p>
                <p className="text-xs text-muted">{c.orderCount} orders · {money(c.spent)}</p>
              </div>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="relative hidden overflow-x-auto rounded-[24px] border border-line bg-white md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-[#FAFBFC] text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
              {['Name', 'Phone & email', 'Postcode', 'Signed up', 'Orders', 'Spent', 'Last order', 'Contacted', 'Tags'].map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-muted">No customers match.</td></tr>}
            {list.map((c) => (
              <tr key={c.id} onClick={() => onSelect(c.id)} className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-[#F8F9FC]">
                <td className="px-4 py-3">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(c.id) }} className="flex items-center gap-2 font-bold hover:text-accent">
                    {c.name}{!c.seen && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>}
                  </button>
                  <span className="text-xs text-muted">{c.account ? 'Account' : 'Guest'}{c.marketingConsent ? ' · offers ✓' : ''}</span>
                </td>
                <td className="px-4 py-3"><p>{formatUkPhone(c.phone) || '—'}</p><p className="max-w-[200px] truncate text-xs text-muted">{c.email}</p></td>
                <td className="px-4 py-3">{c.postcode || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3 font-bold">{c.orderCount}</td>
                <td className="px-4 py-3 font-bold">{money(c.spent)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(c.lastOrder) || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(c.lastContactedAt) || '—'}{c.followUpDate && <span className={`block text-[11px] font-bold ${c.followUpDate <= today ? 'text-danger' : 'text-accent'}`}>Follow up {formatDate(c.followUpDate)}</span>}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded-full bg-[#FFF4DB] px-2 py-0.5 text-[10px] font-bold text-[#9A6A00]">{t}</span>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
