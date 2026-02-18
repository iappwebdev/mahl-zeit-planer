-- Migration: 004_households.sql
-- Description: Create household collaboration tables, update RLS on dishes/weekly_plans/meal_assignments
--              for dual-mode access (solo user vs. household member), and enable Realtime publication.

-- ============================================================================
-- 1. HOUSEHOLDS TABLE
-- ============================================================================
CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. HOUSEHOLD_MEMBERS TABLE
-- ============================================================================
CREATE TABLE public.household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, user_id)
);

-- Indexes for membership lookups
CREATE INDEX idx_household_members_user ON public.household_members(user_id);
CREATE INDEX idx_household_members_household ON public.household_members(household_id);

-- ============================================================================
-- 3. HOUSEHOLD_INVITES TABLE
-- ============================================================================
CREATE TABLE public.household_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_email TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_household_invites_token ON public.household_invites(token);

-- ============================================================================
-- 4. ACTIVITY_LOG TABLE (for realtime activity feed)
-- ============================================================================
-- display_name is written by trigger from profiles table at INSERT time.
-- This avoids the need for JOINs in Realtime payloads (postgres_changes sends raw row only).
CREATE TABLE public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for activity feed queries
CREATE INDEX idx_activity_log_household ON public.activity_log(household_id, created_at DESC);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================================
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICIES: households
-- ============================================================================

-- Members can view their household
CREATE POLICY "Members can view their household"
ON public.households FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = households.id
    AND user_id = (SELECT auth.uid())
  )
);

-- Any authenticated user can create a household (owner_id must be themselves)
CREATE POLICY "Users can create a household"
ON public.households FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Only owner can update their household
CREATE POLICY "Owner can update household"
ON public.households FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = owner_id)
WITH CHECK ((SELECT auth.uid()) = owner_id);

-- Only owner can delete their household
CREATE POLICY "Owner can delete household"
ON public.households FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = owner_id);

-- ============================================================================
-- 7. RLS POLICIES: household_members
-- ============================================================================

-- Members can see other members of the same household
CREATE POLICY "Members can view household members"
ON public.household_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_members.household_id
    AND hm.user_id = (SELECT auth.uid())
  )
);

-- Members can add new members (invite acceptance), or user can add themselves (owner self-insert)
CREATE POLICY "Members can add members or self-insert"
ON public.household_members FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_members.household_id
    AND hm.user_id = (SELECT auth.uid())
  )
);

-- Owner can remove members, or member can remove themselves
CREATE POLICY "Owner can remove members or member can leave"
ON public.household_members FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_members.household_id
    AND hm.user_id = (SELECT auth.uid())
    AND hm.role = 'owner'
  )
);

-- ============================================================================
-- 8. RLS POLICIES: household_invites
-- ============================================================================

-- Household members can view invites for their household
CREATE POLICY "Members can view household invites"
ON public.household_invites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_invites.household_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Household members can create invites
CREATE POLICY "Members can create invites"
ON public.household_invites FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = created_by
  AND
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_invites.household_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Household members can update invites (e.g. mark as used during acceptance)
CREATE POLICY "Members can update invites"
ON public.household_invites FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_invites.household_id
    AND user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_invites.household_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Household members can delete invites
CREATE POLICY "Members can delete invites"
ON public.household_invites FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_invites.household_id
    AND user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 9. RLS POLICIES: activity_log
-- ============================================================================

-- Household members can view activity for their household
CREATE POLICY "Members can view household activity"
ON public.activity_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = activity_log.household_id
    AND user_id = (SELECT auth.uid())
  )
);

-- Household members can insert activity entries
CREATE POLICY "Members can insert activity entries"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = activity_log.household_id
    AND user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 10. ALTER EXISTING TABLES: add nullable household_id FK
-- ============================================================================
ALTER TABLE public.dishes
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

CREATE INDEX idx_dishes_household ON public.dishes(household_id);

ALTER TABLE public.weekly_plans
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

CREATE INDEX idx_weekly_plans_household ON public.weekly_plans(household_id);

-- ============================================================================
-- 11. PARTIAL UNIQUE INDEX: weekly_plans household mode (one plan per household per week)
-- ============================================================================
-- In household mode, multiple users share ONE plan per week.
-- The existing UNIQUE (user_id, week_start) constraint remains for solo users.
CREATE UNIQUE INDEX idx_weekly_plans_household_week
ON public.weekly_plans (household_id, week_start)
WHERE household_id IS NOT NULL;

