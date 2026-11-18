import { useState } from 'react'
import { formatMoney } from '../api.js'
import { useStore } from '../store.jsx'

export default function OrderCard({ order }) {
  const { cancelOrder, toast } = useStore()
  const [busy, setBusy] = useState(false)
  const items = order.items.map((i) => `${i.name} (${i.qty}x)`).join(', ')
  const cancelled = order.status === 'Bekor qilindi'

  async function onCancel() {
    if (busy || !confirm(`#${order.id} buyurtmani bekor qilasizmi?`)) return
    setBusy(true)
    try {
      await cancelOrder(order)
      toast(`#${order.id} buyurtma bekor qilindi`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`order ${cancelled ? 'is-cancelled' : ''}`}>
      <div className="order-top">
        <b>
          #{order.id} — {order.customerName}
        </b>
        <span className={`status ${cancelled ? 'status-cancelled' : ''}`}>{order.status}</span>
      </div>
      <p className="muted order-items">{items}</p>
      <div className="order-bottom">
        <span className="muted">{order.delivery === 'courier' ? 'Kuryer orqali' : "Do'kondan olib ketish"}</span>
        <span className="order-actions">
          {order.status === 'Qabul qilindi' && (
            <button type="button" className="link-danger" onClick={onCancel} disabled={busy}>
              {busy ? '...' : 'Bekor qilish'}
            </button>
          )}
          <b>{formatMoney(order.total)}</b>
        </span>
      </div>
    </div>
  )
}
