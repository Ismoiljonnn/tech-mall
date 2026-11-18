import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// apply saved theme before first paint (no flash)
let theme = 'light'
try {
  theme = localStorage.getItem('tb_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
} catch {
  /* ignore */
}
document.documentElement.dataset.theme = theme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
