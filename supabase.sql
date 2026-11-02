-- University Blood Donation Network — Supabase setup (free tier)
-- Run this once in Supabase Dashboard > SQL Editor > New query.
-- This creates the donors table and the notifications table the server
-- code reads/writes. Requests and activities still stay in the server's
-- db.json on Render; notifications now survive a redeploy in Supabase.
-- If you already ran the donors part before, running the whole file again
-- is safe: both tables use "if not exists" and policies are re-created.

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

-- Emergency notifications: one row per donor per matching request.
-- Created by the server when a new emergency request is submitted,
-- for every non-suspended donor whose blood group can give to the
-- requested group (compatible groups, not just the exact group).
create table if not exists public.notifications (
  id text primary key,
  donor_id text not null,
  patient_name text not null,
  blood_group_needed text not null,
  hospital text,
  phone text,
  emergency_level text default 'Normal',
  required_date text,
  required_time text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Public read notifications" on public.notifications;
create policy "Public read notifications"
  on public.notifications for select
  using (true);

drop policy if exists "Public insert notifications" on public.notifications;
create policy "Public insert notifications"
  on public.notifications for insert
  with check (true);

drop policy if exists "Public update notifications" on public.notifications;
create policy "Public update notifications"
  on public.notifications for update
  using (true)
  with check (true);

drop policy if exists "Public delete notifications" on public.notifications;
create policy "Public delete notifications"
  on public.notifications for delete
  using (true);
