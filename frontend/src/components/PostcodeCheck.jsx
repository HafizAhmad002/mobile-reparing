import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MapPin, X } from 'lucide-react'
import { lookupPostcode } from '../lib/geo'
import { districtOf, serviceStatus } from '../lib/areaCheck'
import { isUkPostcode, normalisePostcode } from '../lib/format'

// "Do we come to you?" Postcode first: answers yes / no before the customer fills anything else.
export default function PostcodeCheck({ className = '' }) {
  const [pc, setPc] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok, postcode, district, place? } | { error }

  const check = async (e) => {
    e.preventDefault()
    if (!isUkPostcode(pc)) return setResult({ error: 'Please enter a full UK postcode, e.g. M14 5RX.' })
    setBusy(true)
    const r = await lookupPostcode(pc)
    setBusy(false)
    if (r.status === 'notfound') return setResult({ error: 'We could not find that postcode. Please check it.' })
    const postcode = r.postcode || normalisePostcode(pc)
    const point = r.status === 'ok' ? { lat: r.lat, lon: r.lon } : null
    const ok = serviceStatus({ point, postcode }) === 'in'
    setResult({ ok, postcode, district: districtOf(postcode), place: point ? { address: '', postcode, ...point } : { address: '', postcode } })
  }

  return (
    <div className={className}>
      <form onSubmit={check} noValidate className="mx-auto flex max-w-[420px] items-center gap-2 rounded-full border border-line bg-white p-1.5 pl-4">
        <MapPin size={16} className="shrink-0 text-accent" aria-hidden="true" />
        <label htmlFor="hero-postcode" className="sr-only">Your postcode</label>
        <input
          id="hero-postcode" value={pc} onChange={(e) => { setPc(e.target.value.toUpperCase()); setResult(null) }}
          placeholder="Do we come to you? Your postcode" autoComplete="postal-code"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={busy || !pc.trim()} className="h-10 shrink-0 rounded-full bg-ink px-5 text-sm font-bold text-white disabled:bg-[#D5D8E0]">{busy ? 'Checking…' : 'Check'}</button>
      </form>
      <div aria-live="polite" className="mt-3 min-h-6 text-sm font-semibold">
        {result?.error && <p className="text-danger">{result.error}</p>}
        {result && !result.error && (result.ok ? (
          <p className="inline-flex flex-wrap items-center justify-center gap-x-2 text-success">
            <Check size={16} aria-hidden="true" /> Yes, we come to {result.district}.
            <Link to="/book" state={{ place: result.place }} className="font-bold text-accent underline">Book a visit</Link>
          </p>
        ) : (
          <p className="inline-flex flex-wrap items-center justify-center gap-x-2 text-danger">
            <X size={16} aria-hidden="true" /> Sorry, not yet. We only cover Manchester for now.
          </p>
        ))}
      </div>
    </div>
  )
}
