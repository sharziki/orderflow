# OrderFlow

**White-label restaurant online ordering platform**

Restaurants sign up → customize branding → add menu → deploy. Done.

## Features

- 🍽️ Full online ordering (pickup & delivery)
- 🚗 DoorDash Drive integration
- 💳 Stripe payments (with Connect for payouts)
- 🎁 Gift cards
- 🖨️ Receipt printing (PrintNode)
- 📱 Mobile-responsive
- ⏰ Scheduled orders
- 📧 Email notifications

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OrderFlow Platform                    │
├─────────────────────────────────────────────────────────┤
│  Dashboard (dashboard.orderflow.io)                     │
│  - Restaurant signup/onboarding                         │
│  - Menu management                                      │
│  - Branding customization                               │
│  - Analytics & orders                                   │
│  - Deploy button                                        │
├─────────────────────────────────────────────────────────┤
│  Deployed Stores                                        │
│  - restaurant1.orderflow.io                             │
│  - restaurant2.orderflow.io                             │
│  - custom-domain.com                                    │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe + Stripe Connect
- **Delivery**: DoorDash Drive API
- **Hosting**: Vercel
- **Email**: Resend

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required variables.

## License

Proprietary - All rights reserved
