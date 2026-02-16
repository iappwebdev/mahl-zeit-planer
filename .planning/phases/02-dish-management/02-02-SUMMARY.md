---
phase: 02-dish-management
plan: 02
subsystem: dishes
tags: [ui, crud, angular-material, reactive-forms, signals, ux]
dependency_graph:
  requires:
    - 02-01-PLAN (DishService, Dish model, DishCategory type)
    - 01-03-PLAN (app shell and navigation)
  provides:
    - Complete dish management UI at /gerichte
    - Angular Material snackbar integration
  affects:
    - Phase 3 plans (will use dish data for meal planning)
tech_stack:
  added:
    - "@angular/material": "^21.1.4"
    - "@angular/cdk": "^21.1.4"
    - "@angular/animations": "^21.1.4"
  patterns:
    - Signal-based reactive state with computed properties
    - Optimistic UI updates with error rollback
    - Angular 17+ control flow (@if, @for, @empty)
    - ReactiveFormsModule with validation
    - MatSnackBar for undo toast notifications
    - takeUntilDestroyed for automatic subscription cleanup
key_files:
  created:
    - src/app/features/dishes/dishes.component.ts
    - src/app/features/dishes/dishes.component.html
  modified:
    - package.json
    - package-lock.json
    - src/app/app.config.ts
decisions:
  - Angular Material installed for MatSnackBar undo toast functionality
  - provideAnimationsAsync() added to app config for Material animations
  - Single-component approach (not broken into sub-components) for simplicity
  - Angular 17+ control flow (@if/@for) used to avoid CommonModule imports
  - Inline SVGs (Heroicons) for icons to avoid external icon library
  - Optimistic updates for favorite toggle and delete (better UX)
  - 5-second undo window for delete operations
  - hasNoDishes computed signal added to avoid exposing private allDishes in template
metrics:
  duration: 195s
  tasks_completed: 2
  files_created: 2
  files_modified: 3
  commits: 2
  completed_at: 2026-02-16T16:24:03Z
---

# Phase 02 Plan 02: Dish Management UI Summary

**One-liner:** Built complete dish management page with inline CRUD form, category tabs, text search, favorite toggle, delete with Rückgängig undo, and German empty states using Angular Material and Signal-based reactive state.

## Execution Overview

**Status:** Complete
**Autonomous:** Yes (no checkpoints)
**Started:** 2026-02-16T16:20:48Z
**Completed:** 2026-02-16T16:24:03Z
**Duration:** 3.25 minutes

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install Angular Material and configure snackbar | 4e32405 | package.json, app.config.ts |
| 2 | Implement complete dishes page with CRUD, filtering, favorites, and undo delete | a83a2dd | dishes.component.ts (209 lines), dishes.component.html (228 lines) |

## What Was Built

### Angular Material Integration (Task 1)

**Packages Installed:**
- `@angular/material` ^21.1.4 - Material Design components (MatSnackBar)
- `@angular/cdk` ^21.1.4 - Component Dev Kit (required by Material)
- `@angular/animations` ^21.1.4 - Animation support for Material

**Configuration:**
- Added `provideAnimationsAsync()` to `app.config.ts` providers array
- Enabled MatSnackBar animations for toast notifications

### Dish Management Component (Task 2)

**Component Class** (209 lines):

**State Management (Signals):**
- `allDishes` - Master dish list from database (private)
- `activeTab` - Current filter tab (alle/Fisch/Fleisch/Vegetarisch/favoriten)
- `searchTerm` - Text search input value
- `isLoading` - Loading indicator state
- `error` - Error message display
- `editingDish` - Dish being edited (null = add mode)

**Computed Signals:**
- `filteredDishes` - Applies tab filter, search filter, and sorts (favorites first, then alphabetical A-Z with German locale)
- `dishCount` - Count of filtered dishes for display
- `hasNoDishes` - Checks if master list is empty (for empty state logic)

