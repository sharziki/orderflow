# Contributing to OrderFlow

Thank you for your interest in contributing to OrderFlow! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Project Structure](#project-structure)
- [How to Add New Features](#how-to-add-new-features)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report bugs clearly with reproduction steps

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Git

### Fork & Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/orderflow.git
cd orderflow

# Add upstream remote
git remote add upstream https://github.com/original/orderflow.git
```

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - At least 32 characters
- `STRIPE_SECRET_KEY` - Stripe test key
- `STRIPE_PUBLISHABLE_KEY` - Stripe public test key

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed demo data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define types/interfaces for all data structures
- Avoid `any` - use proper types or `unknown`
- Use type inference where obvious

```typescript
// ✅ Good
interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
}

function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// ❌ Bad
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0)
}
```

### React Components

- Use functional components with hooks
- Use `'use client'` directive only when needed
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

```tsx
// ✅ Good - Server Component (default)
async function OrderList({ tenantId }: { tenantId: string }) {
  const orders = await getOrders(tenantId)
  return <OrderTable orders={orders} />
}

// ✅ Good - Client Component (when needed)
'use client'
import { useState } from 'react'

function OrderStatusButton({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState('pending')
  // ...
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `OrderModal.tsx`)
- Utilities: `kebab-case.ts` (e.g., `stripe-fees.ts`)
- API routes: `route.ts` in appropriate folder
- Types: Define in same file or `types.ts`

### Directory Structure

```
feature/
├── components/          # UI components
├── hooks/               # Custom React hooks
├── lib/                 # Business logic
├── types.ts             # Type definitions
└── utils.ts             # Helper functions
```

### CSS / Styling

- Use Tailwind CSS classes
- Use `cn()` helper for conditional classes
- Follow mobile-first responsive design
- Use shadcn/ui components when available

```tsx
import { cn } from '@/lib/utils'

function Button({ variant, className }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        className
      )}
    >
      Click me
    </button>
  )
}
```

### Error Handling

- Always handle errors gracefully
- Log errors with context
- Return user-friendly error messages
- Use try-catch in API routes

```typescript
// API Route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ... process
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

## Project Structure

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages & API routes |
| `app/api/` | REST API endpoints |
| `app/dashboard/` | Restaurant dashboard |
| `app/store/[slug]/` | Customer storefront |
| `components/` | Reusable React components |
| `components/ui/` | shadcn/ui base components |
| `lib/` | Utility functions & integrations |
| `prisma/` | Database schema & migrations |

### API Route Pattern

```
app/api/
├── resource/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET (read), PUT (update), DELETE
```

### Component Organization

```
components/
├── ui/                    # Base UI components (shadcn)
├── store-templates/       # Storefront themes
├── menu-layouts/          # Menu display variants
├── providers/             # Context providers
└── [feature].tsx          # Feature-specific components
```

---

## How to Add New Features

### 1. Plan the Feature

- Identify which files need changes
- Plan the database schema changes (if any)
- Design the API endpoints
- Sketch the UI components

### 2. Database Changes

If adding new data models:

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_feature_name

# 3. Generate client
npx prisma generate
```

### 3. API Development

Create API routes following the pattern:

```typescript
// app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - List resources
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await prisma.feature.findMany({
    where: { tenantId: session.tenantId },
  })

  return NextResponse.json({ data })
}

// POST - Create resource
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Validate input
    // Create resource
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### 4. Frontend Development

Create components following patterns:

```tsx
// components/FeatureComponent.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface FeatureProps {
  tenantId: string
}

export function FeatureComponent({ tenantId }: FeatureProps) {
  const [data, setData] = useState<FeatureData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [tenantId])

  async function fetchData() {
    try {
      const res = await fetch('/api/feature')
      const json = await res.json()
      setData(json.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {/* Component UI */}
    </div>
  )
}
```

### 5. Add Tests

```typescript
// tests/feature.spec.ts
import { test, expect } from '@playwright/test'

test('feature should work', async ({ page }) => {
  await page.goto('/dashboard/feature')
  await expect(page.getByText('Feature Title')).toBeVisible()
  // ... more assertions
})
```

---

## Testing

### Run Tests

```bash
# All tests
npm run test

# With UI
npm run test:ui

# Headed (see browser)
npm run test:headed

# Specific file
npx playwright test tests/orders.spec.ts
```

### Writing Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
  })

  test('can view orders list', async ({ page }) => {
    await page.goto('/dashboard/orders')
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()
  })

  test('can update order status', async ({ page }) => {
    await page.goto('/dashboard/orders')
    await page.click('text=Mark Ready')
    await expect(page.getByText('Order updated')).toBeVisible()
  })
})
```

### Testing Philosophy

- Test user flows, not implementation details
- Cover critical paths (ordering, payments)
- Use realistic test data
- Keep tests independent

---

## Pull Request Process

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, documented code
- Add tests for new functionality
- Update documentation if needed

### 3. Test Locally

```bash
npm run lint      # Check for lint errors
npm run build     # Ensure build passes
npm run test      # Run all tests
```

### 4. Commit Changes

Follow commit message guidelines (see below).

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### 6. PR Requirements

- [ ] Descriptive title and description
- [ ] All tests pass
- [ ] No lint errors
- [ ] Documentation updated (if applicable)
- [ ] Screenshots for UI changes

### 7. Code Review

- Address reviewer feedback
- Push additional commits as needed
- Keep the conversation constructive

---

## Commit Message Guidelines

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
feat(orders): add scheduled orders support

# Bug fix
fix(checkout): prevent duplicate payment submissions

# Documentation
docs(readme): add deployment instructions

# Refactor
refactor(auth): extract JWT utilities to separate file
```

### Scope (Optional)

Common scopes:
- `auth` - Authentication
- `orders` - Order management
- `menu` - Menu items
- `dashboard` - Restaurant dashboard
- `store` - Customer storefront
- `payments` - Stripe integration
- `api` - API changes

---

## Questions?

If you have questions or need help:

1. Check existing issues
2. Read the documentation in `/docs`
3. Open a new issue with the "question" label

Thank you for contributing to OrderFlow! 🎉
