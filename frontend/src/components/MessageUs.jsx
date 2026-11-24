import { useState } from 'react'
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Select from './ui/Select'
import { addMessage, useSession } from '../lib/store'
import { SITE } from '../data/site'

const TOPICS = ['Question about my repair', 'Change my booking', 'Price question', 'Something else'].map((t) => ({ value: t, label: t }))

/*
  "Message us" window for a logged-in customer. The message goes to Admin → Messages,
  and the reply shows up in the customer's account. WhatsApp / call are offered for urgent things.
*/
export default function MessageUs({ open, onClose, orderId }) {
  const session = useSession()
  const [topic, setTopic] = useState(TOPICS[0].value)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const close = () => { onClose(); setTimeout(() => { setSent(false); setText('') }, 300) }
  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !session) return
    addMessage({
      name: session.name,
      contact: session.email,
      phone: session.phone,
      userEmail: session.email,
      topic: orderId ? `${topic} (${orderId})` : topic,
      message: text.trim(),
    })
    setSent(true)
  }

  return (
    <Modal open={open} onClose={close} title={sent ? 'Message sent' : 'Message us'} text={sent ? null : 'We usually reply within a few hours. You will see our reply in your account.'} width={560}>
      {sent ? (
        <div className="text-center">
          <CheckCircle2 size={44} strokeWidth={2} className="mx-auto text-success" aria-hidden="true" />
          <p className="mt-3 text-[15px] text-body">Thanks, {session?.name?.split(' ')[0]}. We have your message and will reply soon.</p>
          <Button onClick={close} className="mt-6 w-full sm:w-auto">Done</Button>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-4">
          <Select label="What is it about?" value={topic} onChange={setTopic} options={TOPICS} />
          <div>
            <label htmlFor="msg-text" className="mb-1.5 block text-[13px] font-bold text-body">Your message</label>
            <textarea id="msg-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your message here"
              className="w-full rounded-[14px] border border-field px-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent" />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 text-sm">
              <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-field px-3.5 font-bold hover:border-whatsapp hover:text-whatsapp"><MessageCircle size={15} aria-hidden="true" /> WhatsApp</a>
              <a href={`tel:${SITE.phone}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-field px-3.5 font-bold hover:border-accent hover:text-accent"><Phone size={15} aria-hidden="true" /> Call</a>
            </div>
            <Button type="submit" disabled={!text.trim()}>Send message</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
