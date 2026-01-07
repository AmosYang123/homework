-- V4: Add support for Three-Section Templates
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard';
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS three_section_data JSONB DEFAULT NULL;
ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT NULL;
-- Update existing templates to have 'standard' type
UPDATE public.templates
SET type = 'standard'
WHERE type IS NULL;