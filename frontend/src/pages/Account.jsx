import { useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Camera, ChevronRight, LogOut, Mail, MapPin, MessageSquare, Pencil, Phone, ShoppingBag, Smartphone, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'
import AddressField from '../components/AddressField'
import MessageUs from '../components/MessageUs'
import { StatusBadge } from '../components/admin/shared'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { brands } from '../data/catalog'
import { logOut, updateProfile, useMessages, useOrders, useSession } from '../lib/store'
import { photoPreview } from '../lib/attachments'
import { setMarketingConsent } from '../lib/customers'
import { PHONE_ERROR, POSTCODE_ERROR, deviceLabel, formatDate, formatUkPhone, isUkPostcode, normalisePostcode, normaliseUkPhone, samePhone } from '../lib/format'

const BRAND_OPTIONS = brands.map((b) => ({ value: b.name, label: b.name, group: b.kind === 'tablet' ? 'Tablets' : 'Phones' }))
const shortDate = (iso) => formatDate(iso, { year: true })

// Change / remove the profile picture (made small so it fits in browser storage)
function PhotoButton({ onPhoto, className = '' }) {
  const input = useRef(null)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    const small = await photoPreview(f, 320, 0.82)
    if (small) onPhoto(small)
  }
  return (
    <>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} tabIndex={-1} aria-hidden="true" />
      <button type="button" onClick={() => input.current.click()} aria-label="Change profile photo" className={className}>
        <Camera size={15} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </>
  )
}

// Edit profile window
function EditProfile({ open, onClose, session }) {
  const start = () => ({
    name: session.name || '', phone: formatUkPhone(session.phone) || '', address: session.address || '', postcode: session.postcode || '',
    location: session.location || null, photo: session.photo || null,
    brand: session.device?.brand || '', model: session.device?.model || '',
  })
  const [f, setF] = useState(start)
  const [errors, setErrors] = useState({})
  const brandObj = brands.find((b) => b.name === f.brand)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))

  const save = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.name.trim()) err.name = 'Please enter your name.'
    if (!normaliseUkPhone(f.phone)) err.phone = PHONE_ERROR
    if (f.postcode.trim() && !isUkPostcode(f.postcode)) err.postcode = POSTCODE_ERROR
    setErrors(err)
    if (Object.keys(err).length) return
    updateProfile({
      name: f.name.trim(), phone: normaliseUkPhone(f.phone), address: f.address.trim(), postcode: f.postcode.trim() ? normalisePostcode(f.postcode) : '',
      location: f.location, photo: f.photo,
      device: f.brand && f.model ? { kind: brandObj?.kind || 'phone', brand: f.brand, model: f.model } : null,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" width={600}>
      <form onSubmit={save} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={f.name} photo={f.photo} size="lg" />
            <PhotoButton onPhoto={(photo) => set({ photo })} className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-ink text-white" />
          </div>
          <div className="text-sm">
            <p className="font-bold">Profile photo</p>
            <p className="text-muted">Optional. A clear photo of your face.</p>
            {f.photo && <button type="button" onClick={() => set({ photo: null })} className="mt-1 inline-flex items-center gap-1 font-bold text-danger hover:underline"><Trash2 size={13} aria-hidden="true" /> Remove photo</button>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Full name" value={f.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" aria-invalid={!!errors.name} />
            {errors.name && <p className="mt-1 text-xs font-semibold text-danger">{errors.name}</p>}
          </div>
          <div>
            <Field label="Phone number" type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} autoComplete="tel" aria-invalid={!!errors.phone} />
            {errors.phone && <p className="mt-1 text-xs font-semibold text-danger">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_150px] sm:items-end">
          <AddressField label="Home address" value={f.address} onChange={(v) => set({ address: v })}
            onPick={(p) => set({ address: p.address || f.address, postcode: p.postcode || f.postcode, location: p.lat != null ? { lat: p.lat, lon: p.lon } : f.location })} />
          <div><Field label="Postcode" value={f.postcode} onChange={(e) => set({ postcode: e.target.value })} autoComplete="postal-code" aria-invalid={!!errors.postcode} />{errors.postcode && <p className="mt-1 text-xs font-semibold text-danger">{errors.postcode}</p>}</div>
        </div>

        <fieldset>
          <legend className="text-[13px] font-bold text-body">My phone</legend>
          <p className="text-xs text-muted">So we can fill it in for you when you book.</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Select ariaLabel="Phone brand" placeholder="Brand" value={f.brand} onChange={(v) => set({ brand: v, model: '' })} options={BRAND_OPTIONS} />
            <Select ariaLabel="Phone model" placeholder={brandObj ? 'Model' : 'Choose a brand first'} value={f.model} onChange={(v) => set({ model: v })} disabled={!brandObj}
              options={brandObj ? brandObj.models.map((m) => ({ value: m.name, label: m.name })) : []} />
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Modal>
  )
}

