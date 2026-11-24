import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinHtml = (bg, inner) => `<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 8px 18px -6px rgba(14,15,19,.55);color:#fff">${inner}</span>`
const HOME = L.divIcon({ className: '', html: pinHtml('#1e4fd8', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3z"/></svg>'), iconSize: [34, 34], iconAnchor: [17, 17] })
const VAN = L.divIcon({ className: '', html: pinHtml('#0e0f13', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg>'), iconSize: [34, 34], iconAnchor: [17, 17] })

/*
  Map with the customer's home and the technician. The technician pin glides to each new position
  and a dashed line joins the two. home / tech: { lat, lon } (tech may be null).
*/
export default function TrackMap({ home, tech, className = '', label = 'Map of the technician and your address' }) {
  const box = useRef(null)
  const map = useRef(null)
  const homeM = useRef(null)
  const techM = useRef(null)
  const line = useRef(null)
  const anim = useRef(null)

  useEffect(() => {
    const m = L.map(box.current, { scrollWheelZoom: false, attributionControl: true }).setView([home.lat, home.lon], 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' }).addTo(m)
    m.attributionControl.setPrefix(false)
    homeM.current = L.marker([home.lat, home.lon], { icon: HOME, title: 'Customer' }).addTo(m)
    map.current = m
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(box.current)
    return () => { ro.disconnect(); cancelAnimationFrame(anim.current); m.remove(); map.current = null; techM.current = null; line.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- the home pin is updated below

  useEffect(() => { homeM.current?.setLatLng([home.lat, home.lon]) }, [home.lat, home.lon])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (!tech) { techM.current?.remove(); techM.current = null; line.current?.remove(); line.current = null; m.setView([home.lat, home.lon], 14); return }
    const to = L.latLng(tech.lat, tech.lon)
    if (!techM.current) {
      techM.current = L.marker(to, { icon: VAN, title: 'Technician' }).addTo(m)
      line.current = L.polyline([to, [home.lat, home.lon]], { color: '#1e4fd8', weight: 3, dashArray: '6 8', opacity: 0.8 }).addTo(m)
      m.fitBounds(L.latLngBounds([to, [home.lat, home.lon]]), { padding: [40, 40], maxZoom: 16 })
      return
    }
    // Glide from the last position to the new one
    const from = techM.current.getLatLng()
    const start = performance.now()
    cancelAnimationFrame(anim.current)
    const step = (now) => {
      const k = Math.min(1, (now - start) / 1200)
      const p = L.latLng(from.lat + (to.lat - from.lat) * k, from.lng + (to.lng - from.lng) * k)
      techM.current?.setLatLng(p)
      line.current?.setLatLngs([p, [home.lat, home.lon]])
      if (k < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
    if (!m.getBounds().pad(-0.1).contains(to)) m.fitBounds(L.latLngBounds([to, [home.lat, home.lon]]), { padding: [40, 40], maxZoom: 16 })
  }, [tech?.lat, tech?.lon, home.lat, home.lon]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className={`relative z-0 overflow-hidden rounded-[18px] border border-line bg-[#E9EDF2] ${className}`} role="region" aria-label={label} />
}
