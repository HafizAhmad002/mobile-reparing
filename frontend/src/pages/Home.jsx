import Reveal from '../components/Reveal'
import useDocumentTitle from '../hooks/useDocumentTitle'
import Hero from '../components/sections/home/Hero'
import TrustStrip from '../components/sections/home/TrustStrip'
import HowItWorks from '../components/sections/home/HowItWorks'
import TechnicianBand from '../components/sections/home/TechnicianBand'
import ServicesGrid from '../components/sections/home/ServicesGrid'
import PricePreview from '../components/sections/home/PricePreview'
import ServiceAreas from '../components/sections/home/ServiceAreas'
import AccessoriesBand from '../components/sections/home/AccessoriesBand'
import Reviews from '../components/sections/home/Reviews'
import FaqSection from '../components/sections/home/FaqSection'
import CtaBand from '../components/sections/home/CtaBand'

// Space between sections: 64px on mobile, 100px on desktop
const gap = 'mt-16 lg:mt-[100px]'

export default function Home() {
  useDocumentTitle(
    'FixPoint — Doorstep Phone Repair in Manchester',
    'Doorstep phone and tablet repair in Manchester. Find your phone, book a visit, pay after the repair.',
  )
  return (
    <>
      <Reveal><Hero /></Reveal>
      <Reveal className="mt-6"><TrustStrip /></Reveal>
      <Reveal className={gap}><HowItWorks /></Reveal>
      <Reveal className={gap}><TechnicianBand /></Reveal>
      <Reveal className={gap}><ServicesGrid /></Reveal>
      <Reveal className={gap}><PricePreview /></Reveal>
      <Reveal className={gap}><ServiceAreas /></Reveal>
      <Reveal className={gap}><AccessoriesBand /></Reveal>
      <Reveal className={gap}><Reviews /></Reveal>
      <Reveal className={gap}><FaqSection /></Reveal>
      <Reveal className={gap}><CtaBand /></Reveal>
    </>
  )
}
