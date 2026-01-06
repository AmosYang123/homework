-- ============================================================
-- SUPABASE DATABASE SETUP V3 - OPTIONAL UPDATES & VERIFICATION
-- ============================================================
-- Note: The "Optional Description" change does NOT require a DB update
-- as the Description column was already nullable.
-- 
-- The following are small structural improvements to match the App's Types:
-- ============================================================
-- 1. Add last_used_at column to templates (tracking usage time)
-- We use a safe check to see if it already exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'templates'
        AND column_name = 'last_used_at'
) THEN
ALTER TABLE public.templates
ADD COLUMN last_used_at TIMESTAMPTZ;
END IF;
END $$;
-- 2. Add last_updated_at column to templates (for syncing logic)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'templates'
        AND column_name = 'last_updated_at'
) THEN
ALTER TABLE public.templates
ADD COLUMN last_updated_at TIMESTAMPTZ DEFAULT now();
END IF;
END $$;
-- 3. Verify Constraints
-- Ensuring 'name' is NOT NULL (already should be, but good to check)
ALTER TABLE public.templates
ALTER COLUMN name
SET NOT NULL;
-- ============================================================
-- SUCCESS! V3 Checkup Complete.
-- ============================================================