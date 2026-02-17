# Architecture Research

**Domain:** Family Meal Planning Web Application
**Researched:** 2026-02-16
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Dishes       │  │ Meal Plans   │  │ Auth/Profile │              │
│  │ Feature      │  │ Feature      │  │ Feature      │              │
│  │ (Smart/Dumb) │  │ (Smart/Dumb) │  │ (Smart/Dumb) │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
├─────────┴─────────────────┴──────────────────┴──────────────────────┤
│                          SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Dish        │  │ Meal Plan   │  │ Supabase    │  │ Auth      │ │
│  │ Service     │  │ Service     │  │ Client      │  │ Service   │ │
│  │ + State     │  │ + State     │  │ Service     │  │           │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│         │                │                 │                │       │
├─────────┴────────────────┴─────────────────┴────────────────┴───────┤
│                          SUPABASE BACKEND                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway (Kong)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ GoTrue Auth  │  │ PostgREST    │  │ Realtime     │             │
│  │ (JWT)        │  │ (REST API)   │  │ (WebSocket)  │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                  │                     │
│  ┌──────┴─────────────────┴──────────────────┴───────────────────┐ │
│  │                  PostgreSQL Database                          │ │
│  │  ┌─────────┐  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │ dishes  │  │ meal_plans   │  │ profiles     │             │ │
│  │  │         │  │              │  │              │             │ │
│  │  │ (RLS)   │  │ (RLS)        │  │ (RLS)        │             │ │
│  │  └─────────┘  └──────────────┘  └──────────────┘             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Feature Modules** | Organize related functionality (dishes, meal plans, auth) | Angular standalone components with lazy loading |
| **Smart Components** | Handle business logic, service injection, routing | Routed page components that orchestrate data flow |
| **Dumb Components** | Pure presentation, receive @Input, emit @Output | Reusable UI components with OnPush change detection |
| **Service Layer** | Encapsulate business logic, Supabase communication, state management | Injectable services with Angular Signals for state |
| **Supabase Client** | Centralized backend communication, authentication, real-time subscriptions | Singleton service wrapping @supabase/supabase-js |
| **PostgreSQL Tables** | Data persistence with Row Level Security (RLS) | Relational schema with foreign keys and RLS policies |
| **PostgREST API** | Auto-generated RESTful API from database schema | Automatic, configured via Supabase |
| **Realtime Engine** | WebSocket connections for collaborative features | Elixir-based Phoenix channels |

## Recommended Project Structure

```
src/
├── app/
│   ├── core/                      # Singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── supabase.service.ts     # Centralized Supabase client
│   │   │   └── auth.service.ts         # Authentication wrapper
│   │   ├── guards/
│   │   │   └── auth.guard.ts           # Route protection
│   │   └── models/
│   │       ├── dish.model.ts           # Domain interfaces
│   │       └── meal-plan.model.ts
│   │
│   ├── shared/                    # Reusable dumb components, pipes, directives
│   │   ├── components/
│   │   │   ├── button/
│   │   │   └── card/
│   │   └── pipes/
│   │       └── category-label.pipe.ts
│   │
│   ├── features/                  # Feature-first organization
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── login.component.ts  # Smart component
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── dishes/
│   │   │   ├── services/
│   │   │   │   └── dish.service.ts     # Feature-specific service + state
│   │   │   ├── pages/
│   │   │   │   ├── dish-list/          # Smart component
│   │   │   │   └── dish-form/          # Smart component
│   │   │   ├── components/
│   │   │   │   ├── dish-card/          # Dumb component
│   │   │   │   └── dish-category-filter/ # Dumb component
│   │   │   └── dishes.routes.ts
│   │   │
│   │   ├── meal-plans/
│   │   │   ├── services/
│   │   │   │   ├── meal-plan.service.ts      # CRUD + state
│   │   │   │   └── meal-plan-generator.service.ts # Generation algorithm
│   │   │   ├── pages/
│   │   │   │   ├── meal-plan-list/     # Smart component
│   │   │   │   ├── meal-plan-view/     # Smart component
│   │   │   │   └── meal-plan-generate/ # Smart component
│   │   │   ├── components/
│   │   │   │   ├── weekly-calendar/    # Dumb component
│   │   │   │   └── meal-card/          # Dumb component
│   │   │   └── meal-plans.routes.ts
│   │   │
│   │   └── profile/
│   │       ├── pages/
│   │       │   └── profile-settings/
│   │       └── profile.routes.ts
│   │
│   ├── app.component.ts
│   ├── app.config.ts              # App-level configuration (Angular 21+)
│   └── app.routes.ts              # Top-level routing
│
└── environments/
    ├── environment.ts             # Supabase credentials
    └── environment.prod.ts
```

