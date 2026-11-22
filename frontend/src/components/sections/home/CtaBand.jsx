import Button from '../../ui/Button'
import { SITE } from '../../../data/site'

export default function CtaBand() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="rounded-[36px] bg-ink px-6 py-16 text-center text-white md:py-20">
        <h2 className="text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">Get your phone fixed today</h2>
        <p className="mx-auto mt-4 max-w-[480px] text-base text-[#C9CCD6]">
          Find your phone, tell us what’s wrong and book a visit to your door.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/book" variant="white" size="lg">Book a repair</Button>
          <Button
            href={SITE.whatsapp}
            variant="secondary"
            size="lg"
            className="!border-white/40 !bg-transparent !text-white hover:!border-white"
          >
            WhatsApp us
          </Button>
        </div>
      </div>
    </section>
  )
}
