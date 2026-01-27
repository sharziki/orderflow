# OrderFlow Deployment Guide

This guide will help you deploy OrderFlow to production and start accepting restaurant signups.

## Prerequisites

- [Vercel Account](https://vercel.com) (free tier works)
- [Stripe Account](https://stripe.com) with Connect enabled
- [Vercel Postgres](https://vercel.com/storage/postgres) (or Supabase/Neon)
- Domain name (optional but recommended)

---

## 1. Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database" → "Postgres"
3. Name it `orderflow-db`
4. Copy the connection strings

### Option B: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection String
3. Copy the URI (use "Transaction" mode for serverless)

---

## 2. Environment Variables

Create a `.env` file for local development:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For migrations (non-pooled)

# Auth
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Stripe (Platform Account)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# App URL
NEXT_PUBLIC_BASE_URL="https://orderflow.io"
```

---

## 3. Stripe Connect Setup

OrderFlow uses Stripe Connect to split payments between the platform and restaurants.

### Enable Connect

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Settings → Connect → Get Started
3. Choose "Standard" accounts (restaurants manage their own dashboard)

### Platform Fee

The default platform fee is 2.9% (set in `prisma/schema.prisma` → `platformFeePercent`).

Restaurants can be charged:
- Per-transaction fee (default)
- Monthly subscription (implement in billing)

---

## 4. Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_REPO)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from Step 2
3. Redeploy for changes to take effect

---

## 5. Database Migrations

After setting up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed with demo data
npx prisma db seed
```

---

## 6. Domain Setup

### Vercel Domains

1. Project Settings → Domains
2. Add your domain (e.g., `orderflow.io`)
3. Configure DNS:
   - A record: `76.76.19.19`
   - Or CNAME: `cname.vercel-dns.com`

### Subdomain Routing (for restaurants)

Restaurants get URLs like `joes-pizza.orderflow.io`

1. Add wildcard domain: `*.orderflow.io`
2. DNS: Add CNAME `*` → `cname.vercel-dns.com`

The middleware handles routing based on subdomain.

---

## 7. Post-Deploy Checklist

- [ ] Database connected and migrated
- [ ] Stripe Connect enabled
- [ ] Test restaurant signup flow
- [ ] Test order placement
- [ ] Test payment processing
- [ ] Setup Stripe webhooks

### Stripe Webhooks

Create webhook at: `https://orderflow.io/api/webhooks/stripe`

Events to listen for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated` (Connect)

---

## 8. Revenue Model

### How You Make Money

1. **Transaction Fee**: 2.9% of every order (configurable)
2. **Subscription Plans**: 
   - Starter: $49/mo (up to 50 items)
   - Pro: $99/mo (unlimited)
   - Enterprise: Custom

### Stripe Payout Flow

1. Customer pays → Stripe holds funds
2. Platform fee deducted automatically
3. Restaurant receives payout (2-day rolling)
4. You receive platform fees

---

## 9. Support & Monitoring

### Error Tracking

Add Sentry for error tracking:
```bash
npm install @sentry/nextjs
```

### Analytics

- Vercel Analytics (built-in)
- Stripe Dashboard for revenue

---

## 10. Security Checklist

- [ ] JWT_SECRET is strong (32+ chars)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Stripe keys are live (not test)
- [ ] Database has SSL enabled
- [ ] CORS configured properly

---

## Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Run Prisma Studio (DB GUI)
npx prisma studio

# Generate Prisma Client after schema changes
npx prisma generate

# Create migration
npx prisma migrate dev --name your_migration_name
```

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL format
- Ensure IP is whitelisted (if using Supabase)

### "Stripe Connect not working"
- Verify Connect is enabled in Stripe Dashboard
- Check webhook signatures

### "Images not uploading"
- Verify BLOB_READ_WRITE_TOKEN is set
- Check Vercel Blob is enabled in project

---

## Next Steps

1. **Add more templates** - Create different menu layouts
2. **Mobile app** - React Native ordering app
3. **SMS notifications** - Twilio integration
4. **Loyalty program** - Points system
5. **Multi-location** - Support restaurant chains

---

**Built with ❤️ by OrderFlow**

Questions? support@orderflow.io
