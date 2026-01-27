# OrderFlow Production Deployment Checklist

Complete guide to deploying OrderFlow as a production SaaS.

---

## 📋 Pre-Deployment Checklist

### 1. Accounts Needed

| Service | Purpose | Free Tier | Sign Up |
|---------|---------|-----------|---------|
| **Vercel** | Hosting | ✅ Yes | [vercel.com](https://vercel.com) |
| **Supabase** or **Neon** | PostgreSQL Database | ✅ Yes | [supabase.com](https://supabase.com) / [neon.tech](https://neon.tech) |
| **Stripe** | Payments + Connect | ✅ Yes | [stripe.com](https://stripe.com) |
| **Resend** | Transactional Email | ✅ 100/day free | [resend.com](https://resend.com) |
| **DoorDash** | Delivery (optional) | Contact sales | [developer.doordash.com](https://developer.doordash.com) |
| **Cloudflare R2** | Image uploads (optional) | ✅ 10GB free | [cloudflare.com](https://cloudflare.com) |

---

## 🗄️ Step 1: Database Setup

### Option A: Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `orderflow-prod`
4. Generate a strong password (save it!)
5. Region: Choose closest to your users
6. Wait for project to provision (~2 min)
7. Go to **Settings → Database → Connection String**
8. Copy the **URI** (Transaction mode for serverless)

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Option B: Neon

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard

```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
```

### Push Schema

```bash
npx prisma db push
```

✅ **Checkpoint:** Run `npx prisma studio` - you should see empty tables

---

## 💳 Step 2: Stripe Setup

### Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification
3. Go to **Developers → API Keys**

```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### Enable Stripe Connect

1. Go to **Settings → Connect**
2. Click "Get started with Connect"
3. Choose **Standard accounts** (restaurants manage their own dashboard)
4. Complete platform profile

### Create Webhook

1. Go to **Developers → Webhooks**
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `charge.refunded`
5. Copy the signing secret

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

✅ **Checkpoint:** Webhook endpoint shows "Active" in Stripe dashboard

---

## 📧 Step 3: Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain)
3. Go to **API Keys → Create API Key**

```env
RESEND_API_KEY="re_..."
FROM_EMAIL="OrderFlow <noreply@yourdomain.com>"
```

### Domain Verification (for production)

1. Add domain in Resend dashboard
2. Add DNS records:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)
3. Wait for verification (~5-10 min)

✅ **Checkpoint:** Send test email from Resend dashboard

---

## 🚀 Step 4: Deploy to Vercel

### Option A: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_REPO)

### Option B: CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Add Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Required
DATABASE_URL="postgresql://..."
JWT_SECRET="generate-a-32-char-random-string"
NEXT_PUBLIC_BASE_URL="https://orderflow.yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
FROM_EMAIL="OrderFlow <noreply@yourdomain.com>"

# Admin (your email to access /admin/dashboard)
ADMIN_EMAILS="you@email.com"

# Optional: DoorDash (per-tenant, but can set defaults)
# DOORDASH_DEVELOPER_ID="..."
# DOORDASH_API_KEY="..."
# DOORDASH_SECRET="..."

# Optional: Image uploads (S3/R2)
# S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
# S3_ACCESS_KEY_ID="..."
# S3_SECRET_ACCESS_KEY="..."
# S3_BUCKET="orderflow"
# S3_PUBLIC_URL="https://cdn.yourdomain.com"
```

### Generate JWT Secret

```bash
openssl rand -base64 32
```

✅ **Checkpoint:** Visit your Vercel URL - landing page should load

---

## 🌐 Step 5: Domain Setup

### Add Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain: `orderflow.yourdomain.com`
3. Add DNS records as shown

### Wildcard Subdomain (for restaurant URLs)

To enable `joes-pizza.orderflow.yourdomain.com`:

1. Add wildcard domain: `*.orderflow.yourdomain.com`
2. DNS: Add CNAME `*` → `cname.vercel-dns.com`

✅ **Checkpoint:** Both main domain and a test subdomain resolve

---

## ✅ Step 6: Post-Deploy Verification

### Test Complete Flow

1. **Landing Page**
   - [ ] Visit homepage - loads correctly
   - [ ] All links work
   - [ ] Mobile responsive

2. **Restaurant Signup**
   - [ ] Go to /dashboard/onboarding
   - [ ] Create test restaurant
   - [ ] Check welcome email received
   - [ ] Redirected to dashboard

3. **Menu Management**
   - [ ] Add category
   - [ ] Add menu item
   - [ ] Edit/delete works

4. **Stripe Connect**
   - [ ] Go to Settings
   - [ ] Click "Connect with Stripe"
   - [ ] Complete Stripe onboarding
   - [ ] Status shows "Connected"

5. **Customer Ordering**
   - [ ] Visit /store/[your-slug]
   - [ ] Add items to cart
   - [ ] Checkout flow works
   - [ ] Payment processes (use Stripe test card: 4242 4242 4242 4242)
   - [ ] Order confirmation email received
   - [ ] Order appears in dashboard

6. **Order Management**
   - [ ] Change order status
   - [ ] Customer receives status email
   - [ ] Mark complete works

7. **Password Reset**
   - [ ] Go to /forgot-password
   - [ ] Enter email
   - [ ] Receive reset email
   - [ ] Reset password works

8. **Admin Dashboard**
   - [ ] Visit /admin/dashboard
   - [ ] See your test restaurant
   - [ ] Stats display correctly

---

## 🔒 Security Checklist

- [ ] JWT_SECRET is unique and 32+ characters
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Stripe keys are LIVE (not test) for production
- [ ] Database has SSL enabled
- [ ] ADMIN_EMAILS is set correctly
- [ ] No secrets in client-side code
- [ ] Rate limiting active on auth endpoints

---

## 📊 Monitoring Setup (Optional but Recommended)

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Analytics

- Vercel Analytics (built-in, enable in dashboard)
- Or add Plausible/PostHog for more detail

---

## 💰 Revenue Configuration

### Platform Fee

Default: 2.9% per transaction (set in Prisma schema)

To change:
1. Edit `prisma/schema.prisma` → `platformFeePercent` default
2. Run `npx prisma db push`

### Pricing Tiers

Current tiers (displayed on landing page):
- Starter: $49/mo
- Pro: $99/mo  
- Enterprise: Custom

To implement subscriptions, add Stripe Billing integration.

---

## 🚨 Troubleshooting

### "Database connection failed"
- Check DATABASE_URL format
- Ensure IP allowlist (if using Supabase, it's open by default)
- Verify SSL mode

### "Stripe webhook failing"
- Check STRIPE_WEBHOOK_SECRET matches
- Verify webhook URL is correct
- Check Vercel function logs

### "Emails not sending"
- Verify RESEND_API_KEY is set
- Check domain verification
- Look at Resend dashboard for errors

### "Can't access admin dashboard"
- Verify ADMIN_EMAILS includes your email
- Must be logged in with that email
- Email is case-insensitive

---

## 📁 File Structure Reference

```
orderflow/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── dashboard/               # Restaurant dashboard
│   │   ├── page.tsx            # Main dashboard
│   │   ├── menu/               # Menu management
│   │   ├── orders/             # Order management
│   │   ├── settings/           # Settings (Stripe, DoorDash)
│   │   └── onboarding/         # Signup wizard
│   ├── store/[slug]/           # Customer storefront
│   ├── admin/dashboard/        # Platform admin
│   ├── forgot-password/        # Password reset request
│   ├── reset-password/         # Password reset form
│   └── api/                    # All API routes
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── auth.ts                 # JWT auth helpers
│   ├── email.ts                # Email sending
│   ├── doordash-multi.ts       # DoorDash integration
│   └── rate-limit.ts           # Rate limiting
├── prisma/
│   └── schema.prisma           # Database schema
└── DEPLOY.md                   # Deployment guide
```

---

## 🎉 Launch Checklist

Before announcing:

- [ ] All tests pass
- [ ] Production Stripe keys active
- [ ] Email domain verified
- [ ] Custom domain configured
- [ ] SSL working
- [ ] Admin access verified
- [ ] Tested on mobile
- [ ] Created at least one test order end-to-end
- [ ] Backup database connection tested

---

## 📞 Support Resources

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)
- **Prisma Docs:** [prisma.io/docs](https://prisma.io/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Resend Docs:** [resend.com/docs](https://resend.com/docs)

---

**You're ready to launch! 🚀**

*Last updated: January 2026*
