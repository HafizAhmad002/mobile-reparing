// Repair tips (blog). Replace with API calls to the Django REST API later.

export const posts = [
  {
    slug: 'phone-got-wet',
    title: 'My phone got wet — what should I do right now?',
    category: 'Water damage',
    minutes: 3,
    image: '/images/blog/camera-bar.jpg',
    excerpt: 'The first ten minutes decide whether your phone survives. Here is exactly what to do (and what not to do).',
    body: [
      'Take the phone out of the water straight away and switch it off. Do not try to charge it and do not press buttons to “see if it still works”. Power running through a wet board is what causes most permanent damage.',
      'Remove the case, the SIM tray and any memory card, then gently pat the outside dry with a cloth. Keep the phone upright with the charging port facing down so water can drain out.',
      'Skip the bag of rice — it does very little and can push dust into the ports. The best thing you can do is get the phone opened, cleaned and dried properly as soon as possible. Message us and we will come to you.',
    ],
  },
  {
    slug: 'battery-signs',
    title: '5 signs your phone battery needs replacing',
    category: 'Battery',
    minutes: 3,
    image: '/images/blog/foldable.jpg',
    excerpt: 'Dying by lunchtime? Switching off at 30%? These are the signs a new battery will fix the problem.',
    body: [
      'Batteries wear out with every charge. After a couple of years most phones hold noticeably less charge than when they were new.',
      'Look out for: the battery draining much faster than before, the phone switching off at 20–30%, the phone getting hot while charging, the back or screen lifting slightly, and sudden jumps in the battery percentage.',
      'A swollen battery is a safety risk. If the screen or back is lifting, stop charging the phone and get in touch the same day.',
    ],
  },
  {
    slug: 'cracked-screen-wait',
    title: 'Cracked screen: repair it now or wait?',
    category: 'Screen',
    minutes: 2,
    image: '/images/blog/camera-ring.jpg',
    excerpt: 'A small crack rarely stays small. Here is why it is cheaper and safer to fix it early.',
    body: [
      'Cracks spread. Every pocket, drop and temperature change makes them longer, and moisture and dust get in through the gap and can cause touch problems later.',
      'Cracked glass can also cut your fingers and, on some phones, damage the display underneath. Fixing it early usually costs the same as fixing it later, but avoids the extra damage.',
      'Until you can get it fixed, put a clear screen protector or a strip of clear tape over the crack to keep the pieces in place.',
    ],
  },
  {
    slug: 'battery-last-longer',
    title: 'Simple habits that make your battery last longer',
    category: 'Tips',
    minutes: 3,
    image: '/images/blog/camera-module.jpg',
    excerpt: 'No apps needed. Small changes to how you charge and store your phone add months to its life.',
    body: [
      'Heat is the biggest enemy. Do not leave your phone on a car dashboard, under a pillow while charging or in direct sun.',
      'Try to keep the charge between roughly 20% and 80% when you can, and avoid letting it hit zero often. Use a good-quality cable and plug — cheap, unsafe chargers wear out batteries and can be dangerous.',
      'Turn down the screen brightness, close apps you are not using and keep your phone updated. If it is already old and slow to charge, a new battery is the cheapest way to make it feel new again.',
    ],
  },
  {
    slug: 'local-parts',
    title: 'Why we use locally sourced replacement parts',
    category: 'About our repairs',
    minutes: 2,
    image: '/images/blog/home-screen.jpg',
    excerpt: 'We don’t sell original parts. Here is what that means for your price, your warranty and your phone.',
    body: [
      'We use quality replacement parts that we source locally. They are not original manufacturer parts, and we will always tell you exactly what is going into your phone before we start.',
      'That is how we keep repairs affordable. Every part is tested before it is fitted, and every repair comes with a warranty on the part and the work.',
      'If you would rather have a different option or you are not sure, ask us. The price is agreed with you first — you only pay when your phone works.',
    ],
  },
]

export const postCategories = ['All', ...new Set(posts.map((p) => p.category))]