### Structure Rationale

- **core/:** Singleton services used app-wide (Supabase client, auth). Never imported by feature modules—only by AppConfig.
- **shared/:** Reusable presentational components without business logic. Can be imported anywhere.
- **features/:** Each feature is self-contained with its own pages (smart), components (dumb), services, and routes. Promotes lazy loading and clear boundaries.
- **Smart/Dumb separation:** Pages (smart) handle routing, services, and business logic. Components (dumb) receive data via @Input and emit events via @Output. This enables OnPush change detection and easier testing.

## Architectural Patterns

### Pattern 1: Service-Based State Management with Signals

**What:** Use Angular Signals (Angular 21+) within services to manage feature-level state without external libraries like NgRx.

**When to use:** For small to medium apps with shared state between components but not complex async workflows requiring extensive side effect management.

**Trade-offs:**
- **Pros:** Simple, built-in, performant, no external dependencies
- **Cons:** Not suitable for very complex state with extensive side effects and time-travel debugging needs

**Example:**
```typescript
// dish.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Dish } from '@core/models/dish.model';

@Injectable({ providedIn: 'root' })
export class DishService {
  // State signals
  private dishesSignal = signal<Dish[]>([]);
  private loadingSignal = signal<boolean>(false);
  private filterSignal = signal<string | null>(null);

  // Public computed state
  dishes = this.dishesSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  filteredDishes = computed(() => {
    const filter = this.filterSignal();
    if (!filter) return this.dishesSignal();
    return this.dishesSignal().filter(d => d.category === filter);
  });

  constructor(private supabase: SupabaseService) {}

  async loadDishes() {
    this.loadingSignal.set(true);
    const { data, error } = await this.supabase.client
      .from('dishes')
      .select('*')
      .order('name');

    if (data) this.dishesSignal.set(data);
    this.loadingSignal.set(false);
  }

  setFilter(category: string | null) {
    this.filterSignal.set(category);
  }
}
```

### Pattern 2: Row Level Security (RLS) for Multi-Tenant Data Isolation

**What:** Use PostgreSQL Row Level Security policies to enforce family-level data access at the database layer, not in application code.

**When to use:** Always for production Supabase apps with shared data between authenticated users. Essential for multi-family meal planning where each family sees only their data.

**Trade-offs:**
- **Pros:** Security enforced at database level, impossible to bypass, simplifies client code
- **Cons:** Requires careful policy design, can be complex to debug initially

**Example:**
```sql
-- Enable RLS on dishes table
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see dishes belonging to their family
CREATE POLICY "Users can view own family dishes"
  ON dishes
  FOR SELECT
  USING (family_id = auth.uid()::uuid);

-- Policy: Users can insert dishes for their family
CREATE POLICY "Users can insert own family dishes"
  ON dishes
  FOR INSERT
  WITH CHECK (family_id = auth.uid()::uuid);

-- Similar policies for UPDATE and DELETE
```

### Pattern 3: Smart/Dumb Component Architecture

**What:** Separate components into two categories: Smart (container) components that handle logic and services, and Dumb (presentational) components that only display data.

**When to use:** Always. This is a foundational Angular best practice for maintainable, testable applications.

**Trade-offs:**
- **Pros:** Clear separation of concerns, reusable dumb components, easier testing, better performance with OnPush
- **Cons:** More files to manage, requires discipline to maintain boundaries

