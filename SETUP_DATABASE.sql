-- ============================================================
-- SUPABASE DATABASE SETUP FOR HOMEWORK APP
-- ============================================================
-- Copy this ENTIRE file and paste it into:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================
-- 1. Create the chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 2. Create the templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📝',
    input_example TEXT,
    output_example TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    use_count INTEGER NOT NULL DEFAULT 0
);
-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_updated ON public.chats(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_use_count ON public.templates(use_count DESC);
-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
-- 5. Create RLS Policies for chats table
-- Users can only see their own chats
CREATE POLICY "Users can view own chats" ON public.chats FOR
SELECT USING (auth.uid() = user_id);
-- Users can insert their own chats
CREATE POLICY "Users can insert own chats" ON public.chats FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own chats
CREATE POLICY "Users can update own chats" ON public.chats FOR
UPDATE USING (auth.uid() = user_id);
-- Users can delete their own chats
CREATE POLICY "Users can delete own chats" ON public.chats FOR DELETE USING (auth.uid() = user_id);
-- 6. Create RLS Policies for templates table
-- Users can only see their own templates
CREATE POLICY "Users can view own templates" ON public.templates FOR
SELECT USING (auth.uid() = user_id);
-- Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON public.templates FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON public.templates FOR
UPDATE USING (auth.uid() = user_id);
-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE USING (auth.uid() = user_id);
-- ============================================================
-- SUCCESS! Your database is now ready.
-- ============================================================
-- After running this, reply "success, success" and I'll continue!
-- ============================================================