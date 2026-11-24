import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'

// FAQ accordion: full-width white cards, one item open at a time. items = [{ q, a }]
export default function Accordion({ items, defaultOpen = 0, idPrefix = 'acc' }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="space-y-3 sm:space-y-4">
      {items.map((f, i) => {
        const isOpen = open === i
        return (
          <div
            key={f.q}
            className={`rounded-[20px] border bg-white transition-colors duration-200 sm:rounded-[24px] ${isOpen ? 'border-[#C9D6FF]' : 'border-line'}`}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-bold tracking-[-0.01em] sm:px-8 sm:py-6 sm:text-xl"
              >
                {f.q}
                <span className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-200 sm:size-12 ${isOpen ? 'bg-ink text-white' : 'bg-[#F6F7F9] text-ink'}`}>
                  <Plus size={20} strokeWidth={2} aria-hidden="true" className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
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
                  {/* Padding (not negative margin) so the first line is never clipped by overflow-hidden */}
                  <p className="max-w-[1000px] px-5 pb-6 pr-16 text-[15px] leading-relaxed text-muted sm:px-8 sm:pb-7 sm:pr-24 sm:text-base">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
