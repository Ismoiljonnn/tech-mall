import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db, save } from './db.js'

const PORT = Number(process.env.API_PORT) || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'texnobozor-dev-secret-change-me'
const DELIVERY_FEE = 30000
const PROMOS = { SALE10: 10 }
const CATEGORIES = ['noutbuklar', 'audio', 'aksessuarlar']

const app = express()
app.use(express.json({ limit: '100kb' }))

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// ---------- helpers ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (/^998\d{9}$/.test(digits)) return '+' + digits
  if (/^\d{9}$/.test(digits)) return '+998' + digits
  return null
}

function str(v) {
  return typeof v === 'string' ? v.trim() : ''
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt }
}

function sign(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })
}

function findProduct(id) {
  return db().products.find((p) => p.id === Number(id))
}

function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return []
  const merged = new Map()
  for (const item of raw) {
    const p = findProduct(item?.productId)
    const qty = Math.floor(Number(item?.qty))
    if (!p || !Number.isFinite(qty) || qty < 1) continue
    merged.set(p.id, (merged.get(p.id) || 0) + qty)
  }
  const out = []
  for (const [productId, qty] of merged) {
    const p = findProduct(productId)
    const clamped = Math.min(qty, p.stock)
    if (clamped > 0) out.push({ productId, qty: clamped })
  }
  return out
}

function sanitizeFavorites(raw) {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map(Number))].filter((id) => findProduct(id))
}

function publicOrder(o) {
  const { userId: _userId, ...rest } = o
  return rest
}

// ---------- auth middleware ----------
function readUser(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  try {
    const { sub } = jwt.verify(token, JWT_SECRET)
    return db().users.find((u) => u.id === sub) || null
  } catch {
    return null
  }
}

function optionalAuth(req, _res, next) {
  req.user = readUser(req)
  next()
}

function requireAuth(req, _res, next) {
  req.user = readUser(req)
  if (!req.user) return next(new HttpError(401, 'Avval tizimga kiring'))
  next()
}

// ---------- auth ----------
app.post('/api/auth/register', (req, res) => {
  const name = str(req.body?.name)
  const email = str(req.body?.email).toLowerCase()
  const phone = normalizePhone(req.body?.phone)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  const errors = {}
  if (name.length < 2) errors.name = "Ism kamida 2 ta belgidan iborat bo'lsin"
  if (!EMAIL_RE.test(email)) errors.email = "Elektron pochta noto'g'ri"
  if (!phone) errors.phone = "Telefon raqam noto'g'ri (+998 XX XXX XX XX)"
  if (password.length < 6) errors.password = "Parol kamida 6 ta belgi bo'lsin"
  if (!errors.email && db().users.some((u) => u.email === email)) {
    errors.email = "Bu pochta bilan allaqachon ro'yxatdan o'tilgan"
  }
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Ma'lumotlarni tekshiring", errors })
  }

  const user = {
    id: db().nextUserId++,
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    cart: [],
    favorites: [],
    createdAt: new Date().toISOString(),
  }
  db().users.push(user)
  save()
  res.status(201).json({ token: sign(user), user: publicUser(user) })
})

app.post('/api/auth/login', (req, res) => {
  const email = str(req.body?.email).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const user = db().users.find((u) => u.email === email)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: "Pochta yoki parol noto'g'ri" })
  }
  res.json({ token: sign(user), user: publicUser(user) })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const name = str(req.body?.name)
  const phone = normalizePhone(req.body?.phone)
  const errors = {}
  if (name.length < 2) errors.name = "Ism kamida 2 ta belgidan iborat bo'lsin"
  if (!phone) errors.phone = "Telefon raqam noto'g'ri (+998 XX XXX XX XX)"
  if (Object.keys(errors).length) return res.status(400).json({ message: "Ma'lumotlarni tekshiring", errors })
  req.user.name = name
  req.user.phone = phone
  save()
  res.json({ user: publicUser(req.user) })
})

// ---------- products ----------
app.get('/api/products', (_req, res) => {
  res.json({ products: db().products, categories: CATEGORIES })
})

app.get('/api/products/:id', (req, res, next) => {
  const p = findProduct(req.params.id)
  if (!p) return next(new HttpError(404, 'Mahsulot topilmadi'))
  res.json({ product: p })
})

// ---------- per-user cart & favorites ----------
app.get('/api/me/state', requireAuth, (req, res) => {
  req.user.cart = sanitizeCart(req.user.cart)
  res.json({ cart: req.user.cart, favorites: sanitizeFavorites(req.user.favorites) })
})

