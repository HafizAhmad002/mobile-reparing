import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, PenLine } from 'lucide-react'
import SectionHeading from '../../ui/SectionHeading'
import Icon from '../../ui/Icon'
import { Stagger, StaggerItem } from '../../Reveal'
import { services } from '../../../data/services'
import { OTHER } from '../../../data/content'

// "Other problem" card: the customer types their own problem and goes straight to booking
function OtherCard() {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const go = (e) => {
    e.preventDefault()
    const q = new URLSearchParams({ issue: OTHER })
    if (note.trim()) q.set('note', note.trim())
    navigate(`/book?${q.toString()}`)
  }
  return (
    <form onSubmit={go} className="flex h-full flex-col rounded-[24px] border-2 border-dashed border-field bg-white p-6 transition duration-200 hover:border-accent">
      <span className="grid size-12 place-items-center rounded-2xl bg-tint text-accent"><PenLine size={22} strokeWidth={2} aria-hidden="true" /></span>
      <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">Other problem</h3>
      <label htmlFor="home-other" className="mt-1.5 text-sm leading-relaxed text-muted">Not in the list? Tell us what’s wrong.</label>
      <input
        id="home-other"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Describe your problem"
        className="mt-3 min-h-11 w-full rounded-[14px] border border-field bg-white px-3.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent"
      />
      <button type="submit" className="mt-3 inline-flex min-h-11 items-center justify-between rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-black">
        Continue <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  )
}

export default function ServicesGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <SectionHeading
        align="center"
        eyebrow="Services"
        title="What can we fix?"
        text="Clear starting prices for every repair. The final price depends on your model and is agreed before we start."
      />
      <Stagger className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {services.map((s) => (
          <StaggerItem key={s.id}>
            <Link
              to={`/book?issue=${s.id}`}
              className="flex h-full flex-col rounded-[24px] border border-line bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-tint text-accent">
                <Icon name={s.icon} />
              </span>
              <h3 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">{s.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{s.short}</p>
              <div className="mt-5 flex items-center justify-between text-sm font-bold">
                <span>{s.priceLabel === 'From' ? `From ${s.price}` : 'Free check'}</span>
                <ArrowRight size={16} strokeWidth={2} className="text-accent" aria-hidden="true" />
              </div>
            </Link>
          </StaggerItem>
        ))}
        <StaggerItem className="lg:col-span-2"><OtherCard /></StaggerItem>
      </Stagger>
    </section>
  )
}
