# OrderFlow

**Production-ready restaurant online ordering SaaS** — an Owner.com alternative you can self-host or deploy to Vercel.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)
![Stripe](https://img.shields.io/badge/Stripe-Connect-635BFF)

## Features

### For Restaurants
- 🍽️ **Menu Management** — Categories, items, modifiers, images
- 📱 **Beautiful Storefront** — Mobile-first ordering experience
- 💳 **Stripe Payments** — Secure card payments via Stripe Connect
- 🚗 **DoorDash Delivery** — Integrated DoorDash Drive
- 📊 **Order Dashboard** — Real-time order management
- ⚙️ **Full Customization** — Colors, hours, fees, tax rates

### For Platform Owners
- 🏢 **Multi-tenant** — One codebase, unlimited restaurants
- 💰 **Revenue Share** — Automatic platform fees via Stripe Connect
- 📧 **Email Notifications** — Transactional emails via Resend
- 🔐 **Secure Auth** — JWT sessions, password reset
- 📈 **Admin Dashboard** — See all tenants, orders, revenue
- ⚡ **Rate Limiting** — Built-in API protection

## Quick Start

```bash
# Clone
git clone https://github.com/your-repo/orderflow
cd orderflow

# Install
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Push database schema
npx prisma db push

# Run
npm run dev
```

## Environment Variables

```env
# Database (Supabase, Neon, or any PostgreSQL)
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="your-32-char-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
ADMIN_EMAILS="admin@yourdomain.com"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OrderFlow Platform                      │
├─────────────────────────────────────────────────────────────┤
│  Landing Page    │  Restaurant Dashboard  │  Admin Panel    │
│  (orderflow.io)  │  (/dashboard)          │  (/admin)       │
├─────────────────────────────────────────────────────────────┤
│                    Customer Storefronts                      │
│         joes-pizza.orderflow.io  │  marios.orderflow.io     │
├─────────────────────────────────────────────────────────────┤
│  Stripe Connect  │  DoorDash Drive  │  Resend Email         │
└─────────────────────────────────────────────────────────────┘
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Restaurant dashboard |
| `/dashboard/menu` | Menu management |
| `/dashboard/orders` | Order management |
| `/dashboard/settings` | Settings (Stripe, DoorDash) |
| `/store/[slug]` | Customer ordering page |
| `/admin/dashboard` | Platform admin |
| `/forgot-password` | Password reset |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT (httpOnly cookies)
- **Payments:** Stripe Connect
- **Delivery:** DoorDash Drive API
- **Email:** Resend
- **UI:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion

## Deployment

See [CHECKLIST.md](./CHECKLIST.md) for complete deployment guide.

**Quick deploy to Vercel:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/orderflow)

## Revenue Model

- **Platform Fee:** 2.9% per transaction (configurable)
- **Subscription Plans:** Starter ($49/mo), Pro ($99/mo), Enterprise (custom)

Platform fees are automatically collected via Stripe Connect's `application_fee_amount`.

## API Reference

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/auth/forgot-password` — Request reset
- `POST /api/auth/reset-password` — Reset password

### Tenants
- `POST /api/tenants` — Create restaurant (signup)
- `GET /api/settings` — Get settings
- `PUT /api/settings` — Update settings

### Menu
- `GET/POST /api/menu/categories` — Categories
- `GET/PUT/DELETE /api/menu/categories/[id]`
- `GET/POST /api/menu/items` — Menu items
- `GET/PUT/DELETE /api/menu/items/[id]`

### Orders
- `GET/POST /api/orders` — Orders
- `GET/PUT /api/orders/[orderId]`
- `POST /api/orders/[orderId]/delivery` — Request DoorDash

### Webhooks
- `POST /api/webhooks/stripe` — Stripe events
- `POST /api/doordash/webhook` — DoorDash status

## License

MIT — use it however you want.

---

Built with ❤️ as an Owner.com alternative.
