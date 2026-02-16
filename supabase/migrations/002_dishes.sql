-- Migration: 002_dishes.sql
-- Description: Create dishes table with RLS policies
-- Run this in Supabase SQL Editor or via `supabase db push`

-- ============================================================================
-- DISHES TABLE
-- ============================================================================
-- Linked to auth.users with CASCADE delete
-- Each user has their own collection of dishes
CREATE TABLE public.dishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Fisch', 'Fleisch', 'Vegetarisch')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (CRITICAL - Must be enabled before any data)
-- ============================================================================
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- Using (SELECT auth.uid()) wrapper for 94-99% performance improvement
-- See: Supabase CVE-2025-48757 security advisory
-- ============================================================================

-- Users can read their own dishes
CREATE POLICY "Users can view own dishes"
ON public.dishes FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own dishes
CREATE POLICY "Users can insert own dishes"
ON public.dishes FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own dishes
CREATE POLICY "Users can update own dishes"
ON public.dishes FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own dishes
CREATE POLICY "Users can delete own dishes"
ON public.dishes FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
-- Index for RLS policy queries (most frequently used)
CREATE INDEX idx_dishes_user_id ON public.dishes(user_id);

-- Index for filtering by category
CREATE INDEX idx_dishes_category ON public.dishes(category);

-- Index for sorting by favorite status
CREATE INDEX idx_dishes_favorite ON public.dishes(is_favorite);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically updates the updated_at timestamp
-- Reuses the function created in 001_profiles.sql
-- ============================================================================
CREATE TRIGGER dishes_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
