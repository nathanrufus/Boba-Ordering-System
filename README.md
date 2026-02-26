# Boba Bros Ordering System

A full-stack ordering system for **Boba Bros** with:
- Customer-facing menu + cart + checkout
- **Payment guidance** (E-Birr / CBE; optional Telebirr)
- Orders saved with **PENDING_VERIFICATION** status until staff confirms payment
- Admin panel for managing orders, items, categories, and option groups

---

## Features

### Customer App
- Browse menu by category
- Add items + options to cart
- Checkout with:
  - Customer details (name, phone, pickup/delivery, address)
  - Payment method selection
  - Payment instructions + “I Have Paid – Place Order”
- Order confirmation page (route-based):
  - Order number, total, payment method, status
  - Estimated ready time
  - WhatsApp message button

### Admin App
- Order list with filters (including **PENDING_VERIFICATION**)
- Order detail page with payment verification info
- Update order statuses (PENDING_VERIFICATION → PREPARING → DONE)
- Manage menu items, categories, option groups, options

---

## Payment Methods (Configured)

### E-Birr (Merchant Payment)
- Merchant Number: **
406108**
- Merchant Name: **Boba Bros**
- Amount: auto-filled from cart total
- Optional: Transaction ID
- Order status after submit: **PENDING_VERIFICATION**

### CBE Bank Transfer
- Account Number: **1000741111927**
- Account Name: **Boba Bros**
- Amount: auto-filled from cart total
- Required: **Transaction reference** (until screenshot upload is implemented)
- Order status after submit: **PENDING_VERIFICATION**

> Telebirr can be added once QR + merchant/wallet details are provided.

---

## Option Groups (Only Ones Used)

### `Sugar_level` (single, required)
Options (priceDelta = 0):
- No Sugar
- Less Sugar
- Normal Sugar
- Extra Sugar

### `ice_amout` (single, required)
Options (priceDelta = 0):
- No Ice (sortOrder 1)
- Less Ice (2)
- Normal Ice (3)
- Extra Ice (4)

---

## Order Statuses

- `PENDING_VERIFICATION` – user submitted payment, waiting for staff confirmation
- `PREPARING` – staff confirmed payment and started preparing
- `DONE` – ready / completed
- `CANCELLED` – cancelled by staff

---

## Menu Reference (from provided menu PDF)

### Milkshakes (With Boba Pearls) – **ETB 450**
- Vanilla Milkshake
- Lotus Biscoff Milkshake
- Mango Milkshake
- Nutella Milkshake
- Strawberry Milkshake
- Coffee Milkshake
- Blueberry Milkshake
- Pistachio Milkshake

### Boba Milk Teas (With Boba Pearls) – **ETB 350**
- Brown Sugar Bliss
- Watermelon Bliss Milk Tea
- Taro Delight
- Iced Buna Coffee with Caramel
- Thai Milk Tea
- Strawberry Milk Tea
- Mango Milk Tea
- Paapaya Milk Tea

### Fruit Teas (No Milk, Popping Boba) – **ETB 250**
- Strawberry Fruit tea
- Lychee fruit tea
- Pineapple fruit tea
- Passion fruit tea
- Mango Fruit tea

### Sides & Treats
- Strawberry Ice Cream – **ETB 300**
- Chocolate Ice Cream – **ETB 300**
- Vanilla Ice Cream – **ETB 300**
- Bubble waffle with biscof soft-serve – **ETB 500**

---

## Tech Stack

### Backend
- Node.js + Express
- Prisma ORM
- MySQL database

### Frontend
- React + React Router
- TanStack React Query
- TailwindCSS

---

## Project Setup

### 1) Install dependencies
From the backend folder:
```bash
npm install
```

From the frontend folder:
```bash
npm install
```

### 2) Configure environment variables

#### Backend `.env`
Set your MySQL connection string:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DB_NAME"
```

#### Frontend `.env` (Vite)
Set store WhatsApp number (digits only, no +, spaces):
```env
VITE_STORE_WHATSAPP_NUMBER=2519XXXXXXXX
```

### 3) Database migrations
From backend:
```bash
npx prisma migrate dev
npx prisma generate
```

(Optional) Prisma Studio:
```bash
npx prisma studio
```

### 4) Run the apps

Backend:
```bash
npm run dev
```

Frontend:
```bash
npm run dev
```

---

## API Endpoints (Key)

### Public
- `POST /api/orders` – create order (includes payment method + proof fields)
- `GET /api/orders/:orderNumber` – fetch order for confirmation page

### Admin
- `GET /api/admin/orders` – list orders (filters: status/from/to/page/limit)
- `GET /api/admin/orders/:id` – order details
- `PATCH /api/admin/orders/:id/status` – update status

---

## Validation Notes (Admin Orders Filter)

If you use Zod validation for query/status:
- Ensure `PENDING_VERIFICATION` is included in `allowedStatuses` for:
  - listOrders query schema
  - update status schema

---

## Roadmap (Optional Enhancements)
- Upload CBE payment screenshot proof (transaction reference OR screenshot required)
- Add Telebirr QR + merchant details
- Apply option groups only to drink categories (if desired)
- Admin “Confirm Payment” action (shortcut to set PREPARING)

---

## License
Internal project (Boba Bros).
