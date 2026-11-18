import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { Box, Cart, Chevron, Heart, Logout, Search, User } from '../icons.jsx'

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export default function Header() {
  const { user, cartCount, favorites, logout } = useStore()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'
  const urlQ = onHome ? params.get('q') || '' : ''
  const [q, setQ] = useState(urlQ)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)

  // keep the input in sync when the URL changes (e.g. "Qidiruvni tozalash")
  useEffect(() => {
    setQ(urlQ)
  }, [urlQ])

  useEffect(() => {
    if (!menu) return
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenu(false)
    }
    const esc = (e) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [menu])

  useEffect(() => {
    setMenu(false)
  }, [location.pathname, location.search])

  function onChange(e) {
    const v = e.target.value
    setQ(v)
    if (onHome) {
      const next = new URLSearchParams(params)
      if (v.trim()) next.set('q', v)
      else next.delete('q')
      setParams(next, { replace: true })
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!onHome) navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/')
  }

  return (
    <header className="header">
      <div className="container header-row">
        <Link to="/" className="brand">
          <span className="brand-logo">TB</span>
          <span>
            <b>TexnoBozor</b>
            <small>Zamonaviy texnika do'koni</small>
          </span>
        </Link>

        <form className="search" onSubmit={onSubmit} role="search">
          <Search size={18} />
          <input value={q} onChange={onChange} placeholder="Mahsulot nomi bo'yicha qidirish..." aria-label="Qidirish" />
        </form>

        <nav className="header-actions">
          <Link to="/?fav=1" className="btn btn-outline">
            <Heart size={17} filled />
            <span className="hide-sm">Sevimlilar</span>
            <span className="badge">{favorites.length}</span>
          </Link>
          <Link to="/cart" className="btn btn-dark">
            <Cart size={17} />
            <span className="hide-sm">Savat</span>
            <span className="badge badge-light">{cartCount}</span>
          </Link>

          {user ? (
            <div className="profile" ref={menuRef}>
              <button type="button" className="btn btn-outline profile-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                <span className="avatar">{initials(user.name)}</span>
                <span className="hide-sm">{user.name.split(' ')[0]}</span>
                <Chevron size={16} />
              </button>
              {menu && (
                <div className="menu" role="menu">
                  <div className="menu-head">
                    <span className="avatar avatar-lg">{initials(user.name)}</span>
                    <div>
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <Link to="/profile" className="menu-item" role="menuitem">
                    <User size={17} /> Profilim
                  </Link>
                  <Link to="/profile#orders" className="menu-item" role="menuitem">
                    <Box size={17} /> Buyurtmalarim
                  </Link>
                  <Link to="/?fav=1" className="menu-item" role="menuitem">
                    <Heart size={17} /> Sevimlilar
                  </Link>
                  <button
                    type="button"
                    className="menu-item menu-danger"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false)
                      navigate("/")
                      logout()
                    }}
                  >
                    <Logout size={17} /> Chiqish
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                <User size={17} /> <span className="hide-sm">Kirish</span>
              </Link>
              <Link to="/register" className="btn btn-primary hide-xs">
                Ro'yxatdan o'tish
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
