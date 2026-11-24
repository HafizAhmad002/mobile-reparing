import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const numbered = (n, bg) => L.divIcon({ className: '', html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:${bg};color:#fff;font:800 13px 'Plus Jakarta Sans',sans-serif;border:3px solid #fff;box-shadow:0 6px 14px -6px rgba(14,15,19,.6)">${n}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] })

// Today's visits as numbered pins in time order, joined by a line from the start location
export default function RouteMap({ start, stops, className = '' }) {
  const box = useRef(null)
  useEffect(() => {
    const m = L.map(box.current, { scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m)
    m.attributionControl.setPrefix(false)
    const pts = [[start.lat, start.lon], ...stops.map((s) => [s.lat, s.lon])]
    L.marker(pts[0], { icon: numbered('S', '#0e0f13'), title: 'Start' }).addTo(m)
    stops.forEach((s, i) => L.marker([s.lat, s.lon], { icon: numbered(i + 1, '#1e4fd8'), title: s.title }).addTo(m))
    L.polyline(pts, { color: '#1e4fd8', weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(m)
    m.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 14 })
    const ro = new ResizeObserver(() => m.invalidateSize()); ro.observe(box.current)
    return () => { ro.disconnect(); m.remove() }
  }, [start, stops])
  return <div ref={box} className={`relative z-0 overflow-hidden rounded-[18px] border border-line bg-[#E9EDF2] ${className}`} role="region" aria-label="Map of today’s route" />
}
