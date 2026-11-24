import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Services from './pages/Services'
import Prices from './pages/Prices'
import Booking from './pages/Booking'
import Track from './pages/Track'
import Shop from './pages/Shop'
import Areas from './pages/Areas'
import About from './pages/About'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Login from './pages/Login'
import Account from './pages/Account'
// Admin is split into its own file, so customers never download the admin code
const Admin = lazy(() => import('./pages/Admin'))
import MyRepairs from './pages/MyRepairs'
import Receipt from './pages/Receipt'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Pages with the shared header + footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:ref" element={<Track />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/account" element={<Account />} />
          <Route path="/my-bookings" element={<MyRepairs />} />
          <Route path="/account/repairs" element={<Navigate to="/my-bookings" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* Own layouts (built in later tasks) */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Loading…</div>}><Admin /></Suspense>} />
        <Route path="/receipt/:id" element={<Receipt />} />
      </Routes>
    </>
  )
}

