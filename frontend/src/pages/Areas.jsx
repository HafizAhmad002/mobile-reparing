import { MapPin } from 'lucide-react'
import Reveal, { Stagger, StaggerItem } from '../components/Reveal'
import AreaChecker from '../components/AreaChecker'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { areaGroups, allAreas } from '../data/areas'
import { SITE } from '../data/site'

export default function Areas() {
  useDocumentTitle('Areas We Cover — FixPoint Manchester', 'Doorstep phone repair across Manchester, Salford, Stockport, Sale, Altrincham and nearby areas.')
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="grid items-center gap-10 pt-12 md:grid-cols-2 md:pt-16">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Service areas</p>
          <h1 className="text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">We repair across Manchester</h1>
          <p className="mt-5 max-w-[480px] text-[17px] leading-relaxed text-muted">
            We come to your home, office or café in {allAreas.length}+ areas of Greater Manchester. Type your area or postcode to check.
          </p>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-6 md:p-8">
          <h2 className="text-lg font-extrabold tracking-[-0.02em]">Do you cover my area?</h2>
          <AreaChecker id="areas-check" className="mt-4" />
          <p className="mt-4 text-sm text-muted">Manchester postcodes start with <b>M</b> (for example M20 or M14).</p>
        </div>
      </section>

      <section className="mt-16 lg:mt-[100px]" aria-label="Areas by zone">
        <div className="grid gap-4 md:grid-cols-2">
          {areaGroups.map((g) => (
            <Reveal key={g.zone}>
              <div className="h-full rounded-[28px] border border-line bg-white p-6 md:p-8">
                <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.02em]"><MapPin size={18} strokeWidth={2} className="text-accent" aria-hidden="true" /> {g.zone}</h2>
                <Stagger className="mt-5 flex flex-wrap gap-2">
                  {g.areas.map((a) => (
                    <StaggerItem key={a}><span className="inline-block rounded-full bg-[#F6F7F9] px-3.5 py-1.5 text-[13px] font-semibold text-body">{a}</span></StaggerItem>
                  ))}
                </Stagger>
              </div>
            </Reveal>
          ))}
          <Reveal>
            <div className="flex h-full flex-col justify-between rounded-[28px] bg-ink p-6 text-white md:p-8">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.02em]">Not on the list?</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#C9CCD6]">Message us your postcode. If it’s not too far, we can usually still come.</p>
              </div>
              <Button href={SITE.whatsapp} variant="white" className="mt-6 self-start">Message us</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
