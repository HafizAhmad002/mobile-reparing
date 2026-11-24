import { Quote, Star } from 'lucide-react'
import { Stagger, StaggerItem } from '../../Reveal'
import { reviews } from '../../../data/content'

const Stars = ({ size = 14 }) => (
  <span className="flex gap-0.5" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} className="fill-star text-star" strokeWidth={2} />)}
  </span>
)

export default function Reviews() {
  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Reviews</p>
          <h2 className="max-w-[520px] text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            Happy customers are our best ads
          </h2>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-3">
          <span className="text-[28px] font-extrabold tracking-[-0.03em]">[4.X]</span>
          <div>
            <Stars size={16} />
            <p className="mt-0.5 text-xs text-muted">[N] Google reviews</p>
          </div>
        </div>
      </div>

      <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <StaggerItem key={r.id}>
            <figure className="flex h-full flex-col rounded-[24px] border border-line bg-white p-6 transition sm:p-7 duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
              <Quote size={28} strokeWidth={2} className="fill-accent text-accent" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-body">{r.text}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-tint text-sm font-extrabold text-accent">{r.initial}</span>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{r.name}</p>
                  <p className="text-xs text-muted">{r.detail}</p>
                </div>
                <Stars />
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
