const TOKEN_KEY = 'tb_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token, remember) {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    if (token) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    /* storage unavailable: session lives in memory only */
  }
}

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || 'Xatolik yuz berdi')
    this.status = status
    this.data = data || {}
  }
}

export async function api(path, { method = 'GET', body, token = getToken() } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, { message: "Server bilan aloqa yo'q. Internetni tekshiring." })
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export function formatMoney(n) {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`
}

// "+998 90 123 45 67" mask while typing
export function formatPhone(raw) {
  let d = String(raw).replace(/\D/g, '')
  if ('998'.startsWith(d)) return d ? '+' + d : '' // user is deleting the country code
  if (!d.startsWith('998')) d = '998' + d
  d = d.slice(0, 12)
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean)
  return '+' + parts.join(' ')
}

export function isValidPhone(v) {
  return /^998\d{9}$/.test(String(v).replace(/\D/g, ''))
}

export const CATEGORY_LABELS = {
  noutbuklar: 'Noutbuklar',
  audio: 'Audio',
  aksessuarlar: 'Aksessuarlar',
}