**Example:**
```typescript
// Smart component: dish-list.component.ts (page)
@Component({
  selector: 'app-dish-list',
  template: `
    <app-dish-category-filter
      [currentFilter]="currentFilter()"
      (filterChange)="onFilterChange($event)">
    </app-dish-category-filter>

    <app-dish-card
      *ngFor="let dish of filteredDishes()"
      [dish]="dish"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)">
    </app-dish-card>
  `,
  standalone: true
})
export class DishListComponent {
  dishService = inject(DishService);
  currentFilter = this.dishService.filterSignal;
  filteredDishes = this.dishService.filteredDishes;

  onFilterChange(category: string | null) {
    this.dishService.setFilter(category);
  }

  onEdit(dish: Dish) {
    // Navigate to edit page
  }

  onDelete(dish: Dish) {
    this.dishService.deleteDish(dish.id);
  }
}

// Dumb component: dish-card.component.ts
@Component({
  selector: 'app-dish-card',
  template: `
    <div class="dish-card">
      <h3>{{ dish.name }}</h3>
      <span class="category">{{ dish.category | categoryLabel }}</span>
      <button (click)="edit.emit(dish)">Bearbeiten</button>
      <button (click)="delete.emit(dish)">Löschen</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class DishCardComponent {
  @Input({ required: true }) dish!: Dish;
  @Output() edit = new EventEmitter<Dish>();
  @Output() delete = new EventEmitter<Dish>();
}
```

### Pattern 4: Centralized Supabase Client Service

**What:** Create a singleton service that initializes the Supabase client once and provides it to the entire application.

**When to use:** Always. Never initialize the Supabase client in multiple places.

**Trade-offs:**
- **Pros:** Single source of truth, easy to configure, consistent auth state
- **Cons:** None—this is the recommended pattern from Supabase documentation

**Example:**
```typescript
// core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabaseClient;
  }
}
```

### Pattern 5: Optimistic UI Updates with Realtime Sync

**What:** Immediately update the UI when user makes a change, then sync with server and reconcile if needed. Use Supabase Realtime to sync changes from other users.

**When to use:** For collaborative features where multiple family members might edit meal plans simultaneously.

**Trade-offs:**
- **Pros:** Responsive UI, handles offline scenarios, multi-user sync
- **Cons:** More complex state management, need conflict resolution strategy

**Example:**
```typescript
// meal-plan.service.ts
async updateMealPlan(id: string, updates: Partial<MealPlan>) {
  // 1. Optimistic update
  const currentPlans = this.mealPlansSignal();
  const optimisticPlans = currentPlans.map(plan =>
    plan.id === id ? { ...plan, ...updates } : plan
  );
  this.mealPlansSignal.set(optimisticPlans);

  // 2. Sync with server
  const { data, error } = await this.supabase.client
    .from('meal_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  // 3. Reconcile if error
  if (error) {
    this.mealPlansSignal.set(currentPlans); // Rollback
    throw error;
  }
}

// Subscribe to realtime changes from other users
subscribeToMealPlans(familyId: string) {
  this.supabase.client
    .channel('meal_plans')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_plans',
        filter: `family_id=eq.${familyId}`
      },
      (payload) => this.handleRealtimeChange(payload)
    )
    .subscribe();
}
```

## Data Flow

### User Action Flow (Create Dish)

```
[User fills form]
    ↓
[DishFormComponent (Smart)] → validates input
    ↓
[DishService.createDish()] → optimistic UI update
    ↓
[SupabaseService.client] → POST via PostgREST
    ↓
[PostgreSQL + RLS] → validates family_id policy, inserts row
    ↓
[PostgREST] → returns inserted dish with generated ID
    ↓
[DishService] → updates signal with server response
    ↓
[DishListComponent] → re-renders via computed signal
```

### Meal Plan Generation Flow

```
[User clicks "Generate Plan"]
    ↓
[MealPlanGenerateComponent] → collects preferences (week start, variety level)
    ↓
[MealPlanGeneratorService.generate()]
    ↓ (algorithm runs locally)
├─→ Fetches user's dishes from DishService
├─→ Applies category balance rules (Fish/Meat/Vegetarian)
├─→ Incorporates favorite dishes
├─→ Ensures variety (no repeats within 7 days)
├─→ Generates 7-day plan
    ↓
[MealPlanService.savePlan()] → saves to Supabase
    ↓
[Navigate to meal-plan-view]
```

### Real-time Sync Flow (Multi-User)

```
[Family Member A edits plan on Device 1]
    ↓
[MealPlanService updates local state]
    ↓
[Supabase PostgREST updates database]
    ↓
[PostgreSQL Write-Ahead Log (WAL)]
    ↓
[Supabase Realtime reads WAL]
    ↓
[WebSocket broadcasts to all subscribed clients]
    ↓
