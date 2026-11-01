-- University Blood Donation Network — Supabase setup (free tier)
-- Run this once in Supabase Dashboard > SQL Editor > New query.
-- This creates only the donors table the server code reads/writes.
-- Requests, notifications and activities stay in the server's db.json
-- on Render until a future update moves them to Supabase too.

create table if not exists public.donors (
  id text primary key,
  full_name text not null,
  phone text not null,
  blood_group text not null,
  district text,
  department text,
  batch text,
  last_donation_date text,
  donation_count integer default 0,
  availability_status boolean default true,
  password text,
  created_at timestamptz default now(),
  email text,
  hall text,
  address text,
  roll text,
  is_verified boolean default true,
  is_suspended boolean default false,
  role text default 'donor'
);

-- The server uses the anon key, so the table must be readable/writable
-- through that key. For a campus demo this is the simple setting.
-- For a stricter production setup, replace this with row-level
-- security policies for your own admin/donor roles.
alter table public.donors enable row level security;

create policy "Public read donors"
  on public.donors for select
  using (true);

create policy "Public insert donors"
  on public.donors for insert
  with check (true);

create policy "Public update donors"
  on public.donors for update
  using (true)
  with check (true);

create policy "Public delete donors"
  on public.donors for delete
  using (true);
