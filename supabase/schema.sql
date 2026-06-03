create extension if not exists pgcrypto;

create table if not exists public.app_settings (
  id text primary key default 'default',
  village_name text not null default 'Desa Cerdas',
  district_name text not null default 'Kecamatan',
  city_name text not null default 'Kabupaten',
  province_name text not null default 'Provinsi',
  center_lat double precision not null default -5.3428912,
  center_lng double precision not null default 105.7938069,
  boundary_geojson jsonb,
  fallback_radius_m integer not null default 2500,
  updated_at timestamptz not null default now()
);

alter table public.app_settings alter column id set default 'default';
insert into public.app_settings (id)
values ('default')
on conflict (id) do nothing;

create table if not exists public.reports (
  id text primary key default gen_random_uuid()::text,
  user_id text not null default 'anonymous',
  author_name text not null default 'Warga Anonim',
  title text not null,
  description text not null,
  category text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  lat double precision,
  lng double precision,
  image_url text,
  upvotes integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_status_history (
  id text primary key default gen_random_uuid()::text,
  report_id text not null references public.reports(id) on delete cascade,
  status text not null,
  note text not null,
  changed_by text not null default 'Admin Desa',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id text primary key default gen_random_uuid()::text,
  report_id text not null references public.reports(id) on delete cascade,
  user_id text not null default 'anonymous',
  author_name text not null default 'Warga',
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.report_likes (
  report_id text not null references public.reports(id) on delete cascade,
  user_id text not null default 'anonymous',
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table if not exists public.stores (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  name text not null,
  description text,
  address text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stores add column if not exists address text;

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  user_id text not null default 'anonymous',
  store_id text references public.stores(id) on delete set null,
  seller_name text not null default 'UMKM Desa',
  name text not null,
  description text,
  price integer not null default 0,
  phone_number text,
  whatsapp text,
  image_url text,
  category text not null default 'Makanan',
  stock integer not null default 0,
  featured boolean not null default false,
  sales_count integer not null default 0,
  rating numeric not null default 0,
  reviews_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  buyer_id text not null default 'guest',
  store_id text references public.stores(id) on delete set null,
  total_amount integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'terbayar', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  awb_number text,
  payment_method text,
  payment_token text,
  buyer_name text,
  buyer_phone text,
  shipping_address text,
  cancellation_reason text,
  cancellation_requested_by text,
  cancellation_status text,
  completion_photo_base64 text,
  is_reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  quantity integer not null default 1,
  price integer not null default 0
);

create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  buyer_id text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, product_id, buyer_id)
);

create table if not exists public.community_actions (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text not null,
  category text not null,
  location text,
  date date,
  time text,
  max_participants integer not null default 20,
  current_participants integer not null default 0,
  organizer text not null default 'Admin Desa',
  image_url text,
  status text not null default 'open' check (status in ('open', 'full', 'done')),
  report_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_participants (
  id text primary key default gen_random_uuid()::text,
  action_id text not null references public.community_actions(id) on delete cascade,
  user_id text not null,
  name text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (action_id, user_id)
);

create table if not exists public.emergency_alerts (
  id text primary key default gen_random_uuid()::text,
  user_id text not null default 'anonymous',
  type text not null,
  description text not null,
  location text,
  lat double precision,
  lng double precision,
  status text not null default 'active',
  reporter_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  budget integer not null default 0,
  spent integer not null default 0,
  progress integer not null default 0,
  status text not null default 'planning',
  category text not null default 'Infrastruktur',
  image_url text,
  start_date date,
  end_date date,
  contractor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  company text not null,
  description text not null,
  category text not null default 'Umum',
  type text not null default 'full_time',
  location text,
  deadline date,
  salary_range text,
  requirements text[],
  phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_modules (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  category text not null default 'Umum',
  level text not null default 'Pemula',
  duration_minutes integer not null default 60,
  image_url text,
  instructor text not null default 'Admin DesaMind',
  lessons jsonb not null default '[]'::jsonb,
  rating numeric not null default 4.5,
  enrolled integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  excerpt text,
  content text,
  category text not null default 'Umum',
  author text not null default 'Admin DesaMind',
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null default 'Umum',
  content text not null,
  date timestamptz not null default now(),
  is_important boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null default 'Lainnya',
  date date not null default current_date,
  image_url text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.apbdesa (
  year integer primary key,
  total_budget integer not null default 0,
  realized integer not null default 0,
  allocations jsonb not null default '[]'::jsonb,
  programs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;
