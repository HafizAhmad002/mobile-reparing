import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Wrench, ShieldCheck } from 'lucide-react'
import { Stagger, StaggerItem } from '../../Reveal'

const tiles = [
  { icon: MapPin, title: 'We come to you', text: 'Home, office or café across Manchester.' },
  { icon: Wrench, title: 'Fixed in front of you', text: 'Watch the repair. No phone left behind.' },
  { icon: ShieldCheck, title: 'Warranty on every job', text: 'Parts and work are covered.' },
]

// Replaces the photo grid: one dark card + three icon tiles (no photos)
export default function TechnicianBand() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-between rounded-[28px] bg-ink p-6 text-white sm:p-8 md:p-10 lg:min-h-[260px]">
          <h2 className="max-w-[460px] text-[clamp(26px,3.2vw,38px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            One technician. Real repairs. Right at your door.
          </h2>
          <Link to="/about" className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-sky hover:text-white">
            Meet your technician <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
        <Stagger className="grid gap-4">
          {tiles.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="flex items-center gap-4 rounded-[24px] border border-line bg-white p-4 transition sm:p-5 duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Icon size={22} strokeWidth={2} /></span>
                <div>
                  <p className="text-base font-extrabold tracking-[-0.02em]">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
