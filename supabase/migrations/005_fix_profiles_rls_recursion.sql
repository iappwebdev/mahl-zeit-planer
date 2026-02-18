-- Migration: 005_fix_profiles_rls_recursion.sql
-- Description: Fix infinite recursion in profiles RLS SELECT policy.
--
-- Root cause: "Household members can view each other" (004_households.sql) contains
-- a subquery against public.profiles inside a policy ON public.profiles.
-- PostgreSQL evaluates the subquery under the same RLS policy → infinite recursion.
--
-- Fix: Replace the subquery with a SECURITY DEFINER helper function that reads
-- profiles directly (bypassing RLS), breaking the recursive cycle.

-- ============================================================================
-- 1. HELPER FUNCTION: reads current user's household_id without RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================================
-- 2. DROP recursive policy, recreate with helper function
-- ============================================================================
DROP POLICY IF EXISTS "Household members can view each other" ON public.profiles;

CREATE POLICY "Household members can view each other"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = id
  OR
  (household_id IS NOT NULL AND household_id = public.get_my_household_id())
);

