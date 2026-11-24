import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

// Dialog: a centred card on larger screens, a sheet from the bottom on phones.
// Closes with Escape, the X button or a click on the dark background. Page scroll is locked while open.
export default function Modal({ open, onClose, title, text, children, width = 640 }) {
  const reduce = useReducedMotion()
  const uid = useId()
  const panel = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current()
      // Keep Tab inside the dialog
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')
        const list = [...items].filter((el) => !el.disabled && el.offsetParent !== null)
        if (!list.length) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => panel.current?.querySelector('textarea, input')?.focus(), 60)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      before?.focus?.()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: width }}
            className="relative max-h-[92vh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-white p-5 shadow-[0_30px_80px_-20px_rgba(14,15,19,0.45)] sm:rounded-[28px] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id={`${uid}-title`} className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
                {text && <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{text}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-[#F1F3F7] hover:text-ink">
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
