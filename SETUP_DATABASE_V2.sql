-- ============================================================
-- SUPABASE DATABASE SETUP V2 - SETTINGS & THEME
-- ============================================================
-- Run this AFTER the initial SETUP_DATABASE.sql
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================
-- 1. Create the user_settings table for theme and preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    chat_mode TEXT NOT NULL DEFAULT 'normal' CHECK (chat_mode IN ('normal', 'suggest')),
    show_copy BOOLEAN NOT NULL DEFAULT true,
    show_edit BOOLEAN NOT NULL DEFAULT true,
    show_regenerate BOOLEAN NOT NULL DEFAULT true,
    auto_save BOOLEAN NOT NULL DEFAULT true,
    template_suggestions BOOLEAN NOT NULL DEFAULT true,
    auto_complete BOOLEAN NOT NULL DEFAULT false,
    sticky_mode BOOLEAN NOT NULL DEFAULT false,
    max_file_size INTEGER NOT NULL DEFAULT 10485760,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
-- 3. Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
-- 4. Create RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);
-- ============================================================
-- SUCCESS! Settings table is now ready.
-- ============================================================