-- ============================================================================
-- 12. DROP OLD RLS POLICIES ON dishes (replaced with dual-mode policies below)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can insert own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can update own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can delete own dishes" ON public.dishes;

-- ============================================================================
-- 13. DUAL-MODE RLS POLICIES: dishes (solo user_id OR household membership)
-- ============================================================================

-- SELECT: own dishes (solo) OR household member's dishes
CREATE POLICY "Users can view own or household dishes"
ON public.dishes FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = dishes.household_id
    AND user_id = (SELECT auth.uid())
  ))
);

-- INSERT: user_id matches AND (solo OR user is member of household_id)
CREATE POLICY "Users can insert own or household dishes"
ON public.dishes FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    household_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = dishes.household_id
      AND user_id = (SELECT auth.uid())
    )
  )
);

-- UPDATE: own dish (solo) OR household member's dish
CREATE POLICY "Users can update own or household dishes"
ON public.dishes FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = dishes.household_id
    AND user_id = (SELECT auth.uid())
  ))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = dishes.household_id
    AND user_id = (SELECT auth.uid())
  ))
);

-- DELETE: own dish (solo) OR household member's dish
CREATE POLICY "Users can delete own or household dishes"
ON public.dishes FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = dishes.household_id
    AND user_id = (SELECT auth.uid())
  ))
);

-- ============================================================================
-- 14. DROP OLD RLS POLICIES ON weekly_plans (replaced with dual-mode policies)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can insert own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can update own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can delete own weekly plans" ON public.weekly_plans;

-- ============================================================================
-- 15. DUAL-MODE RLS POLICIES: weekly_plans
-- ============================================================================

-- SELECT: own plans (solo) OR household member's plans
CREATE POLICY "Users can view own or household weekly plans"
ON public.weekly_plans FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = weekly_plans.household_id
    AND user_id = (SELECT auth.uid())
  ))
);

-- INSERT: user_id matches AND (solo OR household member)
CREATE POLICY "Users can insert own or household weekly plans"
ON public.weekly_plans FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    household_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = weekly_plans.household_id
      AND user_id = (SELECT auth.uid())
    )
  )
);

-- UPDATE: own plan (solo) OR household member's plan
CREATE POLICY "Users can update own or household weekly plans"
ON public.weekly_plans FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = weekly_plans.household_id
    AND user_id = (SELECT auth.uid())
  ))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = weekly_plans.household_id
    AND user_id = (SELECT auth.uid())
  ))
);

-- DELETE: own plan (solo) OR household member's plan
CREATE POLICY "Users can delete own or household weekly plans"
ON public.weekly_plans FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = weekly_plans.household_id
    AND user_id = (SELECT auth.uid())
  ))
);

-- ============================================================================
-- 16. DROP OLD RLS POLICIES ON meal_assignments (replaced with dual-mode policies)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own meal assignments" ON public.meal_assignments;
DROP POLICY IF EXISTS "Users can insert own meal assignments" ON public.meal_assignments;
DROP POLICY IF EXISTS "Users can update own meal assignments" ON public.meal_assignments;
DROP POLICY IF EXISTS "Users can delete own meal assignments" ON public.meal_assignments;

-- ============================================================================
-- 17. DUAL-MODE RLS POLICIES: meal_assignments
-- Access controlled through weekly_plans (dual-mode: solo user_id OR household membership)
-- ============================================================================

-- SELECT: assignment belongs to a plan the user owns or is a household member of
CREATE POLICY "Users can view own or household meal assignments"
ON public.meal_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND (
      user_id = (SELECT auth.uid())
      OR
      (household_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = weekly_plans.household_id
        AND user_id = (SELECT auth.uid())
      ))
    )
  )
);

-- INSERT: can insert assignment into plan the user owns or is a household member of
CREATE POLICY "Users can insert own or household meal assignments"
ON public.meal_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND (
      user_id = (SELECT auth.uid())
      OR
      (household_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = weekly_plans.household_id
        AND user_id = (SELECT auth.uid())
      ))
    )
  )
);

