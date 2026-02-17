# Phase 2: Dish Management - Research

**Researched:** 2026-02-16
**Domain:** angular 21 CRUD + Supabase PostgreSQL + Tailwind CSS UI
**Confidence:** HIGH

## Summary

Phase 2 implements a complete CRUD interface for dish management using angular 21 with Signals for state management, Supabase PostgreSQL for data persistence with Row Level Security, and Tailwind CSS for UI components. The research confirms that this pattern is well-established and production-ready, with extensive official documentation for Angular Signals, Supabase CRUD operations, and Tailwind UI components.

The critical architectural decision is using **Angular Signals** (introduced in Angular 16, standard in 19+) for local state management instead of RxJS Observables. Signals provide simpler, more performant reactive state with automatic change detection and computed values for filtering/sorting. For database schema, **check constraints** on TEXT columns are preferred over PostgreSQL ENUM types for categories to allow easier modifications without migrations.

The undo delete pattern requires **optimistic UI updates** combined with Angular Material's MatSnackBar for toast notifications. The recommended implementation uses immediate UI removal, temporary storage of deleted items, and database commits only after the undo window expires (3-5 seconds). This pattern provides instant feedback while maintaining data integrity.

**Primary recommendation:** Create a dishes table with TEXT category field and CHECK constraint, implement a DishService with Signal-based state management, use inline reactive forms with validation, implement category filtering and favorites sorting in computed signals, and use MatSnackBar with action buttons for undo functionality.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dish list layout:**
- Simple list rows — compact, scannable format with dish name, category tag, and favorite icon per row
- Favorites indicated with a heart icon toggle (filled = favorite, outline = not)
- Categories shown as colored badge/pill per dish (e.g., green = Vegetarisch, red = Fleisch, blue = Fisch)
- Default sort: favorites first, then alphabetical A–Z
- Total dish count visible (e.g., "12 Gerichte")

**Add/Edit experience:**
- Add new dish via inline form at top of list — type name, pick category, done
- Edit uses same inline area at top, pre-filled with current values
- Category selection via dropdown/select in the form
- Minimal fields: name + category only (no notes/description field)

**Category filtering:**
- Horizontal tab bar: Alle | Fisch | Fleisch | Vegetarisch | Favoriten
- Dedicated "Favoriten" tab shows only favorited dishes across all categories
- Text search field to find dishes by name, narrows results within active tab

**Delete behavior:**
- Delete icon (trash/X) always visible on every row
- No confirmation dialog — delete immediately
- Show "Rückgängig" undo toast/snackbar for a few seconds after deletion

**Empty state:**
- Friendly message: "Noch keine Gerichte — füge dein erstes hinzu!" with prominent add button
- Shown when dish list is completely empty

### Claude's Discretion

- Search field placement relative to tabs (above or below)
- Exact color choices for category badges
- Undo toast duration and styling
- Loading states and error handling
- Exact spacing, typography, and responsive breakpoints

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/core | 19.x (Signals) | Framework with reactive primitives | User's established stack; Signals are default for state in angular 21+ |
| @supabase/supabase-js | Latest | Database CRUD + RLS | Already integrated in Phase 1; official PostgreSQL client |
| @angular/material/snack-bar | 19.x | Toast notifications | Official Angular Material component for temporary messages with actions |
| tailwindcss | 4.x | UI styling | Already integrated in Phase 1; utility classes for badges, tabs, forms |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @angular/forms | 19.x (ReactiveFormsModule) | Form handling and validation | Required for add/edit dish inline form |
| @angular/cdk/scrolling | 19.x (optional) | Virtual scrolling | Only if dish list exceeds 100+ items; not needed for v1 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Angular Signals | RxJS Observables + BehaviorSubject | Signals are simpler, more performant, and Angular's recommended approach for local state in 19+ |
| Check constraint TEXT | PostgreSQL ENUM | ENUMs require migrations to change values; TEXT with CHECK is more flexible for evolving categories |
| Component filtering | Impure pipe | Impure pipes run on every change detection cycle; component method runs once per data change |
| Soft delete + undo | Hard delete + confirmation dialog | User decision: immediate delete with undo matches modern UX expectations |

