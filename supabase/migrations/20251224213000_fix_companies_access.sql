-- Fix Company/Client Visibility
-- The previous migration added ID columns but didn't populate them for existing data,
-- causing RLS to hide all clients.

DO $$
DECLARE 
    my_recruiter_id uuid;
    my_org_id uuid;
BEGIN
    -- 1. Get the admin recruiter (You)
    SELECT id, organization_id INTO my_recruiter_id, my_org_id
    FROM recruiters 
    WHERE email = 'jimbeattie1000+1@gmail.com' 
    LIMIT 1;

    IF my_recruiter_id IS NOT NULL THEN
        -- 2. Backfill Companies
        -- Assign all "orphaned" companies to you and your org
        UPDATE companies 
        SET recruiter_id = my_recruiter_id, 
            organization_id = my_org_id
        WHERE recruiter_id IS NULL OR organization_id IS NULL;
        
        RAISE NOTICE 'Fixed orphaned companies.';
    ELSE
        RAISE NOTICE 'Could not find your recruiter profile. Please ensure you ran the previous fix.';
    END IF;
END $$;

-- 3. Update RLS to be "Team-Based"
-- Allow viewing clients if they belong to your Organization (not just you personally)
DROP POLICY IF EXISTS "Users can view their own clients" ON companies;

CREATE POLICY "Users can view org clients" 
ON companies 
FOR SELECT 
USING (
  organization_id = get_my_org_id()
);

-- Allow creating clients (auto-link to org)
-- Note: You might need a trigger or default for organization_id on insert, 
-- but for now ensure RLS checks it.
CREATE POLICY "Users can insert org clients" 
ON companies 
FOR INSERT 
WITH CHECK (
  organization_id = get_my_org_id()
);