app.put('/api/me/cart', requireAuth, (req, res) => {
  req.user.cart = sanitizeCart(req.body?.cart)
  save()
  res.json({ cart: req.user.cart })
})

app.put('/api/me/favorites', requireAuth, (req, res) => {
  req.user.favorites = sanitizeFavorites(req.body?.favorites)
  save()
  res.json({ favorites: req.user.favorites })
})

// ---------- promo ----------
app.post('/api/promo/validate', (req, res) => {
  const code = str(req.body?.code).toUpperCase()
  const percent = PROMOS[code]
  if (!percent) return res.status(404).json({ message: 'Promokod topilmadi yoki muddati tugagan' })
  res.json({ code, percent })
})

// ---------- orders ----------
app.post('/api/orders', optionalAuth, (req, res) => {
  const name = str(req.body?.name)
  const phone = normalizePhone(req.body?.phone)
  const delivery = req.body?.delivery === 'pickup' ? 'pickup' : req.body?.delivery === 'courier' ? 'courier' : null
  const promoCode = str(req.body?.promoCode).toUpperCase()
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : []

  const errors = {}
  if (name.length < 2) errors.name = 'Ismingizni kiriting'
  if (!phone) errors.phone = "Telefon raqam noto'g'ri (+998 XX XXX XX XX)"
  if (!delivery) errors.delivery = 'Yetkazib berish usulini tanlang'
  if (promoCode && !PROMOS[promoCode]) errors.promoCode = 'Promokod yaroqsiz'
  if (Object.keys(errors).length) return res.status(400).json({ message: "Ma'lumotlarni tekshiring", errors })

  // merge duplicate lines, validate quantities
  const wanted = new Map()
  for (const it of rawItems) {
    const qty = Math.floor(Number(it?.qty))
    const id = Number(it?.productId)
    if (!Number.isFinite(qty) || qty < 1) continue
    wanted.set(id, (wanted.get(id) || 0) + qty)
  }
  if (wanted.size === 0) return res.status(400).json({ message: "Savat bo'sh" })

  // validate everything BEFORE touching stock (all-or-nothing)
  const problems = []
  const lines = []
  for (const [id, qty] of wanted) {
    const p = findProduct(id)
    if (!p) {
      problems.push({ productId: id, message: 'Mahsulot mavjud emas' })
      continue
    }
    if (p.stock < qty) {
      problems.push({
        productId: id,
        available: p.stock,
        message: p.stock === 0 ? `${p.name} tugagan` : `${p.name}: omborda faqat ${p.stock} ta qoldi`,
      })
      continue
    }
    lines.push({ productId: p.id, name: p.name, price: p.price, qty, icon: p.icon, category: p.category })
  }
  if (problems.length) {
    return res.status(409).json({ message: problems.map((p) => p.message).join('; '), problems, products: db().products })
  }

  for (const l of lines) findProduct(l.productId).stock -= l.qty

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const discountPercent = promoCode ? PROMOS[promoCode] : 0
  const discount = Math.round((subtotal * discountPercent) / 100)
  const deliveryFee = delivery === 'courier' ? DELIVERY_FEE : 0

  const order = {
    id: db().nextOrderId++,
    code: crypto.randomBytes(12).toString('hex'),
    userId: req.user?.id ?? null,
    customerName: name,
    phone,
    delivery,
    items: lines,
    subtotal,
    promoCode: promoCode || null,
    discountPercent,
    discount,
    deliveryFee,
    total: subtotal - discount + deliveryFee,
    status: 'Qabul qilindi',
    createdAt: new Date().toISOString(),
  }
  db().orders.push(order)

  // clear the server-side cart of a logged-in buyer
  if (req.user) req.user.cart = []
  save()

  res.status(201).json({ order: publicOrder(order), products: db().products })
})

// logged-in: own orders. guest: orders whose secret codes it holds.
app.get('/api/orders', optionalAuth, (req, res) => {
  const codes = String(req.query.codes || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 50)
  const orders = db().orders.filter(
    (o) => (req.user && o.userId === req.user.id) || codes.includes(o.code),
  )
  orders.sort((a, b) => b.id - a.id)
  res.json({ orders: orders.map(publicOrder) })
})

// ---------- errors ----------
app.use('/api', (_req, res) => res.status(404).json({ message: 'Topilmadi' }))

// serve the built frontend in production
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: "Noto'g'ri so'rov" })
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ message: status === 500 ? 'Serverda xatolik' : err.message })
})

app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`))
