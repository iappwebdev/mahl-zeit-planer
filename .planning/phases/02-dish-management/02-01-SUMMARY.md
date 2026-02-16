---
phase: 02-dish-management
plan: 01
subsystem: dishes
tags: [database, service-layer, crud, rls]
dependency_graph:
  requires:
    - 01-01-PLAN (SupabaseService, RLS pattern, update_updated_at function)
  provides:
    - dishes table with RLS policies
    - Dish model with DishCategory type
    - DishService with full CRUD operations
  affects:
    - 02-02-PLAN (will use DishService for UI)
tech_stack:
  added:
    - PostgreSQL CHECK constraint for category validation
  patterns:
    - inject(SupabaseService) pattern
    - RLS policy with (SELECT auth.uid()) optimization
    - TypeScript Pick utility for payload types
key_files:
  created:
    - supabase/migrations/002_dishes.sql
    - src/app/features/dishes/models/dish.model.ts
    - src/app/features/dishes/services/dish.service.ts
  modified: []
decisions:
  - TEXT with CHECK constraint over PostgreSQL ENUM for categories (easier to modify)
  - Reuse existing update_updated_at() function from 001_profiles.sql
  - Error throwing in service (no try/catch) - components handle display
  - getAll orders by is_favorite DESC, name ASC - favorites on top
metrics:
  duration: 84s
  tasks_completed: 2
  files_created: 3
  commits: 2
  completed_at: 2026-02-16T16:18:17Z
---

# Phase 02 Plan 01: Dishes Database & Service Layer Summary

**One-liner:** Created dishes table with RLS policies enforcing user isolation and DishService providing getAll/create/update/delete/toggleFavorite methods via Supabase.

## Execution Overview

**Status:** Complete
**Autonomous:** Yes (no checkpoints)
**Started:** 2026-02-16T16:16:53Z
**Completed:** 2026-02-16T16:18:17Z
**Duration:** 1.4 minutes

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create dishes database migration with RLS policies | b98d6fb | supabase/migrations/002_dishes.sql |
| 2 | Create Dish model and DishService with CRUD operations | cc8297e | dish.model.ts, dish.service.ts |

## What Was Built

### Database Layer

**Table:** `public.dishes`
- UUID primary key with auto-generation
- Foreign key to auth.users with CASCADE delete
- Fields: user_id, name, category, is_favorite, timestamps
- CHECK constraint on category (Fisch, Fleisch, Vegetarisch)

**RLS Policies (4):**
- SELECT: Users can view own dishes
- INSERT: Users can insert own dishes
- UPDATE: Users can update own dishes
- DELETE: Users can delete own dishes

All policies use `(SELECT auth.uid())` wrapper pattern for 94-99% performance improvement (per CVE-2025-48757).

**Indexes (3):**
- `idx_dishes_user_id` - RLS query performance
- `idx_dishes_category` - Filter queries
- `idx_dishes_favorite` - Sort queries

**Trigger:**
- Reuses `public.update_updated_at()` function from 001_profiles.sql
- Auto-updates `updated_at` on any UPDATE

### TypeScript Layer

**Dish Model** (`dish.model.ts`):
- `DishCategory` type: `'Fisch' | 'Fleisch' | 'Vegetarisch'`
- `Dish` interface: id, user_id, name, category, is_favorite, timestamps
- `CreateDishPayload` type: `Pick<Dish, 'name' | 'category'>`

**DishService** (`dish.service.ts`):
- `getAll()` - Returns all user's dishes ordered by favorite status then name
- `create(payload)` - Creates new dish with auto user_id
- `update(id, changes)` - Updates name or category
- `delete(id)` - Deletes dish
- `toggleFavorite(id, isFavorite)` - Toggles favorite status

All methods use Supabase client and throw on error (no try/catch).

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Migration SQL:**
- File exists at supabase/migrations/002_dishes.sql
- RLS enabled: YES
- Optimized auth pattern count: 6 occurrences (correct for 4 policies)
- CHECK constraint: YES
- Indexes: 3 (all present)
- References update_updated_at(): YES

**TypeScript:**
- Model exports: Dish, DishCategory, CreateDishPayload - ALL PRESENT
- Service methods: getAll, create, update, delete, toggleFavorite - ALL PRESENT
- Uses inject(SupabaseService): YES
- Imports Dish model: YES
- Build: SUCCESS (no TypeScript errors)

## Must-Haves Verification

**Truths:**
- [x] Dishes table exists with RLS policies enforcing user isolation
- [x] DishService can create, read, update, and delete dishes via Supabase
- [x] DishService can toggle favorite status on a dish
- [x] Dish model has typed fields for id, user_id, name, category, is_favorite

**Artifacts:**
- [x] supabase/migrations/002_dishes.sql - Contains CREATE TABLE, RLS, indexes, CHECK constraint
- [x] src/app/features/dishes/models/dish.model.ts - Exports Dish, DishCategory
- [x] src/app/features/dishes/services/dish.service.ts - Exports DishService

**Key Links:**
- [x] DishService → SupabaseService via inject(SupabaseService)
- [x] DishService → Dish model via import { Dish } from '../models/dish.model'

## Self-Check

Verifying created files and commits.

**Files:**
- supabase/migrations/002_dishes.sql: FOUND
- src/app/features/dishes/models/dish.model.ts: FOUND
- src/app/features/dishes/services/dish.service.ts: FOUND

**Commits:**
- b98d6fb (Task 1 - dishes migration): FOUND
- cc8297e (Task 2 - model and service): FOUND

## Self-Check: PASSED

All files created and commits exist as documented.

## Impact & Next Steps

**Provides for Phase 2:**
- Dishes table ready for data (migration can be run in Supabase SQL Editor)
- DishService ready for UI components to consume
- Type-safe Dish model for all dish-related features

**Next Plan (02-02):**
Will build the Dish List UI component using this DishService to display, create, edit, delete, and toggle favorite dishes.

**Technical Debt:**
None introduced.

**Outstanding Issues:**
None.
