# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Die Familie muss nie wieder täglich überlegen, was es zum Abendessen gibt — ein Klick generiert einen ausgewogenen Wochenplan aus dem eigenen Gerichtepool.
**Current focus:** Phase 4 - Realtime Collaboration - IN PROGRESS

## Current Position

Phase: 4 of 4 (Realtime Collaboration) - IN PROGRESS
Plan: 2 of 3 in current phase - COMPLETED
Status: 04-02 complete — settings page with household panel, accept-invite page, Edge Function invite-user, navigation updated
Last activity: 2026-02-17 — Completed 04-02-PLAN.md

Progress: [███████████████] 93%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 5.7 minutes
- Total execution time: 0.95 hours

**By Phase:**

| Phase | Plans | Total  | Avg/Plan |
|-------|-------|--------|----------|
| 01    | 3     | 43.5m  | 14.5m    |
| 02    | 2     | 4.6m   | 2.3m     |
| 03    | 3     | 15.7m  | 5.2m     |
| 04    | 2     | 8.0m   | 4.0m     |

**Recent Trend:**
- Last 5 plans: 8.0m, 3.5m, 4.2m, 4.0m
- Trend: Consistent sub-10min execution

*Updated after each plan completion*

**Recent Completions:**
- 2026-02-16: 01-01-PLAN.md (Foundation Infrastructure) - 5.7m - 3 tasks
- 2026-02-16: 01-02-PLAN.md (Authentication Pages & Route Guards) - 2.8m - 1 task
- 2026-02-16: 01-03-PLAN.md (App Shell & Navigation) - 35m - 2 tasks
- 2026-02-16: 02-01-PLAN.md (Dishes Database & Service Layer) - 1.4m - 2 tasks
- 2026-02-16: 02-02-PLAN.md (Dish Management UI) - 3.25m - 2 tasks
- 2026-02-17: 03-01-PLAN.md (Meal Planning Data Foundation) - 8.0m - 2 tasks
- 2026-02-17: 03-02-PLAN.md (Weekly Calendar UI) - 3.5m - 2 tasks
- 2026-02-17: 03-03-PLAN.md (Generation Algorithm) - 4.2m - 2 tasks
- 2026-02-17: 04-01-PLAN.md (Household Database Foundation) - 4.0m - 2 tasks
- 2026-02-17: 04-02-PLAN.md (Household Settings UI & Invite System) - 4.0m - 2 tasks

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Angular + Supabase + Vercel stack chosen based on existing Angular experience
- Deutsch-only for v1 to reduce complexity
- Gerichte minimal (Name + Kategorie) for low-friction onboarding
- Focus on Abendessen only in v1
- **[01-01]** Tailwind CSS v4 with PostCSS - Latest version for improved performance
- **[01-01]** Use (SELECT auth.uid()) in RLS policies - 94-99% performance gain per CVE-2025-48757
- **[01-01]** Auto-create profiles via trigger - Ensures profile exists for all users
- **[01-02]** Functional guards (CanActivateFn) over class-based - Angular 21 best practice
- **[01-02]** Generic password reset message - Prevents email enumeration attacks
- **[01-02]** Display name in auth metadata - Simplifies registration flow
- **[01-03]** German route names throughout app - Consistent with Deutsch-only UI
- **[01-03]** Bottom tabs mobile, top bar desktop - Mobile-first navigation pattern
- **[01-03]** Logout visible in nav (not hidden) - Per research decision, quick access to logout
- **[01-03]** .postcssrc.json format for Tailwind - Angular esbuild builder requirement
- **[02-01]** TEXT with CHECK constraint over PostgreSQL ENUM for categories (easier to modify)
- **[02-01]** Reuse existing update_updated_at() function from 001_profiles.sql
- **[02-01]** getAll orders by is_favorite DESC, name ASC - favorites appear first
- **[02-02]** Angular Material installed for MatSnackBar undo toast functionality
- **[02-02]** Single-component approach for dish UI (not broken into sub-components) for simplicity
- **[02-02]** Angular 17+ control flow (@if/@for) to avoid CommonModule imports
- **[02-02]** Optimistic updates for favorite toggle and delete (better UX)
- **[03-01]** DATE type for week_start (not TIMESTAMPTZ) — avoids timezone ambiguity, app sends ISO strings
- **[03-01]** RLS on meal_assignments via weekly_plans ownership subquery — indirect RLS through plan ownership
- **[03-01]** DEFAULT_CATEGORY_PREFERENCES: Fleisch=2, Vegetarisch=2, Fisch=1 (5 assigned, 2 for any)
- **[03-01]** getOrCreateWeeklyPlan uses maybeSingle() + explicit insert — clean single-row return
- **[03-01]** getRecentDishIds uses !inner join syntax — filters dish history through plan ownership
- **[03-02]** getOrCreateWeeklyPlan called lazily on first assignment — avoids creating empty plans for browsed weeks
- **[03-02]** effect() in constructor triggers loadWeek() on currentWeekStart signal change (covers nav + init)
- **[03-02]** DishService loaded by DishPickerComponent autonomously — not passed from MealPlanComponent
- **[03-02]** Past week guard inside openDishPicker() method, not in template click binding
- **[03-03]** Promise.all() for parallel loading of dishes, preferences, and recent IDs — reduces algorithm startup latency
- **[03-03]** 3x favorite weighting via pool duplication (not priority queue) — simple, correct, O(n) overhead
- **[03-03]** 3-phase algorithm: category slots first, then any-category leftovers, then repeats as last resort
- **[03-03]** CategoryConfigComponent import path uses 3 levels up (../../../dishes/) not 4
- **[04-01]** Dual-mode RLS pattern: solo (user_id) OR (household_id IS NOT NULL AND membership) — backward-compatible
- **[04-01]** Data migration on createHousehold/acceptInvite: existing solo dishes/plans updated to household_id
- **[04-01]** SECURITY DEFINER triggers for activity_log: cross-table access to profiles, display_name embedded in row
- **[04-01]** display_name written at INSERT time by trigger — Realtime payload carries it without JOIN
- **[04-01]** Category preferences remain user-scoped (not household) — defers "whose preferences" question
- **[04-01]** Partial unique index idx_weekly_plans_household_week: one plan per household per week
- **[04-02]** SupabaseService.supabaseUrl getter added to expose project URL (SupabaseClient.supabaseUrl is protected)
- **[04-02]** SessionStorage for invite token persistence through registration flow (cleared on tab close)
- **[04-02]** Edge Function validates invite token before calling inviteUserByEmail (prevents spam/abuse)
- **[04-02]** AcceptInviteComponent stub created in Task 1 to enable route compilation, fleshed out in Task 2

### Pending Todos

(None)

### Blockers/Concerns

**From Research:**
- ✓ **[RESOLVED in 01-01]** RLS misconfiguration risk - Implemented optimized (SELECT auth.uid()) pattern in all policies
- ✓ **[RESOLVED in 03-03]** Algorithm complexity for meal plan generation — delivered with 3-phase greedy randomized algorithm
- Free tier project pausing after 7 days inactivity — decision needed in Phase 1: upgrade to Pro vs. keepalive cron

## Session Continuity

Last session: 2026-02-17 (execute-phase)
Stopped at: Completed 04-02-PLAN.md
Resume file: .planning/phases/04-realtime-collaboration/04-02-SUMMARY.md
Next action: Execute 04-03-PLAN.md (Realtime Collaboration Sync)