**CRUD Operations:**
- `loadDishes()` - Fetches all dishes from DishService on init
- `saveDish()` - Creates new dish or updates existing (based on editingDish state)
- `startEdit(dish)` - Sets editing mode and pre-fills form
- `cancelEdit()` - Resets form and exits editing mode
- `deleteDish(dish)` - Optimistic delete with 5-second undo window via MatSnackBar
- `toggleFavorite(dish)` - Optimistic favorite toggle with error rollback

**Other Methods:**
- `setTab(tabId)` - Changes active category tab
- `updateSearch(event)` - Updates search term from input

**Form Validation:**
- Name: required, minLength(2)
- Category: required (Fisch/Fleisch/Vegetarisch)
- Displays validation errors in German when fields are touched and invalid

**Template** (228 lines):

**Structure (Top to Bottom):**

1. **Page Header** - "Meine Gerichte" with dish count badge
2. **Inline Form** - Always visible at top:
   - Text input for dish name (placeholder: "Neues Gericht...")
   - Select dropdown for category (Fisch/Fleisch/Vegetarisch)
   - Submit button (text changes: "Hinzufügen" vs "Speichern")
   - Cancel button (only visible when editing)
   - Validation error messages in German (red, below fields)
3. **Tab Bar** - 5 tabs with accessibility roles:
   - Alle | Fisch | Fleisch | Vegetarisch | Favoriten
   - Active tab: green bottom border and text
   - Horizontal scroll on mobile if needed
4. **Search Field** - Text input with magnifying glass icon
5. **Loading State** - "Laden..." message during data fetch
6. **Error State** - Red error banner when errors occur
7. **Empty State** - Conditional messaging:
   - If truly empty (no dishes in DB): "Noch keine Gerichte — Füge dein erstes Gericht oben hinzu!"
   - If filtered empty (dishes exist but filter yields none): "Keine Gerichte gefunden"
8. **Dish List** - For each dish:
   - Row with dish name (flex-grow)
   - Category badge (colored pill):
     - Fisch: blue (`bg-blue-100 text-blue-800`)
     - Fleisch: red (`bg-red-100 text-red-800`)
     - Vegetarisch: green (`bg-green-100 text-green-800`)
   - Favorite toggle (heart icon):
     - Filled red when favorite
     - Outline gray when not (hover red)
   - Edit button (pencil icon)
   - Delete button (trash icon, hover red background)
   - All buttons 44px minimum touch target size

**Responsive Design:**
- Form: flex-col on mobile, flex-row on desktop (md:flex-row)
- Tab bar: horizontal scroll on small screens (overflow-x-auto)
- Page container: p-4 padding, max-w-4xl mx-auto for centered content
- Touch-friendly button sizes (min 44px)

**UX Features:**
- Optimistic updates for favorite toggle and delete (immediate visual feedback)
- Delete undo via MatSnackBar (5-second window with "Rückgängig" action)
- Error rollback on failed optimistic updates
- German text throughout
- Accessible tab navigation (role="tablist", role="tab", aria-selected)
- Accessible buttons (aria-label on icon buttons)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Template accessing private signal**
- **Found during:** Task 2 - Build verification
- **Issue:** Template tried to access `allDishes()` which was declared as private signal
- **Fix:** Added `hasNoDishes = computed(() => this.allDishes().length === 0)` public computed signal for template use
- **Files modified:** dishes.component.ts (added computed), dishes.component.html (changed `allDishes()` to `hasNoDishes()`)
- **Commit:** Included in a83a2dd
- **Reason:** TypeScript compilation error - private members cannot be accessed in templates

## Verification Results

**Task 1 Verification:**
- [x] `@angular/material` in package.json dependencies
- [x] `@angular/cdk` in package.json dependencies
- [x] `@angular/animations` in package.json dependencies
- [x] `provideAnimationsAsync` in app.config.ts providers
- [x] Build compiles without errors

