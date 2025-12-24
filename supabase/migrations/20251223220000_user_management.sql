-- 1. Create Organizations Table
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

alter table organizations enable row level security;

-- 2. Update Recruiters Table
alter table recruiters 
add column organization_id uuid references organizations(id),
add column avatar_url text,
add column role text check (role in ('admin', 'member')) default 'member';

-- 3. Update Companies (Clients) Table
alter table companies 
add column recruiter_id uuid references recruiters(id),
add column organization_id uuid references organizations(id);

-- 4. Create Invitations Table
create table invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  organization_id uuid references organizations(id) not null,
  invited_by uuid references recruiters(id),
  role text check (role in ('admin', 'member')) default 'member',
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamptz default now()
);

alter table invitations enable row level security;

-- 5. Data Migration (Backfill)
-- Create a default organization
with new_org as (
  insert into organizations (name) values ('Stitch Recruiting') returning id
)
-- Assign existing recruiters to this org
update recruiters set organization_id = (select id from new_org), role = 'admin' where organization_id is null;

-- Assign existing companies to a default recruiter (if any exist)
-- We'll pick the first admin recruiter found or null if none
with default_recruiter as (
  select id from recruiters limit 1
)
update companies set recruiter_id = (select id from default_recruiter) where recruiter_id is null;


-- 6. RLS Policies

-- Organizations
create policy "Users can view their own organization"
  on organizations for select
  using (
    id in (
      select organization_id from recruiters where auth_user_id = auth.uid()
    )
  );

-- Recruiters (Update existing policies or add new ones)
-- Drop old simple policy if needed, or refine it. Assuming we add to it.
create policy "Users can view members of their organization"
  on recruiters for select
  using (
    organization_id in (
      select organization_id from recruiters where auth_user_id = auth.uid()
    )
  );

create policy "Users can update their own profile"
  on recruiters for update
  using (auth_user_id = auth.uid());

-- Companies (Clients) - Enforce Ownership
drop policy if exists "Enable all access for authenticated users" on companies;

create policy "Users can view their own clients"
  on companies for select
  using (
    recruiter_id in (
      select id from recruiters where auth_user_id = auth.uid()
    )
  );

create policy "Users can insert their own clients"
  on companies for insert
  with check (
    recruiter_id in (
      select id from recruiters where auth_user_id = auth.uid()
    )
  );

create policy "Users can update their own clients"
  on companies for update
  using (
    recruiter_id in (
      select id from recruiters where auth_user_id = auth.uid()
    )
  );

-- Invitations
create policy "Repo admins/members can view invitations for their org"
  on invitations for select
  using (
    organization_id in (
      select organization_id from recruiters where auth_user_id = auth.uid()
    )
  );

create policy "Repo admins/members can create invitations"
  on invitations for insert
  with check (
    organization_id in (
      select organization_id from recruiters where auth_user_id = auth.uid()
    )
  );

-- 7. Storage (Avatars)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );
