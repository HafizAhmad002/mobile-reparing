import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SERVICE_AREA } from '../data/areas'

// Pin drawn with CSS (no image files): blue inside the service area, red outside it
const makePin = (color) => L.divIcon({
  className: '',
  html: `<span style="display:block;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 8px 18px -6px rgba(14,15,19,.5)"></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})
const PIN_IN = makePin('#1e4fd8')
const PIN_OUT = makePin('#b42318')

/*
  Map under the address. point = { lat, lon } or null (then it shows the whole service area).
  The shaded circle is the area we cover (SERVICE_AREA in data/areas.js).
  outOfArea: the pin is outside it -> red pin and a "Service out of area" label on the map.
  The pin can be dragged to the exact door: onMove({ lat, lon }).
  Loaded only on the "Your details" step (React.lazy), so other pages don't download it.
*/
// readOnly: the pin can't be dragged (admin order view). area: circle to draw instead of SERVICE_AREA
// (admin settings preview while changing the radius). label: name read out by screen readers.
// fitArea: always keep the whole circle (and the pin) in view (admin settings).
export default function LocationMap({ point, onMove, outOfArea = false, readOnly = false, area = null, fitArea = false, label = 'Map of your address', className = '' }) {
  const box = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const circle = useRef(null)
  const refit = useRef(null) // puts the view back where it should be (used after a resize)
  const moveRef = useRef(onMove)
  moveRef.current = onMove

  useEffect(() => {
    const m = L.map(box.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
      .setView([SERVICE_AREA.lat, SERVICE_AREA.lon], 10)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m)
    m.attributionControl.setPrefix(false) // keep only the required OpenStreetMap credit
    circle.current = L.circle([SERVICE_AREA.lat, SERVICE_AREA.lon], {
      radius: SERVICE_AREA.radiusKm * 1000, color: '#1e4fd8', weight: 2, opacity: 0.6, fillColor: '#1e4fd8', fillOpacity: 0.06, interactive: false,
    }).addTo(m)
    m.fitBounds(circle.current.getBounds(), { padding: [12, 12] })
    map.current = m
    // The box can change size after the map starts (slide-in panels, animations):
    // then re-measure and put the view back on the pin / circle
    const fix = () => {
      m.invalidateSize()
      if (refit.current) refit.current(false)
      else m.fitBounds(circle.current.getBounds(), { padding: [12, 12] })
    }
    const t = setTimeout(fix, 350)
    let last = ''
    const ro = new ResizeObserver(([e]) => {
      const size = `${Math.round(e.contentRect.width)}x${Math.round(e.contentRect.height)}`
      if (size !== last) { last = size; fix() }
    })
    ro.observe(box.current)
    return () => { clearTimeout(t); ro.disconnect(); m.remove(); map.current = null; marker.current = null; refit.current = null }
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (!point) {
      marker.current?.remove()
      marker.current = null
      refit.current = null
      if (circle.current) m.fitBounds(circle.current.getBounds(), { padding: [12, 12] })
      return
    }
    const ll = [point.lat, point.lon]
    if (!marker.current) {
      marker.current = L.marker(ll, { icon: outOfArea ? PIN_OUT : PIN_IN, draggable: !readOnly, keyboard: !readOnly, title: 'Address' }).addTo(m)
      marker.current.on('dragend', () => {
        const p = marker.current.getLatLng()
        moveRef.current?.({ lat: p.lat, lon: p.lng })
      })
    } else {
      marker.current.setLatLng(ll)
    }
    refit.current = (animate = true) => {
      if (outOfArea || fitArea) {
        // Show both the pin and our area, so it is clear how far outside it is
        m.fitBounds(circle.current.getBounds().extend(ll), { padding: [28, 28], animate })
      } else {
        m.setView(ll, Math.max(m.getZoom(), 16), { animate })
      }
    }
    refit.current()
  }, [point, outOfArea, fitArea, readOnly])

  // Settings preview: move / resize the circle
  const aLat = area?.lat
  const aLon = area?.lon
  const aKm = area?.radiusKm
  useEffect(() => {
    if (!circle.current || aKm == null) return
    circle.current.setLatLng([aLat, aLon])
    circle.current.setRadius(aKm * 1000)
    const b = circle.current.getBounds()
    if (fitArea && marker.current) b.extend(marker.current.getLatLng())
    if (!marker.current || fitArea) map.current?.fitBounds(b, { padding: [16, 16] })
  }, [aLat, aLon, aKm, fitArea])

  // Pin colour follows the in / out status
  useEffect(() => { marker.current?.setIcon(outOfArea ? PIN_OUT : PIN_IN) }, [outOfArea])

  return (
    <div className={`relative z-0 overflow-hidden rounded-[18px] border ${outOfArea ? 'border-danger' : 'border-line'} ${className}`}>
      <div ref={box} className="size-full bg-[#E9EDF2]" role="region" aria-label={label} />
      {outOfArea && (
        <p className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-full bg-danger px-4 py-2 text-[13px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(180,35,24,0.7)]">
          Service out of area
        </p>
      )}
    </div>
  )
}
