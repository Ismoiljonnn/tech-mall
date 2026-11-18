import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store.jsx'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import Cart from './pages/Cart.jsx'
import Profile from './pages/Profile.jsx'
import { Login, Register } from './pages/Auth.jsx'

function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <main className="container page">
      <section className="card empty">
        <h3>Sahifa topilmadi</h3>
        <p className="muted">Bunday sahifa mavjud emas.</p>
        <Link to="/" className="btn btn-dark">Bosh sahifa</Link>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ScrollTop />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toasts />
      </StoreProvider>
    </BrowserRouter>
  )
}
