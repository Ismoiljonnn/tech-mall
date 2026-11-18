import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data.json')

const SEED_PRODUCTS = [
  { id: 1, name: 'MacBook Air M2 13"', category: 'noutbuklar', specs: '8GB RAM • 256GB SSD • Space Gray', price: 12400000, rating: 4.9, stock: 5, icon: 'laptop' },
  { id: 2, name: 'Sony WH-1000XM5', category: 'audio', specs: 'Active Noise Cancelling • 30 soat batareya', price: 4200000, rating: 4.8, stock: 2, icon: 'headphones' },
  { id: 3, name: 'Keychron K2 Pro', category: 'aksessuarlar', specs: 'Mexanik klaviatura • Bluetooth / USB-C', price: 1350000, rating: 4.7, stock: 8, icon: 'keyboard' },
  { id: 4, name: 'Apple Watch Series 9', category: 'aksessuarlar', specs: '45mm Aluminium • GPS • Midnight', price: 5100000, rating: 4.8, stock: 4, icon: 'watch' },
  { id: 5, name: 'ASUS Zenbook 14 OLED', category: 'noutbuklar', specs: '16GB RAM • 512GB SSD • Core Ultra 5', price: 10800000, rating: 4.7, stock: 0, icon: 'laptop' },
  { id: 6, name: 'Logitech MX Master 3S', category: 'aksessuarlar', specs: '8000 DPI • Silent Click • Wireless', price: 1180000, rating: 4.9, stock: 6, icon: 'mouse' },
]

function seed() {
  return { products: SEED_PRODUCTS, users: [], orders: [], nextUserId: 1, nextOrderId: 1001 }
}

let state
try {
  state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
} catch {
  state = seed()
  save()
}

export function db() {
  return state
}

// Atomic write: write to temp file then rename, so a crash never leaves a half-written DB.
export function save() {
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, DB_FILE)
}
