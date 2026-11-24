import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/ui/SectionHeading'
import Button from '../components/ui/Button'
import Pill from '../components/ui/Pill'
import Photo from '../components/ui/Photo'
import DeviceFinder from '../components/DeviceFinder'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { androidRows, extraRows, freeFirst, iphoneRows, priceText, rowPhoto } from '../data/prices'

const TABS = [
  { id: 'iphone', label: 'iPhone', rows: iphoneRows, book: (r) => `/book?kind=phone&brand=Apple${r.issue ? `&issue=${r.issue}` : ''}` },
  { id: 'android', label: 'Samsung & Android', rows: androidRows, book: (r) => `/book?kind=phone${r.issue ? `&issue=${r.issue}` : ''}` },
  { id: 'extras', label: 'Extra services', rows: extraRows, book: (r) => `/book?issue=${r.id}` },
]

// Repairs that are not on the list: the price is set after the free check
const OTHER_ROW = { id: 'other', label: 'Other problem', other: true, photo: 'repair-mat' }
const OTHER_PRICE = 'Price confirmed after a free check'

export default function Prices() {
  useDocumentTitle('Repair Prices — FixPoint Manchester', 'Phone repair prices for iPhone, Samsung and Android in Manchester. Free diagnosis. Price agreed before we start.')
  const [tab, setTab] = useState('iphone')
  const current = TABS.find((t) => t.id === tab)
  // FREE services first, then the rest in the client's order; "Other problem" last
  const rows = [...freeFirst(current.rows.filter((r) => !r.hidden)), ...(tab !== 'extras' ? [OTHER_ROW] : [])]
  const bookUrl = (r) => (r.other ? '/book?issue=Other' : current.book(r))
  const price = (r) => (r.other ? OTHER_PRICE : priceText(r))

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="grid items-center gap-8 pt-10 md:grid-cols-2 md:gap-10 md:pt-16 [&>*]:min-w-0">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Prices</p>
          <h1 className="text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">
            Clear prices, agreed before we start
          </h1>
          <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-muted">
            Here is our price list. Your exact price depends on your phone — we confirm it with you before any work begins.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/book" variant="dark" size="lg">Book a repair</Button>
            <Button href="#price-list" variant="secondary" size="lg">See the price list</Button>
          </div>
        </div>
        <Photo src="/images/prices/hero.jpg" alt="Technician repairing an opened smartphone" rounded="rounded-[32px]" className="h-[260px] md:h-[400px]" />
      </section>

      <Reveal className="mt-16 lg:mt-[100px]">
        <div id="price-list" className="scroll-mt-24">
          <SectionHeading align="center" eyebrow="Price list" title="What each repair costs" text="Prices in pounds. Free services are listed first." />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Price list">
          {TABS.map((t) => <Pill key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Pill>)}
        </div>
        {/* Phones: stacked list (a 3-column table is too cramped under 640px) */}
        <ul className="mt-6 overflow-hidden rounded-[24px] border border-line bg-white sm:hidden" aria-label={`${current.label} price list`}>
          {rows.map((r) => (
            <li key={r.id} className="border-b border-line last:border-0">
              {/* Whole row is the "Book" link, so the name gets the full width */}
              <Link to={bookUrl(r)} aria-label={`Book: ${r.label}, ${price(r)}`} className="flex items-center gap-3 px-3 py-3 active:bg-page">
                <Photo src={rowPhoto(r)} alt="" rounded="rounded-[12px]" className="size-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">{r.label}</p>
                  <p className={`mt-0.5 text-sm font-extrabold ${r.free ? 'text-success' : ''}`}>{price(r)}</p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint text-accent" aria-hidden="true">
                  <ArrowRight size={16} strokeWidth={2} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="relative mt-6 hidden overflow-x-auto rounded-[28px] border border-line bg-white sm:block">
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
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <th scope="row" className="px-6 py-3 font-semibold">
                    <span className="flex items-center gap-4">
                      <Photo src={rowPhoto(r)} alt="" rounded="rounded-[12px]" className="size-14 shrink-0" />
                      {r.label}
                    </span>
                  </th>
                  <td className={`px-6 py-3 font-extrabold ${r.other ? '' : 'whitespace-nowrap'} ${r.free ? 'text-success' : ''}`}>{price(r)}</td>
                  <td className="px-6 py-3 text-right">
                    <Link to={bookUrl(r)} aria-label={`Book: ${r.label}`} className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent-dark">
                      Book <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Other models, tablets and repairs not listed here are quoted individually. Your price is always confirmed before we start.
        </p>
      </Reveal>

      <Reveal className="mt-16 lg:mt-[100px]">
        <SectionHeading align="center" eyebrow="Find your phone" title="Find your phone" text="Pick your brand or search. Tap your model to start your booking and see an estimate." />
        <div className="mt-8"><DeviceFinder /></div>
        <div className="mt-10 text-center"><Button to="/book" variant="dark" size="lg">Book a repair</Button></div>
      </Reveal>
    </div>
  )
}
