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
      <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
        {featured.map((a) => (
          <StaggerItem key={a.id}>
            <Link to="/shop" className="flex h-full flex-col rounded-[20px] border border-line bg-white p-3 pb-4 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF] sm:rounded-[24px] sm:p-4 sm:pb-6">
              <AccessoryImage item={a} className="aspect-square w-full rounded-[12px] sm:aspect-[4/5] sm:rounded-[16px]" />
              <h3 className="mt-3 text-[15px] font-extrabold leading-tight tracking-[-0.02em] sm:mt-4 sm:text-lg">{a.name}</h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted sm:text-sm">{a.text}</p>
              <p className="mt-3 text-sm font-bold sm:mt-4">£[price]</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
