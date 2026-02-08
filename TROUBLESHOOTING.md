# OrderFlow Troubleshooting Guide

Common issues and their solutions.

## 📋 Table of Contents

- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Payment Issues](#payment-issues)
- [Order Issues](#order-issues)
- [Delivery Issues](#delivery-issues)
- [Email/SMS Issues](#emailsms-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)

---

## Development Issues

### "Module not found" errors

**Problem:** Import errors when running `npm run dev`

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

### "Invalid hook call" error

**Problem:** React hooks error in browser

**Solution:**
- Check if you're using hooks in a Server Component
- Add `'use client'` directive to components using hooks
- Ensure React versions are consistent

### Port already in use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### TypeScript errors

**Problem:** Type errors during build

**Solution:**
```bash
# Check for errors
npm run lint

# Common fixes:
# 1. Add missing type annotations
# 2. Update @types packages
# 3. Check tsconfig.json settings
```

---

## Database Issues

### "Can't reach database server"

**Problem:** Prisma can't connect to database

**Solutions:**

1. **Check DATABASE_URL format:**
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

2. **For Supabase/Neon:**
   - Use the Transaction/Pooler URL
   - Check if IP is whitelisted
   - Verify SSL mode: `?sslmode=require`

3. **For local PostgreSQL:**
   ```bash
   # Check if PostgreSQL is running
   sudo service postgresql status
   
   # Start it
   sudo service postgresql start
   ```

### "Table does not exist"

**Problem:** Missing database tables

**Solution:**
```bash
# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### "Unique constraint violation"

**Problem:** Duplicate record error

**Solutions:**
- Check if record already exists before creating
- Use `upsert` instead of `create`
- Verify unique constraints in schema

```typescript
// Use upsert for create-or-update
await prisma.customer.upsert({
  where: { tenantId_phone: { tenantId, phone } },
  create: { tenantId, phone, name },
  update: { name },
})
```

### Migration failed

**Problem:** `prisma migrate` fails

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix the migration
# 1. Check prisma/migrations for failed migration
# 2. Fix the SQL
# 3. Run prisma migrate deploy
```

---

## Authentication Issues

### "Unauthorized" on all requests

**Problem:** API returns 401 for authenticated users

**Solutions:**

1. **Check cookie settings:**
   ```typescript
   // Ensure cookie is set correctly
   cookies().set('auth-token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 60 * 60 * 24 * 7, // 7 days
   })
   ```

2. **Check JWT_SECRET:**
   - Must be same across all environments
   - Must be at least 32 characters

3. **Check fetch credentials:**
   ```typescript
   fetch('/api/orders', {
     credentials: 'include', // Include cookies
   })
   ```

### Login doesn't work

**Problem:** Login returns success but user not authenticated

**Solutions:**

1. **Check if session is created in database:**
   ```typescript
   const session = await prisma.session.findMany({
     where: { userId: user.id },
   })
   ```

2. **Check browser cookies:**
   - Open DevTools → Application → Cookies
   - Look for `auth-token` cookie

3. **Verify password hash:**
   ```typescript
   const isValid = await verifyPassword(password, user.passwordHash)
   console.log('Password valid:', isValid)
   ```

### Password reset not working

**Problem:** Reset email sent but link doesn't work

**Solutions:**

1. **Check token expiry:**
   - Tokens expire after 1 hour
   - Check `resetTokenExpiry` in database

2. **Check email link URL:**
   - Should be: `https://yourdomain.com/reset-password?token=xxx`
   - Verify `NEXT_PUBLIC_BASE_URL` is correct

---

## Payment Issues

### "No such payment intent"

**Problem:** Stripe returns error for payment

**Solutions:**

1. **Check Stripe keys match environment:**
   - Use `sk_test_` keys for development
   - Use `sk_live_` keys for production
   - Never mix test and live keys

2. **Check if payment intent exists:**
   ```typescript
   const paymentIntent = await stripe.paymentIntents.retrieve(id)
   console.log(paymentIntent)
   ```

### Webhook signature verification failed

**Problem:** Stripe webhooks return 400

**Solutions:**

1. **Check webhook secret:**
   - Each webhook endpoint has a unique secret
   - Get it from Stripe Dashboard → Webhooks

2. **Check raw body parsing:**
   ```typescript
   // Webhook routes need raw body, not JSON
   export async function POST(req: NextRequest) {
     const body = await req.text() // NOT req.json()
     const signature = req.headers.get('stripe-signature')
     
     const event = stripe.webhooks.constructEvent(
       body,
       signature!,
       process.env.STRIPE_WEBHOOK_SECRET!
     )
   }
   ```

3. **Test locally with Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Restaurant not receiving payouts

**Problem:** Stripe Connect payouts not working

**Solutions:**

1. **Check onboarding status:**
   ```typescript
   const account = await stripe.accounts.retrieve(stripeAccountId)
   console.log('Charges enabled:', account.charges_enabled)
   console.log('Payouts enabled:', account.payouts_enabled)
   ```

2. **Check for requirements:**
   - Restaurant may need to complete additional verification
   - Check `account.requirements.currently_due`

### Platform fee not being charged

**Problem:** All money goes to restaurant

**Solution:**
```typescript
// Ensure application_fee_amount is set
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalInCents,
  currency: 'usd',
  application_fee_amount: feeInCents, // THIS IS REQUIRED
  transfer_data: {
    destination: tenant.stripeAccountId,
  },
})
```

---

## Order Issues

### Orders not appearing in dashboard

**Problem:** New orders don't show up

**Solutions:**

1. **Check tenant isolation:**
   ```typescript
   // Orders must be filtered by tenantId
   const orders = await prisma.order.findMany({
     where: { tenantId: session.tenantId },
   })
   ```

2. **Check if payment succeeded:**
   - Order status is "pending" until payment succeeds
   - Check Stripe Dashboard for payment status

3. **Check browser polling:**
   - Dashboard polls every 30 seconds
   - Try refreshing the page

### Duplicate orders created

**Problem:** Same order appears multiple times

**Solutions:**

1. **Check webhook idempotency:**
   ```typescript
   // Check if event was already processed
   const processed = await prisma.processedWebhook.findUnique({
     where: { eventId: event.id },
   })
   if (processed) return NextResponse.json({ received: true })
   ```

2. **Check payment intent metadata:**
   - Each order should have unique `orderId` in metadata

### Order status not updating

**Problem:** Status change doesn't save

**Solutions:**

1. **Check valid status transitions:**
   - pending → preparing → ready → completed
   - Not: ready → pending (invalid)

2. **Check API response:**
   ```typescript
   const res = await fetch(`/api/orders/${id}`, {
     method: 'PUT',
     body: JSON.stringify({ status: 'preparing' }),
   })
   if (!res.ok) {
     const error = await res.json()
     console.error(error)
   }
   ```

---

## Delivery Issues

### DoorDash quote fails

**Problem:** "Unable to get delivery quote"

**Solutions:**

1. **Check address is valid:**
   - Must be a real, deliverable address
   - Check lat/lng coordinates are correct

2. **Check DoorDash credentials:**
   ```typescript
   // Verify credentials are set
   console.log('Developer ID:', process.env.DOORDASH_DEVELOPER_ID)
   console.log('API Key:', process.env.DOORDASH_API_KEY)
   ```

3. **Check if area is serviceable:**
   - DoorDash may not service all areas
   - Check DoorDash coverage map

### Driver never assigned

**Problem:** Delivery created but no driver

**Solutions:**

1. **Check delivery status in DoorDash:**
   ```typescript
   const status = await doorDashService.getDeliveryStatus(deliveryId)
   console.log(status)
   ```

2. **Common reasons:**
   - High demand in area
   - Late night hours
   - Bad weather

---

## Email/SMS Issues

### Emails not sending

**Problem:** Order confirmation emails not received

**Solutions:**

1. **Check Resend dashboard:**
   - Go to resend.com → Emails
   - Look for bounces or failures

2. **Verify API key:**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_your_key" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@resend.dev","to":"you@email.com","subject":"Test"}'
   ```

3. **Check domain verification:**
   - Custom domains must be verified in Resend
   - Use `onboarding@resend.dev` for testing

### SMS not sending

**Problem:** Twilio SMS fails

**Solutions:**

1. **Check Twilio credentials:**
   - Verify Account SID and Auth Token
   - Check phone number is valid

2. **Check phone format:**
   ```typescript
   // Must be E.164 format
   const phone = '+15551234567' // Correct
   // NOT: (555) 123-4567
   ```

3. **Check Twilio console:**
   - Go to Twilio Console → Monitor → Logs
   - Look for error messages

---

## Deployment Issues

### Build fails on Vercel

**Problem:** `npm run build` fails

**Solutions:**

1. **Check environment variables:**
   - All required env vars must be set in Vercel
   - Check Project Settings → Environment Variables

2. **Check Prisma generation:**
   ```json
   // package.json
   "build": "prisma generate && next build"
   ```

3. **Check TypeScript errors:**
   ```bash
   # Run locally first
   npm run build
   ```

### Subdomain routing not working

**Problem:** `restaurant.orderflow.io` shows 404

**Solutions:**

1. **Check DNS settings:**
   - Add CNAME `*` → `cname.vercel-dns.com`
   - Wait for DNS propagation (up to 48h)

2. **Check Vercel domain settings:**
   - Add `*.yourdomain.com` as domain
   - Enable wildcard

3. **Check middleware:**
   ```typescript
   // middleware.ts should handle subdomain routing
   const subdomain = hostname.split('.')[0]
   return NextResponse.rewrite(new URL(`/store/${subdomain}`, request.url))
   ```

### API routes return 500

**Problem:** Production API errors

**Solutions:**

1. **Check Vercel function logs:**
   - Go to Vercel → Deployments → Functions
   - Look for error messages

2. **Check database connection:**
   - Ensure DATABASE_URL is set in Vercel
   - Try accessing Prisma Studio

3. **Check for missing env vars:**
   - Compare `.env.example` with Vercel env vars

---

## Performance Issues

### Slow page loads

**Problem:** Pages take >3 seconds to load

**Solutions:**

1. **Check database queries:**
   ```typescript
   // Use select to limit fields
   const orders = await prisma.order.findMany({
     select: { id: true, orderNumber: true, status: true },
     take: 20,
   })
   ```

2. **Add caching:**
   ```typescript
   // For static data
   export const revalidate = 60 // Revalidate every 60 seconds
   ```

3. **Optimize images:**
   ```tsx
   // Use Next.js Image component
   import Image from 'next/image'
   <Image src={url} width={200} height={200} alt="" />
   ```

### Memory issues

**Problem:** Function exceeds memory limit

**Solutions:**

1. **Reduce payload size:**
   - Don't fetch all orders at once
   - Use pagination

2. **Stream large responses:**
   ```typescript
   // For large data exports
   return new Response(stream, {
     headers: { 'Content-Type': 'text/csv' },
   })
   ```

---

## Getting Help

If you can't solve an issue:

1. **Check existing issues** on GitHub
2. **Search error message** on Google
3. **Check Vercel/Stripe/etc. documentation**
4. **Open a new issue** with:
   - Error message
   - Steps to reproduce
   - Environment (dev/prod)
   - Relevant logs

---

## Quick Debug Commands

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check database connection
npx prisma db pull

# View database in browser
npx prisma studio

# Check environment
node -e "console.log(process.env)"

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check logs
vercel logs
```
