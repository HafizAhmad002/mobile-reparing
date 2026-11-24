import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import Phone3D from '../../ui/Phone3D'
import Select from '../../ui/Select'
import { ProblemBox } from '../../MediaUpload'
import PostcodeCheck from '../../PostcodeCheck'
import { brands, phoneBrands, tabletBrands } from '../../../data/catalog'
import { issues, OTHER } from '../../../data/content'

// "Other" is not needed here: the description box below is for any problem
const ISSUE_OPTIONS = issues.filter((i) => i !== OTHER).map((i) => ({ value: i, label: i }))

// Each dropdown in the quick-quote bar: full width on phones, side by side from 640px
const QUOTE = 'w-full sm:w-auto sm:min-w-[150px] sm:flex-1'
const BRAND_OPTIONS = [
  ...phoneBrands.map((b) => ({ value: b.id, label: b.name, group: 'Phones' })),
  ...tabletBrands.map((b) => ({ value: b.id, label: b.name, group: 'Tablets' })),
]

// Floating chip over the phones (bobs 6px up and down)
function FloatChip({ className, icon, title, text, delay = 0, reduce }) {
  return (
    <motion.div
      className={`absolute z-10 hidden items-center sm:flex gap-2.5 rounded-2xl border border-line bg-white p-2.5 pr-4 text-left shadow-[0_16px_40px_-20px_rgba(14,15,19,0.3)] ${className}`}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {icon}
      <div>
        <p className="text-[13px] font-extrabold leading-tight">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
    </motion.div>
  )
}

export default function Hero() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [brandId, setBrandId] = useState(brands[0].id)
  const brand = brands.find((b) => b.id === brandId)
  const [model, setModel] = useState(brand.models[0].name)
  const [issue, setIssue] = useState(issues[0])
  const [note, setNote] = useState('') // own words (optional, for any problem)
  const [files, setFiles] = useState([]) // photos / video (optional)

  const onBrand = (id) => {
    const b = brands.find((x) => x.id === id)
    setBrandId(b.id)
    setModel(b.models[0].name) // model list follows the brand
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const q = new URLSearchParams({ kind: brand.kind, brand: brand.name, model, issue })
    if (note.trim()) q.set('note', note.trim())
    // The booking opens with the description and photos already filled in (files can't go in the URL)
    navigate(`/book?${q.toString()}`, { state: { files } })
  }

  return (
    <section className="px-6 pt-10 text-center sm:pt-[72px]">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold">
        <span className="size-2 rounded-full bg-success" aria-hidden="true" />
        Doorstep phone repair in Manchester
      </div>

      <h1 className="mx-auto mt-[22px] max-w-[900px] text-[clamp(34px,8vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
        Broken phone? We fix it at your doorstep.
      </h1>
      <p className="mx-auto mt-5 max-w-[620px] text-[17px] leading-relaxed text-muted sm:text-[18px]">
        Pick your phone, see the exact price, book a time. A technician comes to you, repairs it in front of you, and you pay when it works.
      </p>

      {/* Quick-quote bar */}
      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 flex max-w-[860px] flex-wrap items-stretch gap-2 rounded-[24px] sm:mt-9 sm:gap-2.5 sm:rounded-[28px] border border-line bg-white p-2.5 shadow-[0_16px_40px_-20px_rgba(14,15,19,0.3)]"
      >
        <Select variant="quote" className={QUOTE} label="Brand" value={brandId} onChange={onBrand} options={BRAND_OPTIONS} />
        <Select variant="quote" className={QUOTE} label="Model" value={model} onChange={setModel} options={brand.models.map((m) => ({ value: m.name, label: m.name }))} />
        <Select variant="quote" className={QUOTE} label="What's wrong?" value={issue} onChange={setIssue} options={ISSUE_OPTIONS} />
        <motion.button
          type="submit"
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="order-last inline-flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-accent px-7 sm:order-none text-base font-bold text-white transition-colors hover:bg-accent-dark sm:h-[60px] sm:w-auto sm:min-w-[140px] sm:flex-none"
        >
          Get price <ArrowRight size={16} strokeWidth={2} />
        </motion.button>
        {/* Same box as on the booking page: optional, and carried over to the booking */}
        <ProblemBox
          id="hero-more"
          className="basis-full px-1.5 pb-1.5 pt-1 text-left"
          label="Describe your problem"
          hint="Tell us what is happening. A photo or short video helps us bring the right parts."
          note={note}
          onNote={setNote}
          files={files}
          onFiles={setFiles}
          placeholder="e.g. The screen flickers since I dropped it last week"
        />
      </form>
      <p className="mt-4 text-[13px] text-muted">No hidden charges • Free diagnosis if we can't fix it</p>
      <PostcodeCheck className="mt-5" />

      {/* Real iPhone (3D: turns with the pointer, sways on its own) */}
      <div className="relative mx-auto mt-8 flex max-w-[980px] justify-center sm:mt-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Phone3D src="/images/hero/iphone.png" alt="iPhone, back and front" className="h-[260px] sm:h-[400px] lg:h-[430px]" />
        </motion.div>

        <FloatChip
          reduce={reduce}
          className="left-[4%] top-[30%] lg:left-[14%]"
          icon={<span className="grid size-9 place-items-center rounded-xl bg-success-tint text-success"><ShieldCheck size={18} strokeWidth={2} /></span>}
          title="Warranty included"
          text="on every repair"
        />
        <FloatChip
          reduce={reduce}
          delay={1.5}
          className="right-[4%] top-[52%] lg:right-[14%]"
          icon={<span className="grid size-9 place-items-center rounded-xl bg-tint text-accent"><Truck size={18} strokeWidth={2} /></span>}
          title="We come to you"
          text="home, office or shop"
        />
      </div>
    </section>
  )
}
