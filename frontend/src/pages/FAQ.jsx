import { MessageCircle } from 'lucide-react'
import Reveal from '../components/Reveal'
import Accordion from '../components/ui/Accordion'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { faqs } from '../data/content'
import { SITE } from '../data/site'

// Same layout as the Home FAQ: centered intro + WhatsApp on top, full-width question cards below
export default function FAQ() {
  useDocumentTitle('FAQ & Warranty — FixPoint Manchester', 'Answers about repair time, payment, warranty, parts, data safety and the areas we cover.')
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-12 text-center md:pt-16">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">FAQ &amp; warranty</p>
        <h1 className="text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Got a question?</h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">
          Everything people ask before booking. Can’t find yours? Message us on WhatsApp — we usually reply within [time].
        </p>
        <Button href={SITE.whatsapp} variant="whatsapp" className="mt-6">
          <MessageCircle size={18} strokeWidth={2} /> Chat on WhatsApp
        </Button>
      </section>
      <Reveal className="mt-10 sm:mt-12"><Accordion items={faqs} idPrefix="faq" /></Reveal>
    </div>
  )
}
