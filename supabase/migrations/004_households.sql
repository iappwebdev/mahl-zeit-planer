-- Migration: 004_households.sql
-- Description: Create household collaboration (Option A: household_id on profiles).
--              No household_members join table. Membership is stored directly on profiles.

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
-- 2. HOUSEHOLD_INVITES TABLE
-- ============================================================================
CREATE TABLE public.household_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  invited_email TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_household_invites_token ON public.household_invites(token);

-- ============================================================================
-- 3. ACTIVITY_LOG TABLE
-- ============================================================================
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

CREATE INDEX idx_activity_log_household ON public.activity_log(household_id, created_at DESC);

-- ============================================================================
-- 4. ALTER PROFILES: add household_id and household_role
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  ADD COLUMN household_role TEXT CHECK (household_role IN ('owner', 'member'));

CREATE INDEX idx_profiles_household ON public.profiles(household_id);

-- ============================================================================
-- 5. PROFILES RLS: add policy so household members can see each other
-- ============================================================================
CREATE POLICY "Household members can view each other"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

-- Drop the old self-only SELECT policy (replaced by the one above)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- ============================================================================
-- 6. ALTER DISHES: add household_id
-- ============================================================================
ALTER TABLE public.dishes
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

CREATE INDEX idx_dishes_household ON public.dishes(household_id);

-- ============================================================================
-- 7. ALTER WEEKLY_PLANS: add household_id + partial unique index
-- ============================================================================
ALTER TABLE public.weekly_plans
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

CREATE INDEX idx_weekly_plans_household ON public.weekly_plans(household_id);

CREATE UNIQUE INDEX idx_weekly_plans_household_week
ON public.weekly_plans (household_id, week_start)
WHERE household_id IS NOT NULL;

-- ============================================================================
-- 8. ENABLE RLS ON NEW TABLES
-- ============================================================================
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. DROP OLD RLS POLICIES ON dishes
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can insert own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can update own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can delete own dishes" ON public.dishes;

-- ============================================================================
-- 10. DUAL-MODE RLS POLICIES: dishes (solo OR household via profiles)
-- ============================================================================
CREATE POLICY "Users can view own or household dishes"
ON public.dishes FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

CREATE POLICY "Users can insert own or household dishes"
ON public.dishes FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    household_id IS NULL
    OR household_id IN (
      SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can update own or household dishes"
ON public.dishes FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

CREATE POLICY "Users can delete own or household dishes"
ON public.dishes FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

-- ============================================================================
-- 11. DROP OLD RLS POLICIES ON weekly_plans
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can insert own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can update own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can delete own weekly plans" ON public.weekly_plans;

-- ============================================================================
-- 12. DUAL-MODE RLS POLICIES: weekly_plans
-- ============================================================================
CREATE POLICY "Users can view own or household weekly plans"
ON public.weekly_plans FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

CREATE POLICY "Users can insert own or household weekly plans"
ON public.weekly_plans FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND (
    household_id IS NULL
    OR household_id IN (
      SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Users can update own or household weekly plans"
ON public.weekly_plans FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

CREATE POLICY "Users can delete own or household weekly plans"
ON public.weekly_plans FOR DELETE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR
  (household_id IS NOT NULL AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  ))
);

-- ============================================================================
-- 13. DROP OLD RLS POLICIES ON meal_assignments
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own meal assignments" ON public.meal_assignments;
DROP POLICY IF EXISTS "Users can insert own meal assignments" ON public.meal_assignments;
DROP POLICY IF EXISTS "Users can update own meal assignments" ON public.meal_assignments;
DROP POLICY IF EXISTS "Users can delete own meal assignments" ON public.meal_assignments;

-- ============================================================================
-- 14. DUAL-MODE RLS POLICIES: meal_assignments (via weekly_plans + profiles)
-- ============================================================================
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
      (household_id IS NOT NULL AND household_id IN (
        SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
      ))
    )
  )
);

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
      (household_id IS NOT NULL AND household_id IN (
        SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
      ))
    )
  )
);

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
      (household_id IS NOT NULL AND household_id IN (
        SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
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
      (household_id IS NOT NULL AND household_id IN (
        SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
      ))
    )
  )
);

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
      (household_id IS NOT NULL AND household_id IN (
        SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
      ))
    )
  )
);

-- ============================================================================
-- 15. HOUSEHOLDS RLS POLICIES
-- ============================================================================
CREATE POLICY "Members can view their household"
ON public.households FOR SELECT
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  OR
  id IN (SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "Users can create a household"
ON public.households FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Owner can update household"
ON public.households FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = owner_id)
WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Owner can delete household"
ON public.households FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = owner_id);

-- ============================================================================
-- 16. HOUSEHOLD_INVITES RLS POLICIES (membership via profiles)
-- ============================================================================
CREATE POLICY "Members can view household invites"
ON public.household_invites FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can create invites"
ON public.household_invites FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = created_by
  AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can update invites"
ON public.household_invites FOR UPDATE
TO authenticated
USING (
  household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
)
WITH CHECK (
  household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can delete invites"
ON public.household_invites FOR DELETE
TO authenticated
USING (
  household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 17. ACTIVITY_LOG RLS POLICIES
-- ============================================================================
CREATE POLICY "Members can view household activity"
ON public.activity_log FOR SELECT
TO authenticated
USING (
  household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
);

CREATE POLICY "Members can insert activity entries"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND household_id IN (
    SELECT p.household_id FROM public.profiles p WHERE p.id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 18. REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- ============================================================================
-- 19. UPDATED_AT TRIGGER: households
-- ============================================================================
CREATE TRIGGER households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 20. ACTIVITY LOG TRIGGER FUNCTIONS (SECURITY DEFINER)
-- ============================================================================

-- Dish activity logging
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
  ELSE
    v_user_id := NEW.user_id;
    v_household_id := NEW.household_id;
    v_action := 'dish_updated';
    v_entity_name := NEW.name;
  END IF;

  IF v_household_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT display_name INTO v_display_name
  FROM public.profiles
  WHERE id = v_user_id;

  INSERT INTO public.activity_log (household_id, user_id, display_name, action, entity_type, entity_name)
  VALUES (v_household_id, v_user_id, v_display_name, v_action, 'dish', v_entity_name);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER dishes_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_dish_activity();

-- Meal assignment activity logging
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

  IF v_household_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT display_name INTO v_display_name
  FROM public.profiles
  WHERE id = v_user_id;

  INSERT INTO public.activity_log (household_id, user_id, display_name, action, entity_type, entity_name)
  VALUES (v_household_id, v_user_id, v_display_name, v_action, 'meal_assignment', v_entity_name);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER meal_assignments_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.meal_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_meal_assignment_activity();
