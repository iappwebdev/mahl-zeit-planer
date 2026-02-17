-- Migration: 003_meal_plans.sql
-- Description: Create weekly_plans, meal_assignments, and category_preferences tables with RLS
-- Run this in Supabase Dashboard -> SQL Editor -> paste contents -> Run

-- ============================================================================
-- WEEKLY PLANS TABLE
-- ============================================================================
-- One plan per user per week (week_start is always a Monday, stored as DATE)
CREATE TABLE public.weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ============================================================================
-- MEAL ASSIGNMENTS TABLE
-- ============================================================================
-- One dish assignment per day per weekly plan
CREATE TABLE public.meal_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  weekly_plan_id UUID NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday, 6=Sunday
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (weekly_plan_id, day_of_week)
);

-- ============================================================================
-- CATEGORY PREFERENCES TABLE
-- ============================================================================
-- Per-user preference for how many meals per week of each category
CREATE TABLE public.category_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Fisch', 'Fleisch', 'Vegetarisch')),
  count SMALLINT NOT NULL DEFAULT 0 CHECK (count >= 0 AND count <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category)
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (CRITICAL - Must be enabled before any data)
-- ============================================================================
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: weekly_plans
-- Using (SELECT auth.uid()) wrapper for 94-99% performance improvement
-- See: Supabase CVE-2025-48757 security advisory
-- ============================================================================

-- Users can read their own weekly plans
CREATE POLICY "Users can view own weekly plans"
ON public.weekly_plans FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own weekly plans
CREATE POLICY "Users can insert own weekly plans"
ON public.weekly_plans FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own weekly plans
CREATE POLICY "Users can update own weekly plans"
ON public.weekly_plans FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own weekly plans
CREATE POLICY "Users can delete own weekly plans"
ON public.weekly_plans FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- RLS POLICIES: meal_assignments
-- Access controlled through weekly_plans ownership via subquery
-- ============================================================================

-- Users can read meal assignments that belong to their weekly plans
CREATE POLICY "Users can view own meal assignments"
ON public.meal_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Users can insert meal assignments into their own weekly plans
CREATE POLICY "Users can insert own meal assignments"
ON public.meal_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Users can update meal assignments in their own weekly plans
CREATE POLICY "Users can update own meal assignments"
ON public.meal_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Users can delete meal assignments from their own weekly plans
CREATE POLICY "Users can delete own meal assignments"
ON public.meal_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- RLS POLICIES: category_preferences
-- ============================================================================

-- Users can read their own category preferences
CREATE POLICY "Users can view own category preferences"
ON public.category_preferences FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own category preferences
CREATE POLICY "Users can insert own category preferences"
ON public.category_preferences FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own category preferences
CREATE POLICY "Users can update own category preferences"
ON public.category_preferences FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own category preferences
CREATE POLICY "Users can delete own category preferences"
ON public.category_preferences FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- weekly_plans: primary lookup by user and week
CREATE INDEX idx_weekly_plans_user_week ON public.weekly_plans(user_id, week_start);

-- meal_assignments: join performance (plan -> assignments)
CREATE INDEX idx_meal_assignments_plan ON public.meal_assignments(weekly_plan_id);

-- meal_assignments: dish repeat avoidance queries
CREATE INDEX idx_meal_assignments_dish ON public.meal_assignments(dish_id);

-- category_preferences: preferences lookup
CREATE INDEX idx_category_preferences_user ON public.category_preferences(user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- Reuses the update_updated_at() function created in 001_profiles.sql
-- ============================================================================
CREATE TRIGGER weekly_plans_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER meal_assignments_updated_at
  BEFORE UPDATE ON public.meal_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER category_preferences_updated_at
  BEFORE UPDATE ON public.category_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
