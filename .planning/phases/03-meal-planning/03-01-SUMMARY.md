---
phase: 03-meal-planning
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, angular, typescript]

# Dependency graph
requires:
  - phase: 02-dish-management
    provides: "dishes table and DishService pattern that meal_assignments references"
provides:
  - "weekly_plans, meal_assignments, category_preferences tables with RLS and indexes"
  - "TypeScript interfaces: WeeklyPlan, MealAssignment, CategoryPreference, DayOfWeek"
  - "MealPlanService with 8 CRUD methods for plans, assignments, and preferences"
  - "Helper functions: getWeekStart, getWeekDates, formatDateGerman"
affects: [03-02-calendar-ui, 03-03-generation-algorithm]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DATE type for week_start to avoid timezone ambiguity"
    - "RLS on meal_assignments via weekly_plans ownership subquery"
    - "maybeSingle() for optional existence checks in Supabase queries"
    - "upsert with onConflict for idempotent create-or-update operations"

key-files:
  created:
    - supabase/migrations/003_meal_plans.sql
    - src/app/features/meal-plan/models/meal-plan.model.ts
    - src/app/features/meal-plan/services/meal-plan.service.ts
  modified: []

key-decisions:
  - "DATE type for week_start (not TIMESTAMPTZ) to avoid timezone ambiguity; app sends ISO strings like '2026-02-16'"
  - "RLS on meal_assignments through weekly_plans ownership subquery (indirect access via plan ownership)"
  - "DEFAULT_CATEGORY_PREFERENCES: Fleisch=2, Vegetarisch=2, Fisch=1 (total 5, leaving 2 days for any category)"
  - "getOrCreateWeeklyPlan uses maybeSingle() + manual create instead of upsert to return full row cleanly"
  - "getRecentDishIds uses inner join via !inner syntax to filter through weekly_plans ownership"

patterns-established:
  - "Reuse update_updated_at() trigger function across all new tables (established in 001_profiles.sql)"
  - "Helper utilities exported from model file (getWeekStart, getWeekDates, formatDateGerman)"
  - "inject(SupabaseService) pattern with throw-on-error (no try/catch) matches DishService"

requirements-completed: [PLAN-01, PLAN-02, PLAN-05]

# Metrics
duration: 8min
completed: 2026-02-17
---

# Phase 3 Plan 01: Meal Planning Data Foundation Summary

**Three Supabase tables (weekly_plans, meal_assignments, category_preferences) with RLS, indexes, and MealPlanService exposing 8 CRUD methods for the calendar UI and generation algorithm to build on**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-17T05:45:00Z
- **Completed:** 2026-02-17T05:54:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Database migration with three tables, RLS policies on all (using (SELECT auth.uid()) pattern), 4 indexes, 3 triggers
- TypeScript models matching database schema exactly: WeeklyPlan, MealAssignment, CategoryPreference, DayOfWeek, DAY_LABELS, DEFAULT_CATEGORY_PREFERENCES, WeeklyPlanWithAssignments
- MealPlanService with all 8 CRUD methods following the established DishService pattern
- Helper functions for ISO week boundary math (getWeekStart), date range generation (getWeekDates), and German date formatting (formatDateGerman)
- Angular build compiles with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create meal planning database migration with RLS policies** - `72b56a6` (feat)
2. **Task 2: Create meal plan models and MealPlanService with CRUD operations** - `458523e` (feat)

## Files Created/Modified
- `supabase/migrations/003_meal_plans.sql` - Three tables with RLS, indexes, triggers; ready to run in Supabase SQL Editor
- `src/app/features/meal-plan/models/meal-plan.model.ts` - TypeScript interfaces and constants for meal planning domain
- `src/app/features/meal-plan/services/meal-plan.service.ts` - MealPlanService with CRUD for plans, assignments, and preferences

## Decisions Made
- Used `DATE` type (not `TIMESTAMPTZ`) for `week_start` to avoid timezone ambiguity — app always sends ISO date strings like '2026-02-16'
- RLS on `meal_assignments` is enforced indirectly via `weekly_plans` ownership subquery (users can only access assignments under their own plans)
- `getOrCreateWeeklyPlan` uses `maybeSingle()` + explicit insert rather than `upsert()` to return a clean single row with proper typing
- Default category preferences: Fleisch=2, Vegetarisch=2, Fisch=1 (total 5 assigned, 2 days left for "any" category)
- Inner join syntax (`weekly_plans!inner`) used in `getRecentDishIds` to filter through plan ownership without a secondary query

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — Angular build passed on first attempt with zero errors.

## User Setup Required

**The Supabase migration must be run manually before meal planning features will work.**

Steps:
1. Open Supabase Dashboard for the project
2. Navigate to SQL Editor
3. Paste the full contents of `supabase/migrations/003_meal_plans.sql`
4. Click "Run"

No new environment variables required.

## Next Phase Readiness
- MealPlanService is ready for consumption by the calendar UI (Plan 02)
- Generation algorithm (Plan 03) can call `getOrCreateWeeklyPlan`, `getCategoryPreferences`, `getRecentDishIds`, `assignDish`, and `clearWeekAssignments`
- No blockers — data foundation complete

---
*Phase: 03-meal-planning*
*Completed: 2026-02-17*

## Self-Check: PASSED

- FOUND: supabase/migrations/003_meal_plans.sql
- FOUND: src/app/features/meal-plan/models/meal-plan.model.ts
- FOUND: src/app/features/meal-plan/services/meal-plan.service.ts
- FOUND: .planning/phases/03-meal-planning/03-01-SUMMARY.md
- FOUND commit 72b56a6 (Task 1)
- FOUND commit 458523e (Task 2)
