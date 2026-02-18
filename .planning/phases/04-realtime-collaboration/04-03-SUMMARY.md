---
phase: 04-realtime-collaboration
plan: 03
subsystem: realtime
tags: [angular, supabase, realtime, signals, websocket, activity-feed, household]

# Dependency graph
requires:
  - phase: 04-01
    provides: HouseholdService signals, householdId computed, activity_log table with SECURITY DEFINER triggers, Realtime publication
  - phase: 04-02
    provides: SettingsComponent, HouseholdPanelComponent, LayoutComponent with sessionStorage invite handling
provides:
  - RealtimeService: singleton managing Supabase Realtime channel subscriptions per household
  - Live dish updates in DishesComponent (reload + person-named toast)
  - Live meal assignment updates in MealPlanComponent (reload + person-named toast)
  - ActivityFeedComponent at /einstellungen showing recent household activity
  - Clean subscription lifecycle (subscribe on household join, unsubscribe on leave/destroy)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RealtimeService pattern: effect() on householdId signal drives subscribe/unsubscribe lifecycle automatically"
    - "Realtime channel per household: single channel with multiple postgres_changes listeners (dishes, meal_assignments, household_members, activity_log)"
    - "activityChange signal for person-named toasts: activity_log payload carries display_name from SECURITY DEFINER trigger — no extra JOIN needed"
    - "Toast filtering by currentUserId: skip toast for own changes, show only when activity.new.user_id !== currentUserId"
    - "ActivityFeedComponent auto-refresh: effect() watches dishChange/assignmentChange signals, re-fetches log on any change"

key-files:
  created:
    - src/app/core/services/realtime.service.ts
    - src/app/features/settings/components/activity-feed/activity-feed.component.ts
    - src/app/features/settings/components/activity-feed/activity-feed.component.html
  modified:
    - src/app/features/dishes/dishes.component.ts
    - src/app/features/meal-plan/meal-plan.component.ts
    - src/app/shared/components/layout/layout.component.ts
    - src/app/features/settings/settings.component.ts
    - src/app/features/settings/settings.component.html

key-decisions:
  - "RealtimeService uses effect() on HouseholdService.householdId() for auto-subscribe/unsubscribe — no manual calls needed"
  - "Single Supabase channel per household with multiple postgres_changes listeners (not one channel per table) — cleaner WebSocket usage"
  - "activityChange (not dishChange) used for person-named toasts — activity_log rows carry display_name from SECURITY DEFINER trigger at INSERT time"
  - "currentUserId stored in component field (set in ngOnInit via getUser()) — filter own-change toasts without async in effect"
  - "LayoutComponent injection of RealtimeService ensures service instantiation on first authenticated load"
  - "ActivityFeedComponent auto-refresh uses dishChange/assignmentChange signals (not activityChange) — these fire before activity_log INSERT, triggering a fresh fetch that includes the new entry"

# Metrics
duration: 3min
completed: 2026-02-17
---

# Phase 4 Plan 03: Realtime Collaboration Sync Summary

