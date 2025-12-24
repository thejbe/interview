-- Fix Invitations RLS to use the helper function
-- This resolves the "new row violates row-level security policy" error
-- by ensuring the 'check' constraints use the non-recursive function.

-- 1. Drop old policies
DROP POLICY IF EXISTS "Repo admins/members can view invitations for their org" ON invitations;
DROP POLICY IF EXISTS "Repo admins/members can create invitations" ON invitations;

-- 2. Create new policies using get_my_org_id()

-- VIEW: Users can see invitations for their own org
CREATE POLICY "Users can view org invitations"
ON invitations
FOR SELECT
USING (
  organization_id = get_my_org_id()
);

-- INSERT: Users can create invitations for their own org
-- The 'organization_id' of the new row must match the user's org
CREATE POLICY "Users can create invitations"
ON invitations
FOR INSERT
WITH CHECK (
  organization_id = get_my_org_id()
);
