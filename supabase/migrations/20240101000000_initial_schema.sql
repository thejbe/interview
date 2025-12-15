-- Companies
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Recruiters
create table recruiters (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references companies(id),
  name text,
  email text unique,
  created_at timestamptz default now()
);

-- Hiring Managers
create table hiring_managers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references companies(id),
  name text,
  email text unique,
  calendar_provider text check (calendar_provider in ('google','microsoft','none')) default 'none',
  calendar_sync_status text default 'not_connected',
  last_calendar_sync_at timestamptz,
  created_at timestamptz default now()
);

-- Interview Templates
create table interview_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  created_by_recruiter_id uuid references recruiters(id),
  name text not null,
  interview_length_minutes integer not null,
  location_type text check (location_type in ('online','in_person')) not null,
  online_link text,
  in_person_location text,
  candidate_briefing_text text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Template Files
create table template_files (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references interview_templates(id) on delete cascade,
  file_url text not null,
  file_name text,
  created_at timestamptz default now()
);

-- Template Hiring Managers (Many-to-Many)
create table template_hiring_managers (
  template_id uuid references interview_templates(id) on delete cascade,
  hiring_manager_id uuid references hiring_managers(id) on delete cascade,
  primary key (template_id, hiring_manager_id)
);

-- Slots
create table slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references interview_templates(id) on delete cascade,
  hiring_manager_id uuid references hiring_managers(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text check (status in ('open','booked','blocked')) default 'open',
  source text check (source in ('calendar','override')) default 'calendar',
  created_at timestamptz default now()
);

-- Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references slots(id) on delete cascade,
  candidate_name text not null,
  candidate_email text not null,
  candidate_phone text,
  status text check (status in ('pending','confirmed','cancelled')) default 'pending',
  token text unique not null,
  created_at timestamptz default now()
);

-- RLS Policies (Simplified for V1)
alter table companies enable row level security;
alter table recruiters enable row level security;
alter table hiring_managers enable row level security;
alter table interview_templates enable row level security;
alter table template_files enable row level security;
alter table template_hiring_managers enable row level security;
alter table slots enable row level security;
alter table bookings enable row level security;

-- Basic policy: Allow authenticated access for now (refine later)
create policy "Enable all access for authenticated users" on companies for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on recruiters for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on hiring_managers for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on interview_templates for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on template_files for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on template_hiring_managers for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on slots for all using (auth.role() = 'authenticated');

-- Bookings need public access for candidate via token
create policy "Enable public read with token" on bookings for select using (true);
create policy "Enable public insert" on bookings for insert with check (true);