const Detail = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3 py-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F6F7F9] text-muted"><Icon size={16} strokeWidth={2} aria-hidden="true" /></span>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="break-words text-[15px] font-semibold">{children}</p>
    </div>
  </div>
)

export default function Account() {
  useDocumentTitle('My Account — FixPoint', 'Your profile, repairs and messages.')
  const session = useSession()
  const orders = useOrders()
  const messages = useMessages()
  const [editing, setEditing] = useState(false)
  const [messaging, setMessaging] = useState(false)

  const mine = useMemo(() => (session ? orders.filter((o) => o.userEmail === session.email || (session.phone && samePhone(o.customer?.phone, session.phone))) : []), [orders, session])
  const myMessages = useMemo(() => (session ? messages.filter((m) => m.userEmail === session.email) : []), [messages, session])
  if (!session) return <Navigate to="/login" replace />

  const first = session.name.split(' ')[0]
  const bookUrl = session.device ? `/book?${new URLSearchParams({ kind: session.device.kind || 'phone', brand: session.device.brand, model: session.device.model })}` : '/book'
  const missing = !session.address || !session.device

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10 md:py-14">
      {/* Profile header */}
      <section className="flex flex-col gap-5 rounded-[28px] border border-line bg-white p-5 sm:flex-row sm:items-center sm:p-7">
        <div className="relative self-start sm:self-center">
          <Avatar name={session.name} photo={session.photo} size="xl" />
          <PhotoButton onPhoto={(photo) => updateProfile({ photo })} className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border-[3px] border-white bg-ink text-white transition-colors hover:bg-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">My account</p>
          <h1 className="mt-1 break-words text-[clamp(26px,3.4vw,36px)] font-extrabold leading-tight tracking-[-0.03em]">{session.name}</h1>
          <p className="mt-1 break-words text-sm text-muted">{session.email}{session.phone ? ` · ${formatUkPhone(session.phone)}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMessaging(true)}><MessageSquare size={16} strokeWidth={2} /> Message us</Button>
          <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={15} strokeWidth={2} /> Edit profile</Button>
          <button type="button" onClick={logOut} className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-bold text-muted transition-colors hover:bg-[#FDECEA] hover:text-danger"><LogOut size={16} strokeWidth={2} aria-hidden="true" /> Log out</button>
        </div>
      </section>

      {missing && (
        <button type="button" onClick={() => setEditing(true)} className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-tint px-5 py-3.5 text-left text-sm text-body transition-colors hover:bg-[#DDE6FF]">
          <span><b className="text-ink">Finish your profile, {first}.</b> Add your address and phone model so booking is quicker.</span>
          <ChevronRight size={18} className="shrink-0 text-accent" aria-hidden="true" />
        </button>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Repairs & orders */}
          <section className="rounded-[28px] border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold tracking-[-0.02em]">My repairs &amp; orders <Link to="/my-bookings" className="ml-2 text-sm font-bold text-accent hover:underline">View all</Link></h2>
              <Button to={bookUrl} variant="dark" className="!h-10 !px-4 !text-sm">New repair</Button>
            </div>
            {mine.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-field px-5 py-10 text-center">
                <p className="font-bold">No repairs yet</p>
                <p className="mt-1 text-sm text-muted">When you book while logged in, your repairs show up here.</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {mine.map((o) => {
                  const Icon = o.type === 'accessory' ? ShoppingBag : Smartphone
                  return (
                    <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-1 last:pb-1">
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Icon size={20} strokeWidth={2} aria-hidden="true" /></span>
                      <div className="min-w-[180px] flex-1">
                        <p className="font-extrabold tracking-[-0.01em]">{o.type === 'accessory' ? `Accessories (${o.items.length})` : deviceLabel(o.device.brand, o.device.model)}</p>
                        <p className="text-sm text-muted">{o.id} · {o.slot?.date ? `Visit ${shortDate(`${o.slot.date}T12:00:00`)}${o.slot.time ? `, ${o.slot.time.split(' – ')[0]}` : ''}` : shortDate(o.createdAt)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                      <Link to="/track" className="text-sm font-bold text-accent hover:underline">Track</Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Messages */}
          <section id="messages" className="scroll-mt-24 rounded-[28px] border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold tracking-[-0.02em]">Messages</h2>
              <Button variant="secondary" onClick={() => setMessaging(true)} className="!h-10 !px-4 !text-sm">New message</Button>
            </div>
            {myMessages.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-field px-5 py-8 text-center text-sm text-muted">Questions about a repair? Send us a message and our reply will appear here.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {myMessages.slice(0, 5).map((m) => (
                  <li key={m.id} className="rounded-2xl bg-[#F6F7F9] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span className="font-bold text-ink">{m.topic}</span>
                      <span>{shortDate(m.createdAt)}</span>
                    </div>
                    <p className="ml-auto mt-2 w-fit max-w-[90%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-white">{m.message}</p>
                    {(m.replies || []).map((r, i) => (
                      <div key={i} className="mt-2 max-w-[90%]">
                        <p className="w-fit rounded-2xl rounded-bl-md border border-line bg-white px-4 py-2.5 text-sm">{r.text}</p>
                        <p className="mt-1 text-[11px] text-muted">FixPoint · {new Date(r.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                    ))}
                    {!m.replies?.length && <p className="mt-2 text-right text-[11px] text-muted">Waiting for a reply</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Details */}
        <aside className="rounded-[28px] border border-line bg-white p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-[-0.02em]">My details</h2>
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline"><Pencil size={13} aria-hidden="true" /> Edit</button>
          </div>
          <div className="mt-2 divide-y divide-line">
            <Detail icon={Phone} label="Phone number">{formatUkPhone(session.phone) || <span className="text-muted">Not added</span>}</Detail>
            <Detail icon={Mail} label="Email">{session.email}</Detail>
            <Detail icon={MapPin} label="Address">{session.address ? `${session.address}${session.postcode ? `, ${session.postcode}` : ''}` : <span className="text-muted">Not added</span>}</Detail>
            <Detail icon={Smartphone} label="My phone">{session.device ? deviceLabel(session.device.brand, session.device.model) : <span className="text-muted">Not added</span>}</Detail>
          </div>
          {session.device && <Button to={bookUrl} variant="secondary" className="mt-4 w-full">Book a repair for this phone</Button>}
          {/* Notification settings: updates about my repairs */}
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-muted">Repair updates</p>
          {[['notifyEmail', 'By email', 'Each time your repair moves on'], ['notifySms', 'By text message', 'Only for “on the way” and “completed”']].map(([k, t, d]) => (
            <label key={k} className="mt-2 flex cursor-pointer items-start justify-between gap-3 rounded-2xl bg-[#F6F7F9] p-3.5">
              <span className="text-sm"><b className="block text-ink">{t}</b><span className="text-xs text-muted">{d}</span></span>
              <input type="checkbox" role="switch" checked={k === 'notifyEmail' ? session.notifyEmail !== false : Boolean(session.notifySms)} onChange={(e) => updateProfile({ [k]: e.target.checked })} className="mt-1 size-5 shrink-0 accent-[#1e4fd8]" aria-label={`Repair updates ${t.toLowerCase()}`} />
            </label>
          ))}
          {/* Marketing consent: the customer can switch it on or off at any time */}
          <label className="mt-4 flex cursor-pointer items-start justify-between gap-3 rounded-2xl bg-[#F6F7F9] p-3.5">
            <span className="text-sm"><b className="block text-ink">Tips and offers</b><span className="text-xs text-muted">Repair tips and offers by WhatsApp or email.</span></span>
            <input type="checkbox" role="switch" checked={Boolean(session.marketingConsent)} onChange={(e) => setMarketingConsent(session.email, e.target.checked)} className="mt-1 size-5 shrink-0 accent-[#1e4fd8]" aria-label="Send me tips and offers" />
          </label>
        </aside>
      </div>

      {/* New key each time it opens, so the form starts from the saved details */}
      <EditProfile key={editing ? 'edit' : 'closed'} open={editing} onClose={() => setEditing(false)} session={session} />
      <MessageUs open={messaging} onClose={() => setMessaging(false)} />
    </div>
  )
}
