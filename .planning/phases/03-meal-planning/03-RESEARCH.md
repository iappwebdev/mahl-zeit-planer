# Phase 3: Meal Planning - Research

**Domain:** Weekly meal planning with automated generation
**Researched:** 2026-02-16
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

Meal planning apps in 2026 emphasize automation-first design, reducing daily decision fatigue through smart weekly plan generation. The research reveals three critical success factors: (1) friction-free interfaces that prioritize automation over manual logging, (2) constraint-based generation algorithms that balance nutritional variety with user preferences, and (3) simple data models that support both manual assignment and automated planning workflows.

The technical landscape favors lightweight implementations over complex AI/LLM solutions. Academic research consistently demonstrates that constraint satisfaction algorithms (depth-first branch and bound, weighted CSP) effectively handle category balancing, favorite preferences, and repeat avoidance within 100ms on consumer hardware. For Angular applications, reactive forms with FormArray handle dynamic category configuration, while Angular Material's bottom sheet component provides mobile-optimized dish selection.

The dominant anti-pattern in 2026 is excessive friction: apps requiring constant manual input, complex nutrition tracking, or overly detailed configuration suffer poor retention. Successful patterns include smart defaults (auto-fill remaining days after category constraints), optimistic updates with undo capability, and progressive disclosure (simple weekly view first, advanced configuration available but not required).

