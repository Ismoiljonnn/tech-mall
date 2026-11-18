import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { formatPhone, isValidPhone } from '../api.js'
import { ArrowLeft } from '../icons.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function safeNext(params) {
  const n = params.get('next') || '/'
  return n.startsWith('/') && !n.startsWith('//') ? n : '/'
}

function Field({ label, error, ...input }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input className={error ? 'invalid' : ''} {...input} />
      {error && <span className="error small">{error}</span>}
    </label>
  )
}

function AuthShell({ pill, title, subtitle, children, footer }) {
  return (
    <main className="container page auth-page">
      <section className="card auth-card">
        <div className="auth-top">
          <span className="pill">{pill}</span>
          <Link to="/" className="btn btn-outline btn-sm">
            <ArrowLeft size={15} /> Do'konga qaytish
          </Link>
        </div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth-footer muted">{footer}</p>
      </section>
    </main>
  )
}

export function Login() {
  const { login, user, toast } = useStore()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const next = safeNext(params)

  if (user && !busy) return <Navigate to={next} replace />

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    const errs = {}
    if (!EMAIL_RE.test(email.trim())) errs.email = "Elektron pochta noto'g'ri"
    if (!password) errs.password = 'Parolni kiriting'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await login(email.trim(), password, remember)
      toast(`Xush kelibsiz, ${u.name.split(' ')[0]}!`, 'success')
      navigate(next, { replace: true })
    } catch (err) {
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      pill="Kirish"
      title="Hisobga kirish"
      subtitle="Buyurtmalaringiz va savatingizni ko'rish uchun hisobingizga kiring."
      footer={<>Hisobingiz yo'qmi? <Link to={`/register${params.toString() ? `?${params}` : ''}`}>Ro'yxatdan o'tish</Link></>}
    >
      <form onSubmit={submit} noValidate className="auth-form">
        <Field label="Elektron pochta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="azizbek@example.com" autoComplete="email" error={errors.email} />
        <Field label="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parolingiz" autoComplete="current-password" error={errors.password} />
        <label className="checkbox">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Meni eslab qol
        </label>
        {formError && <p className="error form-error">{formError}</p>}
        <button type="submit" className="btn btn-dark btn-block" disabled={busy}>
          {busy ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const { register, user, toast } = useStore()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const next = safeNext(params)

  if (user && !busy) return <Navigate to={next} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'phone' ? formatPhone(e.target.value) : e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    const errs = {}
    if (form.name.trim().length < 2) errs.name = "Ism kamida 2 ta belgidan iborat bo'lsin"
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Elektron pochta noto'g'ri"
    if (!isValidPhone(form.phone)) errs.phone = "Telefon raqam noto'g'ri (+998 XX XXX XX XX)"
    if (form.password.length < 6) errs.password = "Parol kamida 6 ta belgi bo'lsin"
    if (form.confirm !== form.password) errs.confirm = 'Parollar mos kelmadi'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password })
      toast(`Hisob yaratildi. Xush kelibsiz, ${u.name.split(' ')[0]}!`, 'success')
      navigate(next, { replace: true })
    } catch (err) {
      if (err.data?.errors) setErrors(err.data.errors)
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      pill="Ro'yxatdan o'tish"
      title="Yangi hisob yaratish"
      subtitle="Tezkor buyurtma berish va sevimlilarni saqlash uchun ro'yxatdan o'ting."
      footer={<>Allaqachon hisobingiz bormi? <Link to={`/login${params.toString() ? `?${params}` : ''}`}>Kirish</Link></>}
    >
      <form onSubmit={submit} noValidate className="auth-form">
        <Field label="To'liq ism" value={form.name} onChange={set('name')} placeholder="Azizbek Karimov" autoComplete="name" error={errors.name} />
        <div className="two-col">
          <Field label="Elektron pochta" type="email" value={form.email} onChange={set('email')} placeholder="azizbek@example.com" autoComplete="email" error={errors.email} />
          <Field label="Telefon raqam" value={form.phone} onChange={set('phone')} onFocus={() => !form.phone && setForm((f) => ({ ...f, phone: '+998 ' }))} placeholder="+998 90 123 45 67" inputMode="tel" autoComplete="tel" error={errors.phone} />
        </div>
        <div className="two-col">
          <Field label="Parol" type="password" value={form.password} onChange={set('password')} placeholder="Kamida 6 ta belgi" autoComplete="new-password" error={errors.password} />
          <Field label="Parolni takrorlang" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Parolni qayta kiriting" autoComplete="new-password" error={errors.confirm} />
        </div>
        {formError && <p className="error form-error">{formError}</p>}
        <button type="submit" className="btn btn-dark btn-block" disabled={busy}>
          {busy ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish"}
        </button>
      </form>
    </AuthShell>
  )
}
