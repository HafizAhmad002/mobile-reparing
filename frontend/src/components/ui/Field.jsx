import { useId } from 'react'

// Label + input / select / textarea. as: "input" (default) | "select" | "textarea"
export default function Field({ label, as = 'input', className = '', children, ...rest }) {
  const id = useId()
  const Tag = as
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-body">
        {label}
      </label>
      <Tag
        id={id}
        className="min-h-12 w-full rounded-[14px] border border-field bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent"
        {...rest}
      >
        {children}
      </Tag>
    </div>
  )
}