**Supabase Realtime subscriptions wired to household channel: live dish/meal-plan updates, person-named toasts from activity_log triggers, and an auto-refreshing activity feed in settings**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T18:10:36Z
- **Completed:** 2026-02-17T18:13:37Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Created RealtimeService (`providedIn: 'root'`) with four signals (`dishChange`, `assignmentChange`, `memberChange`, `activityChange`). Internal `effect()` watches `householdService.householdId()` — subscribes to a Supabase Realtime channel when household joined, unsubscribes on leave or service destroy. Solo users have zero subscriptions.
- Updated DishesComponent with two effects: one reloads the dish list on `dishChange`, one shows a person-named snackbar toast on `activityChange` events for dish entity types made by other members (e.g. "Lisa hat Lachs hinzugefuegt").
- Updated MealPlanComponent with two effects: one reloads the current week on `assignmentChange`, one shows a person-named snackbar toast on `activityChange` events for meal_assignment/weekly_plan entity types (e.g. "Max hat Montag geaendert").
- Updated LayoutComponent to inject RealtimeService — ensures the singleton is instantiated when the authenticated layout loads.
- Created ActivityFeedComponent at `src/app/features/settings/components/activity-feed/`. Loads 30 most recent activity_log entries on init, displays German action descriptions, relative timestamps, and color-coded left-border accents per action type. Max-height with overflow scroll. Auto-refreshes via effect watching dishChange/assignmentChange.
- Updated SettingsComponent to import ActivityFeedComponent, add `hasHousehold` computed signal, and conditionally render the feed below HouseholdPanelComponent only for household members.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RealtimeService and integrate live updates into DishesComponent and MealPlanComponent** - `e081720` (feat)
2. **Task 2: Create ActivityFeedComponent and integrate into settings page** - `5edbe38` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/core/services/realtime.service.ts` - Singleton RealtimeService with 4 signals, effect-driven subscribe/unsubscribe lifecycle, DestroyRef cleanup
- `src/app/features/dishes/dishes.component.ts` - Added RealtimeService + SupabaseService injects, constructor effects for data reload and person-named toasts, currentUserId loaded in ngOnInit
- `src/app/features/meal-plan/meal-plan.component.ts` - Added RealtimeService + SupabaseService injects, constructor effects for data reload and person-named toasts, currentUserId loaded in ngOnInit
- `src/app/shared/components/layout/layout.component.ts` - Added RealtimeService inject to ensure initialization
- `src/app/features/settings/components/activity-feed/activity-feed.component.ts` - ActivityFeedComponent with loadActivity(), actionText(), actionIcon(), timeAgo(), entryBorderClass() methods
- `src/app/features/settings/components/activity-feed/activity-feed.component.html` - Compact list with @if/@for Angular control flow, German text, relative timestamps
- `src/app/features/settings/settings.component.ts` - Added HouseholdService inject, hasHousehold computed, ActivityFeedComponent import
- `src/app/features/settings/settings.component.html` - Added conditional @if block rendering ActivityFeedComponent

## Decisions Made

- RealtimeService uses a single Supabase channel per household with multiple `.on('postgres_changes', ...)` listeners — one channel covers all four tables, avoiding unnecessary WebSocket connections
- `activityChange` signal (activity_log INSERT) used as the source for person-named toasts because activity_log rows include `display_name` from the SECURITY DEFINER trigger (04-01 migration). The raw `dishes` postgres_changes payload does not include user display names.
- Toast filtering: `currentUserId` is stored as a component field and loaded once in `ngOnInit` via `supabaseService.client.auth.getUser()`. This avoids async calls inside `effect()` and correctly suppresses self-change notifications.
- ActivityFeedComponent auto-refresh watches `dishChange/assignmentChange` signals instead of `activityChange`. These Realtime events arrive before the activity_log INSERT propagates, so watching them triggers a fresh `getActivityLog()` call that pulls in the new entry.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both builds compiled cleanly with zero TypeScript errors on first attempt.

## Next Phase Readiness

Phase 4 is now complete. All three plans delivered:
- 04-01: Household database foundation (tables, dual-mode RLS, HouseholdService, activity triggers)
- 04-02: Household Settings UI, invite system, AcceptInviteComponent, Edge Function
- 04-03: Realtime subscriptions, person-named toasts, ActivityFeedComponent

The application now delivers the full v1 vision: household members see each other's changes instantly, receive named notifications, and can review recent activity in the settings page.

---
*Phase: 04-realtime-collaboration*
*Completed: 2026-02-17*

## Self-Check: PASSED

All required files present and both task commits verified:
- `src/app/core/services/realtime.service.ts` - FOUND
- `src/app/features/settings/components/activity-feed/activity-feed.component.ts` - FOUND
- `src/app/features/settings/components/activity-feed/activity-feed.component.html` - FOUND
- `src/app/features/dishes/dishes.component.ts` - FOUND
- `src/app/features/meal-plan/meal-plan.component.ts` - FOUND
- `src/app/shared/components/layout/layout.component.ts` - FOUND
- `src/app/features/settings/settings.component.ts` - FOUND
- `src/app/features/settings/settings.component.html` - FOUND
- Commit `e081720` - FOUND
- Commit `5edbe38` - FOUND
