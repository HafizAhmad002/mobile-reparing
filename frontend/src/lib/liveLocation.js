// Technician live location while an order is "On the way". Mounted once in the admin panel.
// Sends a point at most every 15 seconds, or sooner after 50 m of movement.
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useStored } from './store'
import { SHARE_KEY, distanceKm, saveTechLocation, stopSharing } from './orders'

const EVERY_MS = 15000
const MOVE_KM = 0.05

export const useSharing = () => useStored(SHARE_KEY, null)

// Returns { status: 'off' | 'starting' | 'on' | 'denied' | 'error', message }
export function useLocationSharing() {
  const sharing = useSharing()
  const [state, setState] = useState({ status: 'off', message: '' })
  const last = useRef(null)

  useEffect(() => {
    if (!sharing?.orderId) { setState({ status: 'off', message: '' }); return }
    if (!('geolocation' in navigator)) { setState({ status: 'error', message: 'This device can’t share its location.' }); return }
    setState({ status: 'starting', message: '' })
    let lock = null
    // Keep the screen on while driving (when the browser supports it)
    if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then((l) => { lock = l }).catch(() => {})
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy || 0), heading: pos.coords.heading, speed: pos.coords.speed }
        const prev = last.current
        const due = !prev || Date.now() - prev.t >= EVERY_MS || distanceKm(prev, p) >= MOVE_KM
        if (due) { saveTechLocation(sharing.orderId, p); last.current = { ...p, t: Date.now() } }
        setState({ status: 'on', message: '' })
      },
      (err) => setState(err.code === 1
        ? { status: 'denied', message: 'Location access is blocked. Allow location for this site in your phone’s browser settings, then press “Share again”.' }
        : { status: 'error', message: 'Your location is not available right now.' }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    return () => { navigator.geolocation.clearWatch(id); lock?.release?.().catch(() => {}); last.current = null }
  }, [sharing?.orderId])

  return { ...state, orderId: sharing?.orderId || null, stop: stopSharing }
}

// The sharing state, provided once by the admin page and read by the order drawer
export const SharingContext = createContext({ status: 'off', message: '', orderId: null, stop: () => {} })
export const useSharingState = () => useContext(SharingContext)
