import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import ProductCard from '../components/ProductCard.jsx'
import OrderCard from '../components/OrderCard.jsx'
import { CATEGORY_LABELS } from '../api.js'
import { Close, Heart, Search } from '../icons.jsx'

const SORTS = {
  default: 'Standart',
  'price-asc': 'Arzonroq',
  'price-desc': 'Qimmatroq',
  rating: "Reyting bo'yicha",
}

export default function Home() {
  const { products, productsError, loadProducts, favorites, orders, ready } = useStore()
  const [params, setParams] = useSearchParams()

  const q = (params.get('q') || '').trim()
  const cat = CATEGORY_LABELS[params.get('cat')] ? params.get('cat') : 'all'
  const favOnly = params.get('fav') === '1'
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'default'

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value === null || value === '' || value === 'all' || value === 'default') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const list = useMemo(() => {
    const needle = q.toLowerCase()
    let out = products.filter(
      (p) =>
        (cat === 'all' || p.category === cat) &&
        (!favOnly || favorites.includes(p.id)) &&
        (!needle || p.name.toLowerCase().includes(needle) || p.specs.toLowerCase().includes(needle)),
    )
    if (sort === 'price-asc') out = [...out].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') out = [...out].sort((a, b) => b.price - a.price)
    if (sort === 'rating') out = [...out].sort((a, b) => b.rating - a.rating)
    return out
  }, [products, q, cat, favOnly, favorites, sort])

  return (
    <main className="container page">
      <section className="card toolbar">
        <div className="chips">
          {['all', ...Object.keys(CATEGORY_LABELS)].map((c) => (
            <button key={c} type="button" className={`chip ${cat === c ? 'active' : ''}`} onClick={() => update('cat', c)}>
              {c === 'all' ? 'Hammasi' : CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          {q && (
            <span className="search-chip">
              Qidiruv: "{q}"
              <button type="button" onClick={() => update('q', null)} aria-label="Qidiruvni tozalash">
                <Close size={14} />
              </button>
            </span>
          )}
          <button type="button" className={`btn btn-outline btn-sm ${favOnly ? 'active-fav' : ''}`} onClick={() => update('fav', favOnly ? null : '1')} aria-pressed={favOnly}>
            <Heart size={16} filled={favOnly} /> Faqat sevimlilar
          </button>
          <label className="select">
            <span>Saralash:</span>
            <select value={sort} onChange={(e) => update('sort', e.target.value)}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <span className="muted count">{list.length} ta mahsulot</span>
        </div>
      </section>

      {productsError ? (
        <section className="card empty">
          <p>{productsError}</p>
          <button type="button" className="btn btn-dark" onClick={loadProducts}>
            Qayta urinish
          </button>
        </section>
      ) : !ready ? (
        <div className="grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : list.length ? (
        <section className="grid">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </section>
      ) : (
        <section className="card empty">
          <span className="empty-icon">{favOnly && !q ? <Heart size={22} /> : <Search size={22} />}</span>
          <h3>{favOnly && !q ? "Sevimlilar ro'yxati bo'sh" : 'Mahsulot topilmadi'}</h3>
          <p className="muted">
            {q
              ? `"${q}" so'rovi bo'yicha mos mahsulot topilmadi. Boshqa so'z bilan urinib ko'ring.`
              : favOnly
                ? "Mahsulot kartasidagi yurakchani bosib sevimlilarga qo'shing."
                : "Bu bo'limda hozircha mahsulot yo'q."}
          </p>
          <button type="button" className="btn btn-dark" onClick={() => setParams({}, { replace: true })}>
            {q ? 'Qidiruvni tozalash' : 'Barcha mahsulotlar'}
          </button>
        </section>
      )}

      <section className="card orders-box">
        <h2>So'nggi buyurtmalar</h2>
        <p className="muted">Tasdiqlangan buyurtmalar ro'yxati</p>
        {orders.length ? (
          <div className="orders-grid">
            {orders.slice(0, 4).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        ) : (
          <p className="muted orders-empty">Hali buyurtma berilmagan.</p>
        )}
      </section>
    </main>
  )
}
