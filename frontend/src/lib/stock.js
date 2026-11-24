// Accessory stock: { [accessoryId]: { stock: number | null, low: number } }. null = not tracked.
// At 0 the item is hidden on the website. Completed accessory orders take items out of stock.
import { useStored, notifyAdmin } from './store'
import { accessories } from '../data/accessories'

export const STOCK_KEY = 'fp_stock'
const read = () => { try { return JSON.parse(localStorage.getItem(STOCK_KEY) || '{}') } catch { return {} } }
const write = (v) => { localStorage.setItem(STOCK_KEY, JSON.stringify(v)); window.dispatchEvent(new Event('fp-store')) }

export const useStock = () => useStored(STOCK_KEY, {})
export const inStock = (stock, id) => stock[id]?.stock == null || stock[id].stock > 0
export function setStock(id, patch) { const s = read(); write({ ...s, [id]: { stock: null, low: 2, ...(s[id] || {}), ...patch } }) }

// Called when an accessory order is completed
export function takeFromStock(items) {
  const s = read()
  items.forEach((it) => {
    const row = s[it.id]
    if (row?.stock == null) return
    const left = Math.max(0, row.stock - (it.qty || 1))
    s[it.id] = { ...row, stock: left }
    if (left <= (row.low ?? 2)) {
      const name = accessories.find((a) => a.id === it.id)?.name || it.name
      notifyAdmin('low_stock', left === 0 ? 'Out of stock' : 'Low stock', `${name}: ${left} left${left === 0 ? ' (hidden on the website)' : ''}`, '/admin?tab=settings')
    }
  })
  write(s)
}
