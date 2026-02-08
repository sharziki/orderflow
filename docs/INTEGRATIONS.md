# DerbyFlow Integrations Guide

Complete setup instructions for all third-party integrations.

## 📋 Table of Contents

- [Stripe Connect](#stripe-connect)
- [DoorDash Drive](#doordash-drive)
- [Resend (Email)](#resend-email)
- [Twilio (SMS)](#twilio-sms)
- [Go High Level (CRM)](#go-high-level-crm)
- [Google Maps](#google-maps)
- [Image Storage (S3/R2)](#image-storage-s3r2)
- [Upstash Redis](#upstash-redis)

---

## Stripe Connect

Stripe Connect enables marketplace payments where customers pay and funds are split between the platform and restaurants.

### How It Works

```
Customer ($100.00)
       │
       ▼
┌─────────────────┐
│  Stripe Charge  │
└─────────────────┘
       │
       ├── Platform Fee ($2.90) ──▶ Your Stripe Account
       │
       └── Transfer ($97.10) ────▶ Restaurant's Stripe Account
                                         │
                                         └── Stripe Processing Fee (~$3.13)
                                         └── Restaurant Net (~$93.97)
```

### Setup Steps

#### 1. Enable Stripe Connect

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings → Connect**
3. Click **Get Started**
4. Choose **Standard** accounts (restaurants manage their own Stripe dashboard)
5. Complete the platform profile

#### 2. Get API Keys

1. Go to **Developers → API Keys**
2. Copy your **Secret Key** (`sk_live_...` or `sk_test_...`)
3. Copy your **Publishable Key** (`pk_live_...` or `pk_test_...`)

```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

#### 3. Set Up Webhooks

1. Go to **Developers → Webhooks**
2. Click **Add Endpoint**
3. Enter endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `charge.refunded`
5. Copy the **Webhook Secret** (`whsec_...`)

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### 4. Test the Integration

Use Stripe's test card numbers:
- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Restaurant Onboarding Flow

```typescript
// When restaurant signs up, create a Connect account
const account = await stripe.accounts.create({
  type: 'standard',
  email: restaurant.email,
})

// Generate onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://yourdomain.com/dashboard/settings?refresh=true',
  return_url: 'https://yourdomain.com/dashboard/settings?success=true',
  type: 'account_onboarding',
})

// Redirect restaurant to accountLink.url
```

### Creating Payments

```typescript
// lib/stripe-fees.ts is used to calculate fees
import { calculatePlatformFeeInCents } from '@/lib/stripe-fees'

const paymentIntent = await stripe.paymentIntents.create({
  amount: totalInCents,
  currency: 'usd',
  application_fee_amount: calculatePlatformFeeInCents(subtotal, platformFeePercent),
  transfer_data: {
    destination: tenant.stripeAccountId,
  },
  metadata: {
    tenantId: tenant.id,
    orderId: order.id,
  },
})
```

---

## DoorDash Drive

DoorDash Drive provides delivery-as-a-service for restaurants.

### How It Works

```
1. Customer places delivery order
2. Order marked "ready" in dashboard
3. Restaurant clicks "Request Delivery"
4. DoorDash assigns a driver
5. Driver picks up and delivers
6. Status updates via webhook
```

### Setup Steps

#### 1. Create DoorDash Developer Account

1. Go to [DoorDash Developer Portal](https://developer.doordash.com)
2. Create an account and verify your business
3. Create a new application

#### 2. Get API Credentials

From your DoorDash Developer Dashboard:

```env
DOORDASH_DEVELOPER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
DOORDASH_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
DOORDASH_SECRET="base64-encoded-signing-secret"
```

#### 3. Set Up Webhook (Optional)

1. In DoorDash Dashboard, go to **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/doordash/webhook`
3. Select events: `delivery_status`

#### 4. Per-Restaurant Configuration

Restaurants can configure their own DoorDash credentials in Settings:

```typescript
// In tenant settings
{
  doordashDeveloperId: "...",
  doordashKeyId: "...",
  doordashSigningSecret: "...",
  pickupInstructions: "Enter through back door"
}
```

### API Usage

```typescript
// lib/doordash.ts
import { doorDashService } from '@/lib/doordash'

// Create a delivery
const delivery = await doorDashService.createDelivery({
  external_delivery_id: `order_${order.id}`,
  pickup_address: restaurant.fullAddress,
  pickup_phone_number: restaurant.phone,
  pickup_business_name: restaurant.name,
  pickup_instructions: restaurant.pickupInstructions,
  dropoff_address: order.deliveryAddress,
  dropoff_phone_number: order.customerPhone,
  dropoff_contact_given_name: order.customerName.split(' ')[0],
  order_value: Math.round(order.total * 100), // cents
  currency: 'USD',
  items: order.items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: Math.round(item.price * 100),
  })),
})
```

### Delivery Status Flow

```
created → confirmed → assigned → at_pickup → picked_up → at_dropoff → delivered
```

---

## Resend (Email)

Resend provides transactional email delivery.

### Setup Steps

#### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Create an account
3. Go to **API Keys** and create a new key

```env
RESEND_API_KEY="re_..."
FROM_EMAIL="DerbyFlow <noreply@yourdomain.com>"
```

#### 2. Verify Domain (Optional but Recommended)

1. In Resend, go to **Domains**
2. Add your domain
3. Add the DNS records shown
4. Wait for verification

#### 3. Email Templates

DerbyFlow sends these emails:

| Email | Trigger |
|-------|---------|
| Order Confirmation | After successful order |
| New Order Alert | To restaurant on new order |
| Password Reset | When user requests reset |
| Gift Card | When gift card is purchased |

### Usage

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(to: string, order: OrderData) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject: `Order Confirmed: ${order.orderNumber}`,
    html: renderOrderConfirmationEmail(order),
  })
}
```

---

## Twilio (SMS)

Optional SMS notifications for order updates.

### Setup Steps

#### 1. Create Twilio Account

1. Go to [twilio.com](https://twilio.com)
2. Create an account
3. Get a phone number

#### 2. Get Credentials

From Twilio Console:

```env
# These are set per-restaurant in their settings
# twilioAccountSid
# twilioAuthToken
# twilioPhoneNumber
```

#### 3. Per-Restaurant Configuration

Restaurants configure their own Twilio in Settings:

```typescript
// Tenant settings
{
  twilioAccountSid: "AC...",
  twilioAuthToken: "...",
  twilioPhoneNumber: "+1555123456",
  smsNotificationsEnabled: true
}
```

### Usage

```typescript
// lib/sms.ts
import twilio from 'twilio'

export async function sendOrderReadySms(tenant: Tenant, order: Order) {
  if (!tenant.smsNotificationsEnabled || !tenant.twilioAccountSid) {
    return
  }

  const client = twilio(tenant.twilioAccountSid, tenant.twilioAuthToken)

  await client.messages.create({
    body: `Your order ${order.orderNumber} from ${tenant.name} is ready for pickup!`,
    from: tenant.twilioPhoneNumber,
    to: order.customerPhone,
  })
}
```

---

## Go High Level (CRM)

Sync customers and orders to Go High Level CRM.

### Setup Steps

#### 1. Get API Key

1. Log into Go High Level
2. Go to **Settings → API Keys**
3. Create a new API key with Contacts permissions

#### 2. Get Location ID

1. In GHL, go to **Settings → Business Info**
2. Copy the Location ID from the URL

#### 3. Per-Restaurant Configuration

```typescript
// Tenant settings
{
  ghlApiKey: "...",
  ghlLocationId: "..."
}
```

### What Gets Synced

| Event | GHL Action |
|-------|------------|
| New Order | Create/update contact, add order note |
| Repeat Customer | Update contact with new order count |

### Usage

```typescript
// lib/gohighlevel.ts
import { syncOrderToGHL } from '@/lib/gohighlevel'

// Called after order creation
await syncOrderToGHL(
  tenant.ghlApiKey,
  tenant.ghlLocationId,
  {
    name: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone,
    address: order.deliveryAddress,
  },
  {
    orderNumber: order.orderNumber,
    items: order.items,
    total: order.total,
    orderCount: customer.orderCount,
    type: order.type,
  }
)
```

### Contact Notes Format

```
📦 ORDER #ORD-20240115-0001
Order 3 of 5 total orders

Type: DELIVERY

Items:
• Margherita Pizza x2 - $29.98
• Garlic Bread x1 - $5.99

💰 Total: $35.97

📝 Notes: Extra napkins please
```

---

## Google Maps

Address autocomplete for delivery orders.

### Setup Steps

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Places API**

#### 2. Get API Key

1. Go to **APIs & Services → Credentials**
2. Create an API key
3. Restrict it to Places API

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
```

#### 3. Usage in Components

```tsx
// components/AddressAutocomplete.tsx
import { Loader } from '@googlemaps/js-api-loader'

useEffect(() => {
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  })

  loader.load().then(() => {
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      onSelect({
        address: place.formatted_address,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      })
    })
  })
}, [])
```

---

## Image Storage (S3/R2)

Store menu item and logo images.

### Option A: Cloudflare R2 (Recommended)

#### 1. Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Go to **R2 → Create bucket**
3. Name it (e.g., `orderflow`)

#### 2. Get Credentials

1. Go to **R2 → Manage R2 API Tokens**
2. Create a token with read/write permissions

```env
S3_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET="orderflow"
S3_PUBLIC_URL="https://cdn.yourdomain.com"  # After setting up public bucket
```

#### 3. Make Bucket Public (Optional)

1. In bucket settings, enable **Public Access**
2. Configure a custom domain if desired

### Option B: AWS S3

```env
S3_ENDPOINT=""  # Leave empty for AWS
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET="orderflow"
S3_PUBLIC_URL="https://orderflow.s3.amazonaws.com"
```

### Option C: Supabase Storage

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function uploadImage(file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filename, file)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filename)
  
  return publicUrl
}
```

---

## Upstash Redis

Rate limiting and caching.

### Setup Steps

#### 1. Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database

#### 2. Get Credentials

From Upstash console:

```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Usage for Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 requests per minute
  analytics: true,
})

