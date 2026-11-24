import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'

const GAP = 8 // space between the field and the panel
const EDGE = 12 // keep this far from the screen edges

// Floating panel under (or above, if there is no room) a field. Rendered in <body>, so cards with
// overflow:hidden never cut it off. Closes on a click outside or on scroll-away; Escape is handled by the caller.
export default function Popover({ anchorRef, open, onClose, children, width = 'anchor', maxHeight = 360, className = '', ...rest }) {
  const reduce = useReducedMotion()
  const panel = useRef(null)
  const [pos, setPos] = useState(null)

  const place = useCallback(() => {
    const a = anchorRef.current
    if (!a) return
    const r = a.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = Math.min(width === 'anchor' ? r.width : Math.max(width, r.width), vw - EDGE * 2)
    const below = vh - r.bottom - GAP - EDGE
    const above = r.top - GAP - EDGE
    const need = Math.min(maxHeight, 300)
    const up = below < need && above > below
    setPos({
      left: Math.min(Math.max(EDGE, r.left), vw - w - EDGE),
      width: w,
      up,
      top: up ? undefined : r.bottom + GAP,
      bottom: up ? vh - r.top + GAP : undefined,
      maxHeight: Math.max(160, Math.min(maxHeight, up ? above : below)),
    })
  }, [anchorRef, width, maxHeight])

  useLayoutEffect(() => { if (open) place() }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (panel.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose()
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, place, onClose, anchorRef])

  return createPortal(
    // No exit animation: the panel is removed at once, so it can never stay behind and block clicks
    <>
      {open && pos && (
        <motion.div
          ref={panel}
          {...rest}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: pos.up ? 6 : -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight, transformOrigin: pos.up ? 'bottom' : 'top' }}
          className={`z-[200] flex flex-col overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:thin] rounded-[18px] border border-line bg-white p-1.5 text-ink shadow-[0_24px_60px_-18px_rgba(14,15,19,0.35)] ${className}`}
        >
          {children}
        </motion.div>
      )}
    </>,
    document.body,
  )
}
