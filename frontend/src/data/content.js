// Page content shared by several pages. Replace with API calls to the Django REST API later.
// Placeholders such as £[price] and [X] are filled in by the client.

// Repair problems shown in the hero form. "Other" lets the user type their own.
export const OTHER = 'Other'
export const issues = [
  'Cracked screen',
  'Battery drains fast',
  'Not charging',
  'Camera issue',
  'Back glass broken',
  'Water damage',
  'Not sure – free check',
  OTHER,
]

export const trustItems = [
  { icon: 'ShieldCheck', title: '[X]-day warranty', text: 'Parts and labour covered' },
  { icon: 'Zap', title: 'Same-day repair', text: 'Most jobs done in one visit' },
  { icon: 'Cpu', title: 'Quality local parts', text: 'Sourced locally, tested before fitting' },
  { icon: 'Wallet', title: 'Pay after repair', text: 'Price agreed with you first' },
]

export const steps = [
  { n: '01', title: 'Find your phone & problem', text: 'Find your phone or tablet, then tell us what’s wrong. You can describe it in your own words.' },
  { n: '02', title: 'Book a time that suits you', text: 'Pick a day and time window. We come to your home, office or café in Manchester.' },
  { n: '03', title: 'We fix it in front of you', text: 'Your price is agreed before any work starts. You pay once the repair works.' },
]

export const reviews = [0, 1, 2].map((i) => ({
  id: i,
  text: '[Customer Google review goes here. Connect your Google Business profile to show real reviews automatically.]',
  name: '[Customer name]',
  detail: '[Phone model] • [Repair]',
  initial: ['A', 'B', 'C'][i],
}))

export const faqs = [
  {
    q: 'How long does a repair take?',
    a: 'Most screen and battery repairs are finished in one visit, usually within [time]. If a job needs more time, we tell you before we start.',
  },
  {
    q: 'Do I pay before or after the repair?',
    a: 'After. You pay once the repair is done and you have checked that your phone works. Your price is agreed with you before any work begins.',
  },
  {
    q: 'Is there a warranty?',
    a: 'Yes. Every repair comes with a [X]-day warranty covering the replacement part and the work.',
  },
  {
    q: 'Do you use original parts?',
    a: 'No. We use quality replacement parts sourced locally, and we test each one before fitting. That keeps repairs affordable. We will always tell you what part is going in.',
  },
  {
    q: 'What if you can’t fix my phone?',
    a: 'If we can’t fix it, you don’t pay for the repair. Diagnosis is free.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. Most repairs do not touch your data. We never ask for your passwords, and you can watch the repair happen.',
  },
  {
    q: 'Which areas do you cover?',
    a: 'We visit Manchester and nearby areas such as Salford, Stockport, Sale and Altrincham. See the full list on our Areas page or message us.',
  },
  {
    q: 'Do you have a shop I can visit?',
    a: 'No. We don’t have a shop. We come to you, so there are no queues and no travelling.',
  },
]

// What a problem not in the list can be — used by the "Other" option
export const contactTopics = [
  'Booking a repair',
  'Price question',
  'Existing repair',
  'Accessories order',
  'Warranty',
  OTHER,
]
