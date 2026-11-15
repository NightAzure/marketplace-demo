-- Mini-Marketplace initial schema, indexes, RLS policies, triggers, and storage bucket

-- Ensure pgcrypto/gen_random_uuid is available
create extension if not exists pgcrypto;

-- 1. Listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  category text not null,
  seller_email text not null,
  image_url text,
  location text not null default 'Local pickup',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_email text not null,
  seller_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- 3. Performance indexes
create index if not exists idx_listings_category on public.listings (category);
create index if not exists idx_listings_created_at on public.listings (created_at desc);
create index if not exists idx_messages_listing_id on public.messages (listing_id);

-- 4. Updated-at trigger function & trigger
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_listings_updated_at on public.listings;
create trigger update_listings_updated_at
  before update on public.listings
  for each row
  execute function public.update_updated_at_column();

-- 5. Row Level Security (RLS)
alter table public.listings enable row level security;
alter table public.messages enable row level security;

-- Listings policies (no-auth public marketplace)
drop policy if exists "Anyone can view listings" on public.listings;
create policy "Anyone can view listings"
  on public.listings
  for select
  using (true);

drop policy if exists "Anyone can create listings" on public.listings;
create policy "Anyone can create listings"
  on public.listings
  for insert
  with check (true);

drop policy if exists "Users can update their own listings" on public.listings;
create policy "Users can update their own listings"
  on public.listings
  for update
  using (true)
  with check (true);

-- Messages policies
drop policy if exists "Anyone can view messages" on public.messages;
create policy "Anyone can view messages"
  on public.messages
  for select
  using (true);

drop policy if exists "Anyone can create messages" on public.messages;
create policy "Anyone can create messages"
  on public.messages
  for insert
  with check (true);

-- 6. Storage bucket for listing images
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view listing images" on storage.objects;
create policy "Anyone can view listing images"
  on storage.objects
  for select
  using (bucket_id = 'listing-images');

drop policy if exists "Anyone can upload listing images" on storage.objects;
create policy "Anyone can upload listing images"
  on storage.objects
  for insert
  with check (bucket_id = 'listing-images');
