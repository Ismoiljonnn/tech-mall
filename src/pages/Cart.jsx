import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { api, CATEGORY_LABELS, formatMoney, formatPhone, isValidPhone } from '../api.js'
import { ArrowLeft, Cart as CartIcon, Check, Close, ProductIcon, Trash } from '../icons.jsx'

const DELIVERY_FEE = 30000

export default function Cart() {
  const { cartLines, cartCount, setQty, removeFromCart, clearCart, placeOrder, user, toast, ready } = useStore()
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState(null) // { code, percent }
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [delivery, setDelivery] = useState('courier')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState(null)

  // prefill once from the logged-in profile
  useEffect(() => {
    if (user) {
      setName((n) => n || user.name)
      setPhone((p) => p || formatPhone(user.phone))
    }
  }, [user])

  const subtotal = cartLines.reduce((s, l) => s + l.product.price * l.qty, 0)
  const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0
  const deliveryFee = delivery === 'courier' ? DELIVERY_FEE : 0
  const total = subtotal - discount + deliveryFee

  async function applyPromo(e) {
    e.preventDefault()
    const code = promoInput.trim()
    if (!code) return setPromoError('Promokodni kiriting')
    setPromoLoading(true)
    setPromoError('')
    try {
      const data = await api('/promo/validate', { method: 'POST', body: { code } })
      setPromo(data)
      setPromoInput(data.code)
    } catch (err) {
      setPromo(null)
      setPromoError(err.message)
    } finally {
      setPromoLoading(false)
    }
  }

  function removePromo() {
    setPromo(null)
    setPromoInput('')
    setPromoError('')
  }

  async function submit(e) {
    e.preventDefault()
    if (submitting) return
    const errs = {}
    if (name.trim().length < 2) errs.name = 'Ismingizni kiriting'
    if (!isValidPhone(phone)) errs.phone = "Telefon raqam noto'g'ri (+998 XX XXX XX XX)"
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitting(true)
    try {
      const order = await placeOrder({ name: name.trim(), phone, delivery, promoCode: promo?.code || '' })
      setPlaced(order)
      removePromo()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      if (err.data?.errors) setErrors(err.data.errors)
      if (err.data?.errors?.promoCode) setPromo(null)
      toast(err.status === 409 ? `${err.message}. Savat yangilandi.` : err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (placed) {
    return (
      <main className="container page narrow">
        <section className="card success">
          <span className="success-icon">
            <Check size={28} />
          </span>
          <h1>Buyurtma qabul qilindi!</h1>
          <p className="muted">
            Buyurtma raqami <b>#{placed.id}</b>. Tez orada {formatPhone(placed.phone)} raqamiga qo'ng'iroq qilamiz.
          </p>
          <div className="summary-rows">
            <div><span>Mahsulotlar</span><span>{formatMoney(placed.subtotal)}</span></div>
            {placed.discount > 0 && (
              <div className="green"><span>Chegirma ({placed.discountPercent}%)</span><span>− {formatMoney(placed.discount)}</span></div>
            )}
            <div><span>Yetkazib berish</span><span>{placed.deliveryFee ? formatMoney(placed.deliveryFee) : 'Bepul'}</span></div>
            <div className="total"><span>Jami summa</span><span>{formatMoney(placed.total)}</span></div>
          </div>
          <Link to="/" className="btn btn-dark btn-block">Xaridni davom ettirish</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <span className="pill">Savat</span>
          <h1>Savatingiz</h1>
          <p className="muted">{cartCount} ta mahsulot tanlangan — buyurtmani rasmiylashtiring</p>
        </div>
        <Link to="/" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} /> Do'konga qaytish
        </Link>
      </div>

      {!ready ? null : cartLines.length === 0 ? (
        <section className="card empty">
          <span className="empty-icon"><CartIcon size={22} /></span>
          <h3>Savat bo'sh</h3>
          <p className="muted">Mahsulotlarni ko'rib chiqing va yoqqanini savatga qo'shing.</p>
          <Link to="/" className="btn btn-dark">Do'konga o'tish</Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="card cart-list">
            <div className="cart-list-head">
              <h2><CartIcon size={18} /> Tanlangan mahsulotlar ({cartLines.length})</h2>
              <button type="button" className="link-danger" onClick={() => { if (confirm('Savatni tozalaysizmi?')) clearCart() }}>
                Savatni tozalash
              </button>
            </div>
            {cartLines.map(({ product: p, qty }) => (
              <div key={p.id} className="cart-item">
                <span className="cart-thumb"><ProductIcon name={p.icon} size={30} strokeWidth={1.5} /></span>
                <div className="cart-info">
                  <span className="category">{CATEGORY_LABELS[p.category]}</span>
                  <b>{p.name}</b>
                  <small className="muted">{p.specs}</small>
                  <small className="muted">1 dona narxi: {formatMoney(p.price)}</small>
                </div>
                <div className="qty" aria-label="Miqdor">
                  <button type="button" onClick={() => setQty(p.id, qty - 1)} aria-label="Kamaytirish">−</button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(p.id, qty + 1)} disabled={qty >= p.stock} aria-label="Ko'paytirish">+</button>
                </div>
                <b className="line-total">{formatMoney(p.price * qty)}</b>
                <button type="button" className="icon-btn" onClick={() => removeFromCart(p.id)} aria-label="O'chirish">
                  <Trash size={17} />
                </button>
              </div>
            ))}
          </section>

          <section className="card checkout">
            <h2>Buyurtmani rasmiylashtirish</h2>

            <form className="promo" onSubmit={applyPromo}>
              <input
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value)
                  setPromoError('')
                }}
                placeholder="Promo kod (masalan: SALE10)"
                disabled={!!promo}
              />
              {promo ? (
                <button type="button" className="btn btn-soft" onClick={removePromo}><Close size={15} /> Bekor</button>
              ) : (
                <button type="submit" className="btn btn-soft" disabled={promoLoading}>{promoLoading ? '...' : "Qo'llash"}</button>
              )}
            </form>
            {promo && <p className="green small">{promo.code} qo'llandi — {promo.percent}% chegirma</p>}
            {promoError && <p className="error small">{promoError}</p>}

            <form onSubmit={submit} noValidate>
              <h3>Buyurtma ma'lumotlari</h3>
              <div className="field">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" autoComplete="name" />
                {errors.name && <span className="error small">{errors.name}</span>}
              </div>
              <div className="field">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value ? formatPhone(e.target.value) : '')}
                  onFocus={() => !phone && setPhone('+998 ')}
                  placeholder="+998 90 123 45 67"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {errors.phone && <span className="error small">{errors.phone}</span>}
              </div>
              <div className="delivery">
                <button type="button" className={delivery === 'courier' ? 'active' : ''} onClick={() => setDelivery('courier')}>
                  <b>Kuryer orqali</b>
                  <small>{formatMoney(DELIVERY_FEE)}</small>
                </button>
                <button type="button" className={delivery === 'pickup' ? 'active' : ''} onClick={() => setDelivery('pickup')}>
                  <b>Olib ketish</b>
                  <small>Bepul</small>
                </button>
              </div>

              <div className="summary-rows">
                <div><span>Mahsulotlar</span><span>{formatMoney(subtotal)}</span></div>
                {promo && <div className="green"><span>Chegirma ({promo.percent}%)</span><span>− {formatMoney(discount)}</span></div>}
                <div><span>Yetkazib berish</span><span>{deliveryFee ? formatMoney(deliveryFee) : 'Bepul'}</span></div>
                <div className="total"><span>Jami summa</span><span>{formatMoney(total)}</span></div>
              </div>

              <button type="submit" className="btn btn-gradient btn-block" disabled={submitting}>
                {submitting ? 'Yuborilmoqda...' : 'Buyurtma berish'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
