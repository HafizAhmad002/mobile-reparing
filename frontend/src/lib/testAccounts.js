// TEST ACCOUNTS: for showing the site to the client. Remove before going live.
// There is no server yet, so these are created in each browser the first time the site opens.
//   Customer: hafizmahmad@gmail.com / Ahmad7890   (comes with 3 sample bookings)
//   Admin:    alibhai@gmail.com     / Ali7890      (/admin)
// Only SHA-256 hashes of the passwords are kept here.

export const ADMIN_ACCOUNTS = [
  { emails: ['alibhai@gmail.com', 'alibhai@gmial.com'], passwordHash: '971e6e66a4c6b903fa2bbfd7df95d45eacdd91b2f50039b21e14f7bd650e7d49' },
]

const CUSTOMER = {
  name: 'Hafiz Ahmad',
  email: 'hafizmahmad@gmail.com',
  phone: '+447700900321',
  address: '12 Wilmslow Road, Didsbury, Manchester',
  postcode: 'M20 6AG',
  location: { lat: 53.4167, lon: -2.2306 },
  passwordHash: '083920b4debdd23561d24238557f219cb5eedf352babf0156b2e42691f451c3d',
  signupSource: 'website',
  marketingConsent: false,
  consentAt: null,
}

const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const at = (days, h = 10) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d.toISOString() }

function sampleOrders() {
  const customer = { name: CUSTOMER.name, phone: CUSTOMER.phone, email: CUSTOMER.email, address: CUSTOMER.address, postcode: CUSTOMER.postcode }
  const base = { userEmail: CUSTOMER.email, customer, location: CUSTOMER.location, sample: true }
  return [
    {
      ...base, id: 'FP-TEST01', type: 'repair', status: 'confirmed', createdAt: at(-1, 9),
      device: { kind: 'phone', brand: 'Apple', model: 'iPhone 13' }, issues: ['screen'], estimate: { min: 75, max: 95 }, price: null,
      slot: { date: iso(2), start: '10:00', end: '11:00', time: '10:00am – 11:00am', travelMin: 25 },
      statusHistory: [{ from: 'new', to: 'confirmed', at: at(-1, 11), by: 'admin' }],
    },
    {
      ...base, id: 'FP-TEST02', type: 'accessory', status: 'new', createdAt: at(0, 8),
      device: { kind: 'phone', brand: 'Apple', model: 'iPhone 13' }, price: 25,
      items: [{ id: 'case', name: 'Clear phone case', qty: 1, price: 12 }, { id: 'glass', name: 'Tempered glass screen protector', qty: 1, price: 13 }],
    },
    {
      ...base, id: 'FP-TEST03', type: 'repair', status: 'completed', createdAt: at(-30, 9),
      device: { kind: 'phone', brand: 'Samsung', model: 'Galaxy S22' }, issues: ['battery'], price: 59, paid: true, paidAt: at(-28, 12), payMethod: 'card',
      slot: { date: iso(-28), start: '11:00', end: '12:00', time: '11:00am – 12:00pm', travelMin: 20 },
      receipt: { number: 'R-TEST-0001', issuedAt: at(-28, 12), warrantyMonths: 6, payment: 'card' },
      statusHistory: [
        { from: 'new', to: 'confirmed', at: at(-29, 10), by: 'admin' },
        { from: 'confirmed', to: 'on-the-way', at: at(-28, 10), by: 'admin' },
        { from: 'on-the-way', to: 'repairing', at: at(-28, 11), by: 'admin' },
        { from: 'repairing', to: 'completed', at: at(-28, 12), by: 'admin' },
      ],
    },
  ]
}

// Runs once per browser: adds the test customer (and their sample bookings) if they are not there yet
export function seedTestAccounts() {
  try {
    const users = JSON.parse(localStorage.getItem('fp_users') || '[]')
    if (users.some((u) => u.email === CUSTOMER.email)) return
    localStorage.setItem('fp_users', JSON.stringify([...users, { ...CUSTOMER, createdAt: at(-60) }]))
    const orders = JSON.parse(localStorage.getItem('fp_orders') || '[]')
    const fresh = sampleOrders().filter((o) => !orders.some((x) => x.id === o.id))
    localStorage.setItem('fp_orders', JSON.stringify([...fresh, ...orders]))
  } catch { /* storage full or blocked: skip */ }
}
