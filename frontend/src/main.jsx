import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Saved business settings (hours, area, prices) are applied before anything else renders
import './lib/settings'
import { seedTestAccounts } from './lib/testAccounts'
import App from './App'
import './index.css'

seedTestAccounts()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Installable admin (PWA): register the service worker on the live site only
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
