import { useState } from 'react'
import { Check, Clock, Mail, MessageCircle, Phone, Truck } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Select from '../components/ui/Select'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { contactTopics, OTHER } from '../data/content'
import { SITE } from '../data/site'
import { addMessage } from '../lib/store'
import { normaliseUkPhone } from '../lib/format'

const ways = [
  { icon: MessageCircle, title: 'WhatsApp', text: 'Fastest way to reach us', href: SITE.whatsapp, label: 'Open WhatsApp' },
  { icon: Phone, title: 'Call', text: SITE.phone, href: 'tel:[Phone number]', label: 'Call us' },
  { icon: Mail, title: 'Email', text: SITE.email, href: 'mailto:[Email address]', label: 'Email us' },
]

export default function Contact() {
  useDocumentTitle('Contact — FixPoint Manchester', 'Message FixPoint on WhatsApp, call, email or use the form. We repair phones at your door in Manchester.')
  const [form, setForm] = useState({ name: '', contact: '', topic: contactTopics[0], otherTopic: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.name.trim()) err.name = 'Please enter your name.'
    if (!form.contact.trim()) err.contact = 'Please enter an email or phone number.'
    else if (!/@/.test(form.contact) && !normaliseUkPhone(form.contact)) err.contact = 'Please enter an email address or a UK phone number.'
    if (form.topic === OTHER && !form.otherTopic.trim()) err.otherTopic = 'Please type your topic.'
    if (!form.message.trim()) err.message = 'Please write your message.'
    setErrors(err)
    if (Object.keys(err).length) return
    addMessage({
      name: form.name.trim(),
      contact: form.contact.trim(),
      topic: form.topic === OTHER ? form.otherTopic.trim() : form.topic,
      message: form.message.trim(),
    })
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-12 md:pt-16">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Contact</p>
        <h1 className="max-w-[760px] text-[clamp(38px,5vw,60px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Get in touch</h1>
        <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-muted">We don’t have a shop — we come to you. Message us any way you like and we will reply as soon as we can.</p>
      </section>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {ways.map(({ icon: Icon, title, text, href, label }) => (
            <a key={title} href={href} aria-label={label} className="flex items-center gap-4 rounded-[24px] border border-line bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Icon size={22} strokeWidth={2} /></span>
              <span><span className="block text-base font-extrabold tracking-[-0.02em]">{title}</span><span className="block text-sm text-muted">{text}</span></span>
            </a>
          ))}
          <div className="flex items-center gap-4 rounded-[24px] border border-line bg-white p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Truck size={22} strokeWidth={2} /></span>
            <span><span className="block text-base font-extrabold tracking-[-0.02em]">We come to you</span><span className="block text-sm text-muted">Home, office or café in Manchester</span></span>
          </div>
          <div className="flex items-center gap-4 rounded-[24px] border border-line bg-white p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-accent"><Clock size={22} strokeWidth={2} /></span>
            <span><span className="block text-base font-extrabold tracking-[-0.02em]">Hours</span><span className="block text-sm text-muted">{SITE.hours}</span></span>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="rounded-[28px] border border-line bg-white p-6 md:p-8">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Send a message</h2>
          {sent ? (
            <div role="status" className="mt-6 rounded-2xl bg-success-tint p-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-success"><Check size={22} strokeWidth={2.5} aria-hidden="true" /></span>
              <p className="mt-3 text-lg font-extrabold text-success">Message sent</p>
              <p className="mt-1 text-sm text-body">Thank you. We will get back to you soon.</p>
              <Button variant="secondary" className="mt-4" onClick={() => { setSent(false); setForm({ name: '', contact: '', topic: contactTopics[0], otherTopic: '', message: '' }) }}>Send another</Button>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Field label="Your name" value={form.name} onChange={setF('name')} autoComplete="name" />
                {errors.name && <p className="mt-1 text-xs font-semibold text-danger">{errors.name}</p>}
              </div>
              <div>
                <Field label="Email or phone" value={form.contact} onChange={setF('contact')} />
                {errors.contact && <p className="mt-1 text-xs font-semibold text-danger">{errors.contact}</p>}
              </div>
              <Select className="sm:col-span-2" label="Topic" value={form.topic} onChange={(v) => setForm((f) => ({ ...f, topic: v }))} options={contactTopics.map((t) => ({ value: t, label: t }))} />
              {form.topic === OTHER && (
                <div className="sm:col-span-2">
                  <Field label="Your topic" value={form.otherTopic} onChange={setF('otherTopic')} placeholder="What is your message about?" />
                  {errors.otherTopic && <p className="mt-1 text-xs font-semibold text-danger">{errors.otherTopic}</p>}
                </div>
              )}
              <div className="sm:col-span-2">
                <Field label="Message" as="textarea" rows={5} value={form.message} onChange={setF('message')} />
                {errors.message && <p className="mt-1 text-xs font-semibold text-danger">{errors.message}</p>}
              </div>
              <div className="sm:col-span-2"><Button type="submit" variant="dark" size="lg">Send message</Button></div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
