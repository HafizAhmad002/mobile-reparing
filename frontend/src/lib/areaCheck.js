import { allAreas } from '../data/areas'

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
