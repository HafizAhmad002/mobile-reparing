import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BarChart3, CalendarDays, ExternalLink, Inbox, LayoutDashboard, Lock, Mail, MessageCircle, Settings as SettingsIcon, Smartphone, Users, Wrench } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Overview from '../components/admin/Overview'
import Orders from '../components/admin/Orders'
import Schedule from '../components/admin/Schedule'
import Settings from '../components/admin/Settings'
import Customers from '../components/admin/Customers'
import Reports from '../components/admin/Reports'
import NotificationBell, { NotificationsPage, useAdminNotificationWatcher } from '../components/admin/Notifications'
import { useCustomers } from '../lib/customers'
import OrderDrawer from '../components/admin/OrderDrawer'
import Toaster from '../components/ui/Toast'
import GlobalSearch from '../components/admin/GlobalSearch'
import { Search } from 'lucide-react'
import { SharingContext, useLocationSharing } from '../lib/liveLocation'
import { dayKey } from '../components/admin/shared'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { ADMIN_ACCOUNTS } from '../lib/testAccounts'
import { adminLockedFor, hash, recordAdminTry, clearDemoOrders, isAdminUnlocked, lockAdmin, replyToMessage, setMessageRead, unlockAdmin, useMessages, useOrders } from '../lib/store'
import { seedDemoOrders } from '../lib/demo'

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, text: 'Your business at a glance.' },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, text: 'Visits, drives and free time.' },
  { id: 'orders', label: 'Orders', icon: Inbox, text: 'Every repair booking and accessory order. Click one to see everything.' },
  { id: 'customers', label: 'Customers', icon: Users, text: 'Everyone who signed up or booked. Notes, tags and follow-ups.' },
  { id: 'reports', label: 'Reports', icon: BarChart3, text: 'Money, jobs and the activity log for any dates.' },
  { id: 'messages', label: 'Messages', icon: Mail, text: 'Messages sent from the Contact page and from customer accounts.' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, text: 'Working hours, start location, service area, prices, templates and notifications.' },
]
// Pages that are not in the menu
const EXTRA = [{ id: 'notifications', label: 'Notifications', icon: SettingsIcon, text: 'Everything that happened, newest first.' }]

