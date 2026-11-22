// Eyebrow + H2 + optional paragraph. align: "left" | "center"
export default function SectionHeading({ eyebrow, title, text, align = 'left', className = '' }) {
  const center = align === 'center'
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-[640px] ${className}`}>
      {eyebrow && (
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">{eyebrow}</p>
      )}
      <h2 className="text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.03em]">
        {title}
      </h2>
      {text && <p className="mt-4 text-base leading-relaxed text-muted sm:text-[17px]">{text}</p>}
    </div>
  )
}
