---
phase: 04-realtime-collaboration
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, angular, signals, household, realtime]

# Dependency graph
requires:
  - phase: 02-dish-management
    provides: dishes table, DishService, dish.model.ts
  - phase: 03-meal-planning
    provides: weekly_plans, meal_assignments tables, MealPlanService
provides:
  - households, household_members, household_invites, activity_log tables with RLS
  - dual-mode RLS on dishes/weekly_plans/meal_assignments (solo OR household membership)
  - HouseholdService with reactive signals for household lifecycle management
  - household-aware DishService and MealPlanService
  - Supabase Realtime publication for 5 collaboration tables
affects: [04-02, 04-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-mode RLS: solo (user_id) OR household (household_id membership) access pattern"
    - "Signal-based household state: currentHousehold signal drives householdId computed for downstream services"
    - "Data migration on household join: existing solo dishes/plans migrated to household_id on createHousehold/acceptInvite"
    - "SECURITY DEFINER trigger functions for cross-table activity logging without breaking RLS"
    - "display_name embedded in activity_log at INSERT time (trigger), so Realtime payload carries it without JOIN"

key-files:
  created:
    - supabase/migrations/004_households.sql
    - src/app/features/settings/models/household.model.ts
    - src/app/core/services/household.service.ts
  modified:
    - src/app/features/dishes/services/dish.service.ts
    - src/app/features/meal-plan/services/meal-plan.service.ts

key-decisions:
  - "Dual-mode RLS pattern: solo (user_id) OR (household_id IS NOT NULL AND household membership) — backward-compatible, no data loss"
  - "Data migration on createHousehold/acceptInvite: existing solo dishes and plans updated to household_id automatically"
  - "SECURITY DEFINER trigger functions for activity_log: allows cross-table access (profiles) while respecting RLS"
  - "display_name written into activity_log at INSERT time by trigger, not joined at query time — enables Realtime payload to carry it"
  - "Category preferences kept user-scoped (not household-scoped) per research decision — defers 'whose preferences' question"
  - "Partial unique index idx_weekly_plans_household_week for household mode — allows multiple users to share one plan per week"

patterns-established:
  - "Dual-mode service pattern: check this.household.householdId() signal, branch query by household_id vs user_id"
  - "All RLS policies use (SELECT auth.uid()) wrapper — 49 occurrences in 004_households.sql alone"

requirements-completed: [AUTH-04, AUTH-06]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 4 Plan 01: Household Database Foundation Summary

**Supabase household collaboration schema with dual-mode RLS (solo/household), reactive HouseholdService signals, and household-aware DishService/MealPlanService queries**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T17:56:12Z
- **Completed:** 2026-02-17T18:00:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created 004_households.sql with 4 new tables (households, household_members, household_invites, activity_log), dual-mode RLS replacing all old policies on dishes/weekly_plans/meal_assignments, Realtime publication for 5 tables, and SECURITY DEFINER activity log trigger functions
- Created HouseholdService with reactive `currentHousehold` signal and `householdId` computed, providing full household lifecycle (create, join via invite, leave, delete, member management, activity log)
- Updated DishService and MealPlanService to transparently support both solo mode (user_id queries, RLS-filtered) and household mode (household_id queries) based on the householdId signal

## Task Commits

Each task was committed atomically:

1. **Task 1: Create household database migration with dual-mode RLS policies** - `4500d3b` (feat)
2. **Task 2: Create household models, HouseholdService, and update DishService/MealPlanService** - `37d79bf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `supabase/migrations/004_households.sql` - 4 new tables, dual-mode RLS on 3 existing tables, Realtime publication, 2 SECURITY DEFINER trigger functions
- `src/app/features/settings/models/household.model.ts` - Household, HouseholdMember, HouseholdInvite, ActivityLogEntry, HouseholdRole TypeScript interfaces
- `src/app/core/services/household.service.ts` - Full household lifecycle management with reactive signals
- `src/app/features/dishes/services/dish.service.ts` - Added HouseholdService inject, household-aware getAll() and create()
- `src/app/features/meal-plan/services/meal-plan.service.ts` - Added HouseholdService inject, household-aware getOrCreateWeeklyPlan(), getAssignmentsForWeek(), getRecentDishIds()

## Decisions Made
- Dual-mode RLS pattern uses `(SELECT auth.uid()) = user_id OR (household_id IS NOT NULL AND EXISTS(membership check))` — backward-compatible with all existing solo user data
- Data migration approach on createHousehold/acceptInvite: UPDATE dishes/weekly_plans SET household_id = new_id WHERE user_id = me AND household_id IS NULL — existing solo data moves to household without data loss
- SECURITY DEFINER trigger functions for activity_log: required because trigger must JOIN profiles (different RLS context), writes display_name directly into activity_log row so Realtime postgres_changes payload carries it
- Partial unique index `idx_weekly_plans_household_week` WHERE household_id IS NOT NULL — allows shared plan per household per week while preserving solo UNIQUE(user_id, week_start) constraint
- Category preferences (category_preferences table) remain user-scoped, not household-scoped — per research decision, defers "whose preferences" question to future

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - build compiled cleanly with zero TypeScript errors on first attempt.

## User Setup Required

The migration `004_households.sql` must be applied to the Supabase database:
```
supabase db push
```
or paste into Supabase Dashboard -> SQL Editor -> Run.

## Next Phase Readiness
- Household database foundation complete; all tables, RLS, and Realtime enabled
- HouseholdService signals ready for consumption by Plans 02 and 03 UI components
- DishService and MealPlanService already household-aware — no further service changes needed for household data access
- No blockers for Plan 02 (Household Settings UI) or Plan 03 (Realtime sync)

---
*Phase: 04-realtime-collaboration*
*Completed: 2026-02-17*
