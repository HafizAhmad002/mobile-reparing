import { MessageCircle } from 'lucide-react'
import Button from '../../ui/Button'
import Accordion from '../../ui/Accordion'
import { faqs } from '../../../data/content'
import { SITE } from '../../../data/site'

// "Got a question?" centered on top, then the full-width question cards
export default function FaqSection() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="text-center">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Frequently asked questions</p>
        <h2 className="text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">Got a question?</h2>
        <p className="mx-auto mt-4 max-w-[440px] text-base leading-relaxed text-muted">
          Can't find your answer? Message us on WhatsApp and we'll reply quickly.
        </p>
        <Button href={SITE.whatsapp} variant="whatsapp" className="mt-6">
          <MessageCircle size={18} strokeWidth={2} /> Chat on WhatsApp
        </Button>
      </div>

      <div className="mt-10 sm:mt-12">
        <Accordion items={faqs.slice(0, 6)} idPrefix="home-faq" />
      </div>
    </section>
  )
}
