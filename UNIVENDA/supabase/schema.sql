create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  password_hash text not null,
  role text not null default 'seller',
  capabilities text[] not null default array['product_selling', 'freelancing']::text[],
  full_name text,
  phone_number text,
  alternate_phone_number text,
  college_name text,
  course text,
  graduation_year integer,
  purpose_of_joining text,
  address text,
  verification_status text not null default 'unverified',
  sensitive_profile jsonb not null default '{}'::jsonb,
  constraint users_role_check check (role in ('seller', 'customer', 'student', 'admin')),
  constraint users_verification_status_check check (verification_status in ('verified', 'unverified')),
  constraint users_email_lowercase_check check (email = lower(email))
);

create unique index if not exists users_email_lower_idx
  on public.users (email);

create index if not exists users_role_idx
  on public.users (role);

alter table public.users enable row level security;

create policy "service role manages users"
on public.users
as permissive
for all
to service_role
using (true)
with check (true);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text not null,
  price numeric(10, 2) not null,
  category text not null,
  images jsonb not null default '[]'::jsonb,
  self_made_declaration boolean not null default true,
  constraint products_price_positive_check check (price > 0),
  constraint products_self_made_check check (self_made_declaration = true)
);

create index if not exists products_user_id_idx
  on public.products (user_id, updated_at desc);

alter table public.products enable row level security;

create policy "service role manages products"
on public.products
as permissive
for all
to service_role
using (true)
with check (true);

create table if not exists public.freelance_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  skill_title text not null,
  description text not null,
  pricing numeric(10, 2) not null,
  delivery_time integer not null,
  constraint freelance_services_pricing_positive_check check (pricing > 0),
  constraint freelance_services_delivery_time_positive_check check (delivery_time > 0)
);

create index if not exists freelance_services_user_id_idx
  on public.freelance_services (user_id, updated_at desc);

alter table public.freelance_services enable row level security;

create policy "service role manages freelance services"
on public.freelance_services
as permissive
for all
to service_role
using (true)
with check (true);

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  university text not null,
  roll_number text not null,
  department text not null default '',
  offering_type text not null default '',
  portfolio_url text,
  notes text,
  source text not null default 'website',
  review_status text not null default 'pending',
  reviewed_at timestamptz,
  constraint seller_applications_review_status_check
    check (review_status in ('pending', 'approved', 'rejected'))
);

create index if not exists seller_applications_created_at_idx
  on public.seller_applications (created_at desc);

create index if not exists seller_applications_email_idx
  on public.seller_applications (email);

alter table public.seller_applications enable row level security;

create policy "service role manages seller applications"
on public.seller_applications
as permissive
for all
to service_role
using (true)
with check (true);
