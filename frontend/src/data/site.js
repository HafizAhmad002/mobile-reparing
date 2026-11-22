// Site-wide settings. Placeholders in [brackets] are filled in by the client.
export const SITE = {
  name: 'FixPoint',
  city: 'Manchester',
  country: 'UK',
  currency: '£',
  price: '£[price]', // shown wherever a price is not set yet
  whatsapp: 'https://wa.me/[number]',
  phone: '[Phone number]',
  email: '[Email address]',
  hours: '[Opening hours]',
}

// TEMPORARY front-end-only passcode for /admin until the Django API handles real admin login.
// Do not rely on this for security: anyone can read it in the browser.
export const ADMIN_PASSCODE = 'fixpoint-admin'
