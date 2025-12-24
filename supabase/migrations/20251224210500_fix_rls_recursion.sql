-- Fix for RLS Infinite Recursion on Recruiters table
-- Previous "View Members" policy caused infinite recursion because checking organization_id 
-- required querying the recruiters table, which triggered the policy again.

-- 1. Create a "System Function" to get your Organization ID safely
-- SECURITY DEFINER allows this function to run with the privileges of the creator (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT organization_id FROM recruiters WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 2. Drop the broken (looping) policy if it exists
DROP POLICY IF EXISTS "Users can view members of their organization" ON recruiters;

-- 3. Create the fixed policy using the function
CREATE POLICY "Users can view members of their organization" 
ON recruiters 
FOR SELECT 
USING (
  organization_id = get_my_org_id()
);
