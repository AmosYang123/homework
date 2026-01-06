-- ============================================================
-- SUPABASE "BULLETPROOF" DATABASE SETUP
-- ============================================================
-- 1. PROFILES TABLE (Syncs with Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2. CHATS TABLE (With correct types)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 3. TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📝',
    input_example TEXT,
    output_example TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    use_count INTEGER NOT NULL DEFAULT 0
);
-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
-- 5. SIMPLIFIED "ALL ACCESS" POLICIES (Safe but robust)
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
-- Chats
DROP POLICY IF EXISTS "Users can manage own chats" ON chats;
CREATE POLICY "Users can manage own chats" ON public.chats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Templates
DROP POLICY IF EXISTS "Users can manage own templates" ON templates;
CREATE POLICY "Users can manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- 6. AUTO-CREATE PROFILE TRIGGER
-- This ensures every time you sign up, a database entry is created automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, username, email)
VALUES (new.id, split_part(new.email, '@', 1), new.email);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- ============================================================
-- SUCCESS! Copy/Paste this and click RUN.
-- ============================================================