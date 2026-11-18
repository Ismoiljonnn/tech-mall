# TexnoBozor (tech-mall)

An online electronics store built from the Figma design "TexnoBozor — UI Design". Frontend: React + Vite. Backend: Express (JSON file DB).

## Running it

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000 (Vite forwards `/api` to it)

Production: `npm run build && npm start`. Express then serves `dist/` as well.

## Features

- **Products**: categories (Noutbuklar, Audio, Aksessuarlar), search, sorting, "Faqat sevimlilar" filter, and an empty "Mahsulot topilmadi" state.
- **Stock**: the "Omborda: N ta" badge, "Tugagan" / "Mavjud emas" when sold out. You can't put more in the cart than is in stock.
- **Cart**: quantity, removing items, clearing the cart, the SALE10 promo code (10%), delivery (courier 30 000 so'm / pickup free).
- **Ordering**: the server recomputes prices itself and checks stock all-or-nothing. If stock runs short it returns 409 and the cart is updated.
- **Auth**: register/login (bcrypt + JWT, 7 days), "Meni eslab qol", profile editing.
- A guest's cart and favorites are kept in localStorage and merged with the server after login.
- **Profile menu**: Profilim, Buyurtmalarim, Sevimlilar, Chiqish.

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Log in |
| GET/PATCH | /api/auth/me | Profile |
| GET | /api/products | Products |
| GET | /api/me/state | Cart + favorites |
| PUT | /api/me/cart, /api/me/favorites | Save |
| POST | /api/promo/validate | Validate a promo code |
| POST | /api/orders | Place an order |
| GET | /api/orders | Orders |

The DB is created automatically in `server/data.json`. Deleting it resets the data.
