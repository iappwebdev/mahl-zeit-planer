---
phase: 03-meal-planning
plan: 02
subsystem: calendar-ui
tags: [angular, material, bottom-sheet, calendar, meal-planning, signals]

# Dependency graph
requires:
  - phase: 03-01
    provides: "MealPlanService, MealAssignment, WeeklyPlan types, getWeekStart/getWeekDates/formatDateGerman helpers"
  - phase: 02-dish-management
    provides: "DishService.getAll() and Dish model used in DishPickerComponent"
provides:
  - "DishPickerComponent: bottom sheet for selecting/clearing a dish with category filtering"
  - "MealPlanComponent: full weekly calendar with day cards, navigation, assignment, and distribution summary"
affects: [03-03-generation-algorithm]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MatBottomSheet.open() with MAT_BOTTOM_SHEET_DATA injection for bottom sheet components"
    - "effect() in constructor to reload data when reactive signal (currentWeekStart) changes"
    - "Optimistic UI updates with Map<DayOfWeek, MealAssignment> signal + rollback on error"
    - "getOrCreateWeeklyPlan called lazily on first dish assignment (not on page load)"
    - "[class] binding for dynamic Tailwind class strings on distribution summary chips"

key-files:
  created:
    - src/app/features/meal-plan/components/dish-picker/dish-picker.component.ts
    - src/app/features/meal-plan/components/dish-picker/dish-picker.component.html
  modified:
    - src/app/features/meal-plan/meal-plan.component.ts
    - src/app/features/meal-plan/meal-plan.component.html

key-decisions:
  - "DishService not injected in MealPlanComponent (dishes loaded by DishPickerComponent itself, not passed in)"
  - "getOrCreateWeeklyPlan called lazily on first assignDish() call — avoids creating empty plans for viewed weeks"
  - "effect() in constructor (not ngOnInit) used to reload week data when currentWeekStart signal changes"
  - "Past week guard: openDishPicker() returns early if isPastWeek() — no click handler override needed"
  - "Distribution summary uses [class] binding with concatenated string (not ngClass) — simpler for Tailwind"

# Metrics
duration: 3.5min
completed: 2026-02-17
---

# Phase 3 Plan 02: Weekly Calendar UI Summary

**Weekly calendar at /wochenplan with Mon-Sun day cards, MatBottomSheet dish picker with category filtering, optimistic assign/swap/clear, week navigation (current+next editable, past read-only), and category distribution summary**

## Performance

- **Duration:** ~3.5 min
- **Started:** 2026-02-17T05:56:41Z
- **Completed:** 2026-02-17T06:00:05Z
- **Tasks:** 2
- **Files created/modified:** 4

## Accomplishments

- DishPickerComponent: standalone bottom sheet with MAT_BOTTOM_SHEET_DATA, loads all dishes via DishService, filters by Alle/Fisch/Fleisch/Vegetarisch/Favoriten, returns selected dish or null (clear), shows "Gericht entfernen" button when a dish is currently assigned
- Category badge colors match Gerichte page exactly: `bg-blue-100 text-blue-800` (Fisch), `bg-red-100 text-red-800` (Fleisch), `bg-green-100 text-green-800` (Vegetarisch)
- MealPlanComponent: full weekly calendar replacing placeholder with 7 day cards Mon-Sun showing actual calendar dates (e.g., "Montag, 17. Feb.")
- Week navigation: current week and next week editable; past weeks show "Nur Ansicht" badge and disable all edit actions
- Category distribution summary bar shows "2x Fleisch, 1x Fisch, 7x frei" etc. with color-coded chips
- Filled day cards show dish name, category badge, favorite heart (display only), and swap icon
- Empty day cards show "Kein Gericht" in muted italic text; entire card tappable to open picker
- Optimistic updates for assign and remove operations with snackbar error + rollback
- Today highlighted with `border-l-4 border-green-500` left accent
- "Plan generieren" placeholder button shown disabled at bottom of page
- Build passes with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DishPickerComponent as Angular Material bottom sheet** - `320be40` (feat)
2. **Task 2: Implement weekly calendar view with day cards, navigation, and manual assignment** - `1e16b56` (feat)

## Files Created/Modified

- `src/app/features/meal-plan/components/dish-picker/dish-picker.component.ts` - Bottom sheet component: DishService injection, category filter signals, selectDish/clear/close methods
- `src/app/features/meal-plan/components/dish-picker/dish-picker.component.html` - Bottom sheet template: header, remove button, filter chips, scrollable dish list with badges and favorites
- `src/app/features/meal-plan/meal-plan.component.ts` - Full weekly calendar: 7 day card computation, week navigation, optimistic assignment/removal, MatBottomSheet integration
- `src/app/features/meal-plan/meal-plan.component.html` - Calendar template: week header, distribution summary, 7 day cards (filled/empty), "Plan generieren" placeholder

## Decisions Made

- DishService not injected directly in MealPlanComponent — dishes are loaded by DishPickerComponent autonomously when opened
- `getOrCreateWeeklyPlan` called lazily only when first dish is assigned (not on week navigation/view), preventing empty weekly_plan records for browsed weeks
- Used `effect()` in constructor to trigger `loadWeek()` when `currentWeekStart` signal changes, covering both initial load and navigation
- Past week guard handled inside `openDishPicker()` rather than in template click binding — cleaner method encapsulation
- Distribution summary chips use `[class]` with string concatenation instead of `[ngClass]` — sufficient for the simple Tailwind patterns used

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused DishService import from MealPlanComponent**
- **Found during:** Task 2 build cleanup
- **Issue:** DishService was imported and injected in MealPlanComponent per plan spec, but is not actually called — DishPickerComponent handles its own dish loading
- **Fix:** Removed `DishService` import and `inject(DishService)` to avoid dead code
- **Files modified:** `src/app/features/meal-plan/meal-plan.component.ts`
- **Commit:** Included in `1e16b56`

**2. [Rule 1 - Bug] Fixed Angular template interpolation in class attribute**
- **Found during:** Task 2 template review
- **Issue:** Used `class="... {{ item.colorClass }}"` which Angular does not evaluate for class attribute string interpolation
- **Fix:** Changed to `[class]="'...' + item.colorClass"` for proper Angular binding
- **Files modified:** `src/app/features/meal-plan/meal-plan.component.html`
- **Commit:** Included in `1e16b56`

## Next Phase Readiness

- MealPlanComponent is ready as the full calendar shell for Plan 03 (generation algorithm)
- "Plan generieren" button placeholder is visible and positioned — Plan 03 only needs to wire up the click handler and implement the generation logic
- DishPickerComponent is reusable for any future context that needs dish selection
- No blockers

---
*Phase: 03-meal-planning*
*Completed: 2026-02-17*

## Self-Check: PASSED

- FOUND: src/app/features/meal-plan/components/dish-picker/dish-picker.component.ts
- FOUND: src/app/features/meal-plan/components/dish-picker/dish-picker.component.html
- FOUND: src/app/features/meal-plan/meal-plan.component.ts
- FOUND: src/app/features/meal-plan/meal-plan.component.html
- FOUND: .planning/phases/03-meal-planning/03-02-SUMMARY.md
- FOUND commit 320be40 (Task 1)
- FOUND commit 1e16b56 (Task 2)
