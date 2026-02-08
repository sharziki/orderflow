# OrderFlow Database Schema

Complete documentation of the PostgreSQL database schema and model relationships.

## 📋 Table of Contents

- [Overview](#overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Models](#models)
  - [Tenant](#tenant)
  - [User](#user)
  - [Customer](#customer)
  - [Menu](#menu)
  - [Category](#category)
  - [MenuItem](#menuitem)
  - [ModifierGroup](#modifiergroup)
  - [Order](#order)
  - [GiftCard](#giftcard)
  - [PromoCode](#promocode)
  - [Review](#review)
  - [AbandonedCart](#abandonedcart)
  - [ProcessedWebhook](#processedwebhook)
  - [Session](#session)
- [Indexes](#indexes)
- [JSON Fields](#json-fields)
- [Common Queries](#common-queries)
- [Migrations](#migrations)

---

## Overview

OrderFlow uses PostgreSQL with Prisma ORM. The database is designed for multi-tenancy where all data is scoped by `tenantId`.

### Key Design Decisions

1. **Tenant Isolation** - Every data model includes `tenantId` for multi-tenant security
2. **Soft Deletes** - No cascade deletes; use `isActive` flags where possible
3. **JSON for Flexibility** - Complex nested data (order items, modifiers) stored as JSON
4. **Timestamps** - All models have `createdAt` and `updatedAt`

### Connection

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Entity Relationship Diagram

```
                              ┌──────────────────┐
                              │     Tenant       │
                              │   (Restaurant)   │
                              └──────────────────┘
                                       │
           ┌───────────┬───────────┬───┼───┬───────────┬───────────┐
           │           │           │       │           │           │
           ▼           ▼           ▼       ▼           ▼           ▼
      ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
      │  User  │  │  Menu  │  │Category│  │MenuItem│  │ Order  │  │Customer│
      │(Staff) │  │        │  │        │  │        │  │        │  │        │
      └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
                       │           │           │           │           │
                       │           ▼           │           ▼           ▼
                       │      ┌────────┐       │      ┌────────┐  ┌────────┐
                       └─────▶│MenuItem│◀──────┘      │ Review │  │ Review │
                              └────────┘              └────────┘  └────────┘

Additional Models:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  GiftCard    │  │  PromoCode   │  │ModifierGroup │  │AbandonedCart │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Models

### Tenant

The central model representing a restaurant/location.

```prisma
model Tenant {
  id                    String    @id @default(cuid())
  slug                  String    @unique      // URL-friendly identifier
  name                  String                 // Restaurant name
  email                 String    @unique      // Owner email
  phone                 String?
  
  // Multi-location support
  parentTenantId        String?               // If this is a child location
  parentTenant          Tenant?   @relation("TenantLocations", ...)
  childLocations        Tenant[]  @relation("TenantLocations")
  
  // Location
  address               String?
  city                  String?
  state                 String?
  zip                   String?
  latitude              Float?
  longitude             Float?
  timezone              String    @default("America/New_York")
  
  // Branding
  logo                  String?
  template              String    @default("modern")
  menuLayout            String    @default("blu-bentonville")
  primaryColor          String    @default("#2563eb")
  secondaryColor        String    @default("#1e40af")
  
  // Stripe Connect
  stripeAccountId       String?               // Connected Stripe account
  stripeOnboardingComplete Boolean @default(false)
  
  // Features
  pickupEnabled         Boolean   @default(true)
  deliveryEnabled       Boolean   @default(false)
  scheduledOrdersEnabled Boolean  @default(true)
  giftCardsEnabled      Boolean   @default(true)
  loyaltyEnabled        Boolean   @default(false)
  reviewsEnabled        Boolean   @default(true)
  
  // Fees
  taxRate               Float     @default(0)    // Percentage (e.g., 9.0 for 9%)
  deliveryFee           Float     @default(0)
  minOrderAmount        Float     @default(0)
  platformFeePercent    Float     @default(2.9)  // Platform's cut
  
  // Order Throttling
  maxOrdersPerWindow    Int?                  // Max orders in time window
  orderWindowMinutes    Int?                  // Time window in minutes
  
  // Business Hours (JSON)
  businessHours         Json?
  
  // DoorDash Integration
  doordashDeveloperId   String?
  doordashKeyId         String?
  doordashSigningSecret String?
  pickupInstructions    String?
  
  // SMS (Twilio)
  twilioAccountSid      String?
  twilioAuthToken       String?
  twilioPhoneNumber     String?
  smsNotificationsEnabled Boolean @default(false)
  
  // CRM (Go High Level)
  ghlApiKey             String?
  ghlLocationId         String?
  
  // Loyalty Settings
  loyaltyPointsPerDollar Int      @default(1)
  loyaltyPointsRedemptionRate Int @default(100)
  loyaltyRedemptionValue Float   @default(5)
  
  // Custom CTA Banner
  ctaEnabled            Boolean   @default(false)
  ctaText               String?
  ctaSubtext            String?
  ctaLink               String?
  ctaButtonText         String?
  
  // Status
  isActive              Boolean   @default(true)
  isOnboarded           Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  users                 User[]
  menus                 Menu[]
  categories            Category[]
  menuItems             MenuItem[]
  modifierGroups        ModifierGroup[]
  orders                Order[]
  giftCards             GiftCard[]
  promoCodes            PromoCode[]
  customers             Customer[]
  reviews               Review[]
  abandonedCarts        AbandonedCart[]
}
```

#### Business Hours JSON Format

```json
{
  "monday": { "open": "11:00", "close": "22:00" },
  "tuesday": { "open": "11:00", "close": "22:00" },
  "wednesday": { "open": "11:00", "close": "22:00" },
  "thursday": { "open": "11:00", "close": "22:00" },
  "friday": { "open": "11:00", "close": "23:00" },
  "saturday": { "open": "11:00", "close": "23:00" },
  "sunday": null
}
```

---

### User

Restaurant staff members.

```prisma
model User {
  id            String    @id @default(cuid())
  tenantId      String
  tenant        Tenant    @relation(...)
  
  email         String
  passwordHash  String
  name          String?
  role          String    @default("owner")  // owner | manager | staff
  
  // Permissions (for staff role)
  canViewOrders     Boolean @default(true)
  canEditOrders     Boolean @default(false)
  canEditMenu       Boolean @default(false)
  canEditSettings   Boolean @default(false)
  canViewAnalytics  Boolean @default(false)
  canManageStaff    Boolean @default(false)
  
  // Password reset
  resetToken        String?
  resetTokenExpiry  DateTime?
  
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([tenantId, email])  // Same email can exist for different tenants
}
```

---

### Customer

End users who place orders.

```prisma
model Customer {
  id            String    @id @default(cuid())
  tenantId      String
  tenant        Tenant    @relation(...)
  
  phone         String              // Primary identifier
  email         String?
  name          String?
  
  // Loyalty
  loyaltyPoints Int       @default(0)
  totalSpent    Float     @default(0)
  orderCount    Int       @default(0)
  
  // Phone verification
  phoneVerified Boolean   @default(false)
  verifyCode    String?
  verifyCodeExpiry DateTime?
  
  // Preferences
  favoriteItems String[]  @default([])   // Array of menuItemIds
  allergenFilters String[] @default([])  // Allergens to filter out
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  orders        Order[]
  reviews       Review[]
  
  @@unique([tenantId, phone])
}
```

---

### Menu

Multiple menus per restaurant (Dine In, Takeout, Catering).

```prisma
model Menu {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  
  name        String            // e.g., "Dine In", "Catering"
  description String?
  icon        String?           // Lucide icon name or emoji
  isActive    Boolean   @default(true)
  isDefault   Boolean   @default(false)
  sortOrder   Int       @default(0)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  categories  Category[]
}
```

---

### Category

Menu categories (Appetizers, Entrees, etc.).

```prisma
model Category {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  
  menuId      String?           // Link to specific menu
  menu        Menu?     @relation(...)
  
  name        String
  description String?
  image       String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  
  // Time-based availability
  availableFrom String?         // "06:00"
  availableTo   String?         // "11:00"
  availableDays String[] @default([])  // ["monday", "tuesday"]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  menuItems   MenuItem[]
}
```

---

### MenuItem

Individual menu items.

```prisma
model MenuItem {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  categoryId  String
  category    Category  @relation(...)
  
  name        String
  description String?
  price       Float
  image       String?
  images      String[]  @default([])   // Multiple images for galleries
  
  // Variants (Size options)
  variants    Json?     // [{ name: "Small", price: 12.99 }, ...]
  
  // Modifier groups (IDs of linked ModifierGroups)
  modifierGroupIds String[] @default([])
  
  // 86'd / Sold Out
  isSoldOut   Boolean   @default(false)
  soldOutAutoReset Boolean @default(true)  // Reset at midnight
  
  prepTimeMinutes Int?          // Prep time for this item
  
  // Availability
  isAvailable Boolean   @default(true)
  sortOrder   Int       @default(0)
  
  // Time-based availability
  availableFrom String?
  availableTo   String?
  availableDays String[] @default([])
  
  // Dietary info
  allergens   String[]  @default([])  // ["nuts", "dairy", "gluten"]
  calories    Int?
  
  // Upselling
  upsellItemId String?          // "Add fries?"
  upsellPrice  Float?
  
  // Combos/Bundles
  isCombo         Boolean @default(false)
  comboComponents Json?   // Bundle configuration
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Variants JSON Format

```json
[
  { "name": "Small", "price": 12.99 },
  { "name": "Medium", "price": 15.99 },
  { "name": "Large", "price": 18.99 }
]
```

---

### ModifierGroup

Groups of modifiers (Toppings, Sauces, Sides).

```prisma
model ModifierGroup {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  
  name        String            // "Toppings", "Sides"
  description String?
  
  // Selection rules
  isRequired  Boolean   @default(false)
  minSelections Int     @default(0)   // "Choose at least 2"
  maxSelections Int?                  // "Choose up to 3" (null = unlimited)
  
  // Modifiers (JSON array)
  modifiers   Json      // [{ name: "Pepperoni", price: 1.50 }, ...]
  
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Modifiers JSON Format

```json
[
  { "name": "Extra Cheese", "price": 1.50 },
  { "name": "Pepperoni", "price": 2.00 },
  { "name": "Mushrooms", "price": 1.00 },
  { "name": "Olives", "price": 1.00, "soldOut": true }
]
```

---

### Order

Customer orders.

```prisma
model Order {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(...)
  
  customerId      String?
  customer        Customer? @relation(...)
  
  orderNumber     String            // "ORD-20240115-0001"
  status          String    @default("pending")
  type            String            // "pickup" | "delivery"
  
  // Customer info
  customerName    String
  customerEmail   String
  customerPhone   String
  
  // Delivery info
  deliveryAddress String?
  deliveryLat     Float?
  deliveryLng     Float?
  
  // Items (JSON array)
  items           Json
  
  // Pricing
  subtotal        Float
  tax             Float
  tip             Float     @default(0)
  deliveryFee     Float     @default(0)
  discount        Float     @default(0)
  total           Float
  
  // Promo code
  promoCodeId     String?
  promoCodeDiscount Float   @default(0)
  
  // Payment
  paymentIntentId String?
  paymentStatus   String    @default("pending")
  
  // Refund
  refundedAmount  Float     @default(0)
  refundReason    String?
  refundedAt      DateTime?
  
  // Gift card
  giftCardId      String?
  giftCardAmount  Float     @default(0)
  
  // Loyalty
  loyaltyPointsEarned   Int @default(0)
  loyaltyPointsRedeemed Int @default(0)
  
  // Scheduling
  scheduledFor    DateTime?
  scheduledDate   String?           // "2024-01-15" for future orders
  estimatedReady  DateTime?
  estimatedPrepMinutes Int?
  
  // Notes
  notes           String?           // Customer notes
  kitchenNotes    String?           // Staff notes
  
  // DoorDash
  doordashDeliveryId String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  completedAt     DateTime?
}
```

#### Order Status Flow

```
pending → preparing → ready → completed
    └───────────────────────→ cancelled
```

#### Order Items JSON Format

```json
[
  {
    "menuItemId": "item_123",
    "name": "Margherita Pizza",
    "quantity": 2,
    "price": 14.99,
    "options": [
      {
        "optionGroupName": "Size",
        "optionName": "Large",
        "price": 4.00
      },
      {
        "optionGroupName": "Toppings",
        "optionName": "Extra Cheese",
        "price": 1.50
      }
    ],
    "specialRequests": "Well done please"
  }
]
```

---

### GiftCard

Digital gift cards.

```prisma
model GiftCard {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(...)
  
  code            String    @unique       // "GIFT-XXXX-XXXX"
  initialBalance  Float
  currentBalance  Float
  
  purchaserName   String?
  purchaserEmail  String?
  recipientName   String?
  recipientEmail  String?
  message         String?
  
  isActive        Boolean   @default(true)
  expiresAt       DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

### PromoCode

Discount codes.

```prisma
model PromoCode {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  
  code        String            // "FIRST10", "SUMMER20"
  description String?
  
  discountType    String        // "percent" | "fixed"
  discountValue   Float         // 10 for 10% or 5.00 for $5
  
  // Rules
  minOrderAmount  Float?
  maxDiscountAmount Float?      // Cap for percent discounts
  firstTimeOnly   Boolean @default(false)
  singleUse       Boolean @default(false)
  
  // Usage tracking
  usageCount      Int     @default(0)
  maxUsageCount   Int?            // null = unlimited
  
  // Validity
  startsAt        DateTime?
  expiresAt       DateTime?
  isActive        Boolean @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([tenantId, code])
}
```

---

### Review

Customer reviews.

```prisma
model Review {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  
  customerId  String?
  customer    Customer? @relation(...)
  
  orderId     String?
  rating      Int               // 1-5
  comment     String?
  
  response    String?           // Restaurant response
  respondedAt DateTime?
  
  isPublic    Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

### AbandonedCart

Track abandoned carts for recovery emails.

```prisma
model AbandonedCart {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(...)
  
  email       String?
  phone       String?
  
  items       Json              // Cart contents
  subtotal    Float
  
  recoveryEmailSent Boolean   @default(false)
  recoverySmsSent   Boolean   @default(false)
  recovered         Boolean   @default(false)
  recoveredOrderId  String?
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

### ProcessedWebhook

Webhook idempotency tracking.

```prisma
model ProcessedWebhook {
  id          String    @id @default(cuid())
  eventId     String    @unique       // Stripe event ID
  source      String                  // "stripe" | "doordash"
  eventType   String                  // "payment_intent.succeeded"
  processedAt DateTime  @default(now())
}
```

---

### Session

User sessions for JWT tracking.

```prisma
model Session {
  id          String    @id @default(cuid())
  userId      String
  token       String    @unique
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}
```

---

## Indexes

Important indexes for query performance:

```prisma
// Tenant lookups
@@index([slug])
@@index([email])

// Menu items
@@index([tenantId])
@@index([categoryId])
@@index([tenantId, isAvailable])

// Orders
@@index([tenantId])
@@index([tenantId, status])
@@index([tenantId, createdAt])
@@index([orderNumber])
@@index([customerId])
@@index([paymentIntentId])

// Customers
@@index([tenantId])
@@index([phone])

// Webhooks
@@index([eventId])
@@index([source, processedAt])
```

---

## Common Queries

### Get Restaurant with Menu

```typescript
const tenant = await prisma.tenant.findUnique({
  where: { slug: 'joes-pizza' },
  include: {
    categories: {
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    },
    modifierGroups: {
      where: { isActive: true },
    },
  },
})
```

### Get Today's Orders

```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

const orders = await prisma.order.findMany({
  where: {
    tenantId: session.tenantId,
    createdAt: { gte: today },
    status: { not: 'cancelled' },
  },
  orderBy: { createdAt: 'desc' },
})
```

### Get Customer with Loyalty

```typescript
const customer = await prisma.customer.findUnique({
  where: {
    tenantId_phone: {
      tenantId: tenant.id,
      phone: '(555) 123-4567',
    },
  },
  include: {
    orders: {
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
})
```

### Update Order Status

```typescript
const order = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: 'preparing',
    updatedAt: new Date(),
  },
})
```

---

## Migrations

### Create Migration

```bash
# Development - creates migration and applies it
npx prisma migrate dev --name add_feature_name

# Production - apply existing migrations
npx prisma migrate deploy
```

### Push Schema (Dev Only)

```bash
# Quick schema sync without migration history
npx prisma db push
```

### Reset Database

```bash
# WARNING: Deletes all data
npx prisma migrate reset
```

### Seed Data

```bash
npx prisma db seed
```

---

## Best Practices

### Always Filter by Tenant

```typescript
// ✅ Correct
const orders = await prisma.order.findMany({
  where: { tenantId: session.tenantId },
})

// ❌ Security risk - exposes all tenants' data
const orders = await prisma.order.findMany()
```

### Use Transactions for Related Changes

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({ data: orderData })
  
  // Deduct gift card
  await tx.giftCard.update({
    where: { id: giftCardId },
    data: { currentBalance: { decrement: amount } },
  })
  
  // Update customer stats
  await tx.customer.update({
    where: { id: customerId },
    data: {
      orderCount: { increment: 1 },
      totalSpent: { increment: order.total },
    },
  })
  
  return order
})
```

### Handle Concurrent Updates

```typescript
// Use optimistic locking or transactions for concurrent updates
const order = await prisma.order.update({
  where: {
    id: orderId,
    updatedAt: previousUpdatedAt, // Optimistic lock
  },
  data: { status: 'preparing' },
})
```

---

For schema changes, always create a migration and test in a staging environment first.
