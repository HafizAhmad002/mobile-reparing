import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'

// FAQ accordion: one item open at a time. items = [{ q, a }]
export default function Accordion({ items, defaultOpen = 0, idPrefix = 'acc' }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="space-y-3">
      {items.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.q} className="rounded-[20px] border border-line bg-white">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-6 py-4 text-left text-base font-bold"
              >
                {f.q}
                <span className={`grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-200 ${isOpen ? 'bg-ink text-white' : 'bg-[#F6F7F9] text-ink'}`}>
                  <Plus size={16} strokeWidth={2} className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${idPrefix}-${i}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
