import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { SITE } from '../data/site'

// Floating WhatsApp button: pops in after 1s, soft pulse ring every 3s.
export default function WhatsAppButton() {
  const reduce = useReducedMotion()
  return (
    <motion.a
      href={SITE.whatsapp}
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid size-[60px] place-items-center rounded-full bg-whatsapp text-white shadow-[0_14px_30px_-10px_rgba(18,140,74,0.7)]"
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
    >
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-whatsapp"
          animate={{ scale: [1, 1.5], opacity: [0.45, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.8 }}
        />
      )}
      <MessageCircle size={26} strokeWidth={2} className="relative" />
    </motion.a>
  )
}
