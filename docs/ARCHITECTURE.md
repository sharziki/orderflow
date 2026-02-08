# OrderFlow Architecture

This document describes the system architecture, design decisions, and data flow in OrderFlow.

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Request Flow](#request-flow)
- [Authentication & Authorization](#authentication--authorization)
- [Multi-tenancy](#multi-tenancy)
- [Payment Architecture](#payment-architecture)
- [Real-time Updates](#real-time-updates)
- [Caching Strategy](#caching-strategy)
- [Error Handling](#error-handling)
- [Security Architecture](#security-architecture)

---

## Overview

OrderFlow is a multi-tenant SaaS platform built with Next.js 14 using the App Router. It follows a serverless architecture optimized for Vercel deployment.

### Key Design Principles

1. **Multi-tenant by default** - All data is scoped to tenants
2. **API-first** - All features exposed via REST APIs
3. **Serverless-ready** - No persistent connections required
4. **Type-safe** - TypeScript throughout with Prisma
5. **Security-first** - CSRF, rate limiting, input sanitization

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Landing   │  │  Dashboard  │  │ Storefront  │  │   Admin     │       │
│  │    Page     │  │ (Restaurant)│  │ (Customer)  │  │   Panel     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MIDDLEWARE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Auth      │  │   CSRF      │  │  Subdomain  │  │   Rate      │       │
│  │   Check     │  │   Check     │  │   Routing   │  │   Limit     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API LAYER (Next.js)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   Auth   │ │   Menu   │ │  Orders  │ │ Settings │ │ Webhooks │         │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │   Auth   │ │  Stripe  │ │ DoorDash │ │  Email   │ │   GHL    │         │
│  │  Utils   │ │   Fees   │ │   API    │ │  Sender  │ │   CRM    │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │   Prisma ORM      │  │   Upstash Redis   │  │   Supabase/S3     │       │
│  │   (PostgreSQL)    │  │   (Rate Limit)    │  │   (File Storage)  │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Stripe  │ │ DoorDash │ │  Resend  │ │  Twilio  │ │  Google  │         │
│  │ Connect  │ │  Drive   │ │  (Email) │ │  (SMS)   │ │  Maps    │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### Customer Order Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────────┐
│ Customer │────▶│  Storefront  │────▶│ Add Items  │────▶│   Checkout   │
│ Visits   │     │ /store/slug  │     │  to Cart   │     │   Modal      │
└──────────┘     └──────────────┘     └────────────┘     └──────────────┘
                                                                │
     ┌──────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ POST /api/   │────▶│ Validate Order    │────▶│ Create Stripe     │
│ create-      │     │ - Items exist     │     │ PaymentIntent     │
│ payment-     │     │ - Min order met   │     │ (with platform    │
│ intent       │     │ - Promo valid     │     │  fee)             │
└──────────────┘     └───────────────────┘     └───────────────────┘
                                                        │
     ┌──────────────────────────────────────────────────┘
     │
     ▼
┌──────────────┐     ┌───────────────────┐     ┌───────────────────┐
│ Stripe       │────▶│ Webhook:          │────▶│ Send              │
│ Payment      │     │ payment_intent.   │     │ Notifications     │
│ Confirmation │     │ succeeded         │     │ (Email/SMS/GHL)   │
└──────────────┘     └───────────────────┘     └───────────────────┘
                              │
                              ▼
                     ┌───────────────────┐
                     │ Order appears in  │
                     │ Restaurant        │
                     │ Dashboard         │
                     └───────────────────┘
```

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐
│ Login    │────▶│ POST /api/   │────▶│ Verify         │
│ Form     │     │ auth/login   │     │ Password       │
└──────────┘     └──────────────┘     └────────────────┘
                                             │
     ┌───────────────────────────────────────┘
     │
     ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Create JWT     │────▶│ Set httpOnly   │────▶│ Redirect to    │
│ Token          │     │ Cookie         │     │ Dashboard      │
│ (7 day exp)    │     │ 'auth-token'   │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: string    // User's unique ID
  tenantId: string  // Restaurant's ID
  email: string     // User's email
  role: string      // owner | manager | staff
  iat: number       // Issued at timestamp
  exp: number       // Expiration (7 days)
}
```

### Authentication Layers

```
Layer 1: Middleware (middleware.ts)
├── Runs on every request
├── Checks auth-token cookie for dashboard/admin routes
├── Redirects to /login if not authenticated
└── Performs CSRF checks for API mutations

Layer 2: API Routes (lib/auth.ts)
├── getSession() - Verifies JWT and returns payload
├── getCurrentUser() - Gets user with tenant data
└── getCurrentTenant() - Gets tenant only
```

### Role-Based Access Control

```typescript
// User roles and permissions
const rolePermissions = {
  owner: {
    canViewOrders: true,
    canEditOrders: true,
    canEditMenu: true,
    canEditSettings: true,
    canViewAnalytics: true,
    canManageStaff: true,
  },
  manager: {
    canViewOrders: true,
    canEditOrders: true,
    canEditMenu: true,
    canEditSettings: false,
    canViewAnalytics: true,
    canManageStaff: false,
  },
  staff: {
    canViewOrders: true,
    canEditOrders: true,  // configurable
    canEditMenu: false,
    canEditSettings: false,
    canViewAnalytics: false,
    canManageStaff: false,
  },
}
```

---

## Multi-tenancy

### Tenant Isolation Strategy

All data is scoped by `tenantId`. Every database query must include the tenant filter:

```typescript
// ✅ Correct - Always filter by tenantId
const orders = await prisma.order.findMany({
  where: {
    tenantId: session.tenantId,  // REQUIRED
    status: 'pending',
  },
})

// ❌ Wrong - Missing tenant filter
const orders = await prisma.order.findMany({
  where: {
    status: 'pending',
  },
})
```

### Subdomain Routing

```
joes-pizza.orderflow.io  →  /store/joes-pizza
marios-cafe.orderflow.io →  /store/marios-cafe
orderflow.io/joes-pizza  →  /store/joes-pizza (main domain redirect)
```

**Middleware Logic:**

```typescript
// middleware.ts
if (!isMainDomain) {
  const subdomain = hostname.split('.')[0]
  // Rewrite subdomain to /store/[slug]
  return NextResponse.rewrite(new URL(`/store/${subdomain}`, request.url))
}
```

### Data Model Hierarchy

```
Tenant (Restaurant)
├── Users (Staff)
├── Menus
│   └── Categories
│       └── MenuItems
├── ModifierGroups
├── Orders
│   └── OrderItems (JSON)
├── Customers
├── GiftCards
├── PromoCodes
└── Reviews
```

---

## Payment Architecture

### Stripe Connect Flow

OrderFlow uses Stripe Connect in "Direct Charges" mode with platform fees.

```
Customer ($100 order)
       │
       ▼
┌─────────────────┐
│  Stripe Charge  │
│    $100.00      │
└─────────────────┘
       │
       ├────────────────────────────┐
       │                            │
       ▼                            ▼
┌─────────────────┐       ┌─────────────────┐
│  Platform Fee   │       │  Transfer to    │
│     $2.90       │       │  Restaurant     │
│   (2.9%)        │       │    $97.10       │
└─────────────────┘       └─────────────────┘
```

### Payment Flow Code

```typescript
// 1. Create PaymentIntent with platform fee
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalInCents,           // $100.00 = 10000
  currency: 'usd',
  application_fee_amount: feeInCents,  // $2.90 = 290
  transfer_data: {
    destination: tenant.stripeAccountId,  // Restaurant's Stripe account
  },
  metadata: {
    tenantId: tenant.id,
    orderId: order.id,
  },
})

// 2. Webhook confirms payment
// POST /api/webhooks/stripe
if (event.type === 'payment_intent.succeeded') {
  const order = await prisma.order.update({
    where: { paymentIntentId: paymentIntent.id },
    data: { 
      status: 'paid',
      paymentStatus: 'succeeded',
    },
  })
}
```

### Fee Calculation

```typescript
// lib/stripe-fees.ts
interface FeeBreakdown {
  subtotal: number      // Items total
  tax: number           // Tax amount
  deliveryFee: number   // Delivery fee
  platformFee: number   // 2.9% of subtotal
  stripeFee: number     // 2.9% + $0.30 (Stripe's cut)
  restaurantPayout: number  // Total - platformFee
  total: number         // Customer pays
}

// Platform fee = 2.9% of subtotal (not including tax/delivery)
// Restaurant gets: Total - Platform Fee
// Stripe takes their 2.9% + $0.30 from the restaurant's payout
```

---

## Real-time Updates

### Current Implementation

OrderFlow uses polling for order updates:

```typescript
// Dashboard polls every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchOrders()
  }, 30000)
  return () => clearInterval(interval)
}, [])
```

### Future: WebSocket Integration

For real-time updates, consider adding:

```typescript
// Using Pusher/Ably/Socket.io
const pusher = new Pusher('app_key')
const channel = pusher.subscribe(`orders-${tenantId}`)

channel.bind('new-order', (order) => {
  setOrders(prev => [order, ...prev])
  playNotificationSound()
})
```

---

## Caching Strategy

### Static Data (Menu, Categories)

- Cached at edge via Next.js data cache
- Revalidated on updates

```typescript
// Store page - revalidate every 60 seconds
export const revalidate = 60

async function StorePage({ params }: Props) {
  const menu = await getMenu(params.slug)  // Cached
}
```

### Dynamic Data (Orders)

- No cache, always fresh
- Fetched on demand

```typescript
// Orders list - no cache
export const dynamic = 'force-dynamic'

async function OrdersPage() {
  const orders = await getOrders()  // Always fresh
}
```

### Rate Limit Cache (Redis)

```typescript
// lib/rate-limit.ts
// Uses Upstash Redis for sliding window rate limiting
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
})
```

---

## Error Handling

### API Error Response Format

```typescript
interface ErrorResponse {
  error: string           // User-friendly message
  details?: string        // Technical details (dev only)
  code?: string           // Error code for client handling
}

// Example responses
{ "error": "Order not found" }                    // 404
{ "error": "Unauthorized" }                       // 401
{ "error": "Invalid request body" }               // 400
{ "error": "Failed to process payment" }          // 500
```

### Error Handling Pattern

```typescript
export async function POST(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate input
    const body = await req.json()
    if (!body.required_field) {
      return NextResponse.json({ error: 'Missing required field' }, { status: 400 })
    }

    // Business logic
    const result = await processOrder(body)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    // Log error with context
    console.error('[Orders] Failed to create order:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return user-friendly error
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

## Security Architecture

### Defense in Depth

```
Layer 1: Edge (Vercel)
├── DDoS protection
├── SSL/TLS termination
└── Geographic restrictions (optional)

Layer 2: Middleware
├── CSRF protection (origin check)
├── Auth token validation
└── Path-based access control

Layer 3: API Routes
├── Rate limiting (Upstash)
├── Input sanitization
├── Session validation
└── Tenant isolation

Layer 4: Database
├── Parameterized queries (Prisma)
├── Row-level security (tenantId filter)
└── Encrypted connections (SSL)
```

### Security Measures

| Threat | Mitigation |
|--------|------------|
| CSRF | Origin header validation in middleware |
| XSS | Input sanitization, React's built-in escaping |
| SQL Injection | Prisma ORM (parameterized queries) |
| Brute Force | Rate limiting (10 req/min per IP) |
| Session Hijacking | httpOnly cookies, secure flag |
| Unauthorized Access | JWT validation, tenant isolation |

### Webhook Security

```typescript
// Stripe webhook signature verification
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)

// DoorDash webhook signature verification
const signature = createHmac('sha256', secret)
  .update(body)
  .digest('hex')
```

---

## Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Edge     │  │ Serverless │  │   Static   │            │
│  │   Config   │  │ Functions  │  │   Assets   │            │
│  │(middleware)│  │ (API/SSR)  │  │ (images)   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Supabase   │  │   Upstash   │  │  Cloudflare │
│  PostgreSQL │  │    Redis    │  │     R2      │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Environment Configuration

```
Development:  .env.local
Preview:      Vercel Environment Variables (Preview)
Production:   Vercel Environment Variables (Production)
```

---

## Next Steps

For more details, see:
- [API.md](API.md) - Complete API reference
- [DATABASE.md](DATABASE.md) - Schema documentation
- [INTEGRATIONS.md](INTEGRATIONS.md) - Third-party integrations
