import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Send, X } from 'lucide-react'
import { addOrderMessage, markOrderMessagesRead } from '../lib/orders'
import { photoPreview } from '../lib/attachments'
import { formatDateTime } from '../lib/format'

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

/*
  Chat about one order, used on the customer's tracking page (side="customer") and in the admin
  order drawer (side="admin"). Optional photo: jpg, png or webp up to 5 MB (made smaller before saving).
*/
export default function OrderChat({ order, side }) {
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const end = useRef(null)
  const file = useRef(null)
  const list = order.messages || []

  // Reading the thread marks the other side's messages as read
  useEffect(() => { markOrderMessagesRead(order, side) }, [order, side])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [list.length])

  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!OK_TYPES.includes(f.type)) return setError('Photos must be JPG, PNG or WebP.')
    if (f.size > MAX_BYTES) return setError('That photo is bigger than 5 MB.')
    setError('')
    setPhoto(await photoPreview(f, 900, 0.8))
  }
  const send = (e) => {
    e.preventDefault()
    if (!text.trim() && !photo) return
    addOrderMessage(order, side, text, photo)
    setText(''); setPhoto(null)
  }

  return (
    <div>
      <div className="max-h-[340px] space-y-2 overflow-y-auto rounded-2xl bg-[#F6F7F9] p-3 [scrollbar-width:thin]">
        {list.length === 0 && <p className="py-6 text-center text-sm text-muted">{side === 'customer' ? 'Questions about this repair? Send a message.' : 'No messages about this order yet.'}</p>}
        {list.map((m) => {
          const mine = m.from === side
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] overflow-hidden rounded-2xl text-sm ${mine ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md border border-line bg-white'}`}>
                {m.photo && <a href={m.photo} target="_blank" rel="noreferrer"><img src={m.photo} alt="Photo sent in the chat" className="max-h-56 w-full object-cover" /></a>}
                {m.text && <p className="whitespace-pre-line px-3.5 py-2">{m.text}</p>}
              </div>
              <span className="mt-0.5 text-[10px] text-muted">{m.from === 'admin' ? (side === 'admin' ? 'You' : 'Technician') : (side === 'customer' ? 'You' : 'Customer')} · {formatDateTime(m.at)}{mine && m.readAt ? ' · Seen' : ''}</span>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {photo && (
        <div className="relative mt-2 inline-block">
          <img src={photo} alt="Photo to send" className="size-16 rounded-xl object-cover" />
          <button type="button" onClick={() => setPhoto(null)} aria-label="Remove photo" className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-white shadow"><X size={12} /></button>
        </div>
      )}
      {error && <p className="mt-1 text-xs font-semibold text-danger">{error}</p>}
      <form onSubmit={send} className="mt-2 flex items-center gap-2">
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} tabIndex={-1} aria-hidden="true" />
        <button type="button" onClick={() => file.current.click()} aria-label="Add a photo" className="grid size-11 shrink-0 place-items-center rounded-full border border-field text-muted hover:border-accent hover:text-accent"><ImagePlus size={18} /></button>
        <label htmlFor={`chat-${order.id}-${side}`} className="sr-only">Message</label>
        <input id={`chat-${order.id}-${side}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" className="h-11 min-w-0 flex-1 rounded-full border border-field px-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent" />
        <button type="submit" disabled={!text.trim() && !photo} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white disabled:bg-[#D5D8E0]"><Send size={17} /></button>
      </form>
    </div>
  )
}
