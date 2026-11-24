import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

// Small messages in the bottom-right corner. Call toast('Saved') from anywhere;
// <Toaster /> (mounted once) shows them. tone: 'success' | 'error' | 'info'. action: { label, onClick }
export function toast(message, { tone = 'success', action, duration = 5000 } = {}) {
  window.dispatchEvent(new CustomEvent('fp-toast', { detail: { id: `${Date.now()}-${Math.random()}`, message, tone, action, duration } }))
}

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-success' },
  error: { icon: AlertTriangle, cls: 'text-danger' },
  info: { icon: Info, cls: 'text-accent' },
}

export default function Toaster() {
  const reduce = useReducedMotion()
  const [items, setItems] = useState([])
  useEffect(() => {
    const add = (e) => {
      const t = e.detail
      setItems((l) => [...l.slice(-3), t])
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== t.id)), t.duration)
    }
    window.addEventListener('fp-toast', add)
    return () => window.removeEventListener('fp-toast', add)
  }, [])
  const close = (id) => setItems((l) => l.filter((x) => x.id !== id))
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[300] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const { icon: Icon, cls } = TONES[t.tone] || TONES.info
          return (
            <motion.div key={t.id} layout
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: reduce ? 0 : 30 }}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_18px_40px_-16px_rgba(14,15,19,0.4)] sm:w-[360px]">
              <Icon size={19} className={`mt-0.5 shrink-0 ${cls}`} aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm font-semibold text-ink">{t.message}</p>
              {t.action && <button type="button" onClick={() => { t.action.onClick(); close(t.id) }} className="shrink-0 text-sm font-bold text-accent hover:underline">{t.action.label}</button>}
              <button type="button" onClick={() => close(t.id)} aria-label="Close" className="-mr-1 grid size-6 shrink-0 place-items-center rounded-full text-muted hover:bg-[#F1F3F7]"><X size={14} /></button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
