import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeading from '../../ui/SectionHeading'
import AccessoryImage from '../../ui/AccessoryImage'
import Button from '../../ui/Button'
import { Stagger, StaggerItem } from '../../Reveal'
import { accessories } from '../../../data/accessories'

const featured = ['glass', 'case-clear', 'cable-usbc', 'charger-wall'].map((id) => accessories.find((a) => a.id === id))

// Replaces "Not just repairs": accessories only (locally sourced, no big brands)
export default function AccessoriesBand() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Accessories"
          title="Simple accessories, fair prices"
          text="Cases, glass, cables and chargers sourced locally. No big brands — just good-quality basics."
        />
        <Button to="/shop" variant="dark">Browse accessories <ArrowRight size={16} strokeWidth={2} /></Button>
      </div>
      <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((a) => (
          <StaggerItem key={a.id}>
            <Link to="/shop" className="flex h-full flex-col rounded-[24px] border border-line bg-white p-4 pb-6 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
              <AccessoryImage item={a} className="aspect-[4/5] w-full rounded-[16px]" />
              <h3 className="mt-4 text-lg font-extrabold leading-tight tracking-[-0.02em]">{a.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{a.text}</p>
              <p className="mt-4 text-sm font-bold">£[price]</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
