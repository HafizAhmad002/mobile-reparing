import { Link } from 'react-router-dom'
import { MessageCircle, Smartphone } from 'lucide-react'
import { SITE } from '../data/site'
import { FacebookIcon, InstagramIcon, TikTokIcon } from './ui/SocialIcons'

const COLUMNS = [
  {
    title: 'Repairs',
    links: [
      { label: 'All services', to: '/services' },
      { label: 'Price list', to: '/prices' },
      { label: 'Book a repair', to: '/book' },
      { label: 'Track repair', to: '/track' },
    ],
  },
  {
    title: 'More',
    links: [
      { label: 'Accessories', to: '/shop' },
      { label: 'Repair tips', to: '/blog' },
      { label: 'My account', to: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Service areas', to: '/areas' },
      { label: 'FAQ & warranty', to: '/faq' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

const SOCIALS = [
  { label: 'Facebook', href: '#', Icon: FacebookIcon },
  { label: 'Instagram', href: '#', Icon: InstagramIcon },
  { label: 'TikTok', href: '#', Icon: TikTokIcon },
  { label: 'WhatsApp', href: SITE.whatsapp, Icon: (p) => <MessageCircle size={18} strokeWidth={2} {...p} /> },
]

const linkCls = 'text-sm text-[#DCE4FF] transition-colors hover:text-white'

export default function Footer() {
  return (
    <footer className="mt-16 bg-accent text-white lg:mt-[110px]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap gap-10 px-6 pb-7 pt-[60px]">
        {/* Brand */}
        <div className="min-w-[220px] flex-[1.4]">
          <Link to="/" className="flex items-center gap-2.5" aria-label="FixPoint home">
            <span className="grid size-9 place-items-center rounded-[11px] bg-white text-accent">
              <Smartphone size={18} strokeWidth={2} />
            </span>
            <span className="text-xl font-extrabold tracking-[-0.02em]">FixPoint</span>
          </Link>
          <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-[#DCE4FF]">
            Doorstep phone repair with clear prices and a warranty on every job.
          </p>
          <p className="mt-4 text-sm text-[#DCE4FF]">Manchester, UK — we come to you</p>
          <p className="mt-1 text-sm text-[#DCE4FF]">[Opening hours]</p>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className="min-w-[140px] flex-1">
            <h3 className="mb-3.5 text-[15px] font-bold">{col.title}</h3>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={`${linkCls} inline-flex min-h-8 items-center`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Newsletter */}
        <div className="min-w-[300px] flex-[1.6]">
          <h3 className="mb-3.5 text-[15px] font-bold">Get repair tips &amp; offers</h3>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 rounded-full bg-white p-1.5"
          >
            <label htmlFor="footer-join" className="sr-only">Email or WhatsApp number</label>
            <input
              id="footer-join"
              type="text"
              placeholder="Email or WhatsApp number"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Join
            </button>
          </form>
          <div className="mt-4 flex gap-2.5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid size-11 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/15"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-[13px] text-[#DCE4FF]">
          <p>© FixPoint. All rights reserved.</p>
          <div className="flex gap-5">
            {['Terms', 'Privacy', 'Warranty policy'].map((t) => (
              <a key={t} href="#" className="inline-flex min-h-8 items-center hover:text-white">{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
