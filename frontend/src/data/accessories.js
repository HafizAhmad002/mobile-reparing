// Accessories are locally sourced, generic items. NO branded products.
// `price: null` shows "£[price]" until the client fills it in.
// Pictures: `image` is a photo in public/images/accessories. If an item has no `image`,
// a drawn illustration is shown instead (components/ui/AccessoryImage.jsx).

export const accessoryCategories = [
  { id: 'all', label: 'All' },
  { id: 'protection', label: 'Protection' },
  { id: 'charging', label: 'Charging' },
  { id: 'audio', label: 'Audio' },
  { id: 'extras', label: 'Extras' },
]

export const accessories = [
  { id: 'glass', image: '/images/accessories/glass.webp', category: 'protection', name: 'Tempered glass screen protector', text: 'Clear, scratch-resistant glass. Fitted for you if you like.', icon: 'ShieldCheck', price: null },
  { id: 'case-clear', image: '/images/accessories/case-clear.webp', category: 'protection', name: 'Clear phone case', text: 'Slim see-through case that keeps your phone’s own colour.', icon: 'Smartphone', price: null },
  { id: 'case-rugged', image: '/images/accessories/case-rugged.webp', category: 'protection', name: 'Shock-proof phone case', text: 'Thick corners and a raised edge for drops.', icon: 'ShieldCheck', price: null },
  { id: 'case-wallet', image: '/images/accessories/case-wallet.webp', category: 'protection', name: 'Flip wallet case', text: 'Holds a couple of cards and folds into a stand.', icon: 'Layers', price: null },
  { id: 'cable-usbc', image: '/images/accessories/cable-usbc.webp', category: 'charging', name: 'USB-C charging cable', text: 'Strong braided cable for fast charging and data.', icon: 'PlugZap', price: null },
  { id: 'cable-lightning', image: '/images/accessories/cable-lightning.webp', category: 'charging', name: 'Lightning charging cable', text: 'Braided cable for older iPhones and iPads.', icon: 'PlugZap', price: null },
  { id: 'charger-wall', image: '/images/accessories/charger-wall.webp', category: 'charging', name: 'Wall charger plug (UK)', text: 'UK 3-pin plug with USB output. Safety-marked.', icon: 'Zap', price: null },
  { id: 'charger-car', image: '/images/accessories/charger-car.webp', category: 'charging', name: 'Car charger', text: 'Dual-port charger for the cigarette socket.', icon: 'BatteryCharging', price: null },
  { id: 'powerbank', image: '/images/accessories/powerbank.webp', category: 'charging', name: 'Power bank', text: 'Portable battery for a couple of full charges.', icon: 'BatteryCharging', price: null },
  { id: 'earphones', image: '/images/accessories/earphones.webp', category: 'audio', name: 'Wired earphones', text: 'Simple earphones with an in-line mic.', icon: 'Headphones', price: null },
  { id: 'holder', image: '/images/accessories/holder.webp', category: 'extras', name: 'Phone stand / holder', text: 'Foldable stand for your desk or bedside.', icon: 'Smartphone', price: null },
  { id: 'cleaning', image: '/images/accessories/cleaning.webp', category: 'extras', name: 'Screen cleaning kit', text: 'Microfibre cloth and cleaning spray.', icon: 'Sparkles', price: null },
]