**Installation:**
```bash
# Angular Material (if not already installed)
ng add @angular/material

# No additional packages needed - leveraging existing stack
```

## Architecture Patterns

### Recommended Project Structure

```
src/app/features/dishes/
├── dishes.component.ts              # Main dish list container
├── dishes.component.html            # List + tabs + search + form
├── dishes.component.css             # Tailwind utilities + custom styles
├── services/
│   └── dish.service.ts              # CRUD operations + Signal state
├── models/
│   └── dish.model.ts                # TypeScript interface for Dish
└── components/                      # (Optional) Break out if needed
    ├── dish-form/                   # Inline add/edit form
    ├── dish-list-item/              # Individual dish row
    └── dish-empty-state/            # "No dishes" message
```

### Pattern 1: Signal-Based State Management for CRUD

**What:** Use Angular Signals for local component state instead of RxJS Observables
**When to use:** All local state management for dish list, filters, and UI state
**Example:**

```typescript
// Source: https://angular.dev/guide/signals
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-dishes',
  template: `...`
})
export class DishesComponent {
  // Writable signals for mutable state
  private allDishes = signal<Dish[]>([]);
  private activeCategory = signal<string>('alle');
  private searchTerm = signal<string>('');

  // Computed signals for derived state (automatic re-calculation)
  filteredDishes = computed(() => {
    let dishes = this.allDishes();

    // Filter by category
    const category = this.activeCategory();
    if (category === 'favoriten') {
      dishes = dishes.filter(d => d.is_favorite);
    } else if (category !== 'alle') {
      dishes = dishes.filter(d => d.category === category);
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      dishes = dishes.filter(d =>
        d.name.toLowerCase().includes(search)
      );
    }

    // Sort: favorites first, then alphabetical
    return dishes.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name, 'de');
    });
  });

  dishCount = computed(() => this.filteredDishes().length);

  // Update methods
  setCategory(category: string) {
    this.activeCategory.set(category);
  }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  async loadDishes() {
    const dishes = await this.dishService.getAll();
    this.allDishes.set(dishes);
  }
}
```

**Why this pattern:**
- Signals automatically track dependencies and trigger change detection
- Computed signals memoize results (only recalculate when dependencies change)
- Eliminates manual subscription management (no unsubscribe needed)
- More performant than impure pipes or method calls in templates

