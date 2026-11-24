// Small pieces shared by the Admin screens.
import { ImageOff, Play } from 'lucide-react'
import { services } from '../../data/services'
import { extraRows } from '../../data/prices'
import { STATUSES } from '../../lib/store'
import { deviceLabel, formatDate } from '../../lib/format'

export const money = (n) => `£${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const OPEN = ['new', 'confirmed', 'on-the-way', 'repairing']
export const STATUS_OPTIONS = STATUSES.map((st) => ({ value: st.id, label: st.label }))
export const issueName = (id) =>
  services.find((s) => s.id === id)?.name || extraRows.find((r) => r.id === id)?.label || (id === 'unsure' ? 'Not sure (free check)' : id === 'Other' ? 'Other problem' : id)
export const longDate = (iso) => formatDate(iso, { year: true }) // "Thu 26 Nov 2026"

// One colour per status (dot + soft background), used for badges and schedule cards
export const STATUS_TONE = {
  new: { dot: 'bg-accent', soft: 'bg-tint text-accent', bar: 'border-l-accent' },
  confirmed: { dot: 'bg-[#6941C6]', soft: 'bg-[#F1ECFB] text-[#5B34B5]', bar: 'border-l-[#6941C6]' },
  'on-the-way': { dot: 'bg-[#D97706]', soft: 'bg-[#FFF4DB] text-[#9A6A00]', bar: 'border-l-[#D97706]' },
  repairing: { dot: 'bg-[#0E7490]', soft: 'bg-[#E3F4F8] text-[#0E6178]', bar: 'border-l-[#0E7490]' },
  completed: { dot: 'bg-success', soft: 'bg-success-tint text-success', bar: 'border-l-success' },
  cancelled: { dot: 'bg-[#9AA1AF]', soft: 'bg-[#F1F3F7] text-muted', bar: 'border-l-[#C3C7D1]' },
}

export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || STATUS_TONE.new
  const label = STATUSES.find((s) => s.id === status)?.label || status
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tone.soft}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />{label}
    </span>
  )
}

export const DemoTag = () => <span className="ml-1.5 rounded bg-[#FFF4DB] px-1.5 py-0.5 align-middle text-[10px] font-bold text-[#9A6A00]">DEMO</span>

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`min-w-0 rounded-[24px] border border-line bg-white p-5 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-5 flex items-center justify-between gap-3">
        {title && <h2 className="text-base font-extrabold tracking-[-0.02em]">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
)

export function Stat({ icon: Icon, label, value, hint, tone = 'bg-tint text-accent' }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-line bg-white p-4 sm:rounded-[24px] sm:p-5">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} strokeWidth={2} aria-hidden="true" /></span>
        <p className="text-[13px] font-semibold leading-tight text-muted">{label}</p>
      </div>
      <p className="mt-3 break-words text-[24px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[28px]">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

// Customer photos / videos. size: "sm" (list rows) or "lg" (order details)
export function Attachments({ list, size = 'sm' }) {
  if (!list?.length) return null
  const box = size === 'lg' ? 'size-24 rounded-xl' : 'size-10 rounded-lg'
  return (
    <span className="mt-2 flex flex-wrap gap-2">
      {list.map((a, i) => {
        const video = (a.type || '').startsWith('video/')
        if (a.preview) {
          return (
            <a key={i} href={a.preview} target="_blank" rel="noreferrer" title={`${a.name} (open larger)`} className={`block overflow-hidden border border-line ${box}`}>
              <img src={a.preview} alt={`Customer photo ${i + 1}`} className="size-full object-cover transition-transform hover:scale-105" />
            </a>
          )
        }
        return (
          <span key={i} title={a.name} className={`grid place-items-center border border-line bg-[#F6F7F9] text-muted ${box}`}>
            {video ? <Play size={size === 'lg' ? 22 : 14} aria-hidden="true" /> : <ImageOff size={size === 'lg' ? 22 : 14} aria-hidden="true" />}
            <span className="sr-only">{video ? 'Video' : 'File'}: {a.name}</span>
          </span>
        )
      })}
    </span>
  )
}

// "What" column text for an order
export const orderWhat = (o) =>
  o.type === 'accessory'
    ? `Accessories: ${(o.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ')}`
    : deviceLabel(o.device?.brand, o.device?.model)
export const orderProblem = (o) => (o.type === 'accessory' ? '' : (o.issues || []).map(issueName).join(', '))
