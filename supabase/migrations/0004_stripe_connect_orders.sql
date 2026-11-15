-- Stripe Connect seller accounts, listing sold status, and orders table

-- 1. Seller connected accounts (keyed by lowercase seller email)
create table if not exists public.seller_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seller_accounts_email
  on public.seller_accounts (email);

create index if not exists idx_seller_accounts_stripe_account_id
  on public.seller_accounts (stripe_account_id);

drop trigger if exists update_seller_accounts_updated_at on public.seller_accounts;
create trigger update_seller_accounts_updated_at
  before update on public.seller_accounts
  for each row
  execute function public.update_updated_at_column();

alter table public.seller_accounts enable row level security;

drop policy if exists "Anyone can view seller onboarding status" on public.seller_accounts;
create policy "Anyone can view seller onboarding status"
  on public.seller_accounts
  for select
  using (true);

-- 2. Listing availability status ('available' | 'sold')
alter table public.listings
  add column if not exists status text not null default 'available'
    check (status in ('available', 'sold'));

alter table public.listings
  add column if not exists sold_at timestamptz;

create index if not exists idx_listings_status
  on public.listings (status);

-- 3. Orders table (recorded and confirmed via Stripe webhook)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  connected_account_id text not null,
  seller_email text not null,
  buyer_email text,
  amount_cents integer not null check (amount_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  seller_payout_cents integer not null check (seller_payout_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'paid'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_listing_id
  on public.orders (listing_id);

create index if not exists idx_orders_session_id
  on public.orders (stripe_checkout_session_id);

create unique index if not exists idx_orders_paid_listing_unique
  on public.orders (listing_id)
  where (status = 'paid');

drop trigger if exists update_orders_updated_at on public.orders;
create trigger update_orders_updated_at
  before update on public.orders
  for each row
  execute function public.update_updated_at_column();

alter table public.orders enable row level security;
