import { useEffect } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

// A real iPhone photo (background removed) shown as a 3D object:
//  - it turns toward the pointer (or your finger) in 3D space,
//  - it slowly sways by itself when nobody is touching it,
//  - a soft shadow sits behind it and a light reflection slides across the phone.
// Needs a transparent PNG (no white background).
export default function Phone3D({ src, alt, className = '' }) {
  const reduce = useReducedMotion()
  const px = useMotionValue(0) // pointer position inside the box, -0.5 .. 0.5
  const py = useMotionValue(0)
  const sway = useMotionValue(0) // idle swing in degrees

  // Idle sway (off when the user prefers reduced motion)
  useEffect(() => {
    if (reduce) return
    const controls = animate(sway, [-14, 14], { duration: 4.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' })
    return () => controls.stop()
  }, [reduce, sway])

  const springCfg = { stiffness: 110, damping: 16, mass: 0.6 }
  const pointerY = useSpring(useTransform(px, [-0.5, 0.5], [-24, 24]), springCfg)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), springCfg)
  const rotateY = useTransform([pointerY, sway], ([p, s]) => p + s)

  // Reflection and shadow follow the tilt
  const glareX = useTransform(px, [-0.5, 0.5], [10, 90])
  const glareY = useTransform(py, [-0.5, 0.5], [0, 80])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)`
  const shadowX = useTransform(px, [-0.5, 0.5], [34, -34])

  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { px.set(0); py.set(0) }

  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }

  return (
    <div
      className={`relative mx-auto touch-pan-y select-none ${className}`}
      style={{ perspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
    >
      <motion.div className="relative h-full" style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {/* soft shadow behind the phone */}
        <motion.img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 size-full object-contain"
          style={{ x: shadowX, y: 34, z: -70, filter: 'brightness(0) blur(22px)', opacity: 0.28 }}
        />
        {/* the phone */}
        <img src={src} alt={alt} draggable={false} className="relative size-full object-contain drop-shadow-[0_24px_30px_rgba(14,15,19,0.25)]" />
        {/* light reflection, clipped to the phone's outline */}
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ ...mask, background: glare, mixBlendMode: 'soft-light', z: 1 }} />
      </motion.div>
    </div>
  )
}
