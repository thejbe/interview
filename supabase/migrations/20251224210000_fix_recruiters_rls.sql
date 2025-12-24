-- Fix for RLS Recursion on Recruiters table
-- This policy allows a user to view their own profile directly, which is required
-- before they can leverage the Organization-based policies (which depend on knowing the org_id from this profile).

create policy "Users can view their own profile"
  on recruiters for select
  using (auth_user_id = auth.uid());