// One message with the reply box. Replies to logged-in customers appear in their account.
function MessageCard({ m }) {
  const [reply, setReply] = useState('')
  const isEmail = /@/.test(m.contact || '')
  const phone = m.phone || (!isEmail ? m.contact : '')
  const digits = String(phone || '').replace(/\D/g, '')
  const send = (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    replyToMessage(m.id, reply.trim())
    setMessageRead(m.id)
    setReply('')
  }
  return (
    <li className={`rounded-[24px] border bg-white p-5 ${m.read ? 'border-line' : 'border-accent/40 shadow-[0_10px_30px_-20px_rgba(30,79,216,0.6)]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-extrabold">{m.name}
            {!m.read && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}
            {m.userEmail && <span className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-bold text-accent">ACCOUNT</span>}
          </p>
          <p className="text-sm text-muted">{m.contact}{m.phone ? ` · ${m.phone}` : ''} · <span className="font-semibold text-accent">{m.topic}</span></p>
        </div>
        <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{m.message}</p>
      {(m.replies || []).map((r, i) => (
        <div key={i} className="mt-3 rounded-2xl bg-tint px-4 py-3 text-sm">
          <p className="text-xs font-bold text-accent">Your reply · {new Date(r.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
          <p className="mt-1 whitespace-pre-line">{r.text}</p>
        </div>
      ))}
      {m.userEmail ? (
        <form onSubmit={send} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`reply-${m.id}`} className="sr-only">Reply to {m.name}</label>
          <input id={`reply-${m.id}`} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply. The customer sees it in their account."
            className="h-11 min-w-0 flex-1 rounded-full border border-field px-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent" />
          <Button type="submit" disabled={!reply.trim()} className="!h-11">Send reply</Button>
        </form>
      ) : <p className="mt-3 text-xs text-muted">Sent from the Contact page without an account, so reply by email or WhatsApp.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {isEmail && <a href={`mailto:${m.contact}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-bold hover:border-accent hover:text-accent"><Mail size={15} aria-hidden="true" /> Email</a>}
        {digits.length >= 9 && <a href={`https://wa.me/${digits.startsWith('0') ? `44${digits.slice(1)}` : digits}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-field px-4 text-sm font-bold hover:border-whatsapp hover:text-whatsapp"><MessageCircle size={15} aria-hidden="true" /> WhatsApp</a>}
        {!m.read && <button type="button" onClick={() => setMessageRead(m.id)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-bold text-muted hover:bg-[#F6F7F9]">Mark as read</button>}
      </div>
    </li>
  )
}

function Messages() {
  const messages = useMessages()
  if (!messages.length) return <p className="rounded-[24px] border border-line bg-white p-10 text-center text-muted">No messages yet.</p>
  return <ul className="space-y-3">{messages.map((m) => <MessageCard key={m.id} m={m} />)}</ul>
}

// Runs the notification watcher once for the whole admin panel
function NotificationWatcher() {
  useAdminNotificationWatcher()
  return null
}

function Login({ onUnlock }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  return (
    <div className="grid min-h-screen place-items-center bg-page px-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const wait = adminLockedFor()
          if (wait) return setError(`Too many wrong tries. Try again in ${wait} minute${wait > 1 ? 's' : ''}.`)
          const mail = email.trim().toLowerCase()
          const h = await hash(code)
          const ok = ADMIN_ACCOUNTS.some((a) => a.emails.includes(mail) && a.passwordHash === h)
          recordAdminTry(ok)
          if (ok) { unlockAdmin(); onUnlock() } else setError(adminLockedFor() ? 'Too many wrong tries. Try again in 15 minutes.' : 'Email or password is not correct.')
        }}
        className="w-full max-w-[400px] rounded-[28px] border border-line bg-white p-8 shadow-[0_30px_80px_-40px_rgba(14,15,19,0.35)]"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-ink text-white"><Lock size={20} strokeWidth={2} aria-hidden="true" /></span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">FixPoint Admin</h1>
        <p className="mt-1 text-sm text-muted">Log in with your admin email and password.</p>
        <Field className="mt-5" label="Email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        <Field className="mt-3" label="Password" type="password" value={code} onChange={(e) => { setCode(e.target.value); setError('') }} autoComplete="current-password" />
        {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
        <Button type="submit" variant="dark" className="mt-5 w-full">Log in</Button>
        <Link to="/" className="mt-4 block text-center text-sm font-bold text-accent">Back to site</Link>
      </form>
    </div>
  )
}

export default function Admin() {
  useDocumentTitle('Admin — FixPoint', 'FixPoint admin dashboard')
  const [unlocked, setUnlocked] = useState(isAdminUnlocked)
  const [params, setParams] = useSearchParams()
  const tab = [...SECTIONS, ...EXTRA].some((s) => s.id === params.get('tab')) ? params.get('tab') : 'overview'
  const day = params.get('day') || dayKey(new Date())
  // Schedule view: from the URL, else Day on phones and Week on bigger screens
  const view = ['week', 'month', 'list', 'day'].includes(params.get('view')) ? params.get('view') : (typeof window !== 'undefined' && window.innerWidth < 768 ? 'day' : 'week')
  const [openId, setOpenId] = useState(null)
  const customers = useCustomers()
  // A link like /admin?tab=orders&open=FP-XXXX (from a notification) opens that order
  const openParam = params.get('open')
  const [openedParam, setOpenedParam] = useState(null)
  if (openParam && openParam !== openedParam && openParam.startsWith('FP-')) { setOpenedParam(openParam); setOpenId(openParam) }
  const orders = useOrders()
  const messages = useMessages()
  const sharing = useLocationSharing() // technician live location while "On the way"
  const [searching, setSearching] = useState(false)
  // Ctrl / Cmd + K opens the search
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearching(true) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!unlocked) return <Login onUnlock={() => setUnlocked(true)} />

  const go = (id, extra = {}) => { setParams({ tab: id, ...extra }); window.scrollTo(0, 0) }
  const showDay = (date) => { setOpenId(null); go('schedule', { view: 'day', day: date }) }
  const section = [...SECTIONS, ...EXTRA].find((s) => s.id === tab)
  const hasDemo = orders.some((o) => o.demo)
  const today = dayKey(new Date())
  const badges = {
    schedule: orders.filter((o) => o.type === 'repair' && o.status !== 'cancelled' && o.slot?.date === today && o.slot.start).length,
    orders: orders.filter((o) => o.status === 'new').length,
    messages: messages.filter((m) => !m.read).length,
    customers: customers.filter((c) => c.account && !c.seen).length,
  }
  const lock = () => { lockAdmin(); setUnlocked(false) }

  const navItem = (s, mobile) => {
    const Icon = s.icon
    const on = tab === s.id
    return (
      <button key={s.id} type="button" onClick={() => go(s.id)} aria-current={on ? 'page' : undefined}
        className={mobile
          ? `inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold ${on ? 'bg-ink text-white' : 'bg-white text-body'}`
          : `flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-bold transition-colors ${on ? 'bg-white text-ink shadow-[0_6px_20px_-12px_rgba(14,15,19,0.4)]' : 'text-[#C9CCD6] hover:bg-white/10 hover:text-white'}`}>
        <Icon size={18} strokeWidth={2} aria-hidden="true" className={!mobile && on ? 'text-accent' : ''} />
        <span className="flex-1 text-left">{s.label}</span>
        {badges[s.id] > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${on ? 'bg-accent text-white' : mobile ? 'bg-tint text-accent' : 'bg-white/15 text-white'}`}>{badges[s.id]}</span>}
      </button>
    )
  }

  return (
    <SharingContext.Provider value={sharing}>
    <div className="min-h-screen bg-page">
      {/* Desktop side menu */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-ink px-4 py-5 text-white lg:flex" aria-label="Admin menu">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-ink"><Smartphone size={19} strokeWidth={2} aria-hidden="true" /></span>
          <div><p className="text-lg font-extrabold leading-tight tracking-[-0.02em]">FixPoint</p><p className="text-xs font-semibold text-[#9AA1AF]">Admin</p></div>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Admin sections">{SECTIONS.map((s) => navItem(s, false))}</nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <Link to="/" className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-bold text-[#C9CCD6] hover:bg-white/10 hover:text-white"><ExternalLink size={18} aria-hidden="true" /> View website</Link>
          <button type="button" onClick={lock} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-bold text-[#C9CCD6] hover:bg-white/10 hover:text-white"><Lock size={18} aria-hidden="true" /> Lock admin</button>
        </div>
      </aside>

      {/* Phones / tablets: top bar + scrollable tabs */}
      <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[11px] bg-ink text-white"><Smartphone size={17} strokeWidth={2} aria-hidden="true" /></span>
            <span className="text-lg font-extrabold tracking-[-0.02em]">FixPoint <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-bold text-accent">Admin</span></span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setSearching(true)} aria-label="Search" className="grid size-10 place-items-center rounded-full text-body hover:bg-white"><Search size={18} /></button>
            <NotificationBell onViewAll={() => go('notifications')} />
            <Link to="/" aria-label="View website" className="grid size-10 place-items-center rounded-full text-body hover:bg-white"><ExternalLink size={18} /></Link>
            <button type="button" onClick={lock} aria-label="Lock admin" className="grid size-10 place-items-center rounded-full text-body hover:bg-white"><Lock size={18} /></button>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]" aria-label="Admin sections">{SECTIONS.map((s) => navItem(s, true))}</nav>
      </header>

      <main className="lg:pl-[260px]">
        {/* Slim top bar (desktop): notifications and the admin's initials */}
        <div className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-3 border-b border-line bg-page/90 px-8 backdrop-blur lg:flex">
          <button type="button" onClick={() => setSearching(true)} className="mr-auto inline-flex h-10 w-[320px] items-center gap-2 rounded-full border border-line bg-white px-4 text-sm text-muted hover:border-field"><Search size={16} aria-hidden="true" /> Search orders, customers… <kbd className="ml-auto rounded border border-line px-1.5 text-[11px]">Ctrl K</kbd></button>
          <NotificationBell onViewAll={() => go('notifications')} />
          <span className="grid size-10 place-items-center rounded-full bg-ink text-sm font-extrabold text-white" title="Admin">AD</span>
        </div>
        <div className={`mx-auto px-5 py-6 sm:px-8 sm:py-8 ${tab === 'schedule' ? 'max-w-[1500px]' : 'max-w-[1100px]'}`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2.5 text-[clamp(26px,3vw,34px)] font-extrabold leading-tight tracking-[-0.03em]">
                {tab === 'orders' && <Wrench size={24} className="hidden text-accent sm:block" aria-hidden="true" />}{section.label}
              </h1>
              <p className="mt-1 text-sm text-muted">{section.text}</p>
            </div>
            {/* Demo data is a development tool only: never shown on the live site */}
            {import.meta.env.DEV && ['overview', 'orders', 'schedule'].includes(tab) && (
              hasDemo
                ? <Button variant="secondary" onClick={clearDemoOrders}>Remove demo data</Button>
                : <Button variant="secondary" onClick={() => seedDemoOrders(30)}>Load demo data</Button>
            )}
          </div>
          {hasDemo && tab !== 'settings' && tab !== 'messages' && (
            <p className="mb-6 rounded-2xl bg-[#FFF4DB] px-4 py-3 text-sm text-[#7A5600]"><b>Demo data is showing.</b> These are made-up orders so you can preview the dashboard. Remove them before going live.</p>
          )}
          {orders.length === 0 && tab === 'overview' && (
            <p className="mb-6 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-body">No orders yet. New bookings and accessory orders will appear here.{import.meta.env.DEV && ' Use “Load demo data” to preview the dashboard.'}</p>
          )}

          {tab === 'overview' && <Overview orders={orders} onOpen={setOpenId} onSchedule={showDay} onCustomer={(id) => go('customers', { id })} />}
          {tab === 'schedule' && <Schedule orders={orders} date={day} view={view} onDate={(d) => setParams({ tab: 'schedule', view, day: d })} onView={(v) => setParams({ tab: 'schedule', view: v, day })} onOpen={setOpenId} />}
          {tab === 'orders' && <Orders orders={orders} onOpen={setOpenId} />}
          {tab === 'customers' && <Customers selectedId={params.get('id')} onSelect={(id) => setParams(id ? { tab: 'customers', id } : { tab: 'customers' })} onOpenOrder={setOpenId} />}
          {tab === 'messages' && <Messages />}
          {tab === 'settings' && <Settings />}
          {tab === 'notifications' && <NotificationsPage />}
          {tab === 'reports' && <Reports orders={orders.filter((o) => !o.demo || import.meta.env.DEV)} />}
        </div>
      </main>

      <Toaster />
      <NotificationWatcher />
      <GlobalSearch open={searching} onClose={() => setSearching(false)} onOrder={setOpenId} onCustomer={(id) => go('customers', { id })} onMessages={() => go('messages')} />
      <OrderDrawer order={orders.find((o) => o.id === openId) || null} onClose={() => setOpenId(null)} onViewDay={showDay} />
    </div>
    </SharingContext.Provider>
  )
}
