# OrderFlow Deployment Checklist

## Required Environment Variables

### Database (Required)
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
```
- Supabase: Use Transaction pooler URL (port 6543) with `?pgbouncer=true`
- Neon: Use connection string with `?sslmode=require`

### Authentication (Required)
```env
JWT_SECRET="your-32-character-minimum-secret-key"
```
- Generate with: `openssl rand -base64 32`

### Stripe (Required for payments)
```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
- Get from: https://dashboard.stripe.com/apikeys
- Create webhook at: https://dashboard.stripe.com/webhooks
- Webhook URL: `https://your-domain.com/api/webhooks/stripe`
- Events needed: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `charge.refunded`

### Email (Required for notifications)
```env
RESEND_API_KEY="re_..."
FROM_EMAIL="Your App <noreply@yourdomain.com>"
```
- Get from: https://resend.com/api-keys
- Verify your domain for production email sending

### App URLs (Required)
```env
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

### DoorDash (Optional - for delivery)
```env
DOORDASH_DEVELOPER_ID="your-developer-id"
DOORDASH_KEY_ID="your-key-id"
DOORDASH_SIGNING_SECRET="your-signing-secret"
```
- Get from: https://developer.doordash.com

### Admin (Optional)
```env
ADMIN_EMAILS="admin@yourdomain.com,owner@yourdomain.com"
```
- Comma-separated list of admin emails

---

## Vercel Deployment Steps

### 1. Connect Repository
```bash
# Push to GitHub first
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: Next.js (auto-detected)

### 3. Add Environment Variables
In Vercel project settings → Environment Variables, add ALL variables above.

### 4. Deploy
Click "Deploy" - Vercel will build and deploy automatically.

### 5. Post-Deploy Setup

#### Update Stripe Webhook URL
1. Go to Stripe Dashboard → Webhooks
2. Update endpoint URL to: `https://your-vercel-url.vercel.app/api/webhooks/stripe`

#### Push Database Schema
```bash
npx prisma db push
```

#### Run Seed (Optional - for demo data)
```bash
npx prisma db seed
```

---

## Pre-Launch Checklist

### ✅ Infrastructure
- [ ] Database accessible and schema pushed
- [ ] All environment variables set in Vercel
- [ ] Build succeeds without errors
- [ ] Site loads at deployed URL

### ✅ Payments
- [ ] Stripe in LIVE mode (not test)
- [ ] Webhook endpoint active and receiving events
- [ ] Test a real payment (refund after)

### ✅ Email
- [ ] Resend domain verified
- [ ] Test emails sending correctly
- [ ] Check spam folder for deliverability

### ✅ Features
- [ ] Create account flow works
- [ ] Login/logout works
- [ ] Password reset emails sent
- [ ] Menu management works
- [ ] Customer can browse store
- [ ] Customer can place order
- [ ] Restaurant receives order notification
- [ ] Order status updates work

### ✅ Security
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Rate limiting working
- [ ] No sensitive data in console logs
- [ ] Webhook signatures verified

---

## Test Account Credentials (Demo Seed)

After running seed:
- **Store URL:** /store/demo-pizzeria
- **Dashboard Login:** demo@orderflow.io / DemoPassword123!
- **Gift Card Code:** DEMO-GIFT-2024 ($50.00)

---

## Monitoring

### Health Check
```
GET /api/health
```
Returns: `{ status: "ok", db: true, stripe: true, timestamp: "..." }`

### Logs
- Vercel Dashboard → Deployments → Logs
- Filter by: `[Email]`, `[Order]`, `[Stripe]`, `[DoorDash]`

---

## Troubleshooting

### Build Fails
- Check DATABASE_URL is set in Vercel environment
- Check all required env vars are present

### Payments Not Working
- Verify Stripe keys are LIVE not TEST
- Check webhook endpoint is correct URL
- Check webhook signing secret matches

### Emails Not Sending
- Verify Resend API key
- Check domain is verified in Resend
- Check FROM_EMAIL matches verified domain

### Database Connection Issues
- Use Transaction pooler URL for Supabase (port 6543)
- Add `?pgbouncer=true` to connection string
- Check IP allowlist if applicable
