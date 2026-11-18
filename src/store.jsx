import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const GUEST_KEY = 'tb_guest'
const CODES_KEY = 'tb_order_codes'

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v ?? fallback
  } catch {
    return fallback
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function cleanCart(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((i) => ({ productId: Number(i?.productId), qty: Math.floor(Number(i?.qty)) }))
    .filter((i) => Number.isFinite(i.productId) && Number.isFinite(i.qty) && i.qty > 0)
}
function cleanFavs(raw) {
  return Array.isArray(raw) ? [...new Set(raw.map(Number).filter(Number.isFinite))] : []
}

function mergeCarts(a, b) {
  const m = new Map()
  for (const i of [...a, ...b]) m.set(i.productId, (m.get(i.productId) || 0) + i.qty)
  return [...m].map(([productId, qty]) => ({ productId, qty }))
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [productsError, setProductsError] = useState('')
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [orders, setOrders] = useState([])
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t.slice(-3), { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const data = await api('/products')
      setProducts(data.products)
      setProductsError('')
    } catch (e) {
      setProductsError(e.message)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    // logged-in users see only their own orders; guests see the ones placed from this browser
    const codes = getToken() ? [] : readJSON(CODES_KEY, [])
    try {
      const q = codes.length ? `?codes=${encodeURIComponent(codes.join(','))}` : ''
      if (!getToken() && !codes.length) return setOrders([])
      const data = await api(`/orders${q}`)
      setOrders(data.orders)
    } catch {
      /* orders are secondary info; keep previous list */
    }
  }, [])

  // ---------- boot ----------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadProducts()
      const token = getToken()
      let restored = false
      if (token) {
        try {
          const [{ user }, state] = await Promise.all([api('/auth/me'), api('/me/state')])
          if (cancelled) return
          setUser(user)
          setCart(cleanCart(state.cart))
          setFavorites(cleanFavs(state.favorites))
          restored = true
        } catch (e) {
          if (e.status === 401) setToken(null)
        }
      }
      if (!restored && !cancelled) {
        const guest = readJSON(GUEST_KEY, {})
        setCart(cleanCart(guest.cart))
        setFavorites(cleanFavs(guest.favorites))
      }
      if (!cancelled) {
        setReady(true)
        loadOrders()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadProducts, loadOrders])

  // ---------- keep cart within real stock ----------
  useEffect(() => {
    if (!ready || !products.length) return
    setCart((prev) => {
      let changed = false
      const next = []
      for (const item of prev) {
        const p = products.find((x) => x.id === item.productId)
        const qty = p ? Math.min(item.qty, p.stock) : 0
        if (qty !== item.qty) changed = true
        if (qty > 0) next.push({ ...item, qty })
      }
      return changed ? next : prev
    })
  }, [products, ready])

  // ---------- persistence ----------
  const syncErrorShown = useRef(false)
  const manualLogout = useRef(false)
  useEffect(() => {
    if (!ready) return
    if (!user) {
      writeJSON(GUEST_KEY, { cart, favorites })
      return
    }
    const t = setTimeout(() => {
      Promise.all([api('/me/cart', { method: 'PUT', body: { cart } }), api('/me/favorites', { method: 'PUT', body: { favorites } })])
        .then(() => {
          syncErrorShown.current = false
        })
        .catch((e) => {
          if (e.status === 401) {
            setToken(null)
            setUser(null)
            toast('Sessiya tugadi, qaytadan kiring', 'error')
          } else if (!syncErrorShown.current) {
            syncErrorShown.current = true
            toast("Savatni serverga saqlab bo'lmadi", 'error')
          }
        })
    }, 300)
    return () => clearTimeout(t)
  }, [cart, favorites, user, ready, toast])

  // ---------- auth ----------
  const finishAuth = useCallback(
    async ({ token, user }, remember) => {
      setToken(token, remember)
      manualLogout.current = false
      let server = { cart: [], favorites: [] }
      try {
        server = await api('/me/state', { token })
      } catch {
        /* fall back to guest data only */
      }
      const guest = readJSON(GUEST_KEY, {})
      // single batched update: user + merged data
      setUser(user)
      setCart(mergeCarts(cleanCart(server.cart), cleanCart(guest.cart)))
      setFavorites(cleanFavs([...(server.favorites || []), ...(guest.favorites || [])]))
      writeJSON(GUEST_KEY, { cart: [], favorites: [] })
      loadOrders()
    },
    [loadOrders],
  )

  const login = useCallback(
    async (email, password, remember) => {
      const data = await api('/auth/login', { method: 'POST', body: { email, password }, token: null })
      await finishAuth(data, remember)
      return data.user
    },
    [finishAuth],
  )

  const register = useCallback(
    async (form) => {
      const data = await api('/auth/register', { method: 'POST', body: form, token: null })
      await finishAuth(data, true)
      return data.user
    },
    [finishAuth],
  )

  const logout = useCallback(() => {
    manualLogout.current = true
    setToken(null)
    setUser(null)
    setCart([])
    setFavorites([])
    setOrders([])
    loadOrders()
    toast('Hisobdan chiqdingiz')
  }, [loadOrders, toast])

  const updateProfile = useCallback(async (form) => {
    const { user } = await api('/auth/me', { method: 'PATCH', body: form })
    setUser(user)
    return user
  }, [])

  // ---------- cart & favorites ----------
  const productById = useCallback((id) => products.find((p) => p.id === id), [products])

  const addToCart = useCallback(
    (id) => {
      const p = productById(id)
      if (!p || p.stock <= 0) return toast('Bu mahsulot tugagan', 'error')
      const inCart = cart.find((i) => i.productId === id)?.qty || 0
      if (inCart >= p.stock) return toast(`Omborda faqat ${p.stock} ta bor`, 'error')
      setCart((prev) =>
        inCart ? prev.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { productId: id, qty: 1 }],
      )
      toast(`${p.name} savatga qo'shildi`, 'success')
    },
    [cart, productById, toast],
  )

  const setQty = useCallback(
    (id, qty) => {
      const p = productById(id)
      if (!p) return
      const q = Math.max(0, Math.min(Math.floor(qty), p.stock))
      if (qty > p.stock) toast(`Omborda faqat ${p.stock} ta bor`, 'error')
      setCart((prev) => (q === 0 ? prev.filter((i) => i.productId !== id) : prev.map((i) => (i.productId === id ? { ...i, qty: q } : i))))
    },
    [productById, toast],
  )

  const removeFromCart = useCallback((id) => setCart((prev) => prev.filter((i) => i.productId !== id)), [])
  const clearCart = useCallback(() => setCart([]), [])

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  // ---------- orders ----------
  const placeOrder = useCallback(
    async (form) => {
      try {
        const data = await api('/orders', { method: 'POST', body: { ...form, items: cart } })
        setProducts(data.products)
        setCart([])
        if (!user) {
          const codes = readJSON(CODES_KEY, [])
          writeJSON(CODES_KEY, [data.order.code, ...codes].slice(0, 50))
        }
        setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)])
        return data.order
      } catch (e) {
        if (e.status === 409 && e.data.products) setProducts(e.data.products)
        throw e
      }
    },
    [cart, user],
  )

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartLines = useMemo(
    () =>
      cart
        .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
        .filter((l) => l.product),
    [cart, products],
  )

  const value = {
    ready,
    user,
    products,
    productsError,
    loadProducts,
    cart,
    cartLines,
    cartCount,
    favorites,
    orders,
    toasts,
    toast,
    login,
    register,
    logout,
    updateProfile,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    toggleFavorite,
    placeOrder,
    loadOrders,
    manualLogout,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  return useContext(StoreCtx)
}
