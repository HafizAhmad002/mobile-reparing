import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, PenLine } from 'lucide-react'
import SectionHeading from '../../ui/SectionHeading'
import Icon from '../../ui/Icon'
import { ProblemBox } from '../../MediaUpload'
import { Stagger, StaggerItem } from '../../Reveal'
import { services } from '../../../data/services'
import { OTHER } from '../../../data/content'

// "Other problem" card: the customer describes the problem (and can add photos / a video),
// then goes to booking with all of it already filled in
function OtherCard() {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [files, setFiles] = useState([])
  const ready = note.trim().length > 0 || files.length > 0
  const go = (e) => {
    e.preventDefault()
    if (!ready) return
    const q = new URLSearchParams({ issue: OTHER })
    if (note.trim()) q.set('note', note.trim())
    navigate(`/book?${q.toString()}`, { state: { files } }) // files can't go in the URL
  }
  return (
    // Full width card: heading row, description box, then the button row
    <form onSubmit={go} className="rounded-[24px] border-2 border-dashed border-field bg-white p-5 transition-colors duration-200 focus-within:border-accent hover:border-accent sm:p-6 lg:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><PenLine size={22} strokeWidth={2} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold tracking-[-0.02em] sm:text-xl">Other problem</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">Not in the list? Tell us what’s wrong and add a photo or video if you can.</p>
        </div>
      </div>
      <ProblemBox
        id="home-other"
        className="mt-5"
        label="Describe your problem"
        note={note}
        onNote={setNote}
        files={files}
        onFiles={setFiles}
        placeholder="e.g. The phone turns off when I make a call"
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-semibold text-body">
          {['Free diagnosis', 'Price agreed before we start'].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check size={16} strokeWidth={2.5} className="text-success" aria-hidden="true" />{t}</li>
          ))}
        </ul>
        {/* Grey until there is a description, a photo or a video */}
        <button type="submit" disabled={!ready} title={ready ? undefined : 'Describe the problem or add a photo or video first'}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-[15px] font-bold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-[#D5D8E0] sm:w-auto">
          Continue <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
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
      <Stagger className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] sm:gap-4">
        {services.map((s) => (
          <StaggerItem key={s.id}>
            <Link
              to={`/book?issue=${s.id}`}
              className="flex h-full items-start gap-4 rounded-[20px] border border-line bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF] sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-[24px] sm:p-6"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-tint text-accent sm:size-12">
                <Icon name={s.icon} />
              </span>
              <div className="min-w-0 flex-1 sm:flex sm:flex-col">
                <h3 className="text-base font-extrabold tracking-[-0.02em] sm:mt-5 sm:text-lg">{s.name}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted sm:mt-1.5 sm:text-sm">{s.short}</p>
                <div className="mt-2 flex items-center justify-between text-sm font-bold sm:mt-5">
                  <span>{s.priceLabel === 'From' ? `From ${s.price}` : 'Free check'}</span>
                  <ArrowRight size={16} strokeWidth={2} className="text-accent" aria-hidden="true" />
                </div>
              </div>
            </Link>
          </StaggerItem>
        ))}
        <StaggerItem className="col-span-full"><OtherCard /></StaggerItem>
      </Stagger>
    </section>
  )
}
