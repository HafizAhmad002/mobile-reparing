// Address search, reverse lookup and current location.
// Uses Photon (free address search on OpenStreetMap data, https://photon.komoot.io): no API key needed.
// To switch to Google Places later, only this file has to change.

const PHOTON = 'https://photon.komoot.io'
export const MANCHESTER = { lat: 53.4808, lon: -2.2426 }
const UK_BOX = '-8.7,49.8,1.9,60.9' // only UK results

// Photon result -> { id, title, subtitle, address, postcode, lat, lon }
// withName: false drops a shop / building name (used for "my location": people want their street, not the cafe next door)
function toPlace(f, withName = true) {
  const p = f.properties || {}
  const street = [p.housenumber, p.street].filter(Boolean).join(' ')
  const name = withName && p.name && p.name !== p.street ? p.name : ''
  const area = p.district || p.locality || p.suburb || ''
  const town = p.city || p.town || p.village || p.county || ''
  const line1 = [name, street].filter(Boolean).join(', ') || area || town
  const parts = [line1, area !== line1 ? area : '', town !== line1 ? town : ''].filter(Boolean)
  const [lon, lat] = f.geometry?.coordinates || []
  return {
    id: `${p.osm_type}${p.osm_id}`,
    title: line1,
    subtitle: [area, town, p.postcode].filter((x) => x && x !== line1).join(', '),
    address: [...new Set(parts)].join(', '),
    postcode: p.postcode || '',
    lat,
    lon,
  }
}

// Suggestions while typing (nearest to Manchester first). Pass an AbortSignal to cancel old searches.
export async function searchAddress(text, signal) {
  const q = new URLSearchParams({ q: text, limit: '6', lang: 'en', lat: MANCHESTER.lat, lon: MANCHESTER.lon, bbox: UK_BOX })
  const res = await fetch(`${PHOTON}/api/?${q}`, { signal })
  if (!res.ok) throw new Error('search failed')
  const data = await res.json()
  const seen = new Set()
  return (data.features || [])
    .filter((f) => f.properties?.countrycode === 'GB')
    .map(toPlace)
    .filter((p) => p.title && !seen.has(p.address) && seen.add(p.address))
}

// The address at a point on the map. Photon returns the nearest things first (which can be a bare
// postcode, a park or a statue), so pick the nearest house number, else the nearest street.
export async function reverseGeocode(lat, lon) {
  const res = await fetch(`${PHOTON}/reverse?${new URLSearchParams({ lat, lon, lang: 'en', limit: '10', radius: '0.25' })}`)
  if (!res.ok) throw new Error('lookup failed')
  const all = (await res.json()).features || []
  if (!all.length) return null
  const kind = (f) => f.properties || {}
  const isPostcode = (f) => kind(f).osm_value === 'postcode'
  const best =
    all.find((f) => kind(f).housenumber && kind(f).street) ||
    all.find((f) => kind(f).type === 'street') ||
    all.find((f) => !isPostcode(f)) ||
    all[0]
  // A street result has the street in `name`; a house result has it in `street`
  const place = toPlace(best, kind(best).type === 'street')
  // Postcode: from the chosen place, else from the nearest result that has one
  const pc = place.postcode || all.map((f) => kind(f).postcode || (isPostcode(f) ? kind(f).name : '')).find(Boolean) || ''
  return { ...place, postcode: pc, lat, lon }
}

// The phone's / computer's location (asks the user for permission). Resolves { lat, lon }.
export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Your browser cannot share your location. Please type your address.'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(new Error(e.code === 1
        ? 'Location access is blocked. Allow it in your browser settings, or type your address.'
        : 'We could not find your location. Please type your address.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  })
}

// Centre of a UK postcode (for customers who type their address instead of picking one).
// Uses postcodes.io (free, no key). Resolves { lat, lon } or null.
export async function postcodePoint(postcode, signal) {
  const r = await lookupPostcode(postcode, signal)
  return r.status === 'ok' ? { lat: r.lat, lon: r.lon } : null
}

// Full lookup: { status: 'ok', postcode, district, lat, lon } | { status: 'notfound' } | { status: 'error' }
// 'error' means postcodes.io could not be reached: accept the booking and flag it for a manual check.
export async function lookupPostcode(postcode, signal) {
  const pc = String(postcode || '').replace(/\s+/g, '')
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`, { signal })
    if (res.status === 404) return { status: 'notfound' }
    if (!res.ok) return { status: 'error' }
    const r = (await res.json()).result
    return r ? { status: 'ok', postcode: r.postcode, district: r.admin_district || '', lat: r.latitude, lon: r.longitude } : { status: 'notfound' }
  } catch (e) {
    if (e.name === 'AbortError') throw e
    return { status: 'error' }
  }
}

export const mapsLink = ({ lat, lon }) => `https://www.google.com/maps?q=${lat},${lon}`
