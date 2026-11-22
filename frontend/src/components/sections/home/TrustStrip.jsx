import Icon from '../../ui/Icon'
import { trustItems } from '../../../data/content'

// Full-width white band with 4 trust points
export default function TrustStrip() {
  return (
    <section className="border-y border-line bg-white">
      <ul className="mx-auto flex max-w-[1200px] flex-wrap gap-x-8 gap-y-5 px-6 py-6">
        {trustItems.map((t) => (
          <li key={t.title} className="flex min-w-[220px] flex-1 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F6F7F9] text-ink">
              <Icon name={t.icon} size={20} />
            </span>
            <div>
              <p className="text-[15px] font-extrabold">{t.title}</p>
              <p className="text-[13px] text-muted">{t.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
