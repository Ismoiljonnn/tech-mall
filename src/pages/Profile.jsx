import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { formatMoney, formatPhone, isValidPhone } from '../api.js'
import OrderCard from '../components/OrderCard.jsx'

export default function Profile() {
  const { user, ready, orders, loadOrders, updateProfile, toast, favorites, logout, manualLogout } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(formatPhone(user.phone))
    }
  }, [user])

  useEffect(() => {
    if (user) loadOrders()
  }, [user, loadOrders])

  useEffect(() => {
    if (location.hash === '#orders') document.getElementById('orders')?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash, orders.length])

  if (!ready) return null
  if (!user) return <Navigate to={manualLogout.current ? '/' : '/login?next=/profile'} replace />

  const totalSpent = orders.filter((o) => o.status !== "Bekor qilindi").reduce((s, o) => s + o.total, 0)
  const dirty = name.trim() !== user.name || phone.replace(/\D/g, '') !== user.phone.replace(/\D/g, '')

  async function save(e) {
    e.preventDefault()
    const errs = {}
    if (name.trim().length < 2) errs.name = "Ism kamida 2 ta belgidan iborat bo'lsin"
    if (!isValidPhone(phone)) errs.phone = "Telefon raqam noto'g'ri"
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await updateProfile({ name: name.trim(), phone })
      toast("Ma'lumotlar saqlandi", 'success')
    } catch (err) {
      if (err.data?.errors) setErrors(err.data.errors)
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <span className="pill">Profil</span>
          <h1>Profilim</h1>
          <p className="muted">{user.email}</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm link-danger" onClick={() => { navigate('/'); logout() }}>Chiqish</button>
      </div>

      <div className="profile-layout">
        <section className="card profile-card">
          <h2>Shaxsiy ma'lumotlar</h2>
          <form onSubmit={save} noValidate className="auth-form">
            <label className="field">
              <span className="label">To'liq ism</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <span className="error small">{errors.name}</span>}
            </label>
            <label className="field">
              <span className="label">Telefon raqam</span>
              <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} inputMode="tel" />
              {errors.phone && <span className="error small">{errors.phone}</span>}
            </label>
            <label className="field">
              <span className="label">Elektron pochta</span>
              <input value={user.email} disabled />
            </label>
            <button type="submit" className="btn btn-dark btn-block" disabled={busy || !dirty}>
              {busy ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </section>

        <section className="stats">
          <div className="card stat"><small className="muted">Buyurtmalar</small><b>{orders.length}</b></div>
          <div className="card stat"><small className="muted">Sevimlilar</small><b>{favorites.length}</b></div>
          <div className="card stat"><small className="muted">Jami xarid</small><b>{formatMoney(totalSpent)}</b></div>
        </section>
      </div>

      <section className="card orders-box" id="orders">
        <h2>Buyurtmalarim</h2>
        <p className="muted">Barcha buyurtmalaringiz tarixi</p>
        {orders.length ? (
          <div className="orders-grid">
            {orders.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        ) : (
          <p className="muted orders-empty">
            Hali buyurtma yo'q. <Link to="/">Xaridni boshlang</Link>
          </p>
        )}
      </section>
    </main>
  )
}
