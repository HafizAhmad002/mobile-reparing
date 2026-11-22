import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Cpu, ShieldCheck, Wallet } from 'lucide-react'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'
import Pill from '../components/ui/Pill'
import DeviceFinder from '../components/DeviceFinder'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { androidRows, extraRows, iphoneRows, priceText } from '../data/prices'

const notes = [
  { icon: ClipboardList, title: 'Tell us the problem', text: 'Find your phone, then choose the repair or describe your own problem.' },
  { icon: Wallet, title: 'We agree the price', text: 'We confirm your exact price before any work starts. No surprises.' },
  { icon: Cpu, title: 'Quality local parts', text: 'We fit quality replacement parts sourced locally — not original parts — and test them first.' },
  { icon: ShieldCheck, title: 'Warranty included', text: 'Every repair has a [X]-day warranty on the part and the work.' },
]

const TABS = [
  { id: 'iphone', label: 'iPhone', rows: iphoneRows, book: (r) => `/book?kind=phone&brand=Apple${r.issue ? `&issue=${r.issue}` : ''}` },
  { id: 'android', label: 'Samsung & Android', rows: androidRows, book: (r) => `/book?kind=phone${r.issue ? `&issue=${r.issue}` : ''}` },
  { id: 'extras', label: 'Extra services', rows: extraRows, book: () => '/book' },
]

export default function Prices() {
  useDocumentTitle('Repair Prices — FixPoint Manchester', 'Phone repair prices for iPhone, Samsung and Android in Manchester. Free diagnosis. Price agreed before we start.')
  const [tab, setTab] = useState('iphone')
  const current = TABS.find((t) => t.id === tab)

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-12 text-center md:pt-16">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Prices</p>
        <h1 className="mx-auto max-w-[760px] text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
          Clear prices, agreed before we start
        </h1>
        <p className="mx-auto mt-5 max-w-[600px] text-[17px] leading-relaxed text-muted">
          Here is our price list. Your exact price depends on your phone — we confirm it with you before any work begins.
        </p>
      </section>

      <Reveal className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {notes.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[24px] border border-line bg-white p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-tint text-accent"><Icon size={20} strokeWidth={2} /></span>
              <h2 className="mt-4 text-base font-extrabold tracking-[-0.02em]">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-16 lg:mt-[100px]">
        <SectionHeading align="center" eyebrow="Price list" title="What each repair costs" text="Prices in pounds. Diagnosis is free." />
        <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Price list">
          {TABS.map((t) => <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pill>)}
        </div>
        <div className="mt-6 overflow-x-auto rounded-[28px] border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-[15px]">
            <caption className="sr-only">{current.label} price list</caption>
            <thead>
              <tr className="border-b border-line text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
                <th scope="col" className="px-6 py-4">Service</th>
                <th scope="col" className="px-6 py-4">Price</th>
                <th scope="col" className="px-6 py-4"><span className="sr-only">Book</span></th>
              </tr>
            </thead>
            <tbody>
              {current.rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <th scope="row" className="px-6 py-4 font-semibold">{r.label}</th>
                  <td className={`whitespace-nowrap px-6 py-4 font-extrabold ${r.free ? 'text-success' : ''}`}>{priceText(r)}</td>
                  <td className="px-6 py-4 text-right"><Link to={current.book(r)} className="font-bold text-accent hover:underline">Book</Link></td>
                </tr>
              ))}
              {tab !== 'extras' && (
                <tr>
                  <th scope="row" className="px-6 py-4 font-semibold">Other problem</th>
                  <td className="px-6 py-4 font-extrabold">Quoted after free diagnosis</td>
                  <td className="px-6 py-4 text-right"><Link to="/book?issue=Other" className="font-bold text-accent hover:underline">Book</Link></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Other models, tablets and repairs not listed here are quoted individually. Your price is always confirmed before we start.
        </p>
      </Reveal>

      <Reveal className="mt-16 lg:mt-[100px]">
        <SectionHeading align="center" eyebrow="Find your phone" title="Find your phone" text="Pick your brand or search. Tap your model to start your booking and see an estimate." />
        <div className="mt-8"><DeviceFinder initial={24} /></div>
        <div className="mt-10 text-center"><Button to="/book" variant="dark" size="lg">Book a repair</Button></div>
      </Reveal>
    </div>
  )
}
