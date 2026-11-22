// Price list supplied by the client (GBP). Update the numbers here and every page follows.
// Row shapes:
//   { min, max }   a range, e.g. £35 – £45
//   { from }       "From £15"
//   { fixed }      one price, e.g. £10
//   { free: true } FREE
// `issue` links a row to a repair on the booking page. `models` / `pattern` / `brands` tell the
// estimate (lib/pricing.js) which phones the row applies to.

export const iphoneRows = [
  { id: 'ip-screen-8', label: 'Screen replacement — iPhone 8 / 8 Plus / X', min: 35, max: 45, issue: 'screen', models: ['iPhone 8', 'iPhone 8 Plus', 'iPhone X'] },
  { id: 'ip-screen-xr', label: 'Screen replacement — iPhone XR / XS / XS Max', min: 45, max: 55, issue: 'screen', models: ['iPhone XR', 'iPhone XS', 'iPhone XS Max'] },
  { id: 'ip-screen-11', label: 'Screen replacement — iPhone 11 / 11 Pro / 11 Pro Max', min: 50, max: 65, issue: 'screen', models: ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max'] },
  { id: 'ip-screen-12', label: 'Screen replacement — iPhone 12 / 12 Mini / 12 Pro / Pro Max', min: 60, max: 80, issue: 'screen', models: ['iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max'] },
  { id: 'ip-screen-13', label: 'Screen replacement — iPhone 13 / 13 Mini / 13 Pro / Pro Max', min: 75, max: 95, issue: 'screen', models: ['iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max'] },
  { id: 'ip-screen-14', label: 'Screen replacement — iPhone 14 / 14 Plus / 14 Pro / Pro Max', min: 90, max: 130, issue: 'screen', models: ['iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max'] },
  { id: 'ip-screen-15', label: 'Screen replacement — iPhone 15 series', min: 110, max: 160, issue: 'screen', models: ['iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'] },
  { id: 'ip-battery', label: 'Battery replacement — all models', min: 25, max: 40, issue: 'battery' },
  { id: 'ip-back', label: 'Back glass replacement', min: 40, max: 85, issue: 'back-glass' },
  { id: 'ip-port', label: 'Charging port / audio jack', min: 25, max: 45, issue: 'charging-port' },
  { id: 'ip-camera', label: 'Camera lens / rear camera', min: 30, max: 60, issue: 'camera' },
  { id: 'ip-water', label: 'Water damage diagnosis', free: true, issue: 'water-damage' },
  { id: 'ip-labour', label: 'Labour fee (no parts needed)', fixed: 15 },
]

export const androidRows = [
  { id: 'an-screen-a', label: 'Screen — Samsung A series (A1x–A5x)', min: 35, max: 60, issue: 'screen', pattern: '^Galaxy A\\d' },
  { id: 'an-screen-s', label: 'Screen — Samsung S20 / S21 / S22 / S23 series', min: 60, max: 140, issue: 'screen', pattern: '^Galaxy S2[0-3]' },
  { id: 'an-screen-note', label: 'Screen — Samsung Note series', min: 65, max: 110, issue: 'screen', pattern: '^Galaxy Note' },
  { id: 'an-screen-budget', label: 'Screen — budget Android phones', min: 25, max: 45, issue: 'screen', brands: ['Infinix', 'Tecno', 'Itel', 'Redmi', 'Realme', 'Nokia'] },
  { id: 'an-battery', label: 'Battery replacement', min: 22, max: 35, issue: 'battery' },
  { id: 'an-port', label: 'Charging port', min: 25, max: 40, issue: 'charging-port' },
  { id: 'an-back', label: 'Back cover / camera glass', min: 20, max: 45, issue: 'back-glass' },
  { id: 'an-diag', label: 'Diagnosis & software update', free: true, issue: 'software-data' },
]

export const extraRows = [
  { id: 'ex-health', label: 'Full phone health check', free: true },
  { id: 'ex-backup', label: 'Data backup / transfer', fixed: 10 },
  { id: 'ex-unlock', label: 'Phone unlocking', min: 15, max: 30 },
  { id: 'ex-protector', label: 'Screen protector installation', min: 5, max: 10 },
  { id: 'ex-minor', label: 'Minor repair / quick fix', from: 15 },
  { id: 'ex-collect', label: 'Collection & delivery (local)', free: true },
]

const p = (n) => `£${n}`

// "£35 – £45", "From £15", "£10" or "FREE"
export function priceText(row) {
  if (row.free) return 'FREE'
  if (row.from != null) return `From ${p(row.from)}`
  if (row.fixed != null) return p(row.fixed)
  if (row.min === row.max) return p(row.min)
  return `${p(row.min)} – ${p(row.max)}`
}
