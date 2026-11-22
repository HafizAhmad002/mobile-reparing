import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import Reveal, { Stagger, StaggerItem } from '../components/Reveal'
import Pill from '../components/ui/Pill'
import Photo from '../components/ui/Photo'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { posts, postCategories } from '../data/posts'

export default function Blog() {
  useDocumentTitle('Repair Tips — FixPoint Manchester', 'Simple, honest tips on screens, batteries, water damage and keeping your phone healthy.')
  const [cat, setCat] = useState('All')
  const list = posts.filter((p) => cat === 'All' || p.category === cat)
  const [featured, ...rest] = cat === 'All' ? list : []

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-12 text-center md:pt-16">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Repair tips</p>
        <h1 className="mx-auto max-w-[760px] text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Keep your phone healthy</h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">Short, honest guides from the person who repairs phones every day.</p>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter articles">
        {postCategories.map((c) => <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>)}
      </div>

      {featured && (
        <Reveal className="mt-10">
          <Link to={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-[32px] border border-line bg-white transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF] md:grid-cols-[1.2fr_1fr]">
            <Photo src={featured.image} alt={featured.title} rounded="rounded-none" className="h-[240px] md:h-full md:min-h-[360px]" />
            <div className="flex flex-col justify-center p-7 md:p-10">
              <span className="w-fit rounded-full bg-tint px-3 py-1 text-xs font-bold text-accent">{featured.category}</span>
              <h2 className="mt-4 text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.1] tracking-[-0.03em]">{featured.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{featured.excerpt}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">Read article <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></p>
            </div>
          </Link>
        </Reveal>
      )}

      <Stagger key={cat} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(cat === 'All' ? rest : list).map((p) => (
          <StaggerItem key={p.slug}>
            <Link to={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-white transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
              <Photo src={p.image} alt={p.title} rounded="rounded-none" className="h-[200px]" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-tint px-3 py-1 font-bold text-accent">{p.category}</span>
                  <span className="inline-flex items-center gap-1 text-muted"><Clock size={13} strokeWidth={2} aria-hidden="true" /> {p.minutes} min read</span>
                </div>
                <h2 className="mt-3 text-lg font-extrabold leading-snug tracking-[-0.02em]">{p.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}
