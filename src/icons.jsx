const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 20, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} {...rest}>
      {children}
    </svg>
  )
}

export const Search = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
)
export const Heart = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
  </Svg>
)
export const Cart = (p) => (
  <Svg {...p}><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2.5 3.5h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.8H6.2" /></Svg>
)
export const User = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
)
export const Star = (p) => (
  <Svg {...p} fill="currentColor" stroke="none"><path d="m12 2.8 2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3L2.9 9.4l6.3-.8Z" /></Svg>
)
export const ArrowLeft = (p) => (
  <Svg {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></Svg>
)
export const Trash = (p) => (
  <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>
)
export const Close = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
)
export const Chevron = (p) => (
  <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
)
export const Logout = (p) => (
  <Svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /></Svg>
)
export const Box = (p) => (
  <Svg {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5Z" /><path d="m3 8 9 5 9-5M12 13v8" /></Svg>
)
export const Check = (p) => (
  <Svg {...p}><path d="m5 12 5 5 9-10" /></Svg>
)

export const Laptop = (p) => (
  <Svg {...p}><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></Svg>
)
export const Headphones = (p) => (
  <Svg {...p}><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="7" rx="1.5" /><rect x="17" y="14" width="4" height="7" rx="1.5" /></Svg>
)
export const Keyboard = (p) => (
  <Svg {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" /></Svg>
)
export const Watch = (p) => (
  <Svg {...p}><rect x="6" y="6" width="12" height="12" rx="3" /><path d="M9 6l1-4h4l1 4M9 18l1 4h4l1-4M12 10v2l1.5 1.5" /></Svg>
)
export const Mouse = (p) => (
  <Svg {...p}><rect x="6" y="3" width="12" height="18" rx="6" /><path d="M12 7v3" /></Svg>
)

const PRODUCT_ICONS = { laptop: Laptop, headphones: Headphones, keyboard: Keyboard, watch: Watch, mouse: Mouse }

export function ProductIcon({ name, ...p }) {
  const C = PRODUCT_ICONS[name] || Box
  return <C {...p} />
}