-- UPDATE: assignment belongs to a plan the user owns or is a household member of
CREATE POLICY "Users can update own or household meal assignments"
ON public.meal_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND (
      user_id = (SELECT auth.uid())
      OR
      (household_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = weekly_plans.household_id
        AND user_id = (SELECT auth.uid())
      ))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND (
      user_id = (SELECT auth.uid())
      OR
      (household_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = weekly_plans.household_id
        AND user_id = (SELECT auth.uid())
      ))
    )
  )
);

-- DELETE: assignment belongs to a plan the user owns or is a household member of
CREATE POLICY "Users can delete own or household meal assignments"
ON public.meal_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_plans
    WHERE id = meal_assignments.weekly_plan_id
    AND (
      user_id = (SELECT auth.uid())
      OR
      (household_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = weekly_plans.household_id
        AND user_id = (SELECT auth.uid())
      ))
    )
  )
);

-- ============================================================================
-- 18. REALTIME PUBLICATION
-- Enable Supabase Realtime for collaboration-relevant tables
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.household_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- ============================================================================
-- 19. UPDATED_AT TRIGGER: households
-- Reuse the function created in 001_profiles.sql
-- ============================================================================
CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 20. ACTIVITY LOG TRIGGER FUNCTIONS
-- SECURITY DEFINER so trigger can read from profiles table.
-- Only fires when household_id IS NOT NULL on the affected row.
-- Writes display_name directly into activity_log so Realtime payload carries it.
-- ============================================================================

-- Function for dish activity logging
CREATE OR REPLACE FUNCTION public.log_dish_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name TEXT;
  v_user_id UUID;
  v_household_id UUID;
  v_action TEXT;
  v_entity_name TEXT;
BEGIN
  -- Determine user_id and household_id based on operation
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_household_id := OLD.household_id;
    v_action := 'dish_deleted';
    v_entity_name := OLD.name;
  ELSIF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
    v_household_id := NEW.household_id;
    v_action := 'dish_added';
    v_entity_name := NEW.name;
  ELSE -- UPDATE
    v_user_id := NEW.user_id;
    v_household_id := NEW.household_id;
    v_action := 'dish_updated';
    v_entity_name := NEW.name;
  END IF;

  -- Only log if this is a household dish
  IF v_household_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Lookup display_name from profiles
  SELECT display_name INTO v_display_name
  FROM public.profiles
  WHERE id = v_user_id;

  -- Write to activity_log
  INSERT INTO public.activity_log (household_id, user_id, display_name, action, entity_type, entity_name)
  VALUES (v_household_id, v_user_id, v_display_name, v_action, 'dish', v_entity_name);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to dishes table
CREATE TRIGGER dishes_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dish_activity();

-- Function for meal_assignment activity logging
CREATE OR REPLACE FUNCTION public.log_meal_assignment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name TEXT;
  v_user_id UUID;
  v_household_id UUID;
  v_action TEXT;
  v_entity_name TEXT;
  v_plan_record RECORD;
BEGIN
  -- Lookup the weekly_plan to get household_id and user context
  IF TG_OP = 'DELETE' THEN
    SELECT user_id, household_id INTO v_plan_record
    FROM public.weekly_plans WHERE id = OLD.weekly_plan_id;
    v_user_id := v_plan_record.user_id;
    v_household_id := v_plan_record.household_id;
    v_action := 'assignment_changed';
    v_entity_name := NULL;
  ELSE
    SELECT user_id, household_id INTO v_plan_record
    FROM public.weekly_plans WHERE id = NEW.weekly_plan_id;
    v_user_id := v_plan_record.user_id;
    v_household_id := v_plan_record.household_id;
    v_action := 'assignment_changed';
    v_entity_name := NULL;
  END IF;

  -- Only log if this is a household plan
  IF v_household_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Lookup display_name from profiles
  SELECT display_name INTO v_display_name
  FROM public.profiles
  WHERE id = v_user_id;

  -- Write to activity_log
  INSERT INTO public.activity_log (household_id, user_id, display_name, action, entity_type, entity_name)
  VALUES (v_household_id, v_user_id, v_display_name, v_action, 'meal_assignment', v_entity_name);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to meal_assignments table
CREATE TRIGGER meal_assignments_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_meal_assignment_activity();
