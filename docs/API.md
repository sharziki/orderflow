# OrderFlow API Reference

Complete documentation for all API endpoints in OrderFlow.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Common Patterns](#common-patterns)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Menu](#menu)
  - [Orders](#orders)
  - [Settings](#settings)
  - [Customers](#customers)
  - [Store](#store)
  - [Payments](#payments)
  - [Webhooks](#webhooks)
  - [Admin](#admin)

---

## Overview

### Base URL

```
Development: http://localhost:3000/api
Production:  https://yourdomain.com/api
```

### Request Format

- Content-Type: `application/json`
- All POST/PUT bodies must be valid JSON
- Dates in ISO 8601 format

### Response Format

```json
// Success
{
  "data": { ... },
  "message": "Operation successful"
}

// Error
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## Authentication

### Session-Based Auth

OrderFlow uses JWT tokens stored in httpOnly cookies.

```typescript
// Token is automatically sent with requests
// No manual header needed when using fetch with credentials

fetch('/api/orders', {
  credentials: 'include',  // Include cookies
})
```

### Protected Routes

Routes under `/dashboard` and `/admin` require authentication. The middleware automatically redirects to `/login` if not authenticated.

---

## Common Patterns

### Rate Limiting

- 10 requests per minute per IP for order creation
- 100 requests per minute for other endpoints
- Returns 429 with `Retry-After` header when exceeded

### Tenant Scoping

All authenticated endpoints automatically scope data to the user's tenant:

```typescript
// ✅ API automatically filters by session.tenantId
GET /api/orders  →  Returns only your restaurant's orders
```

### Pagination

List endpoints support pagination:

```
GET /api/orders?limit=20&offset=40
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

---

## Endpoints

---

## Auth

### POST /api/auth/login

Authenticate a user.

**Request:**
```json
{
  "email": "owner@restaurant.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "owner@restaurant.com",
    "name": "John Owner",
    "role": "owner"
  },
  "tenant": {
    "id": "tenant_456",
    "name": "Joe's Pizza",
    "slug": "joes-pizza"
  }
}
```

**Errors:**
- 401: Invalid email or password

---

### POST /api/auth/logout

End the current session.

**Request:** None

**Response (200):**
```json
{
  "success": true
}
```

---

### POST /api/auth/forgot-password

Request a password reset email.

**Request:**
```json
{
  "email": "owner@restaurant.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists, a reset email has been sent"
}
```

---

### POST /api/auth/reset-password

Reset password with token.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "newPassword123"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 400: Invalid or expired token

---

## Menu

### GET /api/menu/categories

List all menu categories.

**Response (200):**
```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Appetizers",
      "description": "Start your meal right",
      "image": "https://...",
      "sortOrder": 0,
      "isActive": true,
      "menuItems": [...]
    }
  ]
}
```

---

### POST /api/menu/categories

Create a new category.

**Request:**
```json
{
  "name": "Desserts",
  "description": "Sweet treats",
  "image": "https://...",
  "sortOrder": 5,
  "isActive": true
}
```

**Response (201):**
```json
{
  "category": {
    "id": "cat_new",
    "name": "Desserts",
    ...
  }
}
```

---

### PUT /api/menu/categories/[id]

Update a category.

**Request:**
```json
{
  "name": "Updated Name",
  "sortOrder": 3
}
```

**Response (200):**
```json
{
  "category": { ... }
}
```

---

### DELETE /api/menu/categories/[id]

Delete a category and all its items.

**Response (200):**
```json
{
  "success": true
}
```

---

### GET /api/menu/items

List all menu items.

**Query Parameters:**
- `categoryId` - Filter by category

**Response (200):**
```json
{
  "items": [
    {
      "id": "item_123",
      "name": "Margherita Pizza",
      "description": "Classic tomato and mozzarella",
      "price": 14.99,
      "image": "https://...",
      "images": ["https://..."],
      "categoryId": "cat_123",
      "modifierGroupIds": ["mod_1", "mod_2"],
      "variants": [
        { "name": "Small", "price": 12.99 },
        { "name": "Large", "price": 18.99 }
      ],
      "allergens": ["gluten", "dairy"],
      "calories": 850,
      "isSoldOut": false,
      "isAvailable": true
    }
  ]
}
```

---

### POST /api/menu/items

Create a new menu item.

**Request:**
```json
{
  "name": "New Pizza",
  "description": "Delicious new pizza",
  "price": 15.99,
  "categoryId": "cat_123",
  "image": "https://...",
  "modifierGroupIds": ["mod_1"],
  "allergens": ["gluten"],
  "isAvailable": true
}
```

**Response (201):**
```json
{
  "item": { ... }
}
```

---

### PUT /api/menu/items/[id]

Update a menu item.

**Request:**
```json
{
  "price": 16.99,
  "isSoldOut": true
}
```

---

### DELETE /api/menu/items/[id]

Delete a menu item.

---

### GET /api/menu/modifiers

List all modifier groups.

**Response (200):**
```json
{
  "modifierGroups": [
    {
      "id": "mod_123",
      "name": "Toppings",
      "isRequired": false,
      "minSelections": 0,
      "maxSelections": 5,
      "modifiers": [
        { "name": "Extra Cheese", "price": 1.50 },
        { "name": "Pepperoni", "price": 2.00 }
      ]
    }
  ]
}
```

---

### POST /api/menu/modifiers

Create a modifier group.

**Request:**
```json
{
  "name": "Sauces",
  "isRequired": true,
  "minSelections": 1,
  "maxSelections": 1,
  "modifiers": [
    { "name": "Ranch", "price": 0 },
    { "name": "BBQ", "price": 0 }
  ]
}
```

---

## Orders

### GET /api/orders

List orders for the current tenant.

**Query Parameters:**
- `status` - Filter by status (pending, preparing, ready, completed, cancelled)
- `type` - Filter by type (pickup, delivery)
- `limit` - Items per page (default: 50)
- `offset` - Skip items (default: 0)

**Response (200):**
```json
{
  "orders": [
    {
      "id": "order_123",
      "orderNumber": "ORD-20240115-0001",
      "status": "pending",
      "type": "delivery",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "(555) 123-4567",
      "deliveryAddress": "123 Main St",
      "items": [
        {
          "menuItemId": "item_123",
          "name": "Margherita Pizza",
          "quantity": 2,
          "price": 14.99,
          "options": [
            { "optionGroupName": "Toppings", "optionName": "Extra Cheese", "price": 1.50 }
          ]
        }
      ],
      "subtotal": 31.48,
      "tax": 2.83,
      "deliveryFee": 4.99,
      "tip": 5.00,
      "discount": 0,
      "total": 44.30,
      "scheduledFor": null,
      "notes": "Ring doorbell",
      "createdAt": "2024-01-15T12:30:00Z"
    }
  ],
  "total": 150,
  "stats": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### POST /api/orders

Create a new order (from storefront).

**Request:**
```json
{
  "tenantSlug": "joes-pizza",
  "type": "delivery",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "(555) 123-4567",
  "deliveryAddress": "123 Main St, City, ST 12345",
  "deliveryLat": 40.7128,
  "deliveryLng": -74.0060,
  "items": [
    {
      "menuItemId": "item_123",
      "quantity": 2,
      "options": [
        { "optionGroupName": "Toppings", "optionName": "Extra Cheese", "price": 1.50 }
      ]
    }
  ],
  "tip": 5.00,
  "notes": "Ring doorbell",
  "promoCode": "FIRST10",
  "giftCardCode": "GIFT-XXXX-XXXX",
  "scheduledFor": "2024-01-15T18:00:00Z"
}
```

**Response (201):**
```json
{
  "order": {
    "id": "order_new",
    "orderNumber": "ORD-20240115-0042",
    "total": 44.30,
    "status": "pending"
  },
  "message": "Order placed successfully!"
}
```

**Errors:**
- 400: Validation error (item not found, min order not met)
- 404: Restaurant not found
- 429: Order throttle exceeded

---

### GET /api/orders/[orderId]

Get order details.

**Response (200):**
```json
{
  "order": { ... }
}
```

---

### PUT /api/orders/[orderId]

Update order status.

**Request:**
```json
{
  "status": "preparing"
}
```

**Valid Status Transitions:**
- pending → preparing, cancelled
- preparing → ready, cancelled
- ready → completed, cancelled
- completed → (no changes)
- cancelled → (no changes)

---

### POST /api/orders/[orderId]/delivery

Request DoorDash delivery.

**Request:**
```json
{
  "tip": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "deliveryId": "dd_123456",
  "status": "created",
  "fee": 599
}
```

---

### POST /api/orders/[orderId]/refund

Issue a refund.

**Request:**
```json
{
  "amount": 10.00,
  "reason": "Customer request - wrong order"
}
```

**Response (200):**
```json
{
  "success": true,
  "refundId": "re_123",
  "refundedAmount": 10.00
}
```

---

## Settings

### GET /api/settings

Get tenant settings.

**Response (200):**
```json
{
  "settings": {
    "name": "Joe's Pizza",
    "slug": "joes-pizza",
    "email": "owner@joespizza.com",
    "phone": "(555) 123-4567",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "logo": "https://...",
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "taxRate": 9.0,
    "deliveryFee": 4.99,
    "minOrderAmount": 15.00,
    "pickupEnabled": true,
    "deliveryEnabled": true,
    "scheduledOrdersEnabled": true,
    "businessHours": {
      "monday": { "open": "11:00", "close": "22:00" },
      ...
    },
    "stripeAccountId": "acct_123",
    "stripeOnboardingComplete": true
  }
}
```

---

### PUT /api/settings

Update tenant settings.

**Request:**
```json
{
  "name": "Joe's Famous Pizza",
  "taxRate": 8.5,
  "deliveryFee": 5.99
}
```

---

### PUT /api/settings/demo-mode

Toggle demo mode for testing.

**Request:**
```json
{
  "enabled": true
}
```

---

## Customers

### GET /api/customers

List customers (with loyalty data).

**Response (200):**
```json
{
  "customers": [
    {
      "id": "cust_123",
      "phone": "(555) 123-4567",
      "email": "john@example.com",
      "name": "John Doe",
      "loyaltyPoints": 150,
      "totalSpent": 245.50,
      "orderCount": 8,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/loyalty

Get loyalty program status for a customer.

**Query Parameters:**
- `phone` - Customer phone number

**Response (200):**
```json
{
  "customer": {
    "id": "cust_123",
    "loyaltyPoints": 150,
    "totalSpent": 245.50,
    "orderCount": 8
  },
  "rewards": {
    "pointsPerDollar": 1,
    "redemptionRate": 100,
    "redemptionValue": 5.00,
    "availableRewards": 1
  }
}
```

---

### POST /api/loyalty/redeem

Redeem loyalty points.

**Request:**
```json
{
  "customerId": "cust_123",
  "points": 100
}
```

---

## Store

### GET /api/store/[slug]

Get public store data for customer storefront.

**Response (200):**
```json
{
  "tenant": {
    "name": "Joe's Pizza",
    "slug": "joes-pizza",
    "logo": "https://...",
    "primaryColor": "#2563eb",
    "address": "123 Main St",
    "phone": "(555) 123-4567",
    "businessHours": {...},
    "pickupEnabled": true,
    "deliveryEnabled": true,
    "taxRate": 9.0,
    "deliveryFee": 4.99,
    "minOrderAmount": 15.00
  },
  "categories": [...],
  "items": [...],
  "modifierGroups": [...]
}
```

---

### GET /api/store/[slug]/reviews

Get store reviews.

**Response (200):**
```json
{
  "reviews": [
    {
      "id": "rev_123",
      "rating": 5,
      "comment": "Best pizza in town!",
      "response": "Thank you!",
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ],
  "averageRating": 4.5,
  "totalReviews": 42
}
```

---

### POST /api/store/[slug]/reviews

Submit a review (after ordering).

**Request:**
```json
{
  "orderId": "order_123",
  "rating": 5,
  "comment": "Delicious!"
}
```

---

## Payments

### POST /api/create-payment-intent

Create Stripe PaymentIntent for checkout.

**Request:**
```json
{
  "tenantId": "tenant_123",
  "amount": 4430,
  "orderId": "order_123"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

---

### GET /api/gift-cards/[code]

Check gift card balance.

**Response (200):**
```json
{
  "giftCard": {
    "code": "GIFT-XXXX-XXXX",
    "currentBalance": 25.00,
    "isActive": true
  }
}
```

---

### POST /api/gift-cards/[code]/redeem

Redeem gift card (applied at checkout).

---

### POST /api/promo-codes/validate

Validate a promo code.

**Request:**
```json
{
  "code": "FIRST10",
  "subtotal": 50.00
}
```

**Response (200):**
```json
{
  "valid": true,
  "discount": 5.00,
  "discountType": "percent",
  "message": "10% off applied!"
}
```

---

## Webhooks

### POST /api/webhooks/stripe

Handle Stripe webhook events.

**Events Handled:**
- `payment_intent.succeeded` - Mark order as paid
- `payment_intent.payment_failed` - Handle failed payment
- `account.updated` - Update Stripe Connect status
- `charge.refunded` - Record refund

**Headers Required:**
- `stripe-signature` - Webhook signature

---

### POST /api/doordash/webhook

Handle DoorDash delivery status updates.

**Events Handled:**
- Delivery status changes
- Driver assignment
- Pickup/dropoff updates

---

## Admin

### GET /api/admin/tenants

List all tenants (platform admin only).

**Response (200):**
```json
{
  "tenants": [
    {
      "id": "tenant_123",
      "name": "Joe's Pizza",
      "slug": "joes-pizza",
      "email": "owner@joespizza.com",
      "isActive": true,
      "stripeOnboardingComplete": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "_count": {
        "orders": 150,
        "menuItems": 45
      }
    }
  ]
}
```

---

## Error Responses

### Validation Error (400)

```json
{
  "error": "Minimum order amount is $15.00"
}
```

### Unauthorized (401)

```json
{
  "error": "Unauthorized"
}
```

### Not Found (404)

```json
{
  "error": "Order not found"
}
```

### Rate Limited (429)

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfterSeconds": 60
}
```

### Server Error (500)

```json
{
  "error": "Failed to process request. Please try again."
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /api/orders | 10/minute per IP |
| POST /api/auth/login | 5/minute per IP |
| POST /api/auth/forgot-password | 3/minute per email |
| Other endpoints | 100/minute per IP |

---

## Testing

Use these test values in development:

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

**Demo Tenant:**
- Slug: `demo-restaurant`
- Email: `demo@orderflow.io`
- Password: `demo123`