[Family Member B's Device 2 receives update]
    ↓
[MealPlanService.handleRealtimeChange()]
    ↓
[UI re-renders with new data via Signals]
```

### Authentication Flow

```
[User enters email on login page]
    ↓
[AuthService.signInWithMagicLink()]
    ↓
[Supabase GoTrue sends magic link email]
    ↓
[User clicks link in email]
    ↓
[GoTrue validates token, creates session]
    ↓
[Browser redirects to app with session JWT]
    ↓
[AuthService detects session via onAuthStateChange]
    ↓
[AuthGuard allows access to protected routes]
    ↓
[All Supabase requests include JWT in Authorization header]
    ↓
[PostgreSQL RLS policies use auth.uid() from JWT]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **1-10 families (MVP)** | Monolithic Angular app, direct Supabase client calls, no caching, single PostgreSQL instance. Enable RLS from day one. |
| **10-100 families** | Add client-side caching with Signals (computed values), enable Supabase Realtime selectively (only for meal plan editing), use Supabase connection pooling (Supavisor). |
| **100-1000 families** | Implement service workers for offline support, add database indexes on foreign keys (family_id, user_id), consider read replicas if read-heavy, use Supabase Edge Functions for complex meal plan algorithms if client-side becomes slow. |
| **1000+ families** | Move meal plan generation to Edge Functions (Deno), implement CDN caching for static assets, use database partitioning by family_id if queries slow, consider splitting database by region if international. |

### Scaling Priorities

1. **First bottleneck (around 100 families):** Database query performance on meal_plans table. **Fix:** Add composite index on (family_id, week_start_date). Use pagination for meal plan history.

2. **Second bottleneck (around 500 families):** Real-time WebSocket connection limits. **Fix:** Only subscribe to Realtime for actively viewed meal plans, unsubscribe when navigating away. Use Supabase's channel multiplexing.

3. **Third bottleneck (around 1000 families):** Client-side meal plan generation algorithm becomes slow with large dish libraries. **Fix:** Move generation logic to Supabase Edge Function, call via RPC, cache results for 5 minutes.

## Anti-Patterns

### Anti-Pattern 1: Initializing Supabase Client in Multiple Places

**What people do:** Import createClient from '@supabase/supabase-js' and initialize it directly in feature services.

**Why it's wrong:** Creates multiple client instances with separate auth state, leads to inconsistent sessions, wastes memory, violates singleton pattern.

**Do this instead:** Create a single SupabaseService in core/ that initializes the client once. Inject this service wherever Supabase access is needed.

### Anti-Pattern 2: Skipping Row Level Security in Development

**What people do:** Disable RLS during development for convenience, plan to add it later before production.

**Why it's wrong:** Security policies are hard to retrofit. You'll build features assuming unrestricted data access, then face breaking changes when adding RLS. Potential data leaks if you forget to enable it.

**Do this instead:** Enable RLS from the first database table. Write policies alongside schema creation. Test with multiple user accounts from the start.

### Anti-Pattern 3: Fetching All Data Upfront

**What people do:** Load all dishes and all meal plans for a family into memory on app startup.

**Why it's wrong:** Slow initial load, wastes bandwidth, consumes client memory unnecessarily, doesn't scale beyond a few hundred records.

**Do this instead:** Use pagination for lists (select with range), lazy-load data as needed, implement virtual scrolling for large lists, fetch only the current week's meal plan initially.

### Anti-Pattern 4: Mixing Business Logic into Components

**What people do:** Put database queries, meal plan generation algorithms, and data transformations directly in component TypeScript files.

**Why it's wrong:** Violates single responsibility, makes components untestable without mocking Supabase, prevents code reuse, makes components heavy and hard to maintain.

**Do this instead:** Keep components thin. Move all business logic to services. Components should only handle UI concerns: form validation, user events, template rendering. Use smart/dumb pattern strictly.

### Anti-Pattern 5: Ignoring Realtime Unsubscribe

**What people do:** Subscribe to Realtime channels in components but forget to unsubscribe when component is destroyed.

**Why it's wrong:** Memory leaks, app continues receiving and processing updates for views user isn't looking at, connection pool exhaustion, battery drain on mobile.

**Do this instead:** Always unsubscribe in ngOnDestroy. Use RxJS takeUntilDestroyed operator or store channel reference and call unsubscribe() explicitly. Better yet, manage subscriptions at the service level with lifecycle-aware logic.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Supabase Auth (GoTrue)** | Magic link authentication via SupabaseService.client.auth | No password storage needed, email-based flow is user-friendly for families |
| **Supabase Database (PostgreSQL via PostgREST)** | TypeScript client: .from('table').select() | Type-safe queries, automatic foreign key joins |
| **Supabase Realtime** | WebSocket channel subscriptions | Subscribe to specific tables filtered by family_id, unsubscribe when leaving view |
| **Vercel Hosting** | Static site deployment with edge network | Environment variables for Supabase credentials, automatic HTTPS |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Component ↔ Service** | Dependency injection, Signals | Components never access Supabase directly, always through services |
| **Smart Component ↔ Dumb Component** | @Input/@Output | Unidirectional data flow, dumb components are stateless |
| **Service ↔ Service** | Direct method calls via DI | Keep service dependencies minimal, avoid circular deps |
| **Feature ↔ Feature** | Shared services from core/, routing | Features are isolated, communicate via navigation or shared core services |
| **Frontend ↔ Backend** | PostgREST API over HTTPS, WebSocket for Realtime | All requests include JWT, RLS enforced server-side |

## Build Order Implications

Based on architectural dependencies, implement in this order:

### Phase 1: Foundation
1. **Core infrastructure** first: SupabaseService, AuthService, routing guards
2. **Database schema** with RLS policies: users → profiles → dishes
3. **Authentication flow**: Login, session management, protected routes
4. **Reason:** Must establish secure data access patterns before any features

### Phase 2: Dish Management
1. **Dish CRUD** with smart/dumb components
2. **DishService** with Signal-based state
3. **Dish list with filtering** by category
4. **Reason:** Meal plans depend on dishes existing—build foundation data model first

### Phase 3: Manual Meal Planning
1. **Meal plan CRUD** (users create plans manually)
2. **Weekly calendar view** component
3. **Dish selection** for each day
4. **Reason:** Manual planning validates data model and UI before auto-generation

### Phase 4: Auto-Generation
1. **Generation algorithm** service
2. **Preference collection** (variety level, favorites)
3. **Category balancing logic** (Fish/Meat/Vegetarian)
4. **Reason:** Algorithm depends on stable dish and meal plan data structures

### Phase 5: Real-Time Collaboration
1. **Realtime subscription** setup in services
2. **Optimistic UI updates**
3. **Conflict resolution** strategy
4. **Reason:** Requires solid understanding of state management and multi-user scenarios

## Database Schema Design

```sql
-- Core tables for meal planning system

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  family_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES profiles(family_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Fish', 'Meat', 'Vegetarian')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES profiles(family_id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, week_start_date)
);

CREATE TABLE meal_plan_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  dish_id UUID REFERENCES dishes(id) ON DELETE SET NULL,
  UNIQUE(meal_plan_id, day_of_week)
);

-- Indexes for performance
CREATE INDEX idx_dishes_family_id ON dishes(family_id);
CREATE INDEX idx_dishes_category ON dishes(family_id, category);
CREATE INDEX idx_meal_plans_family_week ON meal_plans(family_id, week_start_date DESC);
CREATE INDEX idx_meal_plan_days_plan_id ON meal_plan_days(meal_plan_id);

-- RLS Policies (examples)
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own family dishes" ON dishes
  FOR SELECT USING (family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid()));
```

## Sources

**HIGH Confidence (Official Documentation):**
- [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture) - Core architectural components
- [Build a User Management App with Angular](https://supabase.com/docs/guides/getting-started/tutorials/with-angular) - Angular integration patterns
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture) - Real-time system design

**MEDIUM Confidence (Verified Industry Sources):**
- [State Management Patterns That Actually Scale in Angular 21](https://medium.com/@dipaksahirav/state-management-patterns-that-actually-scale-in-angular-21-5a2d50f1347f) - Signals vs NgRx
- [Angular 2025 Guide: Project Structure with the Features Approach](https://www.ismaelramos.dev/blog/angular-2025-project-structure-with-the-features-approach/) - Feature-first organization
- [Best Practices for Supabase](https://www.leanware.co/insights/supabase-best-practices) - Production patterns
- [Building Scalable Real-Time Systems: A Deep Dive into Supabase Realtime Architecture](https://medium.com/@ansh91627/building-scalable-real-time-systems-a-deep-dive-into-supabase-realtime-architecture-and-eccb01852f2b) - Optimistic UI patterns

**MEDIUM Confidence (Domain Research):**
- [How to Build a Recipe Database](https://www.blueberri.co/blog/creating-a-recipe-database) - Database schema patterns
- [Application of Artificial Intelligence for Weekly Dietary Menu Planning](https://link.springer.com/chapter/10.1007/978-3-540-72375-2_3) - Meal plan generation algorithms

---
*Architecture research for: Family Meal Planning Web Application*
*Researched: 2026-02-16*
