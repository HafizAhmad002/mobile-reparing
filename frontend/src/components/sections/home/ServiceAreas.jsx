import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import AreaChecker from '../../AreaChecker'
import { featuredAreas } from '../../../data/areas'

// Stylised map pin
function Pin({ label, className, index, dark }) {
  const reduce = useReducedMotion()
  return (
    <div className={`absolute ${className}`}>
      <motion.div
        className="flex flex-col items-center"
        initial={reduce ? false : { opacity: 0, y: -12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
      >
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold shadow-[0_8px_20px_-10px_rgba(14,15,19,0.4)] ${dark ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
          {label}
        </span>
        <span className={`mt-1 size-2.5 rounded-full ${dark ? 'bg-ink' : 'bg-accent'}`} />
      </motion.div>
    </div>
  )
}

export default function ServiceAreas() {
  const reduce = useReducedMotion()

  return (
    <section className="mx-auto max-w-[1200px] px-6">
      <div className="grid items-center gap-8 rounded-[28px] border border-line bg-white p-5 sm:rounded-[36px] sm:p-6 md:grid-cols-2 md:p-10">
        <div>
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Service areas</p>
          <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">
            Home, office or café — we come to you
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Doorstep phone repair across Manchester, Salford, Stockport, Sale and nearby. Type your area or postcode to check.
          </p>

          <AreaChecker id="home-area" className="mt-6" />

          <div className="mt-5 flex flex-wrap gap-2">
            {featuredAreas.map((a) => (
              <span key={a} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-semibold text-body">{a}</span>
            ))}
            <Link to="/areas" className="rounded-full border border-line px-3.5 py-1.5 text-[13px] font-semibold text-accent hover:border-accent">
              + all areas
            </Link>
          </div>
        </div>

        {/* Stylised map */}
        <div
          className="relative h-[300px] overflow-hidden sm:h-[380px] rounded-[28px] bg-[#EEF1F6]"
          style={{
            backgroundImage:
              'linear-gradient(#E1E5EC 1px, transparent 1px), linear-gradient(90deg, #E1E5EC 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
          role="img"
          aria-label="Map showing Manchester and the areas we cover"
        >
          <div className="absolute left-[-5%] top-[48%] h-4 w-[110%] -rotate-[14deg] bg-white" />
          <div className="absolute left-[46%] top-[-5%] h-[110%] w-4 rotate-[12deg] bg-white" />
          <motion.div
            className="absolute left-1/2 top-1/2 size-[160px] -translate-x-1/2 sm:size-[200px] -translate-y-1/2 rounded-full border-2 border-dashed border-accent bg-accent/10"
            animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Pin label="Salford Quays" index={0} className="left-[10%] top-[20%]" />
          <Pin label="Fallowfield" index={1} className="right-[10%] top-[26%]" />
          <Pin label="Chorlton" index={2} className="bottom-[14%] left-[18%]" />
          <Pin label="Didsbury" index={3} className="bottom-[10%] right-[14%]" />
          <Pin label="Manchester" index={4} dark className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%]" />
        </div>
      </div>
    </section>
  )
}