Database schema requires three core entities: `weekly_plans` (week identifier, user ownership), `meal_assignments` (day-dish linkage), and `category_preferences` (user's balance configuration). The existing `dishes` table provides the source data pool. Historical tracking for repeat avoidance can be achieved through simple date-range queries on `meal_assignments` without complex event sourcing.

## Key Findings

**Stack:** Angular reactive forms + Supabase relational queries + constraint satisfaction algorithm in TypeScript for generation logic
**Architecture:** Three-layer approach: (1) PlanService handles CRUD + generation algorithm, (2) reactive signals manage UI state with optimistic updates, (3) bottom sheet modal for dish selection
**Critical pitfall:** Over-engineering generation logic — simple greedy algorithms with randomization handle small dish libraries (10-50 dishes) better than complex constraint solvers; complexity should scale with library size

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Data Layer & Schema** - Database tables, RLS policies, models, service foundation
   - Addresses: PLAN-01 (storage), PLAN-02 (generation needs data access)
   - Avoids: Building UI without proper data foundation (Phase 2 pattern works well)
   - Establishes: `weekly_plans`, `meal_assignments`, `category_preferences` tables with RLS

2. **Weekly Calendar UI** - View component, manual assignment, dish picker
   - Addresses: PLAN-01 (calendar view), PLAN-06 (individual swap)
   - Avoids: Premature optimization of generation before testing manual workflow
   - Validates: User interaction patterns before automating them

3. **Generation Algorithm & Configuration** - Auto-generation logic, category balance UI, regeneration
   - Addresses: PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-07
   - Avoids: Building complex algorithms without understanding actual library sizes
   - Implements: Constraint satisfaction with progressive complexity (start simple, add sophistication if needed)

**Phase ordering rationale:**
- Data first ensures UI has real persistence (learned from Phase 2)
- Manual assignment before automation validates user mental model
- Generation last allows algorithm tuning based on real dish library patterns

**Research flags for phases:**
- Phase 1 (Data): Standard patterns, unlikely to need additional research
- Phase 2 (UI): May need deeper UX research if calendar interactions feel complex during implementation
- Phase 3 (Generation): Likely needs performance testing research if algorithm is slow with real data (>500ms generation time)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Angular reactive forms + Supabase well-established from Phase 2 |
| Features | MEDIUM-HIGH | Industry patterns clear, some uncertainty on small-library fallback UX |
| Architecture | HIGH | Three-layer separation proven in dish management, applies cleanly here |
| Pitfalls | MEDIUM | Over-engineering well-documented, but algorithm simplicity threshold unclear without testing |

## Gaps to Address

- **Algorithm performance threshold**: Research found "works in <100ms" but didn't specify library size at which simple greedy fails and CSP solver becomes necessary
- **Week boundary handling**: ISO week vs. calendar week (Mon-Sun) vs. user-configurable start day — research assumes Mon-Sun but didn't verify German user expectations
- **Category configuration persistence**: Unclear if user changes balance weekly or sets once and forgets — impacts whether config lives in preferences table or per-plan
- **Empty week states**: Research focused on generation, not initial "no plan exists yet" state UX patterns

---

# Technology Stack

**Project:** MahlZeitPlaner - Phase 3: Meal Planning
**Researched:** 2026-02-16

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular 21 | 21.x | UI framework | Already established in Phases 1-2, standalone components + signals |
| TypeScript | 5.x | Type safety | Required by Angular, ensures algorithm correctness |
| Angular Signals | Built-in | State management | Proven in Phase 2 for reactive UI updates |
| Reactive Forms | Built-in | Category config UI | FormArray handles dynamic category count inputs |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase/PostgreSQL | Current | Data persistence | Already integrated, supports complex queries for repeat detection |
| Row Level Security | Built-in | Multi-user isolation | Ensures plan privacy before Phase 4 collaboration |

### UI Components
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Material | Latest | Bottom sheet, snackbar | Already installed in Phase 2, provides mobile-optimized modals |
| Tailwind CSS v4 | 4.x | Styling | Established in Phase 1, category badge colors must match Phase 2 |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.x or later | ISO week calculations | If manual date math proves error-prone, use `startOfISOWeek`, `getISOWeek` |
| None (native Date) | Built-in | Week boundaries | Prefer if simple Mon-Sun calculation suffices (no library overhead) |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Date handling | Native Date API | date-fns, Day.js | Adds 20-50KB bundle size; ISO week calculation is ~20 lines of code |
| Calendar UI | Custom component | angular-calendar, FullCalendar | Over-engineered for simple Mon-Sun grid; these target complex event scheduling |
| Generation algorithm | Custom TypeScript | AI/LLM API calls | Phase requirement explicitly excludes AI; cost and latency inappropriate |
| Dish picker | Angular Material bottom sheet | Custom modal | Bottom sheet is mobile-optimized, already installed |

## Installation

```bash
# No new dependencies required if using native Date API
# Phase 2 already installed Angular Material

# Optional: If ISO week complexity warrants a library
npm install date-fns
```

## Sources

- [Angular Material Bottom Sheet](https://material.angular.dev/components/bottom-sheet/overview) - HIGH confidence (official docs)
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms) - HIGH confidence (official docs)
- [Building Dynamic Forms in Angular](https://angular.dev/guide/forms/dynamic-forms) - HIGH confidence (official docs)

---

# Feature Landscape

**Domain:** Weekly meal planning applications
**Researched:** 2026-02-16

## Table Stakes

Features users expect in meal planning apps. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Weekly calendar view (Mon-Sun) | Universal standard for meal planning | Low | 7-column grid or vertical list with day labels |
| Manual meal assignment | Users need control over specific days | Medium | Requires dish picker UI + assignment persistence |
| One-click plan generation | Automation is core value prop in 2026 | High | Constraint satisfaction algorithm required |
| Category balance configuration | Generic "balanced" fails diverse diets | Medium | Each user defines what "balanced" means for them |
| Favorite preference in generation | Avoids suggesting disliked dishes | Low | Simple weight/filter in algorithm |
| Visual category indicators | Quick scan of week's variety | Low | Colored badges matching dish management |
| Week navigation | View past/future weeks | Low | Previous/Next buttons with date range display |

## Differentiators

Features that set products apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Repeat avoidance (2+ weeks) | Prevents meal fatigue | Medium | Requires historical queries, sweet spot is 2-3 week lookback |
| Small library warnings | Sets expectations when variety is impossible | Low | Count available dishes vs. configured requirements |
| Undo/redo plan generation | Allows comparison of generated options | Medium | Requires plan versioning or snapshot state |
| Category distribution summary | Visual feedback on balance achievement | Low | Simple count display: "2x Fleisch, 3x Vegetarisch..." |
| Regenerate preserving favorites | "Lock" certain days, regenerate others | High | Partial regeneration complicates constraint solver |
| Empty day indicators | Clear visual for incomplete weeks | Low | Different styling for unassigned days |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Drag-and-drop rearrangement | PLAN-08 explicitly deferred to v2; adds complexity without matching phase scope | Tap-to-swap with dish picker (simpler, mobile-friendly) |
| Template saving | PLAN-09 deferred to v2; premature before validating generation quality | Focus on generation algorithm quality so templates become less necessary |
| Meal history view | PLAN-10 deferred to v2; past-week browsing is read-only complexity | Week navigation provides basic past viewing, detailed history later |
| Multi-meal-per-day | MEAL-01, MEAL-02 deferred; v1 is dinner-only | Single meal assignment per day, clearly labeled "Abendessen" |
| Nutrition tracking | Out of scope per requirements; shifts focus to diet app | Trust user's category balance configuration to handle nutrition |
| Recipe/ingredient details | v2 feature (DISH-06, DISH-07); generation needs only dish+category | Keep meal assignments simple: just dish reference |

## Feature Dependencies

```
Weekly calendar view (PLAN-01)
  └─> Manual assignment (PLAN-06) — requires picker UI
  └─> Generation display — shows generated results
      └─> Category balance config (PLAN-03) — generation input
      └─> Favorite preference (PLAN-04) — generation weighting
      └─> Repeat avoidance (PLAN-05) — requires historical data access
      └─> Regenerate (PLAN-07) — rerun algorithm with same config
```

## MVP Recommendation

Prioritize (in order):
1. **Weekly calendar view** (PLAN-01) — Foundation for all other features
2. **Manual assignment** (PLAN-06) — Validates data model and UX before automation
3. **Basic generation without config** (PLAN-02) — Proves algorithm works with hardcoded balance
4. **Category balance configuration** (PLAN-03) — Unlocks customization value
5. **Favorite preference** (PLAN-04) — Low effort, high perceived value
6. **Repeat avoidance** (PLAN-05) — Quality improvement after basic generation works
7. **Regenerate** (PLAN-07) — Last because it's just re-running existing algorithm

Defer:
- **Category distribution summary**: Nice-to-have visual feedback, not blocking for core workflow
- **Small library warnings**: Edge case handling, can add after MVP validation
- **Empty day polish**: Basic "Kein Gericht" text (from phase context) sufficient initially

## Sources

- [Meal Planning Apps That You Will Actually Use (2026)](https://planeatai.com/blog/meal-planning-apps-that-you-will-actually-use-2026) - MEDIUM confidence (WebSearch verified)
- [The Best Meal Planner in 2026](https://www.valtorian.com/blog/the-best-meal-planner-in-2026) - MEDIUM confidence (industry blog)
- [10 Common Mistakes in Weekly Meal Planning](https://www.menumagic.ai/blog/10-common-mistakes-in-weekly-meal-planning) - MEDIUM confidence (practical patterns)

---

# Architecture Patterns

**Domain:** Weekly meal planning with automated generation
**Researched:** 2026-02-16

## Recommended Architecture

### Three-Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer (meal-planning.component.ts)        │
│ - Angular signals for reactive UI state                │
│ - Optimistic updates for manual assignments             │
│ - Week navigation (current, ±1 week)                    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Service Layer (meal-plan.service.ts)                   │
│ - CRUD for weekly_plans + meal_assignments             │
│ - Generation algorithm (constraint satisfaction)        │
│ - Historical query for repeat avoidance                 │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Data Layer (Supabase + PostgreSQL)                     │
│ - weekly_plans: week ownership and metadata            │
│ - meal_assignments: day-dish linkage                   │
│ - category_preferences: user's balance config          │
│ - dishes: source pool (from Phase 2)                   │
└─────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `MealPlanningComponent` | Weekly calendar UI, week navigation, trigger generation | `MealPlanService`, `DishPickerComponent` |
| `DishPickerComponent` | Modal/bottom sheet for selecting dish, category filtering | `DishService` (read-only from Phase 2) |
| `CategoryConfigComponent` | Edit category balance preferences (e.g., 2x Fleisch, 3x Vegetarisch) | `MealPlanService` (save preferences) |
| `MealPlanService` | Plan CRUD, generation algorithm, validation | Supabase client, `DishService` (read dishes) |
| `DishService` | Read dish library (existing from Phase 2) | Supabase client |

### Data Flow

```
User Action: "Generate Plan" button clicked
  └─> MealPlanningComponent.generatePlan()
      └─> MealPlanService.generateWeeklyPlan(weekStart)
          ├─> Load category_preferences for user
          ├─> Load dishes for user (via DishService)
          ├─> Load meal_assignments for previous 2 weeks (repeat avoidance)
          ├─> Run generation algorithm
          │   ├─> Filter dishes by category requirements
          │   ├─> Weight favorites higher
          │   ├─> Exclude recent repeats
          │   └─> Assign dishes to 7 days
          └─> Save to weekly_plans + meal_assignments (upsert)
      └─> Update UI signals with new plan (optimistic)

User Action: "Swap dish on Wednesday"
  └─> MealPlanningComponent.openDishPicker(day)
      └─> DishPickerComponent opens (bottom sheet)
          └─> User selects dish
              └─> MealPlanService.assignDish(weekStart, day, dishId)
                  └─> Upsert meal_assignments record
              └─> Update UI signal (optimistic)
```

## Patterns to Follow

### Pattern 1: Constraint Satisfaction via Greedy Algorithm with Randomization
**What:** Simple first-pass algorithm for small-to-medium dish libraries (10-100 dishes)
**When:** MVP and likely sufficient for v1 given typical family dish libraries
**Example:**
```typescript
interface GenerationConfig {
  categoryBalance: Record<DishCategory, number>; // e.g., { Fleisch: 2, Fisch: 1, Vegetarisch: 4 }
  recentDishIds: Set<string>; // Dishes used in last 2 weeks
}

function generateWeeklyPlan(
  dishes: Dish[],
  config: GenerationConfig
): Map<DayOfWeek, Dish> {
  const assignments = new Map<DayOfWeek, Dish>();
  const availableDishes = dishes.filter(d => !config.recentDishIds.has(d.id));

  // Phase 1: Fill category requirements
  for (const [category, count] of Object.entries(config.categoryBalance)) {
    const categoryDishes = availableDishes.filter(d => d.category === category);
    const favorites = categoryDishes.filter(d => d.is_favorite);

    // Prefer favorites, fallback to all category dishes
    const pool = favorites.length >= count ? favorites : categoryDishes;
    const selected = randomSample(pool, count); // Fisher-Yates shuffle + take N

    for (const dish of selected) {
      const day = getNextUnassignedDay(assignments);
      assignments.set(day, dish);
    }
  }

  // Phase 2: Fill remaining days with any available dishes
  while (assignments.size < 7) {
    const day = getNextUnassignedDay(assignments);
    const remaining = availableDishes.filter(d =>
      !Array.from(assignments.values()).includes(d)
    );
    const dish = randomChoice(remaining.length ? remaining : availableDishes);
    assignments.set(day, dish);
  }

  return assignments;
}
```

### Pattern 2: Optimistic Updates with Rollback
**What:** Update UI immediately, save to backend, revert on error (from Phase 2 pattern)
**When:** All manual assignments and generation
**Example:**
```typescript
async swapDish(day: DayOfWeek, newDish: Dish): Promise<void> {
  const currentPlan = this.weeklyPlan();
  const previousDish = currentPlan.get(day);

  // Optimistic update
  this.weeklyPlan.update(plan => new Map(plan).set(day, newDish));

  try {
    await this.mealPlanService.assignDish(this.currentWeekStart(), day, newDish.id);
  } catch (error) {
    // Rollback on error
    this.weeklyPlan.update(plan => new Map(plan).set(day, previousDish));
    this.snackBar.open('Fehler beim Speichern', 'OK', { duration: 3000 });
  }
}
```

### Pattern 3: ISO Week Boundary Calculation
**What:** Consistent week start (Monday) and week identification for navigation
**When:** All week navigation and plan loading
**Example:**
```typescript
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getWeekIdentifier(date: Date): string {
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().split('T')[0]; // "2026-02-16" format
}

// Usage: Store week_identifier as TEXT in weekly_plans table
```

### Pattern 4: Partial Regeneration (Advanced - Phase 3.3 or v2)
**What:** Allow user to "lock" certain days and regenerate only the rest
**When:** Only if user feedback indicates frustration with full regeneration losing good choices
**Note:** Adds complexity to constraint solver; defer unless proven necessary
```typescript
// Deferred pattern - document for future reference
function regeneratePartial(
  lockedDays: Set<DayOfWeek>,
  existingPlan: Map<DayOfWeek, Dish>,
  config: GenerationConfig
): Map<DayOfWeek, Dish> {
  const newPlan = new Map(existingPlan);

  // Adjust category requirements to account for locked days
  const lockedCategories = Array.from(lockedDays)
    .map(day => existingPlan.get(day)?.category)
    .filter(Boolean);

  const adjustedBalance = adjustBalanceForLocked(config.categoryBalance, lockedCategories);

  // Generate for remaining days only
  // ... (similar to full generation but skip locked days)

  return newPlan;
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Complex CSP Solver for Small Libraries
**What:** Implementing weighted constraint satisfaction with backtracking for <50 dishes
**Why bad:** Over-engineering; greedy randomized algorithm handles small libraries in <10ms
**Instead:** Start with simple greedy approach, measure performance, add complexity only if slow (>500ms)

### Anti-Pattern 2: Storing Plans as Denormalized JSON
**What:** Saving entire week as `{ monday: dish_id, tuesday: dish_id, ... }` JSON in single row
**Why bad:** Cannot query individual assignments, poor support for partial updates, breaks foreign keys
**Instead:** Relational `meal_assignments` table with composite key (week_id, day_of_week, dish_id)

### Anti-Pattern 3: Client-Side Only Generation
**What:** Running generation algorithm purely in browser, never persisting generated plan
**Why bad:** Lost on navigation/refresh, can't show "last generated" timestamp, no history
**Instead:** Generate client-side for speed, immediately persist to Supabase, treat as source of truth

### Anti-Pattern 4: Navigation Without Week Boundaries
**What:** Allowing arbitrary date ranges (e.g., "show me Feb 15-21" even though it spans two ISO weeks)
**Why bad:** Confuses generation ("what week am I generating for?"), hard to detect duplicates
**Instead:** Enforce Mon-Sun boundaries; navigation always jumps full weeks

## Scalability Considerations

| Concern | At 10-50 dishes | At 100-200 dishes | At 500+ dishes |
|---------|----------------|------------------|----------------|
| Generation speed | Greedy algorithm <10ms | Greedy still viable <50ms | May need CSP solver or indexing optimization |
| Repeat avoidance | Simple Set lookup | Consider indexing meal_assignments.dish_id | Require index + date range optimization |
| Dish picker UX | Flat list acceptable | Add search/filter required | Virtual scrolling or pagination needed |
| Category balance | Any configuration works | Validate config sums ≤ available dishes | Suggest distributions based on library composition |

**Note:** Research indicates most family meal planning apps handle 20-80 dishes. 500+ is unlikely but document thresholds for Phase 4 (multi-family scenarios).

## Sources

- [Design and implementation of a constraint satisfaction algorithm for meal planning](https://www.diva-portal.org/smash/get/diva2:21100/FULLTEXT01.pdf) - HIGH confidence (academic research)
- [An AI-based nutrition recommendation system](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1546107/full) - MEDIUM confidence (recent research)
- [Angular Material Bottom Sheet](https://material.angular.dev/components/bottom-sheet/overview) - HIGH confidence (official docs)
- [JavaScript ISO-8601 week number](https://www.w3resource.com/javascript-exercises/javascript-date-exercise-24.php) - MEDIUM confidence (code examples verified)

---

# Domain Pitfalls

**Domain:** Weekly meal planning applications
**Researched:** 2026-02-16

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Insufficient Dishes for Balance Requirements
**What goes wrong:** User configures "3x Fleisch, 2x Fisch, 2x Vegetarisch" but only has 2 Fisch dishes total; generation fails or produces confusing results
**Why it happens:** No validation between category_preferences and actual dish library composition
**Consequences:** Generation throws errors, or worse, silently fills with duplicates within same week (breaking variety expectation)
**Prevention:**
- Validate category config on save: count available dishes per category, warn if count < requested
- Fallback logic: if insufficient dishes, show warning "Nicht genügend Gerichte für volle Abwechslung" and allow repeats
- UI hint: show available dish counts next to category config inputs (e.g., "Fisch: ⬜⬜ (5 verfügbar)")
**Detection:** Monitor generation failures; if users frequently regenerate, may indicate unsatisfactory results from insufficient variety

### Pitfall 2: Race Conditions in Optimistic Updates
**What goes wrong:** User clicks "Generate" button multiple times quickly; multiple generation requests run simultaneously, last one wins but UI shows intermediate state
**Why it happens:** Async generation + optimistic UI updates without request deduplication
**Consequences:** UI shows plan A, database has plan B; user edits plan A (which doesn't exist), changes lost
**Prevention:**
- Disable generate button while request in flight
- Cancel in-flight requests when new generation triggered (AbortController)
- Use request ID/timestamp to ignore stale responses
**Detection:** User reports "my changes disappeared" or "plan keeps changing back"

### Pitfall 3: Week Boundary Confusion Across Timezones
**What goes wrong:** User in Germany (UTC+1) generates plan for "this week" at 11 PM Sunday; server in UTC thinks it's Monday (next week); plan saved to wrong week
**Why it happens:** Client and server calculate week boundaries using different timezone contexts
**Consequences:** Plans appear in wrong week slots, regeneration overwrites unintended weeks
**Prevention:**
- Use ISO week boundaries (Mon-Sun) with explicit date strings (YYYY-MM-DD), not Date objects in API
- Calculate week_start in client timezone, send as ISO string "2026-02-16" (unambiguous)
- Server treats week_identifier as string key, not parsed date
**Detection:** User reports "I created a plan for next week but it shows in this week"

### Pitfall 4: Unbounded Historical Queries for Repeat Avoidance
**What goes wrong:** Algorithm queries "all previous meal assignments for user" to avoid repeats; as database grows (years of history), query becomes slow (10s+)
**Why it happens:** No date range limit on historical query
**Consequences:** Generation becomes unusably slow after 6-12 months of usage
**Prevention:**
- Hard limit repeat avoidance to last 2-3 weeks (research shows 2 weeks is sweet spot)
- Query: `WHERE week_start >= (current_week - INTERVAL '3 weeks')`
- Index on (user_id, week_start) for fast range scans
**Detection:** User reports "generate button hangs" or performance monitoring shows slow queries on meal_assignments

## Moderate Pitfalls

### Pitfall 5: Regeneration Without Confirmation
**What goes wrong:** User accidentally clicks "Generate" button after manually perfecting their plan; entire week overwritten without undo
**Why it happens:** No confirmation dialog when regenerating over existing plan
**Prevention:**
- Phase context specifies confirmation: "Bestehende Einträge überschreiben?"
- Offer "Rückgängig" snackbar after regeneration (store previous plan briefly)
**Detection:** User frustration with "lost my plan" complaints

### Pitfall 6: Category Badge Color Mismatch
**What goes wrong:** Dish categories use green/red/blue in Phase 2 (dish management), but meal planning shows orange/purple/teal; user confusion
**Why it happens:** Hardcoded colors in component CSS instead of shared design tokens
**Prevention:**
- Phase context requires: "Category badge colors must match existing dish management page for consistency"
- Extract category colors to Tailwind config or CSS variables
- Use semantic names: `--color-category-fisch`, `--color-category-fleisch`, `--color-category-vegetarisch`
**Detection:** User feedback: "Why are colors different on this page?"

### Pitfall 7: Favorite Weighting Too Extreme
**What goes wrong:** Algorithm exclusively picks favorites, non-favorites never appear; or favorites ignored entirely
**Why it happens:** Binary favorite filter instead of probabilistic weighting
**Prevention:**
- Use weighted random selection: favorites 2-3x more likely, not exclusive
- If insufficient favorites for category, include non-favorites
- Allow user to see why dish was chosen (debug mode: "Picked because favorite")
**Detection:** User reports "same dishes every week" or "favorites never show up"

### Pitfall 8: Empty Week Navigation UX
**What goes wrong:** User navigates to next week (empty plan); sees blank calendar; unclear whether to generate or manually assign
**Why it happens:** No visual distinction between "empty but can be filled" vs "viewing mode only"
**Prevention:**
- Phase context specifies: "Current + 1 week ahead" for navigation
- Show prominent "Plan generieren" button on empty future weeks
- Past weeks read-only with clear indicator (grayed out, no edit icons)
**Detection:** User support questions: "How do I add meals to next week?"

## Minor Pitfalls

### Pitfall 9: Week Label Ambiguity
**What goes wrong:** User sees "Montag" but unclear if it's "next Monday" or "last Monday"
**Why it happens:** Day name without calendar date
**Prevention:** Phase context requires: "Day labels include actual calendar dates (e.g., 'Montag, 17. Feb')"
**Detection:** User asks "Which Monday is this?"

### Pitfall 10: Missing Loading States During Generation
**What goes wrong:** User clicks "Generate", nothing happens for 2 seconds, clicks again, double-generates
**Why it happens:** No visual feedback during async operation
**Prevention:**
- Show spinner or loading state immediately
- Disable button during generation
- Optimistic UI: show skeleton/placeholder while loading
**Detection:** Analytics show high rate of duplicate generation requests

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data schema design | Denormalized JSON storage for week data | Use relational meal_assignments table with composite keys |
| Generation algorithm | Over-engineering CSP for small libraries | Start with greedy randomized, measure performance before optimizing |
| Week navigation | Arbitrary date ranges instead of Mon-Sun | Enforce ISO week boundaries in all date calculations |
| Dish picker UI | Flat list becomes unwieldy at 100+ dishes | Add search field, consider category tabs (reuse Phase 2 pattern) |
| Category configuration | Free-form input without validation | Validate against available dishes, show warnings |
| Historical tracking | Unbounded queries for repeat avoidance | Hard limit to 2-3 weeks, index on week_start |

## Sources

- [10 Common Mistakes in Weekly Meal Planning](https://www.menumagic.ai/blog/10-common-mistakes-in-weekly-meal-planning) - MEDIUM confidence (practical patterns)
- [Meal Planning Apps That You Will Actually Use (2026)](https://planeatai.com/blog/meal-planning-apps-that-you-will-actually-use-2026) - MEDIUM confidence (UX friction patterns)
- [Design and implementation of a constraint satisfaction algorithm for meal planning](https://www.diva-portal.org/smash/get/diva2:21100/FULLTEXT01.pdf) - HIGH confidence (algorithm complexity warnings)
- Phase 2 implementation analysis (codebase patterns) - HIGH confidence (proven patterns to reuse)
