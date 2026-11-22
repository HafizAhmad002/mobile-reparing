import { MessageCircle } from 'lucide-react'
import Reveal from '../components/Reveal'
import Accordion from '../components/ui/Accordion'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { faqs } from '../data/content'
import { SITE } from '../data/site'

export default function FAQ() {
  useDocumentTitle('FAQ & Warranty — FixPoint Manchester', 'Answers about repair time, payment, warranty, parts, data safety and the areas we cover.')
  return (
    <div className="mx-auto max-w-[900px] px-6">
      <section className="pt-12 md:pt-16">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">FAQ &amp; warranty</p>
        <h1 className="text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Questions, answered</h1>
        <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">Everything people ask before booking. Can’t find yours? Message us.</p>
      </section>
      <Reveal className="mt-10"><Accordion items={faqs} idPrefix="faq" /></Reveal>
      <Reveal className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-ink p-8 text-white">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.02em]">Still have a question?</h2>
            <p className="mt-1 text-[15px] text-[#C9CCD6]">We usually reply within [time].</p>
          </div>
          <Button href={SITE.whatsapp} variant="whatsapp"><MessageCircle size={18} strokeWidth={2} /> Chat on WhatsApp</Button>
        </div>
      </Reveal>
    </div>
  )
}
