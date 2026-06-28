# A7-Store — Backend API

A multi-tenant e-commerce backend that lets multiple independent store owners run their own shop, manage products and orders, and receive customer orders that get routed straight to WhatsApp. Built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**, with image storage on **Supabase Storage**.

## Overview

Each store is an isolated tenant: it has its own owner account(s), its own products, and its own orders — all scoped by `storeId`. Customers don't need an account; they browse a store's public storefront by its `slug` and check out as guests. When an order is placed, the backend can automatically generate a WhatsApp deep link so the store owner gets notified instantly.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js / Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` for password hashing |
| File uploads | `multer` (in-memory) → Supabase Storage |
| Deployment | Vercel |

## Data Model

```
Store
 ├── users[]        (owners/managers of this store)
 ├── products[]      (catalog items)
 └── orders[]         (customer orders)

Product
 ├── images[]          (ProductImage, ordered by sort_order)
 └── orderItems[]

Order
 └── items[]            (OrderItem — snapshot of price at purchase time)
```

### Store
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Display name |
| `slug` | String | Unique, used in public storefront URLs |
| `logo_url` | String? | Supabase public URL |
| `whatsapp_number` | String? | Used to build WhatsApp order links |

### User (store owner / manager)
| Field | Type | Notes |
|---|---|---|
| `email` | String | Unique **per store** (`@@unique([email, storeId])`) |
| `password` | String | Hashed with bcrypt |
| `role` | String | `ADMIN` \| `MANAGER` |
| `storeId` | String | FK → Store |

### Product
| Field | Type | Notes |
|---|---|---|
| `name`, `description` | String | |
| `price` | Float | Original price |
| `sale_price` | Float? | Optional discounted price |
| `stock` | Int | Inventory count |
| `is_available` | Boolean | Hides the product from the public storefront when `false` |
| `images[]` | ProductImage[] | Up to 3 per product |

**Limits enforced server-side:** max **15 products** per store, max **3 images** per product.

### Order / OrderItem
| Field | Type | Notes |
|---|---|---|
| `status` | String | `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` (or `CANCELLED`) |
| `customer_name/phone/address` | String | Captured at checkout, no account required |
| `totalPrice` | Float | Sum of all line items |
| `whatsapp_sent` | Boolean | Set when a WhatsApp link was generated |
| `OrderItem.price_at_purchase` | Float | Price snapshot — protects historical orders from later price changes |
| `OrderItem.seller_amount` | Float | Net amount owed to the seller after commission |

## Authentication

JWT-based. On register/login, the API returns a signed token containing `{ userId, storeId, role }`, valid for **7 days**. Protected routes use an `authenticate` middleware that reads `Authorization: Bearer <token>` and attaches `req.user`.

## API Reference

Base URL: `https://a7-store.vercel.app/api`

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Creates a new Store + its first ADMIN user in one transaction |
| POST | `/auth/login` | — | Returns a JWT for an existing user |

### Store
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/store/me` | Owner | Get the logged-in owner's store profile |
| PUT | `/store` | Owner | Update store name, slug, whatsapp number |
| POST | `/store/logo` | Owner | Upload/replace the store logo (multipart) |
| DELETE | `/store/logo` | Owner | Remove the store logo |
| GET | `/store/:slug` | — | Public store profile (used by the storefront) |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | Owner | List the owner's own products |
| POST | `/products` | Owner | Create a product (multipart, up to 3 images, field name `images`) |
| PUT | `/products/:id` | Owner | Update product fields (no image changes) |
| DELETE | `/products/:id` | Owner | Delete a product and its stored images |
| GET | `/store/:slug/products` | — | Public: list available products for a storefront |
| GET | `/store/:slug/products/:id` | — | Public: single product details |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/store/:slug/orders` | — | Customer places an order (guest checkout) |
| GET | `/dashboard/orders` | Owner | List the store's orders, optional `?status=` filter |
| PUT | `/orders/:id/status` | Owner | Update an order's status |

## Order Flow

1. Customer submits `{ customer_name, customer_phone, customer_address, notes, items: [{ productId, quantity }] }` to `POST /store/:slug/orders`.
2. The service validates stock and availability, computes `totalPrice` and `seller_amount` per item (commission-adjusted), and creates the order with its items in one transaction.
3. If the store has a `whatsapp_number`, a pre-filled WhatsApp message link is generated and returned in the response (`whatsapp_url`) so the storefront can deep-link the customer straight into a chat with the seller.
4. The owner reviews the order in their dashboard and transitions it through `PENDING → CONFIRMED → SHIPPED → DELIVERED`, or `CANCELLED` at any point.

## Environment Variables

```
DATABASE_URL=          # PostgreSQL connection string (pooled)
DIRECT_URL=            # PostgreSQL direct connection (for Prisma migrations)
JWT_SECRET=            # Secret used to sign auth tokens
SUPABASE_URL=
SUPABASE_KEY=
```

## Getting Started

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Deployment

Deployed on **Vercel**. Make sure all environment variables above are set in the project's Vercel dashboard before deploying, and that `DATABASE_URL` points to a pooled connection suitable for serverless functions.