export async function checkRateLimit(req: NextRequest, identifier: string) {
  const ip = req.ip ?? '127.0.0.1'
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `${identifier}:${ip}`
  )
  
  if (!success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(reset),
          },
        }
      ),
    }
  }
  
  return { success: true }
}
```

---

## Integration Checklist

Use this checklist when setting up a new DerbyFlow instance:

### Required
- [ ] PostgreSQL database configured
- [ ] Stripe Connect enabled
- [ ] Stripe API keys set
- [ ] Stripe webhook configured
- [ ] Resend API key set
- [ ] JWT_SECRET configured

### Recommended
- [ ] Custom domain configured
- [ ] Wildcard subdomain for restaurants
- [ ] Google Maps API key (for delivery)
- [ ] Image storage (S3/R2/Supabase)
- [ ] Upstash Redis (for rate limiting)

### Optional (Per Restaurant)
- [ ] DoorDash credentials
- [ ] Twilio credentials
- [ ] Go High Level integration

---

## Troubleshooting

### Stripe Webhook Fails

1. Check webhook secret matches
2. Verify endpoint URL is correct
3. Check Stripe Dashboard for failed events
4. Ensure HTTPS is configured

### DoorDash API Errors

1. Verify credentials are correct
2. Check if address is serviceable
3. Ensure business is approved for Drive

### Email Not Sending

1. Verify Resend API key
2. Check FROM_EMAIL domain is verified
3. Check Resend dashboard for bounces

### Images Not Uploading

1. Verify S3/R2 credentials
2. Check bucket permissions
3. Ensure CORS is configured for bucket
