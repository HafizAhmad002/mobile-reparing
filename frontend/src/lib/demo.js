// Demo orders so the admin dashboard can be previewed. They are flagged `demo: true`
// and can be removed with one click. NOT real customer data or real prices.
import { brands } from '../data/catalog'
import { services } from '../data/services'
import { accessories } from '../data/accessories'
import { allAreas } from '../data/areas'
import { ORDERS_KEY } from './store'

// Small seeded random generator so the demo looks the same each time
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function seedDemoOrders(days = 30) {
  const rand = rng(42)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const popular = brands.filter((b) => ['apple', 'samsung', 'xiaomi', 'redmi', 'oppo', 'ipad'].includes(b.id))
  const names = ['Sam', 'Aisha', 'Tom', 'Priya', 'Omar', 'Lucy', 'Jack', 'Fatima', 'Ben', 'Hannah', 'Ali', 'Chloe']
  const orders = []
  const now = new Date()

  for (let d = 0; d < days; d++) {
    const perDay = 1 + Math.floor(rand() * 5) // 1-5 orders a day
    for (let i = 0; i < perDay; i++) {
      const when = new Date(now)
      when.setDate(now.getDate() - d)
      when.setHours(8 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0)
      if (when > now) continue

      const isAccessory = rand() < 0.22
      const age = d // days ago
      const status = age > 3 ? (rand() < 0.1 ? 'cancelled' : 'completed') : pick(['new', 'confirmed', 'on-the-way', 'repairing', 'completed'])
      const base = {
        id: `FP-D${String(orders.length + 1).padStart(5, '0')}`,
        demo: true,
        createdAt: when.toISOString(),
        status,
        customer: {
          name: `${pick(names)} (demo)`,
          phone: `07000 ${String(100000 + Math.floor(rand() * 899999))}`,
          email: '',
          address: 'Demo address',
          postcode: `M${1 + Math.floor(rand() * 40)} ${Math.floor(rand() * 9)}AA`,
          area: pick(allAreas),
        },
      }
      if (isAccessory) {
        const items = [pick(accessories)].map((a) => ({ id: a.id, name: a.name, qty: 1 + Math.floor(rand() * 2), price: 5 + Math.floor(rand() * 20) }))
        const total = items.reduce((n, it) => n + it.price * it.qty, 0)
        orders.push({ ...base, type: 'accessory', items, price: status === 'cancelled' ? null : total })
      } else {
        const brand = pick(popular)
        const model = pick(brand.models)
        const issue = pick(services)
        orders.push({
          ...base,
          type: 'repair',
          device: { kind: brand.kind, brand: brand.name, model: model.name },
          issues: [issue.id],
          issueNote: '',
          slot: { date: when.toISOString().slice(0, 10), time: pick(['Morning', 'Afternoon', 'Evening']) },
          price: status === 'cancelled' || status === 'new' ? null : 20 + Math.floor(rand() * 8) * 10,
        })
      }
    }
  }
  const existing = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]').filter((o) => !o.demo)
  localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders, ...existing].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  window.dispatchEvent(new Event('fp-store'))
}
