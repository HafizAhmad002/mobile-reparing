// Works out an ESTIMATE from the client's price list (data/prices.js) for a device + problems.
// It is only an estimate: the final price is always confirmed with the customer before work starts.
import { androidRows, iphoneRows } from '../data/prices'

const lower = (s) => String(s || '').trim().toLowerCase()

// Find the price-list row that applies to one problem on one device (or null if we have no price)
function findRow({ kind, brand, model }, issue) {
  // Free checks apply to every device
  if (issue === 'unsure' || issue === 'water-damage') return { free: true }
  if (kind !== 'phone') return null // tablets are quoted individually

  const isApple = lower(brand) === 'apple'
  const rows = isApple ? iphoneRows : androidRows
  return (
    rows.find((r) => {
      if (r.issue !== issue) return false
      if (r.models) return r.models.map(lower).includes(lower(model))
      if (r.pattern) return new RegExp(r.pattern).test(model) && lower(brand) === 'samsung'
      if (r.brands) return r.brands.map(lower).includes(lower(brand))
      return true
    }) || null
  )
}

// Returns { min, max, known, unknown } or null when none of the problems has a listed price.
//   known   = [{ issue, row }]  problems that have a price
//   unknown = [issue]           problems that will be quoted
export function estimate({ kind, brand, model, issues }) {
  const known = []
  const unknown = []
  ;(issues || []).forEach((issue) => {
    const row = findRow({ kind, brand, model }, issue)
    if (row) known.push({ issue, row })
    else unknown.push(issue)
  })
  if (!known.length) return null
  const min = known.reduce((n, k) => n + (k.row.free ? 0 : k.row.min ?? k.row.fixed ?? k.row.from ?? 0), 0)
  const max = known.reduce((n, k) => n + (k.row.free ? 0 : k.row.max ?? k.row.fixed ?? k.row.from ?? 0), 0)
  return { min, max, known, unknown }
}

export function estimateText(est) {
  if (!est) return null
  if (est.max === 0) return 'FREE'
  return est.min === est.max ? `£${est.min}` : `£${est.min} – £${est.max}`
}
