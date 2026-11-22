import { Hammer, MapPin, ShieldCheck, User, Wallet } from 'lucide-react'
import Reveal, { Stagger, StaggerItem } from '../components/Reveal'
import Button from '../components/ui/Button'
import SectionHeading from '../components/ui/SectionHeading'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { SITE } from '../data/site'

const values = [
  { icon: Hammer, title: 'I do every repair myself', text: 'The person you book is the person who fixes your phone. No handing it to someone else.' },
  { icon: Wallet, title: 'Honest prices', text: 'I tell you the price before I start. If we agree, I fix it. If not, you pay nothing.' },
  { icon: ShieldCheck, title: 'Local parts, tested first', text: 'I use quality replacement parts sourced locally and test each one before it goes in. I’ll always tell you what I’m fitting.' },
  { icon: MapPin, title: 'I come to you', text: 'Home, office or café across Manchester. You watch the repair — your phone never leaves your sight.' },
]

export default function About() {
  useDocumentTitle('About — FixPoint Manchester', 'Meet the person who repairs your phone. One technician, honest prices, doorstep repair in Manchester.')
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="grid items-center gap-10 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pt-16">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">About</p>
          <h1 className="text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Hi, I’m [Your name]. I fix your phone myself.</h1>
          <p className="mt-5 max-w-[540px] text-[17px] leading-relaxed text-muted">
            FixPoint is not a big company with a big team. It’s me — a phone repair technician in Manchester, coming to your door with the tools and parts to fix your phone or tablet while you wait.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/book" variant="dark" size="lg">Book a repair</Button>
            <Button href={SITE.whatsapp} variant="whatsapp" size="lg">Message me</Button>
          </div>
        </div>
        {/* Portrait placeholder: the client adds their own photo later */}
        <div className="grid aspect-[4/5] max-h-[460px] w-full place-items-center rounded-[36px] bg-photo text-center text-muted" role="img" aria-label="Photo of the technician (to be added)">
          <div>
            <User size={56} strokeWidth={1.5} className="mx-auto" aria-hidden="true" />
            <p className="mt-3 text-sm">[Your photo]</p>
          </div>
        </div>
      </section>

      <Reveal className="mt-16 lg:mt-[100px]">
        <div className="rounded-[36px] border border-line bg-white p-8 md:p-12">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">My story</p>
          <p className="mt-4 max-w-[760px] text-[clamp(20px,2.4vw,28px)] font-bold leading-[1.35] tracking-[-0.02em]">
            [Write a few sentences here: how you started repairing phones, how many years you have been doing it, and why you decided to repair at people’s doors.]
          </p>
        </div>
      </Reveal>

      <section className="mt-16 lg:mt-[100px]">
        <SectionHeading eyebrow="How I work" title="One person, done properly" />
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="flex h-full gap-4 rounded-[24px] border border-line bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Icon size={22} strokeWidth={2} /></span>
                <div>
                  <h2 className="text-lg font-extrabold tracking-[-0.02em]">{title}</h2>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Reveal className="mt-16 lg:mt-[100px]">
        <div className="rounded-[36px] bg-ink px-6 py-14 text-center text-white md:py-16">
          <h2 className="text-[clamp(28px,3.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Phone broken? Let’s fix it.</h2>
          <p className="mx-auto mt-3 max-w-[460px] text-base text-[#C9CCD6]">Find your phone, tell me what’s wrong and I’ll come to you.</p>
          <Button to="/book" variant="white" size="lg" className="mt-7">Book a repair</Button>
        </div>
      </Reveal>
    </div>
  )
}
