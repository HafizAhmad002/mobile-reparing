import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import Phone3D from '../../ui/Phone3D'
import { brands, phoneBrands, tabletBrands } from '../../../data/catalog'
import { issues, OTHER } from '../../../data/content'

// Small labelled select used inside the quick-quote bar
function QuoteSelect({ label, value, onChange, children, disabled }) {
  return (
    <label className="block min-w-[150px] flex-1 rounded-[20px] bg-[#F6F7F9] px-4 py-2.5 text-left">
      <span className="block text-xs font-bold text-muted">{label}</span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 min-h-8 w-full cursor-pointer bg-transparent text-[15px] font-bold text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  )
}


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
  const [note, setNote] = useState('') // own words when "Other" is chosen

  const onBrand = (e) => {
    const b = brands.find((x) => x.id === e.target.value)
    setBrandId(b.id)
    setModel(b.models[0].name) // model list follows the brand
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const q = new URLSearchParams({ kind: brand.kind, brand: brand.name, model, issue })
    if (issue === OTHER && note.trim()) q.set('note', note.trim())
    navigate(`/book?${q.toString()}`)
  }

  return (
    <section className="px-6 pt-[72px] text-center max-sm:pt-10">
      <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-semibold">
        <span className="size-2 rounded-full bg-success" aria-hidden="true" />
        Doorstep phone repair in Manchester
      </div>

      <h1 className="mx-auto mt-[22px] max-w-[900px] text-[clamp(40px,6vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em]">
        Broken phone? We fix it at your doorstep.
      </h1>
      <p className="mx-auto mt-5 max-w-[620px] text-[17px] leading-relaxed text-muted sm:text-[18px]">
        Pick your phone, see the exact price, book a time. A technician comes to you, repairs it in front of you, and you pay when it works.
      </p>

      {/* Quick-quote bar */}
      <form
        onSubmit={onSubmit}
        className="mx-auto mt-9 flex max-w-[860px] flex-wrap items-stretch gap-2.5 rounded-[28px] border border-line bg-white p-2.5 shadow-[0_16px_40px_-20px_rgba(14,15,19,0.3)]"
      >
        <QuoteSelect label="Brand" value={brandId} onChange={onBrand}>
          <optgroup label="Phones">
            {phoneBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </optgroup>
          <optgroup label="Tablets">
            {tabletBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </optgroup>
        </QuoteSelect>
        <QuoteSelect label="Model" value={model} onChange={(e) => setModel(e.target.value)}>
          {brand.models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
        </QuoteSelect>
        <QuoteSelect label="What's wrong?" value={issue} onChange={(e) => setIssue(e.target.value)}>
          {issues.map((i) => <option key={i} value={i}>{i}</option>)}
        </QuoteSelect>
        {issue === OTHER && (
          <label className="block w-full basis-full rounded-[20px] bg-[#F6F7F9] px-4 py-2.5 text-left">
            <span className="block text-xs font-bold text-muted">Describe your problem</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Phone restarts by itself when I open the camera"
              className="mt-0.5 min-h-8 w-full bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
            />
          </label>
        )}
        <motion.button
          type="submit"
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex h-[60px] min-w-[140px] flex-1 items-center justify-center gap-2 rounded-[20px] bg-accent px-7 text-base font-bold text-white transition-colors hover:bg-accent-dark max-sm:w-full sm:flex-none"
        >
          Get price <ArrowRight size={16} strokeWidth={2} />
        </motion.button>
      </form>
      <p className="mt-4 text-[13px] text-muted">No hidden charges • Free diagnosis if we can't fix it</p>

      {/* Real iPhone (3D: turns with the pointer, sways on its own) */}
      <div className="relative mx-auto mt-8 flex max-w-[980px] justify-center sm:mt-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Phone3D src="/images/hero/iphone.png" alt="iPhone, back and front" className="h-[300px] sm:h-[400px] lg:h-[430px]" />
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