**Task 2 Verification:**
- [x] dishes.component.ts exists (209 lines, exceeds 100 minimum)
- [x] dishes.component.html exists (228 lines, exceeds 80 minimum)
- [x] Component imports DishService (line 5)
- [x] Component imports MatSnackBar (line 4)
- [x] Component imports ReactiveFormsModule (line 3)
- [x] All required signals present: allDishes, activeTab, searchTerm, isLoading, error, editingDish
- [x] Computed signal filteredDishes with sorting logic
- [x] Template contains all 5 tabs (Alle, Fisch, Fleisch, Vegetarisch, Favoriten)
- [x] Template contains inline form with name input and category select
- [x] Template contains search input with placeholder "Gerichte suchen..."
- [x] Template contains German empty state messages
- [x] Template contains heart SVG for favorites (filled and outline variants)
- [x] Template contains delete button on every dish row
- [x] Component uses takeUntilDestroyed for snackbar subscriptions (lines 173, 181)
- [x] Build compiles without errors (verified after fix)

## Must-Haves Verification

**Phase 2 Requirements (All 5 Addressed):**

**Truths:**
- [x] User can create a dish with name and category via inline form
- [x] User can edit existing dish name or category via inline form pre-filled with current values
- [x] User can delete dishes with immediate removal and Rückgängig undo toast
- [x] User can filter dish list by category tabs (Alle, Fisch, Fleisch, Vegetarisch, Favoriten)
- [x] User can search dishes by name within active tab
- [x] User can mark dishes as favorites with heart icon toggle
- [x] Dish list sorts favorites first, then alphabetical (localeCompare with 'de')
- [x] Category badges show colored pills (blue=Fisch, red=Fleisch, green=Vegetarisch)
- [x] Empty state shows friendly German message when no dishes exist
- [x] Total dish count visible in header

**Artifacts:**
- [x] src/app/features/dishes/dishes.component.ts (209 lines) - Complete logic with signals
- [x] src/app/features/dishes/dishes.component.html (228 lines) - Full template
- [x] package.json contains @angular/material

**Key Links:**
- [x] dishes.component.ts → dish.service.ts via `inject(DishService)` (line 19)
- [x] dishes.component.ts → @angular/material/snack-bar via `inject(MatSnackBar)` (line 21)
- [x] dishes.component.ts → dish.model.ts via `import { Dish, DishCategory, CreateDishPayload }` (line 6)

## Self-Check

Verifying created files and commits.

**Files:**
- src/app/features/dishes/dishes.component.ts: FOUND (209 lines)
- src/app/features/dishes/dishes.component.html: FOUND (228 lines)
- package.json: MODIFIED (contains Angular Material)
- src/app/app.config.ts: MODIFIED (contains provideAnimationsAsync)

**Commits:**
- 4e32405 (Task 1 - Angular Material): FOUND
- a83a2dd (Task 2 - Dish UI): FOUND

## Self-Check: PASSED

All files created/modified and commits exist as documented.

## Impact & Next Steps

**Provides for Phase 2:**
- Complete dish management UI at `/gerichte` with all 5 Phase 2 requirements
- User can now add, edit, delete, filter, search, and favorite dishes
- Angular Material integrated for future UI enhancements

**Phase 2 Status:**
- **Plan 01 (Data Layer):** COMPLETE
- **Plan 02 (UI Layer):** COMPLETE
- **Phase 2:** READY FOR VERIFICATION

**Next Steps:**
1. User must run Supabase migration (002_dishes.sql) in SQL Editor before testing
2. Verify all 5 must-haves work end-to-end with real data
3. Move to Phase 3 (Meal Planning)

**Technical Debt:**
None introduced.

**Outstanding Issues:**
None. All functionality implemented as specified.

## User Setup Required

Before testing, user must run database migration:

**Action:** Run `supabase/migrations/002_dishes.sql` in Supabase Dashboard SQL Editor
**Why:** Creates dishes table with RLS policies (from Plan 01)
**Location:** Supabase Dashboard → SQL Editor → paste contents of 002_dishes.sql → Run
**Verification:** After running, test creating a dish in the UI at http://localhost:4200/gerichte