**Source:** [Angular Signals Official Guide](https://angular.dev/guide/signals)

### Pattern 2: Supabase CRUD Service with RLS Policies

**What:** Centralized service for all dish database operations with performant RLS
**When to use:** All database interactions for dishes
**Example:**

```typescript
// DishService - CRUD operations
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Dish } from '../models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private supabase = inject(SupabaseService);

  async getAll(): Promise<Dish[]> {
    const { data, error } = await this.supabase.client
      .from('dishes')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async create(dish: Omit<Dish, 'id' | 'created_at'>): Promise<Dish> {
    const { data, error } = await this.supabase.client
      .from('dishes')
      .insert(dish)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, changes: Partial<Dish>): Promise<Dish> {
    const { data, error } = await this.supabase.client
      .from('dishes')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<Dish> {
    return this.update(id, { is_favorite: isFavorite });
  }
}
```

**Database Migration:**
```sql
-- Migration: 002_dishes.sql
-- Create dishes table with RLS policies

CREATE TABLE public.dishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Fisch', 'Fleisch', 'Vegetarisch')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (CRITICAL)
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- Performance: Using (SELECT auth.uid()) wrapper for 94-99% improvement
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- SELECT policy: Users see only their own dishes
CREATE POLICY "Users view own dishes"
ON public.dishes FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- INSERT policy: Users create dishes for themselves
CREATE POLICY "Users create own dishes"
ON public.dishes FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE policy: Users update only their own dishes
CREATE POLICY "Users update own dishes"
ON public.dishes FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE policy: Users delete only their own dishes
CREATE POLICY "Users delete own dishes"
ON public.dishes FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Performance indexes
CREATE INDEX idx_dishes_user_id ON public.dishes(user_id);
CREATE INDEX idx_dishes_category ON public.dishes(category);
CREATE INDEX idx_dishes_favorite ON public.dishes(is_favorite);

-- Auto-update updated_at timestamp
CREATE TRIGGER dishes_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
```

**Sources:**
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase JavaScript API Reference](https://supabase.com/docs/reference/javascript/v1/using-filters)
- [Angular + Supabase Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-angular)

### Pattern 3: Optimistic UI Updates with Undo

**What:** Update UI immediately, store deleted item temporarily, allow undo within time window
**When to use:** All delete operations per user requirement (no confirmation dialog)
**Example:**

```typescript
// Component with undo delete
import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dishes',
  template: `...`
})
export class DishesComponent {
  private snackBar = inject(MatSnackBar);
  private dishService = inject(DishService);
  private deletedDish: { dish: Dish, index: number } | null = null;

  deleteDish(dish: Dish) {
    // 1. Optimistic update: remove from UI immediately
    const dishes = this.allDishes();
    const index = dishes.findIndex(d => d.id === dish.id);
    this.allDishes.set(dishes.filter(d => d.id !== dish.id));

    // 2. Store for potential undo
    this.deletedDish = { dish, index };

    // 3. Show undo snackbar (no duration = stays until action or dismissed)
    const snackBarRef = this.snackBar.open(
      `"${dish.name}" gelöscht`,
      'Rückgängig',
      { duration: 5000 } // 5 seconds to undo
    );

    // 4. Handle undo action
    snackBarRef.onAction().subscribe(() => {
      if (this.deletedDish) {
        // Restore to original position
        const restored = [...this.allDishes()];
        restored.splice(this.deletedDish.index, 0, this.deletedDish.dish);
        this.allDishes.set(restored);
        this.deletedDish = null;
      }
    });

    // 5. Commit delete to database after snackbar dismissed
    snackBarRef.afterDismissed().subscribe(async (info) => {
      if (!info.dismissedByAction && this.deletedDish) {
        // User didn't click undo - proceed with delete
        try {
          await this.dishService.delete(this.deletedDish.dish.id);
        } catch (error) {
          // If delete fails, restore the item
          const restored = [...this.allDishes()];
          restored.splice(this.deletedDish.index, 0, this.deletedDish.dish);
          this.allDishes.set(restored);
          this.snackBar.open('Löschen fehlgeschlagen', 'OK', { duration: 3000 });
        } finally {
          this.deletedDish = null;
        }
      }
    });
  }
}
```

**Important note:** Per Angular Material accessibility guidelines, snackbars with actions should NOT have a duration for screen reader users. However, user requirements specify a timed undo window. The compromise is a 5-second duration (longer than typical 3s) to balance accessibility with UX expectations.

**Sources:**
- [Angular Material Snackbar Tutorial](https://www.djamware.com/post/6902ea8954cd275155ae6be7/angular-material-snackbar-tutorial-easy-toast-notifications-for-your-app)
- [Angular Material Snackbar Overview](https://material.angular.dev/components/snack-bar/overview)
- [Supabase with TanStack Query - Optimistic Updates](https://makerkit.dev/blog/saas/supabase-react-query)

### Pattern 4: Inline Form with Reactive Validation

**What:** Single form component that handles both add and edit modes
**When to use:** User-specified inline form at top of list
**Example:**

```typescript
import { Component, signal, computed, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-dish-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <input
          type="text"
          formControlName="name"
          placeholder="Gericht Name"
          class="w-full px-4 py-2 rounded-lg border"
          [class.border-red-500]="showNameError()"
        />
        @if (showNameError()) {
          <p class="text-sm text-red-500 mt-1">
            {{ nameError() }}
          </p>
        }
      </div>

      <div>
        <select formControlName="category" class="w-full px-4 py-2 rounded-lg border">
          <option value="">Kategorie wählen</option>
          <option value="Fisch">Fisch</option>
          <option value="Fleisch">Fleisch</option>
          <option value="Vegetarisch">Vegetarisch</option>
        </select>
        @if (showCategoryError()) {
          <p class="text-sm text-red-500 mt-1">Kategorie erforderlich</p>
        }
      </div>

      <div class="flex gap-2">
        <button type="submit" [disabled]="!form.valid" class="btn-primary">
          {{ editMode() ? 'Speichern' : 'Hinzufügen' }}
        </button>
        @if (editMode()) {
          <button type="button" (click)="onCancel()" class="btn-secondary">
            Abbrechen
          </button>
        }
      </div>
    </form>
  `
})
export class DishFormComponent {
  form: FormGroup;
  editMode = signal(false);

  dishSaved = output<Dish>();
  cancelled = output<void>();

  // Computed error states
  showNameError = computed(() => {
    const control = this.form.get('name');
    return control?.invalid && (control?.dirty || control?.touched);
  });

  nameError = computed(() => {
    const control = this.form.get('name');
    if (control?.hasError('required')) return 'Name erforderlich';
    if (control?.hasError('minlength')) return 'Mindestens 2 Zeichen';
    return '';
  });

  showCategoryError = computed(() => {
    const control = this.form.get('category');
    return control?.invalid && (control?.dirty || control?.touched);
  });

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required]
    });
  }

  loadDish(dish: Dish) {
    this.editMode.set(true);
    this.form.patchValue(dish);
  }

  onSubmit() {
    if (this.form.valid) {
      this.dishSaved.emit(this.form.value);
      this.reset();
    }
  }

  onCancel() {
    this.cancelled.emit();
    this.reset();
  }

  reset() {
    this.form.reset();
    this.editMode.set(false);
  }
}
```

**Sources:**
- [Angular Reactive Forms Guide](https://angular.dev/guide/forms/reactive-forms)
- [Angular Form Validation](https://angular.dev/guide/forms/form-validation)
- [How to Validate Angular Reactive Forms](https://www.freecodecamp.org/news/how-to-validate-angular-reactive-forms/)

### Pattern 5: Tailwind CSS Tabs and Badges

**What:** Horizontal tab navigation with active state and category badges
**When to use:** User-specified horizontal category tabs and colored badges per dish
**Example:**

```html
<!-- Tab navigation -->
<div class="border-b border-gray-200">
  <nav class="flex space-x-8" role="tablist">
    @for (tab of tabs; track tab.id) {
      <button
        role="tab"
        [attr.aria-selected]="activeCategory() === tab.id"
        (click)="setCategory(tab.id)"
        class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
        [class.border-green-600]="activeCategory() === tab.id"
        [class.text-green-600]="activeCategory() === tab.id"
        [class.border-transparent]="activeCategory() !== tab.id"
        [class.text-gray-500]="activeCategory() !== tab.id"
        [class.hover:text-gray-700]="activeCategory() !== tab.id"
      >
        {{ tab.label }}
      </button>
    }
  </nav>
