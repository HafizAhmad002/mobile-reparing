import { allAreas, SERVICE_AREA } from '../data/areas'

// Checks an area name or postcode against the Manchester list.
// Returns { status: 'yes' | 'maybe' | 'none', area?: string }
export function checkArea(input) {
  const text = input.trim().toLowerCase()
  if (!text) return { status: 'none' }

  const exact = allAreas.find((a) => a.toLowerCase() === text)
  if (exact) return { status: 'yes', area: exact }

  const partial = allAreas.find((a) => a.toLowerCase().includes(text) || text.includes(a.toLowerCase()))
  if (partial) return { status: 'yes', area: partial }

  // Manchester postcodes start with M followed by a number, e.g. M20 4AB
  if (/^m\d{1,2}(\s?\d[a-z]{2})?$/i.test(text.replace(/\s+/g, ' '))) return { status: 'yes', area: input.trim().toUpperCase() }

  // Nearby postcodes (SK = Stockport, OL = Oldham, WA = Warrington/Altrincham, BL = Bolton, M = Manchester)
  if (/^(sk|ol|wa|bl)\d/i.test(text)) return { status: 'maybe' }

  return { status: 'none' }
}

// Distance in km between two { lat, lon } points
function distanceKm(a, b) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Is the booking address inside the area we cover?
//  - with a map pin: inside the SERVICE_AREA circle
//  - without a pin: from the postcode (Manchester "M" postcodes and listed areas are in)
// Returns 'in' | 'out' | 'unknown' (nothing to check yet)
// "M20 6AG" -> "M20"
export const districtOf = (postcode) => String(postcode || '').trim().toUpperCase().replace(/\s+/g, ' ').split(' ')[0].replace(/(\w+?)(\d\w{2})$/, (m, a, b) => (b.length === 3 && !String(postcode).includes(' ') ? a : m))
// The listed district for a postcode (with its call-out fee), or null
export const listedDistrict = (postcode) => (SERVICE_AREA.districts || []).find((d) => d.code === districtOf(postcode)) || null

export function serviceStatus({ point, postcode }) {
  if (listedDistrict(postcode)) return 'in' // districts you added in Settings are always covered
  if (point) return distanceKm(point, SERVICE_AREA) <= SERVICE_AREA.radiusKm ? 'in' : 'out'
  const pc = (postcode || '').trim()
  if (!pc) return 'unknown'
  const r = checkArea(pc)
  if (r.status === 'yes' || r.status === 'maybe') return 'in'
  // Only call it "out" once it looks like a real UK postcode (e.g. "LS1 4AP"), not while typing
  return /^[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}$/i.test(pc) ? 'out' : 'unknown'
}
