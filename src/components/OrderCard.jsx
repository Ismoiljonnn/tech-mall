import { formatMoney } from '../api.js'

export default function OrderCard({ order }) {
  const items = order.items.map((i) => `${i.name} (${i.qty}x)`).join(', ')
  return (
    <div className="order">
      <div className="order-top">
        <b>
          #{order.id} — {order.customerName}
        </b>
        <span className="status">{order.status}</span>
      </div>
      <p className="muted order-items">{items}</p>
      <div className="order-bottom">
        <span className="muted">{order.delivery === 'courier' ? 'Kuryer orqali' : "Do'kondan olib ketish"}</span>
        <b>{formatMoney(order.total)}</b>
      </div>
    </div>
  )
}
