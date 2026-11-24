import { accessories } from '../../data/accessories'
import { setStock, useStock } from '../../lib/stock'
import { Card } from './shared'

// Settings > Accessory stock. Leave "In stock" empty to not track an item.
export default function StockCard() {
  const stock = useStock()
  const num = 'h-10 w-20 rounded-xl border border-field px-3 text-sm font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent'
  return (
    <Card title="Accessory stock" action={<span className="text-xs text-muted">At 0 an item is hidden on the website</span>}>
      <ul className="divide-y divide-line">
        {accessories.map((a) => {
          const row = stock[a.id] || {}
          const out = row.stock === 0
          const low = row.stock != null && row.stock > 0 && row.stock <= (row.low ?? 2)
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
              <p className="min-w-[180px] flex-1 text-sm font-semibold">{a.name}
                {out && <span className="ml-2 rounded-full bg-[#FDECEA] px-2 py-0.5 text-[10px] font-bold text-danger">OUT · HIDDEN</span>}
                {low && <span className="ml-2 rounded-full bg-[#FFF4DB] px-2 py-0.5 text-[10px] font-bold text-[#9A6A00]">LOW</span>}
              </p>
              <label className="flex items-center gap-2 text-xs text-muted">In stock
                <input type="number" min="0" inputMode="numeric" className={num} placeholder="—" value={row.stock ?? ''} onChange={(e) => setStock(a.id, { stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })} />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">Warn at
                <input type="number" min="0" inputMode="numeric" className={num} value={row.low ?? 2} onChange={(e) => setStock(a.id, { low: Math.max(0, Number(e.target.value)) })} />
              </label>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
