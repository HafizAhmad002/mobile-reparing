import { lazy, Suspense, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Loader2, MapPinOff, MousePointer2 } from 'lucide-react'
import AddressField from '../components/AddressField'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { serviceStatus } from '../lib/areaCheck'
import { reverseGeocode } from '../lib/geo'
import { SERVICE_AREA } from '../data/areas'
import { SITE } from '../data/site'

// The map (Leaflet) is downloaded only for this page and the booking page
const LocationMap = lazy(() => import('../components/LocationMap'))

/*
  "Do you cover my area?" — one map, same as the booking page:
  search an address or use your location, drag the pin, and see straight away if it is inside the
  blue circle (SERVICE_AREA in data/areas.js). "Book a repair" carries the address into the booking.
*/
export default function Areas() {
  useDocumentTitle('Areas We Cover — FixPoint Manchester', 'Check if we cover your address: doorstep phone repair across Manchester, Salford, Stockport, Sale and Altrincham.')
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [spot, setSpot] = useState(null)
  const [busy, setBusy] = useState(false)
  const job = useRef(0)

  const status = spot ? serviceStatus({ point: spot }) : 'unknown'
  const out = status === 'out'

  const pick = (p) => {
    setAddress(p.address || address)
    setPostcode(p.postcode || '')
    if (p.lat != null) setSpot({ lat: p.lat, lon: p.lon })
  }
  // Dragging the pin: the address follows the pin
  const movePin = async (p) => {
    setSpot(p)
    const n = ++job.current
    setBusy(true)
    const place = await reverseGeocode(p.lat, p.lon).catch(() => null)
    if (n !== job.current) return
    setBusy(false)
    if (place) { setAddress(place.address || address); setPostcode(place.postcode || '') }
  }
  const book = () => navigate('/book', { state: { place: { address, postcode, lat: spot.lat, lon: spot.lon } } })

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-10 text-center md:pt-16">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Service area</p>
        <h1 className="mx-auto max-w-[760px] text-[clamp(36px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Do we cover your address?</h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">
          We come to your home, office or café anywhere inside the blue circle: Manchester and about {SERVICE_AREA.radiusKm} km around it. Search your address to check.
        </p>
      </section>

      <section className="mt-10 grid gap-5 rounded-[28px] border border-line bg-white p-4 sm:p-6 lg:grid-cols-[380px_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:gap-y-5 lg:rounded-[36px] lg:p-8" aria-label="Check your address">
        {/* Phones: search, map, result. Desktop: search + result on the left, map on the right. */}
        <div className="min-w-0">
          <AddressField label="Your address or postcode" value={address} onChange={setAddress} onPick={pick} invalid={out} />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <MousePointer2 size={13} strokeWidth={2} aria-hidden="true" /> Or drag the pin on the map to your door.
          </p>
        </div>

        {/* The map */}
        <Suspense fallback={<div className="h-[340px] animate-pulse rounded-[18px] bg-[#E9EDF2] sm:h-[420px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[520px]" />}>
          <LocationMap point={spot} outOfArea={out} onMove={movePin} className="h-[340px] sm:h-[420px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[520px]" />
        </Suspense>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-end" aria-live="polite">
            {busy ? (
              <p className="flex items-center gap-2 rounded-[20px] bg-[#F6F7F9] p-5 text-sm font-semibold text-body">
                <Loader2 size={18} className="animate-spin text-accent" aria-hidden="true" /> Finding the address…
              </p>
            ) : status === 'in' ? (
              <div className="rounded-[20px] border border-[#BDE5CF] bg-success-tint p-5">
                <p className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em] text-success"><CheckCircle2 size={22} strokeWidth={2.2} aria-hidden="true" /> Yes, we cover you!</p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{address ? <>We can come to <b>{address}{postcode ? `, ${postcode}` : ''}</b>.</> : 'This address is inside our area.'} Book a time and we repair your phone at your door.</p>
                <Button onClick={book} className="mt-4 w-full">Book a repair here <ArrowRight size={16} strokeWidth={2} /></Button>
              </div>
            ) : out ? (
              <div className="rounded-[20px] border border-[#F4C7C3] bg-[#FDECEA] p-5">
                <p className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em] text-danger"><MapPinOff size={22} strokeWidth={2.2} aria-hidden="true" /> Service out of area</p>
                <p className="mt-1.5 text-sm leading-relaxed text-body">Sorry, {address ? <b>{address}</b> : 'this address'} is outside our service area. We only repair phones inside the blue circle. If you are close to it, message us and we will see if we can help.</p>
                <Button href={SITE.whatsapp} variant="whatsapp" className="mt-4 w-full">Message us</Button>
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-field p-5">
                <p className="text-[15px] font-extrabold tracking-[-0.02em]">How it works</p>
                <ol className="mt-2 space-y-1.5 text-sm text-muted">
                  <li>1. Type your street or postcode and pick it from the list, or use your current location.</li>
                  <li>2. The pin shows your address on the map.</li>
                  <li>3. Inside the blue circle? We come to you.</li>
                </ol>
              </div>
            )}
        </div>

      </section>
    </div>
  )
}
