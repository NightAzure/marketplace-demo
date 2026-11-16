# Mini-Marketplace

A local buy-and-sell marketplace built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Supabase** (Postgres + Storage), and **Stripe Connect** (Direct Charges). No user login is required—sellers are identified by their listing email for both buyer inquiries and Stripe Connect payouts.

## Features

- **Browse, Search & Filter**: Responsive grid/list marketplace feed (`/`), dynamic category routes (`/category/[slug]`), keyword search across title/description/location/category, and price/newest sorting. Sold listings are automatically hidden from the active feed.
- **Create Listings (`/create`, `/create/item`)**: Drag-and-drop photo upload to the Supabase `listing-images` storage bucket (`/api/upload`), Zod validation, and a synchronized live card/detail preview.
- **Buyer-to-Seller Messaging (`/api/messages`)**: Private inquiry modal on `/item/[id]` with quick-reply chips, stored in Supabase `messages` and emailed to the seller via Resend (with Nodemailer SMTP fallback).
- **Stripe Connect Seller Onboarding (`/connect`)**: Sellers enter the email used on their listings, complete Stripe's hosted onboarding, and their connected account (`acct_...`) and readiness flags are saved to Supabase `seller_accounts`.
- **Buy Now via Direct Charges (`/api/stripe/checkout`)**: Listings (`>= $0.50`) from onboarded sellers display a **Buy Now** button on their dedicated `/item/[id]` page, creating a Stripe Checkout Session directly on the seller's connected account with a **10% platform fee** (`application_fee_amount`).
- **Webhook Order Confirmation (`/api/stripe/webhook` & `/checkout/success`)**: Handles `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `account.updated` events, records paid orders in Supabase `orders`, marks purchased listings as `sold`, and displays an order receipt on `/checkout/success`.

## Tech Stack

- **Framework**: Next.js `16.4.6`, React `19.3`, TypeScript
- **Styling & UI**: Tailwind CSS v4, Radix UI / shadcn-style components, `lucide-react`
- **Database & Storage**: Supabase (`@supabase/supabase-js`)
- **Payments**: Stripe Connect (`stripe`, Direct Charges + Connect Webhooks)
- **Email**: Resend (`resend`) with Nodemailer (`nodemailer`) SMTP fallback
- **Validation**: Zod (`zod`)

## Environment Variables

Copy `.env.example` to `.env` (or `.env.local`) and fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Transactional Email (Resend primary)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="Mini-Marketplace <noreply@yourdomain.com>"

# Transactional Email (Nodemailer SMTP fallback)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# Application URL (used in email links & server-side references)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Connect (Sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

## Database Setup

Run the SQL migrations in `supabase/migrations/` in order in your Supabase SQL Editor (or via Supabase CLI):

1. `supabase/migrations/0001_init_marketplace.sql` — `listings`, `messages`, indexes, `updated_at` trigger, RLS policies, and `listing-images` storage bucket.
2. `supabase/migrations/0002_update_location_default.sql` — updates default listing location.
3. `supabase/migrations/0003_private_messages.sql` — restricts public read access on `messages`.
4. `supabase/migrations/0004_stripe_connect_orders.sql` — creates `seller_accounts` and `orders` tables, adds `status` (`available` / `sold`) and `sold_at` to `listings`.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **(Optional) Seed sample listings:**

   ```bash
   npm run seed
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe Connect Webhook Setup

For live deployments (e.g. Vercel), register a Connect webhook endpoint pointing to `/api/stripe/webhook` for `checkout.session.completed` and `account.updated`:

```bash
node --env-file=.env scripts/register-stripe-webhook.mjs https://YOUR-APP.vercel.app
```

Copy the printed `Signing secret` (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in your deployment environment variables and redeploy.

For local webhook testing, you can forward events with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Scripts & Verification

- `npm run dev` — Start Next.js development server
- `npm run lint` — Run ESLint
- `npx tsc --noEmit` — Run TypeScript type checking
- `npx next build --webpack` — Build production bundle
- `npm run start` — Start production server
- `npm run seed` — Seed sample marketplace listings into Supabase

## Key Routes

| Route | Purpose |
| --- | --- |
| `/` | Main marketplace feed (available listings) |
| `/category/[slug]` | Category-filtered marketplace feed |
| `/create`, `/create/item` | Create a new listing with live preview |
| `/item/[id]` | Listing detail page (**Buy Now** & **Message Seller**) |
| `/connect` | Seller Stripe Connect onboarding & status check |
| `/checkout/success` | Order confirmation & receipt page |
| `/api/listings`, `/api/listings/[id]` | Listings CRUD & search/filter API |
| `/api/messages` | Buyer inquiry submission & email dispatch |
| `/api/upload` | Image upload to Supabase Storage |
| `/api/stripe/connect` | Create/sync Stripe connected accounts & Account Links |
| `/api/stripe/checkout` | Create Direct Charge Stripe Checkout Sessions |
| `/api/stripe/webhook` | Stripe Connect webhook handler |
| `/api/stripe/order-status` | Order & payment confirmation lookup |
