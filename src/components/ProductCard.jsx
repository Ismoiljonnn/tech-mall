import { CATEGORY_LABELS, formatMoney } from '../api.js'
import { useStore } from '../store.jsx'
import { Cart, Heart, ProductIcon, Star } from '../icons.jsx'

export default function ProductCard({ product }) {
  const { favorites, toggleFavorite, addToCart, cart } = useStore()
  const fav = favorites.includes(product.id)
  const soldOut = product.stock <= 0
  const inCart = cart.find((i) => i.productId === product.id)?.qty || 0
  const maxed = !soldOut && inCart >= product.stock

  let stockClass = 'stock-ok'
  if (soldOut) stockClass = 'stock-out'
  else if (product.stock <= 2) stockClass = 'stock-low'

  return (
    <article className={`card product ${soldOut ? 'is-out' : ''}`}>
      <div className="product-media">
        <span className={`stock ${stockClass}`}>{soldOut ? 'Tugagan' : `Omborda: ${product.stock} ta`}</span>
        <button
          type="button"
          className={`fav ${fav ? 'is-fav' : ''}`}
          onClick={() => toggleFavorite(product.id)}
          aria-pressed={fav}
          aria-label={fav ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
        >
          <Heart size={17} filled={fav} />
        </button>
        <ProductIcon name={product.icon} size={64} strokeWidth={1.3} />
      </div>
      <div className="product-body">
        <div className="product-meta">
          <span className="category">{CATEGORY_LABELS[product.category] || product.category}</span>
          <span className="rating">
            <Star size={14} /> {product.rating.toFixed(1)}
          </span>
        </div>
        <h3>{product.name}</h3>
        <p className="muted">{product.specs}</p>
        <div className="product-foot">
          <b className="price">{formatMoney(product.price)}</b>
          {soldOut ? (
            <button type="button" className="btn btn-disabled" disabled>
              Mavjud emas
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => addToCart(product.id)}
              disabled={maxed}
              title={maxed ? 'Ombordagi barcha mahsulot savatda' : undefined}
            >
              <Cart size={16} /> {maxed ? 'Savatda' : inCart ? `Savatga (${inCart})` : 'Savatga'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
