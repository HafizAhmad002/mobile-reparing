import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BadgeCheck, Bell, BellRing, CalendarClock, CalendarX2, Inbox, Mail, PackageX, ShieldAlert, UserPlus } from 'lucide-react'
import Popover from '../ui/Popover'
import { toast } from '../ui/Toast'
import { getAdminPrefs, getNotifications, markAllNotificationsRead, markNotificationRead, notifyAdmin, useNotifications } from '../../lib/store'
import { timeAgo } from '../../lib/format'
import { useCustomers, updateMeta } from '../../lib/customers'
import { dayKey } from './shared'

// Icon + colour per notification type
export const TYPE_STYLE = {
  new_order: { icon: Inbox, cls: 'bg-tint text-accent', group: 'orders' },
  order_cancelled: { icon: CalendarX2, cls: 'bg-[#FDECEA] text-danger', group: 'orders' },
  order_rescheduled: { icon: CalendarClock, cls: 'bg-[#FFF4DB] text-[#9A6A00]', group: 'orders' },
  new_message: { icon: Mail, cls: 'bg-[#F1ECFB] text-[#5B34B5]', group: 'messages' },
  new_signup: { icon: UserPlus, cls: 'bg-success-tint text-success', group: 'customers' },
  follow_up_due: { icon: BellRing, cls: 'bg-[#E3F4F8] text-[#0E6178]', group: 'customers' },
  low_stock: { icon: PackageX, cls: 'bg-[#FFF4DB] text-[#9A6A00]', group: 'orders' },
  quote_approved: { icon: BadgeCheck, cls: 'bg-success-tint text-success', group: 'orders' },
  quote_declined: { icon: CalendarX2, cls: 'bg-[#FDECEA] text-danger', group: 'orders' },
  warranty_claim: { icon: ShieldAlert, cls: 'bg-[#FFF4DB] text-[#9A6A00]', group: 'orders' },
}
const styleOf = (t) => TYPE_STYLE[t] || TYPE_STYLE.new_order

function Item({ n, onGo }) {
  const { icon: Icon, cls } = styleOf(n.type)
  return (
    <li>
      <button type="button" onClick={() => onGo(n)} className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[#F6F7F9] ${n.read ? '' : 'bg-tint/40'}`}>
        <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${cls}`}><Icon size={16} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm ${n.read ? 'font-semibold text-body' : 'font-extrabold text-ink'}`}>{n.title}</span>
          <span className="block truncate text-xs text-muted">{n.body}</span>
          <span className="mt-0.5 block text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
        </span>
        {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="unread" />}
      </button>
    </li>
  )
}

// Plays a short "ping" (no sound file needed)
function ping() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.frequency.value = 880; g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.35)
  } catch { /* sound not available */ }
}

