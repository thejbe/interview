-- Departments
create table departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Update Hiring Managers
alter table hiring_managers 
add column department_id uuid references departments(id),
add column role text;

-- RLS for Departments
alter table departments enable row level security;
create policy "Enable all access for authenticated users" on departments for all using (auth.role() = 'authenticated');
