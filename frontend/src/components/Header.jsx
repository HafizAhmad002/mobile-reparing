import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Menu, Smartphone, User, X } from 'lucide-react'
import Button from './ui/Button'

export const NAV_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'Prices', to: '/prices' },
  { label: 'Accessories', to: '/shop' },
  { label: 'Areas', to: '/areas' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

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
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold transition-colors ${
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
        <div className="flex items-center gap-2.5">
          <Link
            to="/login"
            aria-label="My account"
            className="grid size-11 place-items-center rounded-full border border-field bg-white text-ink transition-colors hover:border-ink"
          >
            <User size={18} strokeWidth={2} />
          </Link>
          <div className="hidden sm:block">
            <Button to="/book" variant="dark">
              Book a repair <ArrowRight size={16} strokeWidth={2} />
            </Button>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-field bg-white text-ink lg:hidden"
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
