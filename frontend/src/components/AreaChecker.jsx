import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { checkArea } from '../lib/areaCheck'
import { SITE } from '../data/site'

// "Enter your area" form shared by the Home page and the Areas page
export default function AreaChecker({ id = 'area-input', className = '' }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null)

  const onSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) setResult(checkArea(value))
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-full bg-[#F6F7F9] p-1.5 pl-4">
        <MapPin size={18} strokeWidth={2} className="shrink-0 text-muted" aria-hidden="true" />
        <label htmlFor={id} className="sr-only">Enter your area or postcode</label>
        <input
          id={id}
          value={value}
          onChange={(e) => { setValue(e.target.value); setResult(null) }}
          placeholder="Enter your area or postcode"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-black">Check</button>
      </form>
      {result && (
        <p role="status" className={`mt-3 text-sm font-semibold ${result.status === 'yes' ? 'text-success' : 'text-body'}`}>
          {result.status === 'yes' && `Good news — we visit ${result.area}.`}
          {result.status === 'maybe' && 'That is just outside our main area. Message us and we will check if we can come.'}
          {result.status === 'none' && (
            <>We don’t see that area on our list yet. <a href={SITE.whatsapp} className="text-accent underline">Message us</a> and we will check.</>
          )}
        </p>
      )}
    </div>
  )
}
