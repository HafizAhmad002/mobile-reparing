// Filter chip. Inactive: white + border. Active: ink background.
export default function Pill({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-colors duration-200 ${
        active
          ? 'bg-ink text-white'
          : 'border border-line bg-white text-body hover:border-field'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
