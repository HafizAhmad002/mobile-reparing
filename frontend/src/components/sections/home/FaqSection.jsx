import { MessageCircle } from 'lucide-react'
import Button from '../../ui/Button'
import Accordion from '../../ui/Accordion'
import { faqs } from '../../../data/content'
import { SITE } from '../../../data/site'

export default function FaqSection() {
  return (
    <section className="mx-auto grid max-w-[1200px] gap-10 px-6 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <h2 className="text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">Got a question?</h2>
        <p className="mt-4 max-w-[360px] text-base leading-relaxed text-muted">
          Can't find your answer? Message us on WhatsApp and we'll reply quickly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={SITE.whatsapp} variant="whatsapp">
            <MessageCircle size={18} strokeWidth={2} /> Chat on WhatsApp
          </Button>
          <Button to="/faq" variant="secondary">All questions</Button>
        </div>
      </div>
      <Accordion items={faqs.slice(0, 6)} idPrefix="home-faq" />
    </section>
  )
}
