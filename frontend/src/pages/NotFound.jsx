import { Link } from 'react-router-dom'

// 404 page shown for any unknown route
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 font-bold text-white hover:bg-accent-dark"
      >
        Back to home
      </Link>
    </div>
  )
}