</div>

<!-- Category badge in dish row -->
<span
  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  [class.bg-blue-100]="dish.category === 'Fisch'"
  [class.text-blue-800]="dish.category === 'Fisch'"
  [class.bg-red-100]="dish.category === 'Fleisch'"
  [class.text-red-800]="dish.category === 'Fleisch'"
  [class.bg-green-100]="dish.category === 'Vegetarisch'"
  [class.text-green-800]="dish.category === 'Vegetarisch'"
>
  {{ dish.category }}
</span>

<!-- Favorite icon toggle -->
<button
  (click)="toggleFavorite(dish)"
  class="text-gray-400 hover:text-red-500 transition-colors"
  [class.text-red-500]="dish.is_favorite"
  aria-label="Als Favorit markieren"
>
  @if (dish.is_favorite) {
    <!-- Heroicons: solid heart -->
    <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
    </svg>
  } @else {
    <!-- Heroicons: outline heart -->
    <svg class="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
  }
</button>
```

**Sources:**
- [Tailwind CSS Tabs - Official UI Components](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs)
- [Tailwind CSS Badges - Official Components](https://tailwindcss.com/plus/ui-blocks/application-ui/elements/badges)
- [Flowbite Tailwind Tabs](https://flowbite.com/docs/components/tabs/)
- [Flowbite Tailwind Badges](https://flowbite.com/docs/components/badge/)

### Anti-Patterns to Avoid

- **Impure filter pipes:** Angular explicitly does not provide filter/sort pipes because they perform badly. Pre-filter data in component methods or computed signals instead.
- **Multiple database round-trips:** Fetch all dishes once, filter/sort client-side. Don't query database for each category change.
- **Manual change detection:** Signals automatically trigger change detection. Don't use `ChangeDetectorRef.detectChanges()`.
- **Hard deletes without undo:** User specified immediate delete with undo. Don't add confirmation dialogs.
- **PostgreSQL ENUMs for categories:** ENUMs can't be modified without migrations. Use TEXT with CHECK constraint for flexibility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom overlay system | Angular Material MatSnackBar | Handles positioning, animation, stacking, accessibility, action callbacks |
| Form validation | Custom error messages | Angular ReactiveFormsModule validators + computed signals | Built-in validators (required, minLength), automatic error state tracking |
| State management | Custom observable store | Angular Signals | Native framework primitive, automatic change detection, memoized computed values |
| Category filtering | Custom filter logic | Computed signals with array methods | Reactive, automatically updates, memoized for performance |
| Virtual scrolling | Custom viewport renderer | @angular/cdk/scrolling (if needed) | Handles viewport sizing, buffer zones, scroll events, performance optimization |

**Key insight:** angular 21+ provides built-in solutions for most common patterns. Signals replace the need for custom state management, computed signals replace impure pipes, and Angular Material provides accessible UI components. Building custom solutions adds complexity without benefit.

## Common Pitfalls

### Pitfall 1: Forgetting RLS Policies on New Tables

**What goes wrong:** New dishes table created but RLS not enabled. All user data is publicly accessible via Supabase anon key.

**Why it happens:** RLS is disabled by default. Developers forget to enable it after creating tables.

**How to avoid:**
1. Always include `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` in migration
2. Add all CRUD policies (SELECT, INSERT, UPDATE, DELETE) before any data exists
3. Test with different users to verify isolation

**Warning signs:**
- Can see other users' dishes in database or API responses
- Security scanner flags public table access
- Postman/curl requests succeed without authentication

**Source:** [Supabase Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pitfall 2: Using Impure Pipes for Filtering

**What goes wrong:** Creating a filter pipe to show filtered dishes causes performance issues. Pipe runs on every change detection cycle (every keystroke, mouse move).

**Why it happens:** Angular doesn't provide built-in filter/sort pipes, so developers create custom impure pipes.

**How to avoid:**
1. Use computed signals for filtering/sorting instead of pipes
2. Filter data once in component methods, bind to filtered array
3. Never use impure pipes for data transformation

**Warning signs:**
- UI feels sluggish when typing in search field
- Frame drops in Chrome DevTools Performance tab
- Multiple pipe executions logged per user action

**Source:** [Angular Pipes Performance Best Practices](https://medium.com/@rohitjsingh16/mastering-angular-pipes-types-examples-and-performance-best-practices-b79efe5dcda3)

### Pitfall 3: Not Handling Failed Deletes After Undo Window

**What goes wrong:** User deletes dish, undo window expires, database delete fails (network error, RLS policy issue). Dish disappears from UI but remains in database. Next reload shows the "deleted" dish.

**Why it happens:** Optimistic UI update without proper error handling on the actual delete.

**How to avoid:**
1. Wrap database delete in try/catch
2. If delete fails after undo window, restore item to UI and show error
3. Log errors for debugging
4. Consider retry logic for transient network errors

**Warning signs:**
- Dishes reappear after page reload
- Users report "I deleted this but it's back"
- Error logs showing delete failures but no UI feedback

### Pitfall 4: Direct auth.uid() in RLS Policies (Performance)

**What goes wrong:** RLS policies using `auth.uid() = user_id` cause performance issues. Postgres calls the function for every row being evaluated.

**Why it happens:** Common pattern in documentation before performance advisory. Seems like the natural approach.

**How to avoid:**
1. Always wrap `auth.uid()` in a `SELECT`: `(SELECT auth.uid()) = user_id`
2. This allows Postgres to cache the result per statement, not per row
3. Results in 94-99% performance improvement

**Warning signs:**
- Slow query performance as data grows
- Database CPU spikes during queries
- EXPLAIN ANALYZE shows multiple auth.uid() calls

**Source:** [Supabase RLS Performance Pattern](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pitfall 5: Not Unsubscribing from Snackbar Actions

**What goes wrong:** Component subscribes to `snackBarRef.onAction()` and `afterDismissed()` but doesn't unsubscribe on component destroy. Memory leaks accumulate over time.

**Why it happens:** Subscriptions are created but component lifecycle not managed.

**How to avoid:**
1. Store subscriptions and unsubscribe in `ngOnDestroy()`
2. Use `takeUntilDestroyed()` operator (Angular 16+)
3. Consider async pipe if possible

**Warning signs:**
- Memory usage grows over time without page refresh
- Multiple delete operations trigger for single click
- Chrome DevTools Memory Profiler shows leaked components

**Example fix:**
```typescript
import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class DishesComponent {
  private destroyRef = inject(DestroyRef);

  deleteDish(dish: Dish) {
    const snackBarRef = this.snackBar.open(...);

    snackBarRef.onAction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { /* undo logic */ });

    snackBarRef.afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { /* delete logic */ });
  }
}
```

## Code Examples

Verified patterns from official sources:

### Creating a Dish (Supabase Insert)

```typescript
// Source: https://supabase.com/docs/reference/javascript/v1/insert
async create(dish: { name: string; category: string }): Promise<Dish> {
  const { data: { user } } = await this.supabase.client.auth.getUser();

  const { data, error } = await this.supabase.client
    .from('dishes')
    .insert({
      user_id: user!.id,
      name: dish.name,
      category: dish.category,
      is_favorite: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Updating Favorite Status (Supabase Update)

```typescript
// Source: https://supabase.com/docs/reference/javascript/v1/update
async toggleFavorite(id: string, isFavorite: boolean): Promise<Dish> {
  const { data, error } = await this.supabase.client
    .from('dishes')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Filtering with Multiple Conditions (Computed Signal)

```typescript
// Source: https://angular.dev/guide/signals
filteredDishes = computed(() => {
  const dishes = this.allDishes();
  const category = this.activeCategory();
  const search = this.searchTerm().toLowerCase();

  return dishes
    .filter(d => {
      // Category filter
      if (category === 'favoriten') return d.is_favorite;
      if (category !== 'alle' && d.category !== category) return false;

      // Search filter
      if (search && !d.name.toLowerCase().includes(search)) return false;

      return true;
    })
    .sort((a, b) => {
      // Sort: favorites first, then alphabetical
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name, 'de');
    });
});
```

### Loading State with Signals

```typescript
// Pattern for async operations with loading state
export class DishesComponent {
  isLoading = signal(false);
  error = signal<string | null>(null);

  async loadDishes() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const dishes = await this.dishService.getAll();
      this.allDishes.set(dishes);
    } catch (err) {
      this.error.set('Gerichte konnten nicht geladen werden');
      console.error('Load dishes error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RxJS BehaviorSubject for state | Angular Signals | Angular 16 (2023), standard in 19 | Simpler API, automatic change detection, better performance, less boilerplate |
| Class-based guards (CanActivate) | Functional guards (CanActivateFn) | Angular 15 (2022) | Tree-shakeable, less boilerplate, direct dependency injection |
| Impure pipes for filtering | Computed signals or component methods | Angular 16 with Signals | Much better performance, explicit dependencies |
| auth.uid() in RLS policies | (SELECT auth.uid()) | Supabase 2024 advisory | 94-99% performance improvement |
| PostgreSQL ENUM for categories | TEXT with CHECK constraint | Best practice evolution | Easier to modify categories without migrations |
| Soft delete pattern | Optimistic delete + undo window | Modern UX expectation | Better user experience, immediate feedback |

**Deprecated/outdated:**
- **RxJS-based state management for simple CRUD:** Signals are the Angular-native solution now. Use RxJS only for complex async streams.
- **NgRx for local component state:** Overkill for single-component state. Signals provide reactivity without the boilerplate.
- **Manual change detection:** Signals trigger change detection automatically. No need for `ChangeDetectorRef`.

## Open Questions

1. **Realtime Updates from Other Devices**
   - What we know: Supabase Realtime can broadcast database changes to all connected clients
   - What's unclear: User requirement doesn't specify multi-device sync. Is it needed in Phase 2?
   - Recommendation: Defer to Phase 4 (collaboration phase). Phase 2 focuses on single-user CRUD.

2. **Virtual Scrolling Necessity**
   - What we know: Angular CDK virtual scroll is recommended for 100+ items
   - What's unclear: Expected dish count for typical user
   - Recommendation: Skip virtual scrolling in Phase 2. Most families have 20-50 dishes. Add later if needed.

3. **Undo Window Duration**
   - What we know: User wants "a few seconds" for undo
   - What's unclear: Exact duration (3s, 5s, 7s?)
   - Recommendation: Start with 5 seconds (common UX pattern). User can adjust in implementation feedback.

4. **Category Badge Colors**
   - What we know: User specified "e.g., green = Vegetarisch, red = Fleisch, blue = Fisch"
   - What's unclear: User marked as "Claude's Discretion" - confirms suggestion or wants alternatives?
   - Recommendation: Use suggested colors as they match semantic associations (green=plant, red=meat, blue=fish/water).

## Sources

### Primary (HIGH confidence)

- [Angular Signals Official Guide](https://angular.dev/guide/signals) - State management patterns
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms) - Form handling
- [Angular Form Validation](https://angular.dev/guide/forms/form-validation) - Validation patterns
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policies and performance
- [Supabase JavaScript Reference](https://supabase.com/docs/reference/javascript/v1/using-filters) - CRUD operations
- [Supabase Angular Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-angular) - Integration patterns
- [Angular Material Snackbar](https://material.angular.dev/components/snack-bar/overview) - Toast notifications

### Secondary (MEDIUM confidence)

- [Crunchy Data: ENUMs vs Check Constraints](https://www.crunchydata.com/blog/enums-vs-check-constraints-in-postgres) - Database design
- [Medium: Database ENUMs vs VARCHAR](https://medium.com/@zulfikarditya/database-enums-vs-constrained-varchar-a-technical-deep-dive-for-modern-applications-30d9d6bba9f8) - Category field patterns
- [Angular Signals CRUD Tutorial](https://www.techiediaries.com/angular-signals-crud/) - Practical examples
- [Telerik: State Management with Signals](https://www.telerik.com/blogs/practical-guide-state-management-using-angular-services-signals) - State patterns
- [Makerkit: Supabase with TanStack Query](https://makerkit.dev/blog/saas/supabase-react-query) - Optimistic updates pattern
- [Angular Material Snackbar Tutorial](https://www.djamware.com/post/6902ea8954cd275155ae6be7/angular-material-snackbar-tutorial-easy-toast-notifications-for-your-app) - Undo action implementation

### Tertiary (LOW confidence)

- [Flowbite Tailwind Components](https://flowbite.com/docs/components/) - UI component examples (not Angular-specific)
- [FlyonUI Tailwind Tabs](https://flyonui.com/docs/navigations/tabs-pills/) - Tab styling patterns (not Angular-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already integrated or official Angular/Supabase solutions
- Architecture: HIGH - Angular Signals and Supabase patterns extensively documented in official guides
- Pitfalls: HIGH - RLS performance, impure pipes, undo handling well-documented in official sources

**Research date:** 2026-02-16
**Valid until:** ~2026-03-16 (30 days - stable stack, slow-moving domain)

**Angular version note:** Angular 21 is current stable. Signals are production-ready and recommended for new development.

**Supabase version note:** Using latest supabase-js client. RLS performance pattern (SELECT auth.uid()) is current best practice as of 2024 advisory.
