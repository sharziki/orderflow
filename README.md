# OrderFlow 🍔

**Production-ready restaurant online ordering SaaS** — a modern Owner.com alternative you can self-host or deploy to Vercel.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)
![Stripe](https://img.shields.io/badge/Stripe-Connect-635BFF)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [License](#-license)

---

## 🎯 Overview

OrderFlow is a multi-tenant SaaS platform that allows restaurants to accept online orders. Each restaurant gets their own branded storefront, dashboard, and Stripe-connected payment processing.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                       OrderFlow Platform                            │
├─────────────────────────────────────────────────────────────────────┤
│  Landing Page      │  Restaurant Dashboard   │  Platform Admin      │
│  (orderflow.io)    │  (/dashboard)           │  (/admin/dashboard)  │
├─────────────────────────────────────────────────────────────────────┤
│                     Customer Storefronts                            │
│   joes-pizza.orderflow.io  │  marios-cafe.orderflow.io             │
├─────────────────────────────────────────────────────────────────────┤
│  Stripe Connect    │  DoorDash Drive   │  Resend Email   │  GHL CRM │
└─────────────────────────────────────────────────────────────────────┘
```

### Business Model

- **Platform Fee:** 2.9% per transaction (configurable per tenant)
- **Subscription Plans:** Starter ($49/mo), Pro ($99/mo), Enterprise (custom)
- **Automatic Payouts:** Via Stripe Connect to restaurant accounts

---

## ✨ Features

### For Restaurants
| Feature | Description |
|---------|-------------|
| 🍽️ **Menu Management** | Categories, items, modifiers, variants, multiple images |
| 📱 **Beautiful Storefronts** | Mobile-first, multiple templates (Modern, Slice, etc.) |
| 💳 **Stripe Payments** | Secure card payments via Stripe Connect |
| 🚗 **DoorDash Delivery** | Integrated DoorDash Drive API for delivery |
| 📊 **Order Dashboard** | Real-time order management with status updates |
| ⚙️ **Full Customization** | Colors, hours, fees, tax rates, branding |
| 📧 **Email Notifications** | Automatic order confirmations & alerts |
| 📱 **SMS Notifications** | Twilio integration for SMS alerts |
| 🎁 **Gift Cards** | Sell and redeem digital gift cards |
| 🏷️ **Promo Codes** | Percent/fixed discounts with rules |
| ⭐ **Loyalty Program** | Points-based customer rewards |
| 🥗 **Allergen Filtering** | Mark allergens on menu items |
| ⏰ **Scheduled Orders** | Accept future-date orders |
| 🛒 **Abandoned Cart Recovery** | Email recovery for incomplete orders |

### For Platform Owners
| Feature | Description |
|---------|-------------|
| 🏢 **Multi-tenant** | One codebase, unlimited restaurants |
| 💰 **Revenue Share** | Automatic platform fees via Stripe Connect |
| 📧 **Email System** | Transactional emails via Resend |
| 🔐 **Secure Auth** | JWT sessions with httpOnly cookies |
| 📈 **Admin Dashboard** | View all tenants, orders, revenue |
| ⚡ **Rate Limiting** | Built-in API protection (Upstash Redis) |
| 🔒 **CSRF Protection** | Middleware-based origin checks |
| 🌐 **Subdomain Routing** | Automatic slug-based routing |

---

## 🛠️ Tech Stack

### Core Framework
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript 5** | Type-safe development |
| **React 18** | UI library with server components |

### Database & ORM
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database (Supabase/Neon/Vercel) |
| **Prisma 5** | Type-safe ORM with migrations |

### Payments & Integrations
| Technology | Purpose |
|------------|---------|
| **Stripe Connect** | Payment processing & marketplace payouts |
| **DoorDash Drive** | Delivery integration |
| **Resend** | Transactional emails |
| **Twilio** | SMS notifications |
| **Go High Level** | CRM integration |
| **Google Maps** | Address autocomplete |

### UI & Styling
| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Framer Motion** | Animations |
| **Lucide Icons** | Icon library |
| **Recharts** | Analytics charts |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Vercel** | Hosting & edge functions |
| **Upstash Redis** | Rate limiting |
| **AWS S3 / R2** | Image storage |
| **Supabase Storage** | Alternative image storage |

---

## 📁 Project Structure

```
orderflow/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── menu/                 # Menu CRUD
│   │   ├── orders/               # Order management
│   │   ├── settings/             # Tenant settings
│   │   ├── webhooks/             # Stripe & DoorDash webhooks
│   │   └── ...
│   ├── dashboard/                # Restaurant dashboard pages
│   ├── admin/                    # Platform admin pages
│   ├── store/[slug]/             # Customer storefront
│   ├── login/                    # Authentication pages
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── store-templates/          # Storefront templates
│   ├── menu-layouts/             # Menu display layouts
│   └── ...
│
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── db.ts                     # Prisma client
│   ├── stripe-fees.ts            # Fee calculations
│   ├── doordash.ts               # DoorDash integration
│   ├── email.ts                  # Email sending
│   ├── gohighlevel.ts            # GHL CRM integration
│   ├── rate-limit.ts             # Rate limiting
│   └── ...
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── public/                       # Static assets
├── docs/                         # Documentation
└── middleware.ts                 # Request middleware
```

### Key Directories Explained

| Directory | Purpose |
|-----------|---------|
| `app/api/` | All REST API endpoints |
| `app/dashboard/` | Restaurant owner dashboard |
| `app/admin/` | Platform admin panel |
| `app/store/[slug]/` | Customer-facing storefronts |
| `components/ui/` | Reusable UI components |
| `lib/` | Business logic & integrations |
| `prisma/` | Database schema & migrations |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Supabase, Neon, or local)
- Stripe account with Connect enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/orderflow.git
cd orderflow

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Push database schema
npx prisma db push

# 6. (Optional) Seed demo data
npx prisma db seed

# 7. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🔐 Environment Variables

Create a `.env.local` file with these variables:

```env
# ==========================================
# DATABASE (Required)
# ==========================================
DATABASE_URL="postgresql://user:password@host:5432/database"

# ==========================================
# AUTH (Required)
# ==========================================
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"

# ==========================================
# APP URL (Required)
# ==========================================
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ==========================================
# STRIPE (Required for payments)
# ==========================================
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ==========================================
# EMAIL (Required for notifications)
# ==========================================
RESEND_API_KEY="re_..."
FROM_EMAIL="OrderFlow <noreply@yourdomain.com>"

# ==========================================
# ADMIN ACCESS (Required)
# ==========================================
ADMIN_EMAILS="admin@yourdomain.com"

# ==========================================
# OPTIONAL - Image Uploads (S3/R2)
# ==========================================
# S3_ENDPOINT="https://account.r2.cloudflarestorage.com"
# S3_ACCESS_KEY_ID="..."
# S3_SECRET_ACCESS_KEY="..."
# S3_BUCKET="orderflow"
# S3_PUBLIC_URL="https://cdn.yourdomain.com"

# ==========================================
# OPTIONAL - Rate Limiting (Upstash)
# ==========================================
# UPSTASH_REDIS_REST_URL="https://..."
# UPSTASH_REDIS_REST_TOKEN="..."
```

See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for detailed setup instructions.

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection String
3. Copy the URI and set as `DATABASE_URL`

### Option 2: Neon

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string from dashboard
3. Set as `DATABASE_URL`

### Option 3: Local PostgreSQL

```bash
# Create database
createdb orderflow

# Set connection string
DATABASE_URL="postgresql://localhost:5432/orderflow"
```

### Run Migrations

```bash
# Push schema to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

---

## 💻 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Playwright tests
npm run test:headed  # Run tests with visible browser
```

### Database Tools

```bash
npx prisma studio    # Visual database browser
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Push schema changes
npx prisma db seed   # Seed demo data
```

### Testing

We use Playwright for end-to-end testing:

```bash
npm run test              # Run all tests
npm run test:ui           # Run with UI mode
npm run test:headed       # See the browser
npm run test:report       # View test report
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/orderflow)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Post-Deployment

