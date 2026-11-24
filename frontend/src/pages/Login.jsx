import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Smartphone } from 'lucide-react'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Photo from '../components/ui/Photo'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { logIn, signUp, useSession } from '../lib/store'
import { PHONE_ERROR, normaliseUkPhone } from '../lib/format'

const EMPTY = { name: '', email: '', phone: '', password: '', marketingConsent: false }

// Own layout (no header/footer): photo on the left, form on the right
export default function Login() {
  useDocumentTitle('Log in or Sign up — FixPoint', 'Log in to see your repairs, or create a free FixPoint account.')
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // After logging in: back to where they came from, else straight to their bookings
  const dest = location.state?.from || (mode === 'signup' ? '/account' : '/my-bookings')
  if (session) return <Navigate to={dest} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && (!form.name.trim() || !form.phone.trim())) return setError('Please enter your name and phone number.')
    if (mode === 'signup' && !normaliseUkPhone(form.phone)) return setError(PHONE_ERROR)
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.')
    if (form.password.length < 8) return setError('Your password needs at least 8 characters.')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp({ ...form, phone: normaliseUkPhone(form.phone) })
      else await logIn(form)
      navigate(dest)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-page lg:grid-cols-[1.05fr_1fr]">
      {/* Photo side */}
      <div className="relative hidden overflow-hidden lg:block">
        <Photo src="/images/login.jpg" alt="Close-up of a phone’s camera lenses" rounded="rounded-none" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <h2 className="max-w-[420px] text-[clamp(30px,3vw,44px)] font-extrabold leading-[1.08] tracking-[-0.03em]">Your phone, fixed at your door.</h2>
          <p className="mt-3 max-w-[380px] text-base text-white/80">Keep track of your repairs and book again in a few taps.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="FixPoint home">
            <span className="grid size-9 place-items-center rounded-[11px] bg-ink text-white"><Smartphone size={18} strokeWidth={2} /></span>
            <span className="text-xl font-extrabold tracking-[-0.02em]">FixPoint</span>
          </Link>
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-body hover:text-ink"><ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> Back to site</Link>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10"
        >
          <h1 className="text-[clamp(32px,4vw,42px)] font-extrabold leading-[1.05] tracking-[-0.035em]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-[15px] text-muted">{mode === 'login' ? 'Log in to see your repairs and orders.' : 'Free, takes a minute. Your details are filled in when you book.'}</p>

          <div className="mt-6 grid grid-cols-2 rounded-full border border-line bg-white p-1" role="tablist" aria-label="Log in or sign up">
            {[['login', 'Log in'], ['signup', 'Sign up']].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setError('') }}
                className={`min-h-11 rounded-full text-sm font-bold transition-colors ${mode === k ? 'bg-ink text-white' : 'text-body'}`}>{label}</button>
            ))}
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {mode === 'signup' && (
              <>
                <Field label="Full name" value={form.name} onChange={setF('name')} autoComplete="name" />
                <Field label="Phone number" type="tel" value={form.phone} onChange={setF('phone')} autoComplete="tel" />
              </>
            )}
            <Field label="Email" type="email" value={form.email} onChange={setF('email')} autoComplete="email" />
            <Field label="Password" type="password" value={form.password} onChange={setF('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'signup' && (
              // UK law: offers only with a box the customer ticks themselves (never pre-ticked)
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-3.5 text-sm text-body">
                <input type="checkbox" checked={form.marketingConsent} onChange={(e) => setForm((f) => ({ ...f, marketingConsent: e.target.checked }))} className="mt-0.5 size-5 shrink-0 accent-[#1e4fd8]" />
                <span>Send me repair tips and offers by WhatsApp or email. You can opt out anytime.</span>
              </label>
            )}
            {error && <p role="alert" className="rounded-xl bg-[#FDECEA] px-4 py-2.5 text-sm font-semibold text-danger">{error}</p>}
            <Button type="submit" variant="dark" size="lg" className="w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <button type="button" className="font-bold text-accent" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
