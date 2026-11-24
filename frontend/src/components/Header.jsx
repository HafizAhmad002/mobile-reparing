import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarPlus, ClipboardList, LayoutDashboard, Search, LogOut, Menu, MessageSquare, Smartphone, User, UserRound, X } from 'lucide-react'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import Popover from './ui/Popover'
import CustomerBell from './CustomerBell'
import { isAdminUnlocked, logOut, useSession } from '../lib/store'

export const NAV_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'Prices', to: '/prices' },
  { label: 'Accessories', to: '/shop' },
  { label: 'Areas', to: '/areas' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

// Logged in: profile picture with a small menu. Logged out: the "log in" icon.
function AccountButton() {
  const session = useSession()
  const anchor = useRef(null)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); anchor.current?.querySelector('button')?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!session) {
    return (
      <Link to="/login" aria-label="Log in or create an account" className="grid size-11 place-items-center rounded-full border border-field bg-white text-ink transition-colors hover:border-ink">
        <User size={18} strokeWidth={2} />
      </Link>
    )
  }
  const item = 'flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-ink transition-colors hover:bg-[#F6F7F9]'
  return (
    <div ref={anchor}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${session.name}`}
        className={`grid size-11 place-items-center rounded-full border-2 bg-white transition-colors ${open ? 'border-accent' : 'border-white hover:border-field'}`}>
        <Avatar name={session.name} photo={session.photo} size="sm" />
      </button>
      <Popover anchorRef={anchor} open={open} onClose={() => setOpen(false)} width={260} className="!p-2">
        <div role="menu" aria-label="Account">
          <div className="flex items-center gap-3 border-b border-line px-2 pb-3 pt-1">
            <Avatar name={session.name} photo={session.photo} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold">{session.name}</p>
              <p className="truncate text-xs text-muted">{session.email}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link role="menuitem" to="/account" className={item}><UserRound size={17} className="text-muted" aria-hidden="true" /> My account</Link>
            <Link role="menuitem" to="/my-bookings" className={item}><CalendarPlus size={17} className="text-muted" aria-hidden="true" /> My bookings</Link>
            <Link role="menuitem" to="/account#messages" className={item}><MessageSquare size={17} className="text-muted" aria-hidden="true" /> Messages</Link>
            <button role="menuitem" type="button" onClick={() => { setOpen(false); logOut() }} className={`${item} text-danger hover:bg-[#FDECEA]`}><LogOut size={17} aria-hidden="true" /> Log out</button>
          </div>
        </div>
      </Popover>
    </div>
  )
}

// Admin logged in (this tab): a button back to the admin panel
function AdminLink() {
  useLocation() // re-check on every page change
  if (!isAdminUnlocked()) return null
  return (
    <Link to="/admin" className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-3.5 text-sm font-bold text-white hover:bg-accent-dark">
      <LayoutDashboard size={16} aria-hidden="true" /><span className="hidden sm:inline">Admin panel</span>
    </Link>
  )
}

// Logged in: a clear "My bookings" button on the bar (bigger screens)
function MyBookingsLink() {
  const session = useSession()
  if (!session) return null
  return (
    <NavLink to="/my-bookings" className={({ isActive }) => `hidden h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-bold transition-colors md:inline-flex xl:px-4 ${isActive ? 'border-accent bg-tint text-accent' : 'border-field bg-white text-ink hover:border-ink'}`}>
      <ClipboardList size={16} aria-hidden="true" /><span className="sr-only xl:not-sr-only">My bookings</span>
    </NavLink>
  )
}

// Top of the phone menu: my bookings (logged in) or track a repair (everyone)
function MobileAccountLinks({ onGo }) {
  const session = useSession()
  const cls = 'mb-2 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-base font-bold text-ink'
  return (
    <div className="mb-3">
      {session && <Link to="/my-bookings" onClick={onGo} className={cls}><ClipboardList size={19} className="text-accent" aria-hidden="true" /> My bookings</Link>}
      <Link to="/track" onClick={onGo} className={cls}><Search size={19} className="text-accent" aria-hidden="true" /> Track a repair</Link>
    </div>
  )
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const { pathname } = useLocation()

  // Shadow once the page is scrolled more than 8px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on route change and on Escape
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
    <header
      className="sticky top-0 z-50 border-b border-line bg-page/92 backdrop-blur-[10px] transition-shadow duration-300"
      style={{ boxShadow: scrolled ? '0 8px 24px -16px rgba(14,15,19,0.25)' : '0 0 0 0 rgba(14,15,19,0)' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3.5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="FixPoint home">
          <span className="grid size-9 place-items-center rounded-[11px] bg-ink text-white">
            <Smartphone size={18} strokeWidth={2} />
          </span>
          <span className="text-xl font-extrabold tracking-[-0.02em]">FixPoint</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-0.5 min-[900px]:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center rounded-full px-2 text-[13px] font-semibold transition-colors xl:px-3 xl:text-sm ${
                  isActive
                    ? 'bg-white text-ink ring-1 ring-line'
                    : 'text-body hover:bg-white/70 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <AdminLink />
          <MyBookingsLink />
          <CustomerBell />
          <AccountButton />
          <div className="hidden sm:block">
            <Button to="/book" variant="dark">
              Book<span className="hidden xl:inline">&nbsp;a repair</span> <ArrowRight size={16} strokeWidth={2} />
            </Button>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-field bg-white text-ink min-[900px]:hidden"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile menu (outside <header>: backdrop-filter would trap fixed children) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-50 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(86vw,360px)] flex-col bg-page p-6 shadow-[0_16px_40px_-20px_rgba(14,15,19,0.3)]"
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="grid size-11 place-items-center rounded-full border border-field bg-white"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
              <nav aria-label="Mobile" className="flex flex-1 flex-col overflow-y-auto">
                <MobileAccountLinks onGo={() => setOpen(false)} />
                {NAV_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `border-b border-line py-4 text-lg font-semibold ${isActive ? 'text-accent' : 'text-ink'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <Button to="/book" variant="dark" size="lg" className="mt-4 w-full" onClick={() => setOpen(false)}>
                Book a repair <ArrowRight size={16} strokeWidth={2} />
              </Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