1. Set environment variables in Vercel dashboard
2. Add custom domain(s)
3. Configure wildcard subdomain (`*.yourdomain.com`)
4. Set up Stripe webhook: `https://yourdomain.com/api/webhooks/stripe`

See [DEPLOY.md](DEPLOY.md) for complete deployment guide.

---

## 📡 API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password |

### Menu Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/menu/categories` | GET, POST | List/create categories |
| `/api/menu/categories/[id]` | GET, PUT, DELETE | Manage category |
| `/api/menu/items` | GET, POST | List/create items |
| `/api/menu/items/[id]` | GET, PUT, DELETE | Manage item |
| `/api/menu/modifiers` | GET, POST | List/create modifiers |

### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET, POST | List/create orders |
| `/api/orders/[orderId]` | GET, PUT | Get/update order |
| `/api/orders/[orderId]/delivery` | POST | Request DoorDash delivery |
| `/api/orders/[orderId]/refund` | POST | Issue refund |

### Store
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/store/[slug]` | GET | Get store data |
| `/api/store/[slug]/reviews` | GET, POST | Store reviews |

### Webhooks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/stripe` | POST | Stripe events |
| `/api/doordash/webhook` | POST | DoorDash status updates |

See [docs/API.md](docs/API.md) for complete API documentation.

---

## 🏗️ Architecture

### Request Flow

```
Customer Order Flow:
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│ Browser │───▶│ Middleware  │───▶│ API Route   │───▶│ Prisma  │
└─────────┘    └─────────────┘    └─────────────┘    └─────────┘
                    │                   │                  │
                    ▼                   ▼                  ▼
              CSRF Check          Rate Limit         PostgreSQL
              Subdomain           Validation
               Routing
```

### Payment Flow

```
┌──────────┐     ┌────────┐     ┌─────────────┐     ┌────────────┐
│ Customer │────▶│ Stripe │────▶│ Platform    │────▶│ Restaurant │
│ $100.00  │     │        │     │ Fee: $2.90  │     │ Gets: $97.10│
└──────────┘     └────────┘     └─────────────┘     └────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & data flow |
| [docs/API.md](docs/API.md) | Complete API documentation |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Key components explained |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema & relationships |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | Stripe, DoorDash, GHL setup |
| [DEPLOY.md](DEPLOY.md) | Deployment guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues & fixes |

---

## 🔐 Security Features

- **JWT Authentication** with httpOnly cookies
- **CSRF Protection** via origin header checks
- **Rate Limiting** with Upstash Redis
- **Input Sanitization** for all user input
- **Webhook Signature Verification** for Stripe & DoorDash
- **Password Hashing** with bcrypt (12 rounds)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-location support for chains
- [ ] Kitchen display system (KDS)
- [ ] POS integration
- [ ] Table ordering via QR codes
- [ ] Advanced analytics dashboard
- [ ] White-label mobile apps

---

## 📄 License

MIT — use it however you want.

---

**Built with ❤️ as an Owner.com alternative**

Questions? Open an issue or reach out at support@orderflow.io
