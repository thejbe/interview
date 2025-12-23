-- Decouple slots from templates to allow global availability
-- 1. Make template_id nullable
-- 2. Drop the existing foreign key constraint that cascades delete
-- 3. Re-add foreign key constraint WITHOUT cascade (or set null on delete)

-- Note: We need to find the constraint name first, but usually it's auto-generated.
-- Safest way is to alter column to drop Not Null (if it was) and change FK behavior.

-- 1. Make template_id nullable (it might already be, but ensuring it)
ALTER TABLE slots ALTER COLUMN template_id DROP NOT NULL;

-- 2. Drop the existing foreign key constraint
-- We use a do block to find and drop it because the name is not fixed
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'slots'
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        -- We can't easily check which column it points to in this simple loop effectively without more complex query
        -- But assuming we want to replace the template_id FK.
        -- Let's try to be specific:
        IF EXISTS (
            SELECT 1 FROM information_schema.key_column_usage
            WHERE table_name = 'slots'
            AND column_name = 'template_id'
            AND constraint_name = r.constraint_name
        ) THEN
            EXECUTE 'ALTER TABLE slots DROP CONSTRAINT ' || r.constraint_name;
        END IF;
    END LOOP;
END $$;

-- 3. Add new Foreign Key without Cascade Delete (Set Null on Delete optional, or just No Action)
ALTER TABLE slots
ADD CONSTRAINT slots_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES interview_templates(id)
ON DELETE SET NULL;
