// Round profile picture. Without a photo it shows the first letters of the name.
const SIZES = { sm: 'size-9 text-[13px]', md: 'size-11 text-[15px]', lg: 'size-20 text-2xl', xl: 'size-24 text-3xl sm:size-28' }

export const initials = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

export default function Avatar({ name, photo, size = 'md', className = '' }) {
  return photo ? (
    <img src={photo} alt="" className={`shrink-0 rounded-full object-cover ${SIZES[size]} ${className}`} />
  ) : (
    <span className={`grid shrink-0 place-items-center rounded-full bg-accent font-extrabold tracking-[-0.02em] text-white ${SIZES[size]} ${className}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