/*
  Watches for new admin notifications (mount ONCE, in the Admin page): checks every 20 s while the tab
  is visible (60 s when hidden) and on changes from other tabs, then shows a toast, and a browser
  notification when the tab is hidden (if allowed in Settings). Also turns due follow-ups into notifications.
*/
export function useAdminNotificationWatcher() {
  const navigate = useNavigate()
  const customers = useCustomers()
  const seen = useRef(null) // ids already announced
  function go(n) {
    markNotificationRead(n.id)
    if (n.link) navigate(n.link)
  }
  // Follow-ups due today become a notification once per customer per day
  useEffect(() => {
    const today = dayKey(new Date())
    customers.filter((c) => c.followUpDate && c.followUpDate <= today).forEach((c) => {
      const flag = `fu-${c.id}-${today}`
      if (localStorage.getItem(flag)) return
      localStorage.setItem(flag, '1')
      notifyAdmin('follow_up_due', 'Follow-up due', `${c.name}${c.followUpDate < today ? ' (overdue)' : ''}`, `/admin?tab=customers&id=${encodeURIComponent(c.id)}`)
      updateMeta(c.id, {})
    })
  }, [customers])

  // Announce new ones (toast / browser notification / sound)
  useEffect(() => {
    const check = () => {
      const list = getNotifications().filter((n) => n.to === 'admin')
      if (seen.current === null) { seen.current = new Set(list.map((n) => n.id)); return }
      const fresh = list.filter((n) => !seen.current.has(n.id) && !n.read)
      fresh.forEach((n) => seen.current.add(n.id))
      if (!fresh.length) return
      const prefs = getAdminPrefs()
      const n = fresh[0]
      toast(`${n.title} · ${n.body}`, { tone: 'info', action: n.link ? { label: 'View', onClick: () => go(n) } : undefined })
      if (prefs.sound) ping()
      if (document.visibilityState === 'hidden' && prefs.desktop && 'Notification' in window && Notification.permission === 'granted') {
        const bn = new Notification(n.title, { body: n.body, tag: n.id })
        bn.onclick = () => { window.focus(); go(n) }
      }
    }
    check()
    let timer
    const loop = () => { timer = setTimeout(() => { check(); loop() }, document.visibilityState === 'visible' ? 20000 : 60000) }
    loop()
    const onStore = () => check()
    window.addEventListener('fp-store', onStore)
    window.addEventListener('storage', onStore)
    return () => { clearTimeout(timer); window.removeEventListener('fp-store', onStore); window.removeEventListener('storage', onStore) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- runs once; go() only navigates

}

/*
  Bell with unread badge + dropdown panel. It also watches for new notifications:
  checks every 20 s while the tab is visible (60 s when hidden) and on changes from other tabs,
  then shows a toast, and a browser notification when the tab is hidden (if allowed in Settings).
*/
export default function NotificationBell({ onViewAll }) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const all = useNotifications()
  const mine = useMemo(() => all.filter((n) => n.to === 'admin'), [all])
  const unread = mine.filter((n) => !n.read).length
  const anchor = useRef(null)
  const [open, setOpen] = useState(false)

  function go(n) {
    markNotificationRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const today = dayKey(new Date())
  const groups = [
    ['Today', mine.filter((n) => dayKey(new Date(n.createdAt)) === today).slice(0, 12)],
    ['Earlier', mine.filter((n) => dayKey(new Date(n.createdAt)) !== today).slice(0, 8)],
  ].filter(([, l]) => l.length)

  return (
    <div ref={anchor}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        className={`relative grid size-10 place-items-center rounded-full border bg-white transition-colors ${open ? 'border-accent text-accent' : 'border-line text-ink hover:border-field'}`}>
        <Bell size={18} strokeWidth={2} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span key={unread} initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}
              className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <Popover anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={380} maxHeight={520} className="!p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[15px] font-extrabold">Notifications</p>
          {unread > 0 && <button type="button" onClick={() => markAllNotificationsRead('admin')} className="text-sm font-bold text-accent hover:underline">Mark all as read</button>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-width:thin]">
          {groups.length === 0 ? <p className="px-3 py-10 text-center text-sm text-muted">No notifications yet.</p> : groups.map(([label, list]) => (
            <div key={label}>
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
              <ul>{list.map((n) => <Item key={n.id} n={n} onGo={go} />)}</ul>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => { setOpen(false); onViewAll() }} className="shrink-0 border-t border-line py-3 text-sm font-bold text-accent hover:bg-[#F6F7F9]">View all</button>
      </Popover>
    </div>
  )
}

/* ------------------------------- full page ------------------------------ */
const TABS = [['all', 'All'], ['unread', 'Unread'], ['orders', 'Orders'], ['messages', 'Messages'], ['customers', 'Customers']]
const PAGE = 20

export function NotificationsPage() {
  const navigate = useNavigate()
  const all = useNotifications()
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const list = all.filter((n) => n.to === 'admin').filter((n) => (tab === 'all' ? true : tab === 'unread' ? !n.read : styleOf(n.type).group === tab))
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const shown = list.slice((page - 1) * PAGE, page * PAGE)
  const go = (n) => { markNotificationRead(n.id); if (n.link) navigate(n.link) }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter notifications">
          {TABS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => { setTab(k); setPage(1) }}
              className={`h-9 rounded-full border px-4 text-sm font-bold transition-colors ${tab === k ? 'border-ink bg-ink text-white' : 'border-line bg-white text-body hover:border-field'}`}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={() => markAllNotificationsRead('admin')} className="text-sm font-bold text-accent hover:underline">Mark all as read</button>
      </div>
      <div className="rounded-[24px] border border-line bg-white p-2">
        {shown.length === 0 ? <p className="px-4 py-12 text-center text-sm text-muted">Nothing here.</p> : <ul>{shown.map((n) => <Item key={n.id} n={n} onGo={go} />)}</ul>}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-10 rounded-full border border-line bg-white px-4 text-sm font-bold disabled:opacity-40">Previous</button>
          <span className="text-sm text-muted">Page {page} of {pages}</span>
          <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="h-10 rounded-full border border-line bg-white px-4 text-sm font-bold disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}

/* --------------------------- settings section --------------------------- */
export function NotificationSettings({ prefs, onChange }) {
  const supported = typeof window !== 'undefined' && 'Notification' in window
  const [perm, setPerm] = useState(supported ? Notification.permission : 'unsupported')
  const allow = async () => {
    if (!supported) return
    const p = await Notification.requestPermission() // only when the admin clicks
    setPerm(p)
    onChange({ desktop: p === 'granted' })
  }
  const Toggle = ({ k, label, text }) => (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-[#F6F7F9] p-4">
      <span className="text-sm"><b className="block text-ink">{label}</b><span className="text-xs text-muted">{text}</span></span>
      <input type="checkbox" role="switch" checked={Boolean(prefs[k])} onChange={(e) => onChange({ [k]: e.target.checked })} className="mt-1 size-5 shrink-0 accent-[#1e4fd8]" />
    </label>
  )
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#F6F7F9] p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm"><b className="block text-ink">Desktop notifications</b><span className="text-xs text-muted">{perm === 'granted' ? 'Allowed. You get a notification when this tab is in the background.' : perm === 'denied' ? 'Blocked in your browser settings. Allow notifications for this site there.' : perm === 'unsupported' ? 'This browser does not support notifications.' : 'Get a notification on your computer or phone when the tab is hidden.'}</span></span>
        {perm === 'default' && <button type="button" onClick={allow} className="h-10 shrink-0 rounded-full bg-ink px-4 text-sm font-bold text-white">Allow desktop notifications</button>}
        {perm === 'granted' && <input type="checkbox" role="switch" aria-label="Desktop notifications" checked={Boolean(prefs.desktop)} onChange={(e) => onChange({ desktop: e.target.checked })} className="size-5 accent-[#1e4fd8]" />}
      </div>
      <Toggle k="sound" label="Play a sound" text="A short ping when something new arrives." />
      <Toggle k="emailOrders" label="Email me for new orders" text="Needs the online server (backend) to send emails. Saved for when it is connected." />
    </div>
  )
}
