import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import Popover from './ui/Popover'
import { markNotificationRead, useNotifications, useSession, getNotifications } from '../lib/store'
import { samePhone, timeAgo } from '../lib/format'

// Notifications for the logged-in customer (to their email or phone)
export const isMine = (n, session) => session && n.to !== 'admin' && (n.to === session.email || (session.phone && samePhone(n.to, session.phone)))

export default function CustomerBell() {
  const session = useSession()
  const navigate = useNavigate()
  const all = useNotifications()
  const anchor = useRef(null)
  const [open, setOpen] = useState(false)
  const mine = useMemo(() => all.filter((n) => isMine(n, session)), [all, session])
  const unread = mine.filter((n) => !n.read).length
  if (!session) return null

  const go = (n) => { markNotificationRead(n.id); setOpen(false); if (n.link) navigate(n.link) }
  const readAll = () => {
    const list = getNotifications().map((n) => (isMine(n, session) ? { ...n, read: true } : n))
    localStorage.setItem('fp_notifications', JSON.stringify(list)); window.dispatchEvent(new Event('fp-store'))
  }
  return (
    <div ref={anchor}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative grid size-11 place-items-center rounded-full border border-field bg-white text-ink transition-colors hover:border-ink">
        <Bell size={18} strokeWidth={2} />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <Popover anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={340} maxHeight={460} className="!p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[15px] font-extrabold">Updates</p>
          {unread > 0 && <button type="button" onClick={readAll} className="text-sm font-bold text-accent hover:underline">Mark all as read</button>}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {mine.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">No updates yet. We’ll let you know when your repair moves on.</li>}
          {mine.slice(0, 20).map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => go(n)} className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-[#F6F7F9] ${n.read ? '' : 'bg-tint/40'}`}>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read ? 'font-semibold text-body' : 'font-extrabold'}`}>{n.title}</span>
                  <span className="block text-xs text-muted">{n.body}</span>
                  <span className="text-[11px] text-muted">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="unread" />}
              </button>
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  )
}
