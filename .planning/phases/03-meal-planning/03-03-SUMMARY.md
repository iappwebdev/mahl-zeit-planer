---
phase: 03-meal-planning
plan: 03
subsystem: generation-algorithm
tags: [angular, typescript, algorithm, signals, tailwind]

# Dependency graph
requires:
  - phase: 03-01
    provides: "MealPlanService: getCategoryPreferences, getRecentDishIds, getOrCreateWeeklyPlan, clearWeekAssignments, assignDish"
  - phase: 03-02
    provides: "MealPlanComponent shell with placeholder generate button; DishPickerComponent for manual assignment"
  - phase: 02-01
    provides: "DishService.getAll() used for dish pool loading"
provides:
  - "MealPlanGeneratorService: greedy randomized 3-phase generation algorithm with favorite weighting and repeat avoidance"
  - "CategoryConfigComponent: inline collapsible UI to configure category balance"
  - "MealPlanComponent: fully activated generate/regenerate button with loading state, warnings, and category config toggle"
affects: [04-export-share]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fisher-Yates shuffle with favorite-weighted pool (3x duplicates) for probabilistic dish selection"
    - "3-phase generation: category slots first, then leftover slots, then fallback with repeats"
    - "window.confirm() for regeneration confirmation (per CONTEXT.md decision)"
    - "Promise.all() to parallelize dish loading, preferences, and recent dish IDs"
    - "animate-pulse skeleton on empty day cards during generation"

key-files:
  created:
    - src/app/features/meal-plan/services/meal-plan-generator.service.ts
    - src/app/features/meal-plan/components/category-config/category-config.component.ts
    - src/app/features/meal-plan/components/category-config/category-config.component.html
  modified:
    - src/app/features/meal-plan/meal-plan.component.ts
    - src/app/features/meal-plan/meal-plan.component.html

key-decisions:
  - "Promise.all() for parallel loading of dishes, preferences, and recent IDs — reduces algorithm startup latency"
  - "3x favorite weighting via pool duplication (not a separate priority queue) — simple, correct, and O(n) overhead"
  - "Phase 1/2/3 separation: category slots filled first to guarantee balance, then any-category leftovers, then repeats as last resort"
  - "CategoryConfigComponent path uses ../../../dishes/ (3 levels up from components/category-config/) — not 4 levels"

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 3 Plan 03: Generation Algorithm Summary

**Greedy randomized algorithm (3-phase) with Fisher-Yates favorite-weighted selection, 2-week repeat avoidance, and inline CategoryConfigComponent for per-category day count tuning**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-17T06:02:32Z
- **Completed:** 2026-02-17T06:06:44Z
- **Tasks:** 2
- **Files created/modified:** 5

## Accomplishments

- MealPlanGeneratorService: `generateWeeklyPlan(weekStart)` returns `GenerationResult { assignments: Map<DayOfWeek, Dish>, warnings: string[] }`
- Phase 1: fills category-specific slots from filtered dish pool using favorite-weighted Fisher-Yates shuffle (favorites appear 3x in pool)
- Phase 2: fills remaining unassigned days from any category
- Phase 3: fallback to full library (allows repeats) when pool exhausted — triggers "Nicht genugend Gerichte fur volle Abwechslung" warning
- Repeat avoidance: calls `getRecentDishIds(weekStart, 2)` to exclude dishes used in the previous 2 weeks
- Small library fallback: if filtered pool < 7 dishes, reverts to full library and sets warning
- CategoryConfigComponent: number inputs per category (Fleisch/Vegetarisch/Fisch), shows available dish counts, auto-saves on change, warns if count > available, shows "Summe ubersteigt 7 Tage" if total > 7
- MealPlanComponent: `generatePlan()` with confirmation dialog when overwriting, `isGenerating` loading state disabling interaction, `generationWarnings` amber banners (dismissible), `showCategoryConfig` toggle via gear icon
- Button text toggles: "Plan generieren" (empty) / "Neu generieren" (has assignments) / "Generiere..." (loading with spinner)
- Day cards show `opacity-60` and pulse skeleton on empty cards during generation
- Angular build: zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement generation algorithm service and category config component** - `996346e` (feat)
2. **Task 2: Integrate generation and config into the weekly calendar component** - `7619c15` (feat)

## Files Created/Modified

- `src/app/features/meal-plan/services/meal-plan-generator.service.ts` - Core generation service: 3-phase algorithm, weighted sampling, Fisher-Yates shuffle
- `src/app/features/meal-plan/components/category-config/category-config.component.ts` - Standalone component with FormsModule, loads preferences + dish counts on init, auto-saves
- `src/app/features/meal-plan/components/category-config/category-config.component.html` - Compact row layout per category with badge, number input, available count hint, and summary line
- `src/app/features/meal-plan/meal-plan.component.ts` - Added MealPlanGeneratorService, isGenerating/generationWarnings/showCategoryConfig signals, generatePlan/toggleCategoryConfig/dismissWarnings methods
- `src/app/features/meal-plan/meal-plan.component.html` - Replaced placeholder button with active generate UI, gear toggle, collapsible category config, warning banners, loading states

## Decisions Made

- Used `Promise.all()` to parallelize loading of all dishes, category preferences, and recent dish IDs — avoids three sequential round-trips to Supabase
- Favorite weighting implemented via pool duplication (each favorite added 3x) rather than a priority queue — simpler code, correct probability distribution after Fisher-Yates shuffle
- 3-phase algorithm keeps category-balance guarantee: Phase 1 always fills category-specific slots before the general pool, so configured balance is respected as long as dishes are available
- CategoryConfigComponent import path is `../../../dishes/` (3 up from `components/category-config/`) — caught wrong `../../../../dishes/` on first build attempt and fixed before committing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected import paths in CategoryConfigComponent**
- **Found during:** Task 1 first build
- **Issue:** Initially used `../../../../dishes/services/dish.service` (4 levels up) which resolves to `src/app/` instead of `src/app/features/` — TypeScript reported TS2307 cannot find module
- **Fix:** Changed to `../../../dishes/services/dish.service` and `../../../dishes/models/dish.model` (3 levels up, correct path from `features/meal-plan/components/category-config/`)
- **Files modified:** `src/app/features/meal-plan/components/category-config/category-config.component.ts`
- **Commit:** Fixed before Task 1 commit `996346e`

## Next Phase Readiness

- Phase 3 complete: data foundation (03-01), calendar UI (03-02), and generation algorithm (03-03) all delivered
- Phase 4 (export/share) can build on the fully functional MealPlanComponent
- No blockers — generation algorithm is wired end-to-end

---
*Phase: 03-meal-planning*
*Completed: 2026-02-17*

## Self-Check: PASSED

- FOUND: src/app/features/meal-plan/services/meal-plan-generator.service.ts
- FOUND: src/app/features/meal-plan/components/category-config/category-config.component.ts
- FOUND: src/app/features/meal-plan/components/category-config/category-config.component.html
- FOUND: src/app/features/meal-plan/meal-plan.component.ts
- FOUND: src/app/features/meal-plan/meal-plan.component.html
- FOUND: .planning/phases/03-meal-planning/03-03-SUMMARY.md
- FOUND commit 996346e (Task 1)
- FOUND commit 7619c15 (Task 2)
