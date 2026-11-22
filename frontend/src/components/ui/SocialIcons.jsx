// lucide-react v1 has no brand icons, so these are small inline stroke icons (24x24).
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const FacebookIcon = (p) => (
  <svg {...base} {...p}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
)
export const InstagramIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </svg>
)
export const TikTokIcon = (p) => (
  <svg {...base} {...p}><path d="M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5" /></svg>
)
