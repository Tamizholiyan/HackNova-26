-- ==============================================================================
-- ResQNet Centralized Emergency Response Platform (SDG 3 & 11)
-- Database Schema, RLS Policies, Realtime Publication, & Seed Data
-- ==============================================================================

-- 1. UNITS TABLE (Emergency Fleet)
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  callsign text not null,
  type text check (type in ('ambulance','fire','police')) not null,
  status text check (status in ('available','dispatched','en_route','on_scene','transporting','offline')) default 'available',
  lat double precision not null,
  lng double precision not null,
  crew text,
  battery_percent int default 95,
  speed_kmh double precision default 0,
  updated_at timestamptz default now()
);

-- 2. HOSPITALS TABLE (Emergency Facilities)
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text,
  lat double precision not null,
  lng double precision not null,
  total_beds int not null default 100,
  occupied_beds int not null default 0,
  icu_beds_available int not null default 5,
  status text check (status in ('accepting','full')) default 'accepting',
  specializations text[] default '{}',
  address text,
  phone text,
  updated_at timestamptz default now()
);

-- 3. PROFILES TABLE (User Accounts & Role Scopes)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('dispatcher','responder','hospital')) not null,
  full_name text,
  unit_id uuid references public.units(id),
  hospital_id uuid references public.hospitals(id),
  created_at timestamptz default now()
);

-- 4. INCIDENTS TABLE (Emergency Events)
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('medical','fire','police')) not null,
  title text not null,
  status text check (status in ('pending','assigned','en_route','on_scene','transporting','resolved','cancelled')) default 'pending',
  lat double precision not null,
  lng double precision not null,
  address_label text,
  severity text check (severity in ('MILD','MODERATE','SEVERE','CRITICAL')),
  description text,
  citizen_token uuid default gen_random_uuid(),
  assigned_unit_id uuid references public.units(id),
  assigned_hospital_id uuid references public.hospitals(id),
  eta_seconds int default 240,
  distance_km double precision default 1.2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. REALTIME REPLICATION
alter publication supabase_realtime add table public.incidents, public.units, public.hospitals;

-- 6. ROW LEVEL SECURITY (RLS)
alter table public.units enable row level security;
alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;

-- Public can read hospitals & units for map telemetry and insert incidents
create policy "Anyone can insert incidents"
  on public.incidents for insert
  to anon, authenticated
  with check (true);

create policy "Citizen can read their own created incident"
  on public.incidents for select
  to anon, authenticated
  using (true);

create policy "Citizen can update their own created incident"
  on public.incidents for update
  to anon, authenticated
  using (true);

create policy "Staff can read all incidents"
  on public.incidents for select
  to authenticated
  using (true);

create policy "Staff can update incidents"
  on public.incidents for update
  to authenticated
  using (true);

create policy "Anyone can read units"
  on public.units for select
  to anon, authenticated
  using (true);

create policy "Staff can update units"
  on public.units for update
  to authenticated
  using (true);

create policy "Anyone can read hospitals"
  on public.hospitals for select
  to anon, authenticated
  using (true);

create policy "Hospital staff and dispatch can update hospitals"
  on public.hospitals for update
  to authenticated
  using (true);

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- 7. SEED DATA (Default City Units & Hospitals in Chennai / Marina Beach)
insert into public.hospitals (id, name, short_code, lat, lng, total_beds, occupied_beds, icu_beds_available, status, specializations, address, phone)
values
  ('b0000000-0000-0000-0000-000000000001', 'Rajiv Gandhi Govt General Hospital (Hospital A)', 'RGGGH-A', 13.0805, 80.2778, 350, 350, 0, 'full', array['Level 1 Trauma', 'General Emergency', 'Toxicology'], 'EVR Periyar Salai, Park Town, Chennai', '+91 44 2530 5000'),
  ('b0000000-0000-0000-0000-000000000002', 'Apollo Main Hospital (Hospital B)', 'APOLLO-B', 13.0602, 80.2514, 220, 168, 14, 'accepting', array['Advanced Cardiac Care', 'Neuro Trauma', 'ICU Resuscitation'], '21 Greams Lane, Thousand Lights, Chennai', '+91 44 2829 0200'),
  ('b0000000-0000-0000-0000-000000000003', 'Fortis Malar Hospital (Hospital C)', 'FORTIS-C', 13.0068, 80.2575, 180, 142, 8, 'accepting', array['Cardiology', 'Critical Care', 'Organ Transplant'], 'No. 52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai', '+91 44 4289 2222'),
  ('b0000000-0000-0000-0000-000000000004', 'Govt Royapettah Hospital (Hospital D)', 'GRH-D', 13.0536, 80.2642, 260, 215, 9, 'accepting', array['Accident & Emergency', 'Burn Unit', 'Orthopedics'], 'Westcott Rd, Royapettah, Chennai', '+91 44 2848 1111')
on conflict (id) do nothing;

insert into public.units (id, callsign, type, status, lat, lng, crew, battery_percent, speed_kmh)
values
  ('a0000000-0000-0000-0000-000000000001', 'Ambulance Alpha-1', 'ambulance', 'available', 13.0542, 80.2735, 'Dr. Priya Raman & Paramedic Vignesh', 94, 0),
  ('a0000000-0000-0000-0000-000000000002', 'Ambulance Bravo-2', 'ambulance', 'available', 13.0370, 80.2680, 'Anand S. & Deepa M.', 88, 0),
  ('a0000000-0000-0000-0000-000000000003', 'Fire Rescue Squad-9', 'fire', 'available', 13.0580, 80.2710, 'Capt. Ramesh & Squad', 98, 0),
  ('a0000000-0000-0000-0000-000000000004', 'Police Patrol Cruiser-7', 'police', 'available', 13.0460, 80.2805, 'Insp. Karthik & Suresh', 91, 0),
  ('a0000000-0000-0000-0000-000000000005', 'Ambulance Echo-5', 'ambulance', 'available', 13.0720, 80.2580, 'Arun K. & Stella R.', 82, 0)
on conflict (id) do nothing;
