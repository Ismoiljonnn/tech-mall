import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { CATEGORY_LABELS, formatMoney } from '../api.js'
import { ArrowLeft, Cart, Heart, ProductIcon, Star } from '../icons.jsx'
import ProductCard from '../components/ProductCard.jsx'

export default function Product() {
  const { id } = useParams()
  const { products, ready, cart, addToCart, setQty, favorites, toggleFavorite } = useStore()
  if (!ready) return null
  const p = products.find((x) => x.id === Number(id))

  if (!p) {
    return (
      <main className="container page">
        <section className="card empty">
          <h3>Mahsulot topilmadi</h3>
          <p className="muted">Bu mahsulot mavjud emas yoki o'chirilgan.</p>
          <Link to="/" className="btn btn-dark">Do'konga qaytish</Link>
        </section>
      </main>
    )
  }

  const inCart = cart.find((i) => i.productId === p.id)?.qty || 0
  const fav = favorites.includes(p.id)
  const soldOut = p.stock <= 0
  const similar = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3)

  return (
    <main className="container page">
      <div>
        <Link to="/" className="btn btn-outline btn-sm"><ArrowLeft size={16} /> Do'konga qaytish</Link>
      </div>
      <section className="card detail">
        <div className="detail-media">
          <ProductIcon name={p.icon} size={140} strokeWidth={1.1} />
        </div>
        <div className="detail-info">
          <div className="product-meta">
            <span className="category">{CATEGORY_LABELS[p.category]}</span>
            <span className="rating"><Star size={15} /> {p.rating.toFixed(1)}</span>
          </div>
          <h1>{p.name}</h1>
          <ul className="specs">
            {p.specs.split('•').map((s) => <li key={s}>{s.trim()}</li>)}
          </ul>
          <b className="detail-price">{formatMoney(p.price)}</b>
          <span className={`stock-inline ${soldOut ? 'stock-out' : p.stock <= 2 ? 'stock-low' : 'stock-ok'}`}>
            {soldOut ? 'Tugagan' : `Omborda: ${p.stock} ta`}
          </span>
          <div className="detail-actions">
            {soldOut ? (
              <button type="button" className="btn btn-disabled" disabled>Mavjud emas</button>
            ) : inCart ? (
              <>
                <div className="qty qty-lg">
                  <button type="button" onClick={() => setQty(p.id, inCart - 1)} aria-label="Kamaytirish">−</button>
                  <span>{inCart}</span>
                  <button type="button" onClick={() => setQty(p.id, inCart + 1)} disabled={inCart >= p.stock} aria-label="Ko'paytirish">+</button>
                </div>
                <Link to="/cart" className="btn btn-dark">Savatga o'tish</Link>
              </>
            ) : (
              <button type="button" className="btn btn-dark" onClick={() => addToCart(p.id)}><Cart size={16} /> Savatga qo'shish</button>
            )}
            <button type="button" className={`btn btn-outline ${fav ? 'active-fav' : ''}`} onClick={() => toggleFavorite(p.id)} aria-pressed={fav}>
              <Heart size={16} filled={fav} /> {fav ? 'Sevimlilarda' : 'Sevimlilarga'}
            </button>
          </div>
        </div>
      </section>
      {similar.length > 0 && (
        <>
          <h2 className="section-title">O'xshash mahsulotlar</h2>
          <section className="grid">{similar.map((x) => <ProductCard key={x.id} product={x} />)}</section>
        </>
      )}
    </main>
  )
}
