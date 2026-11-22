import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

const MotionLink = motion.create(Link)

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  dark: 'bg-ink text-white hover:bg-black',
  secondary: 'bg-white text-ink border border-field hover:border-ink',
  whatsapp: 'bg-whatsapp text-white hover:brightness-110',
  white: 'bg-white text-ink hover:bg-tint',
}
const SIZES = { md: 'h-12 px-6 text-[15px]', lg: 'h-[52px] px-7 text-base' }

// Renders <Link> with "to", <a> with "href", otherwise <button>.
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  className = '',
  children,
  ...rest
}) {
  const reduce = useReducedMotion()
  const cls = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors duration-200 ${VARIANTS[variant]} ${SIZES[size]} ${className}`
  const motionProps = reduce ? {} : { whileHover: { y: -2 }, whileTap: { scale: 0.98 }, transition: { duration: 0.2 } }

  if (to) {
    return <MotionLink to={to} className={cls} {...motionProps} {...rest}>{children}</MotionLink>
  }
  if (href) {
    return <motion.a href={href} className={cls} {...motionProps} {...rest}>{children}</motion.a>
  }
  return <motion.button type="button" className={cls} {...motionProps} {...rest}>{children}</motion.button>
}
