-- Migration: 001_profiles.sql
-- Description: Create profiles table with RLS policies
-- Run this in Supabase SQL Editor or via `supabase db push` before any users register

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Linked to auth.users with CASCADE delete
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (CRITICAL - Must be enabled before any data)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- Using (SELECT auth.uid()) wrapper for 94-99% performance improvement
-- See: Supabase CVE-2025-48757 security advisory
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- Users can insert their own profile (for trigger)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- PERFORMANCE INDEX
-- ============================================================================
CREATE INDEX idx_profiles_id ON public.profiles(id);

-- ============================================================================
-- AUTO-CREATE PROFILE TRIGGER
-- Automatically creates a profile when a user signs up
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically updates the updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
