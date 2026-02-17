# Phase 4: Realtime Collaboration - Research

**Researched:** 2026-02-17
**Domain:** Supabase Realtime (Postgres Changes), Household data model, Invite flows, Angular signal-based subscriptions
**Confidence:** HIGH (core Supabase Realtime API), MEDIUM (RLS migration strategy, invite flow), HIGH (Angular cleanup patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Household setup
- Household creation is a **separate step after login** — not part of registration
- Users access it from a new "Haushalt" section in the settings page
- One user can belong to **one household only** (no multi-household switching)
- Creator becomes **owner** — only owner can remove members and delete household
- Day-to-day usage is equal for all members (add/edit dishes, modify plans, invite others)
- App works **fully functional solo** without a household — household is optional

#### Invitation flow
- **Both methods available:** shareable link + email invitation
- Shareable links **expire after 7 days** — owner/member generates a new one when needed
- **Any member** can invite others (not restricted to owner)
- Invited users without an account: registration flow → **auto-join household** after signup (invite token preserved through registration)

#### Data sharing model
- When joining: existing dishes **merge into household** — no data lost
- When leaving: dishes **stay with household** — leaving member starts fresh
- **No individual dish ownership** within a household — all dishes belong to the shared pool, any member can edit or delete any dish
- Meal plans are shared per household — all members see and can modify the same weekly plans

#### Realtime sync UX
- **Inline updates + subtle toast** — changes appear immediately in the UI, plus a brief toast confirms what changed (e.g., "Lisa hat Montag geändert")
- **Last write wins** for concurrent edits — with instant sync, conflicts are rare in a family context
- **Activity feed** showing recent household changes (who added/changed what)

### Claude's Discretion
- Activity feed placement (notification bell vs. settings section vs. other)
- Toast styling and duration
- Exact Supabase Realtime channel architecture
- RLS policy design for household-scoped data
- Migration strategy for existing user data when creating/joining a household

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-04 | User kann Familien-Workspace erstellen (Haushalt) | Covered by `households` + `household_members` table design, settings-page Haushalt section, owner/member roles via `role` column |
| AUTH-05 | User kann Familienmitglieder per Email/Link einladen | Covered by `household_invites` table (shareable token + email), Supabase Auth `inviteUserByEmail` for email path, custom token for link path |
| AUTH-06 | Alle Familienmitglieder teilen Gerichte und Wochenpläne | Covered by migrating `user_id` → `household_id` on dishes/weekly_plans, updating RLS policies to check household membership |
| UI-03 | Änderungen von Familienmitgliedern sind sofort sichtbar (Realtime) | Covered by Supabase Realtime `postgres_changes` subscriptions filtered by `household_id`, Angular signal-based state updates, MatSnackBar toast notifications |
</phase_requirements>

---

## Summary

This phase converts MahlZeitPlaner from a single-user app to a collaborative family household app. The three primary technical challenges are: (1) restructuring the data model from user-scoped to household-scoped, (2) building an invite system that works for both existing and new users, and (3) wiring up Supabase Realtime so every household member sees changes instantly.

The data model migration is the most consequential change. Currently `dishes` and `weekly_plans` are keyed on `user_id`. They must gain a `household_id` foreign key, and solo users (no household) must continue to work unchanged — meaning the `household_id` column must be nullable, with RLS policies that accept either direct `user_id` ownership (solo) or household membership (collaborative). This dual-mode design is non-trivial but well-supported by PostgreSQL subquery-based RLS policies.

Supabase Realtime's `postgres_changes` API is the correct tool for live sync. It respects RLS — the server checks each subscriber's access before broadcasting a change — so a simple subscription filtered by `household_id` with correct RLS policies is both secure and sufficient. For a family app (low concurrent subscribers per household), `postgres_changes` is appropriate; the Broadcast alternative is only needed at scale. No new npm dependencies are required; `@supabase/supabase-js` ^2.95.3 already includes Realtime.

**Primary recommendation:** Add a nullable `household_id` to `dishes` and `weekly_plans` via migration; create `households` and `household_members` tables; use `postgres_changes` subscriptions filtered by `household_id`; implement invite tokens as a custom `household_invites` table for the shareable-link path and `inviteUserByEmail` for the email path (noting email invite requires a Supabase Edge Function with the service-role key, not a frontend call).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.95.3 (already installed) | Realtime subscriptions, auth invite, DB queries | Already in project; Realtime is built-in, no separate install needed |
| Angular Signals | Angular 21 (built-in) | Reactive state that updates when Realtime events arrive | Established pattern in codebase (dishes, meal-plan services) |
| `MatSnackBar` | `@angular/material` ^21.1.4 (already installed) | Toast notifications for "Lisa hat Montag geändert" | Already used in `dishes.component.ts` and `meal-plan.component.ts` |
| PostgreSQL RLS | Supabase built-in | Household-scoped data access, secures Realtime events | Same pattern used in all prior phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Edge Functions (Deno) | Supabase CLI | Email invite via service-role key without exposing secret to frontend | Required for `auth.admin.inviteUserByEmail` — service-role key must not be in Angular bundle |
| `DestroyRef` | Angular 21 (built-in) | Clean up Realtime channel subscriptions on component destroy | Use in every component/service that holds a channel reference |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `postgres_changes` | Supabase Broadcast + DB trigger | Broadcast is more scalable but requires server-side trigger SQL and more complex setup; overkill for family-scale use |
| Custom invite token table | Supabase `inviteUserByEmail` only | `inviteUserByEmail` is admin-only (Edge Function required) and doesn't support shareable links for existing users; custom table handles both paths |
| Nullable `household_id` on existing tables | New household-scoped tables (separate schema) | New tables break existing services and routes; nullable FK preserves solo-user compatibility with minimal refactoring |

**Installation:**
```bash
# No new npm dependencies required.
# All needed libraries are already installed:
# @supabase/supabase-js ^2.95.3, @angular/material ^21.1.4
```

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase (additions only):

```
src/
├── app/
│   ├── features/
│   │   ├── settings/                         # NEW - settings page (Haushalt lives here)
│   │   │   ├── settings.component.ts
│   │   │   ├── settings.component.html
│   │   │   └── components/
│   │   │       ├── household-panel/           # Haushalt section within settings
│   │   │       │   ├── household-panel.component.ts
│   │   │       │   └── household-panel.component.html
│   │   │       └── activity-feed/             # Optional: recent changes feed
│   │   │           ├── activity-feed.component.ts
│   │   │           └── activity-feed.component.html
│   │   └── auth/
│   │       └── accept-invite/                 # NEW - handles invite token in URL
│   │           ├── accept-invite.component.ts
│   │           └── accept-invite.component.html
│   ├── core/
│   │   └── services/
│   │       ├── household.service.ts           # NEW - household CRUD + membership
│   │       └── realtime.service.ts            # NEW - channel management, subscriptions
supabase/
├── migrations/
│   └── 004_households.sql                     # NEW - households, members, invites tables
└── functions/
    └── invite-user/                           # NEW - Edge Function for email invite
        └── index.ts
```

### Pattern 1: Supabase Realtime postgres_changes Subscription

**What:** Subscribe to database changes on a specific table, filtered by `household_id`. Angular service manages channel lifecycle; components subscribe to signals.

**When to use:** Any component displaying household-shared data (dishes list, meal plan calendar).

**Example:**
```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
// In realtime.service.ts or directly in household service

import { Injectable, inject, DestroyRef } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private supabase = inject(SupabaseService);
  private destroyRef = inject(DestroyRef);
  private channels: RealtimeChannel[] = [];

  subscribeToHousehold(
    householdId: string,
    onDishChange: (payload: any) => void,
    onPlanChange: (payload: any) => void
  ): void {
    // One channel per household is sufficient for all tables
    const channel = this.supabase.client
      .channel(`household:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',             // INSERT | UPDATE | DELETE
          schema: 'public',
          table: 'dishes',
          filter: `household_id=eq.${householdId}`,
        },
        onDishChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_assignments',
          // meal_assignments doesn't have household_id directly;
          // filter via weekly_plan_id is not supported in eq filter.
          // Solution: subscribe without filter, RLS ensures only household rows arrive.
        },
        onPlanChange
      )
      .subscribe();

    this.channels.push(channel);

    // Cleanup when service is destroyed (app-level)
    this.destroyRef.onDestroy(() => {
      this.supabase.client.removeChannel(channel);
    });
  }

  removeAllChannels(): void {
    this.channels.forEach(ch => this.supabase.client.removeChannel(ch));
    this.channels = [];
  }
}
```

**In DishService — react to realtime event:**
```typescript
// Source: Angular docs https://angular.dev/guide/signals
// When a realtime INSERT arrives, add dish to the signal:
private onDishInserted(payload: any): void {
  const newDish = payload.new as Dish;
  this.allDishes.update(current => [...current, newDish]);
  // Toast: "Lisa hat [name] hinzugefügt"
  this.snackBar.open(`${payload.new.created_by_name ?? 'Jemand'} hat ${newDish.name} hinzugefügt`, '', { duration: 3000 });
}
```

### Pattern 2: Dual-Mode RLS (Solo + Household)

**What:** All data tables support both solo users (no household) and household members via RLS policies that check both conditions with OR.

**When to use:** `dishes`, `weekly_plans` — any table being migrated from user-scoped to household-scoped.

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Dishes SELECT policy: allow own dishes (solo) OR household member dishes

CREATE POLICY "Users can view own or household dishes"
ON public.dishes FOR SELECT
TO authenticated
USING (
  -- Solo: user owns the dish directly
  (SELECT auth.uid()) = user_id
  OR
  -- Household: user is a member of the dish's household
  (
    household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = dishes.household_id
      AND user_id = (SELECT auth.uid())
    )
  )
);
```

**Critical note:** Use `(SELECT auth.uid())` wrapper (not bare `auth.uid()`) in all policies. This project has consistently used this pattern for 94-99% performance improvement per CVE-2025-48757. Maintain it in all new policies.

### Pattern 3: Household Data Model

**What:** Three new tables: `households` (the workspace), `household_members` (many-to-many with roles), `household_invites` (tokens for link/email invites).

**Example:**
```sql
-- Source: verified against Supabase community discussions + own design
-- Migration: 004_households.sql

CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, user_id)
);

CREATE TABLE public.household_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_email TEXT,                          -- NULL for shareable link, set for email invite
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_at TIMESTAMPTZ,                          -- NULL until accepted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add household_id to existing tables (nullable = solo users still work)
ALTER TABLE public.dishes
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;

ALTER TABLE public.weekly_plans
  ADD COLUMN household_id UUID REFERENCES public.households(id) ON DELETE SET NULL;
-- Note: weekly_plans UNIQUE constraint is (user_id, week_start).
-- In household mode, multiple users share one plan; the constraint needs rethinking.
-- Solution: when a household exists, create ONE weekly_plan per household per week,
--           owned by the household (household_id set, user_id = creator for audit).
--           The UNIQUE constraint (user_id, week_start) becomes (household_id, week_start)
--           when household_id is not null. This requires a partial unique index.

-- Enable Realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.household_members;
```

### Pattern 4: Invite Token Flow

**Shareable Link (new user):**
```
1. Member generates invite → creates household_invites row with token, no email
2. Shareable URL: https://app.com/einladen?token=<hex>
3. Guest visits URL → check token validity (not expired, not used)
4. If guest has no account → redirect to /registrieren?invite=<token>
5. Registration component: reads invite param from URL, stores in sessionStorage
6. After successful signup, registration component reads token from sessionStorage
   → calls acceptInvite(token, newUserId) to add to household_members
7. Mark invite as used (used_at = NOW())
```

**Email Invite (existing or new user):**
```
1. Member submits email → Angular calls Edge Function (POST /functions/v1/invite-user)
2. Edge Function (service-role key available via Deno.env):
   a. Creates household_invites row with token AND invited_email
   b. Calls supabase.auth.admin.inviteUserByEmail(email, { redirectTo: '...' })
      - If user already exists: inviteUserByEmail still sends a magic link
3. User clicks email link → Supabase Auth redirects to /einladen-bestaetigen
4. Accept-invite component: reads token from URL, calls acceptInvite()
```

**Critical:** `auth.admin.inviteUserByEmail()` requires the **service-role key**, which must NEVER be in the Angular frontend bundle. It MUST be called from a Supabase Edge Function. This is non-negotiable for security.

### Pattern 5: Data Migration on Household Create/Join

**Create household (first user):**
```typescript
// Source: own design based on Supabase patterns
async createHousehold(name: string): Promise<void> {
  const user = await this.supabase.client.auth.getUser();
  const userId = user.data.user!.id;

  // 1. Create household
  const { data: household } = await this.supabase.client
    .from('households')
    .insert({ name, owner_id: userId })
    .select()
    .single();

  // 2. Add creator as owner member
  await this.supabase.client
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId, role: 'owner' });

  // 3. Migrate existing dishes to the household
  await this.supabase.client
    .from('dishes')
    .update({ household_id: household.id })
    .eq('user_id', userId)
    .is('household_id', null);       // Only migrate unassigned dishes

  // 4. Migrate existing weekly_plans
  await this.supabase.client
    .from('weekly_plans')
    .update({ household_id: household.id })
    .eq('user_id', userId)
    .is('household_id', null);
}
```

**Join household (invited user — merge dishes):**
```typescript
async joinHousehold(householdId: string, userId: string): Promise<void> {
  // 1. Add user as member
  await this.supabase.client
    .from('household_members')
    .insert({ household_id: householdId, user_id: userId, role: 'member' });

  // 2. Merge dishes: assign user's solo dishes to the household
  await this.supabase.client
    .from('dishes')
    .update({ household_id: householdId })
    .eq('user_id', userId)
    .is('household_id', null);

  // 3. Weekly plans: user adopts the household's plans (no migration needed —
  //    their future queries will return household plans via new RLS policy)
  //    Old solo plans remain with user_id but household_id = NULL (not shared)
}
```

### Pattern 6: Activity Feed (Claude's Discretion Recommendation)

**Recommendation:** Notification bell in the navbar (desktop and mobile), showing last N household events. Feed data sourced from a `household_activity` table populated by Postgres triggers on `dishes` and `meal_assignments`.

**Why notification bell over settings section:**
- The settings page is accessed infrequently; activity is time-sensitive
- A bell badge (unread count) communicates new activity at a glance
- Consistent with mobile UX conventions families expect

**Minimal activity log table:**
```sql
CREATE TABLE public.household_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('dish_added', 'dish_updated', 'dish_deleted', 'plan_changed')),
  subject_name TEXT,                  -- e.g. dish name or day name
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This table is append-only and written via service calls (not triggers, to keep migration simple). The Realtime subscription on `household_activity` drives both the feed and the toast display.

**Toast pattern (uses existing MatSnackBar):**
```typescript
// Source: Angular Material docs https://material.angular.dev/components/snack-bar/overview
// Already used in DishesComponent and MealPlanComponent
this.snackBar.open(
  `${actorName} hat ${subjectName} ${eventLabel}`,
  '',
  { duration: 4000, horizontalPosition: 'end', verticalPosition: 'bottom' }
);
```

### Anti-Patterns to Avoid

- **Calling `auth.admin.inviteUserByEmail` from Angular frontend:** Exposes service-role key in browser. Always use an Edge Function.
- **Subscribing without cleanup:** Supabase channels consume server-side resources and hold WebSocket connections. Always call `supabase.removeChannel(channel)` in `DestroyRef.onDestroy` or `ngOnDestroy`.
- **One channel per component instance:** Multiple components will re-render on navigation. A singleton `RealtimeService` (providedIn: 'root') that owns channel lifecycle prevents duplicate subscriptions.
- **Filtering `meal_assignments` by `household_id` in Realtime filter:** `meal_assignments` doesn't have a `household_id` column. Rely on RLS (membership check via `weekly_plans`) to filter — subscribing with no filter is fine when RLS blocks unauthorized rows.
- **NOT using `(SELECT auth.uid())` wrapper in new RLS policies:** Every prior migration uses this optimization. Breaking the pattern here would introduce a performance regression.
- **Making `household_id` NOT NULL immediately:** Existing users have no household. Making the column nullable is the only backwards-compatible migration path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket connection management | Custom WebSocket client | `supabase.channel()` API | Supabase handles reconnection, heartbeat, auth token refresh |
| Invite email delivery | Custom SMTP/nodemailer in frontend | Supabase Edge Function + `inviteUserByEmail` | Service-role key security; Supabase handles email deliverability |
| Duplicate event deduplication | Custom event ID tracking | Rely on Supabase Realtime's built-in delivery guarantees | For a family app (< 10 concurrent), duplicate events are rare; "last write wins" is acceptable |
| Realtime authorization checks | Custom middleware | Supabase RLS policies on tables | Server enforces RLS before broadcasting — no client-side filtering needed |
| Token generation for invite links | Custom UUID/random generator | `DEFAULT encode(gen_random_bytes(32), 'hex')` in SQL | Cryptographically secure, server-generated, no client trust required |

**Key insight:** Supabase Realtime + RLS is a complete security model. Do not add application-layer authorization checks on top of it — they create inconsistency.

---

## Common Pitfalls

### Pitfall 1: weekly_plans UNIQUE Constraint Conflict

**What goes wrong:** The existing `UNIQUE (user_id, week_start)` constraint on `weekly_plans` assumes one plan per user per week. In household mode, multiple users share ONE plan per week — so two members trying to upsert the same week would both pass the constraint (different `user_id` values) and create duplicate plans.

**Why it happens:** The constraint was designed for solo mode. Household mode requires a different uniqueness model: one plan per household per week.

**How to avoid:** Add a partial unique index for household plans:
```sql
-- Allows multiple solo plans (household_id IS NULL) but only one per household per week
CREATE UNIQUE INDEX idx_weekly_plans_household_week
ON public.weekly_plans (household_id, week_start)
WHERE household_id IS NOT NULL;
```
HouseholdService's `getOrCreateWeeklyPlan` must query by `household_id` when a household exists, not by `user_id`.

**Warning signs:** Two weekly plan rows for the same week appearing in the household view.

### Pitfall 2: Realtime Subscription Before Household ID is Known

**What goes wrong:** Component subscribes to realtime channel at initialization, but `householdId` is `null` for solo users. Subscribing with `filter: 'household_id=eq.null'` never matches any row and silently fails to deliver events.

**Why it happens:** Component lifecycle runs before async household membership check completes.

**How to avoid:** Subscribe to realtime only after `HouseholdService` confirms a non-null `householdId`. Use an Angular `effect()` that watches the `householdId` signal:
```typescript
effect(() => {
  const hid = this.householdService.currentHouseholdId();
  if (hid) {
    this.realtimeService.subscribeToHousehold(hid, ...);
  }
});
```

**Warning signs:** No toasts appearing when a collaborator makes changes; realtime subscription status never reaches 'SUBSCRIBED'.

### Pitfall 3: RLS Policy Blocks Realtime Events Despite Being a Member

**What goes wrong:** User is a household member but receives no realtime events for dish changes. Subscription status shows 'SUBSCRIBED' but payloads never arrive.

**Why it happens:** The Realtime server checks each subscriber's RLS before broadcasting. If the SELECT policy on `dishes` doesn't yet include the household-membership check, the server concludes the user cannot see the row and suppresses the event.

**How to avoid:** RLS SELECT policies on `dishes`, `weekly_plans`, and `meal_assignments` MUST include the household-membership subquery (Pattern 2 above). Deploy the updated RLS policies in the same migration as enabling Realtime on those tables.

**Warning signs:** Direct `SELECT` queries work fine (user sees household dishes) but Realtime events for those same rows are never delivered.

### Pitfall 4: Email Invite Requires Service-Role Key — Never in Frontend

**What goes wrong:** Developer calls `supabase.auth.admin.inviteUserByEmail()` directly from the Angular service. The app requires the service-role key in `environment.ts`, which ships to the browser and is visible to anyone who views source.

**Why it happens:** The `admin` API namespace is easy to accidentally use in Angular since the same `@supabase/supabase-js` package exposes it.

**How to avoid:** The email invite button in the Angular UI must call a Supabase Edge Function via `supabase.functions.invoke('invite-user', { body: { email, householdId } })`. The Edge Function reads `SUPABASE_SERVICE_ROLE_KEY` from Deno environment variables (set in Supabase project secrets, never in the repo).

**Warning signs:** `environment.ts` contains a key starting with `eyJ...` that is NOT the anon/publishable key (longer, higher-privilege). Or `auth.admin` is imported in any Angular service file.

### Pitfall 5: Invite Token Lost Through Registration Redirect

**What goes wrong:** Invited user without account clicks shareable link → `/einladen?token=abc` → redirected to `/registrieren` → completes registration → token is gone from the URL, household join never happens.

**Why it happens:** Angular router navigation clears query params unless explicitly preserved. `sessionStorage` is cleared when the browser tab closes.

**How to avoid:**
1. Pass token as a query param through the redirect: `/registrieren?invite=abc`
2. Registration component reads `invite` param and stores it in `sessionStorage` immediately
3. After `signUp()` success, read from `sessionStorage` before navigating away
4. Call `acceptInvite(token)` before navigating to the main app
5. Clear from `sessionStorage` after acceptance

Use Angular Router's `ActivatedRoute.snapshot.queryParamMap.get('invite')` — this is synchronous and available before the async signup call.

### Pitfall 6: activity_feed Table Under-Populated (Missing Triggered Events)

**What goes wrong:** Some member actions (e.g., plan generation that does a bulk upsert) skip the activity log because the Angular service calls `MealPlanService.generate()` directly without calling `HouseholdService.logActivity()`.

**Why it happens:** Activity logging is an afterthought added at the service layer, and each service method must explicitly call it.

**How to avoid:** Consider a Postgres trigger on `dishes` and `meal_assignments` to write to `household_activity` automatically. This guarantees all changes are logged regardless of which code path triggered them:
```sql
CREATE OR REPLACE FUNCTION public.log_household_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.household_id IS NOT NULL THEN
    INSERT INTO public.household_activity (household_id, actor_id, actor_name, event_type, subject_name)
    VALUES (
      NEW.household_id,
      (SELECT auth.uid()),
      (SELECT display_name FROM public.profiles WHERE id = (SELECT auth.uid())),
      TG_TABLE_NAME || '_' || lower(TG_OP),
      NEW.name   -- or NEW.day_of_week::text for meal_assignments
    );
  END IF;
  RETURN NEW;
END;
$$;
```

**Warning signs:** Activity feed shows only some changes, or feed is empty despite members actively editing.

---

## Code Examples

Verified patterns from official sources:

### Realtime Channel — Subscribe and Unsubscribe
```typescript
// Source: https://supabase.com/docs/guides/realtime/postgres-changes
// Subscription with filter
const channel = supabase
  .channel('household-dishes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'dishes',
      filter: `household_id=eq.${householdId}`,
    },
    (payload) => {
      // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      // payload.new: new record (null for DELETE)
      // payload.old: old record (primary key only unless REPLICA IDENTITY FULL)
      console.log(payload);
    }
  )
  .subscribe((status) => {
    // status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'
    if (status === 'SUBSCRIBED') {
      console.log('Realtime connected for household', householdId);
    }
  });

// Cleanup (in DestroyRef.onDestroy or ngOnDestroy):
supabase.removeChannel(channel);
```

### Enable Realtime on Tables (Migration SQL)
```sql
-- Source: https://supabase.com/docs/guides/realtime/postgres-changes
-- Add tables to the supabase_realtime publication
-- Run in migration file (004_households.sql or a subsequent migration)
ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.household_activity;
```

### Edge Function — Email Invite
```typescript
// Source: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
// supabase/functions/invite-user/index.ts (Deno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { email, householdId, householdName } = await req.json();

  // Service role client — reads from Deno env (set via `supabase secrets set`)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Create invite record first to get the token
  const { data: invite } = await supabaseAdmin
    .from('household_invites')
    .insert({ household_id: householdId, invited_email: email, created_by: /* from JWT */ null })
    .select()
    .single();

  // Send email invite via Supabase Auth admin API
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `https://your-app.com/einladen-bestaetigen?token=${invite.token}`,
    data: { household_id: householdId, household_name: householdName }
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### Angular: Calling Edge Function from Frontend
```typescript
// Source: @supabase/supabase-js docs
// In HouseholdService
async inviteByEmail(email: string, householdId: string, householdName: string): Promise<void> {
  const { error } = await this.supabase.client.functions.invoke('invite-user', {
    body: { email, householdId, householdName }
  });
  if (error) throw error;
}
```

### Shareable Link — Generate and Validate
```typescript
// Generate (any authenticated member):
async generateInviteLink(householdId: string): Promise<string> {
  const { data, error } = await this.supabase.client
    .from('household_invites')
    .insert({
      household_id: householdId,
      created_by: (await this.supabase.client.auth.getUser()).data.user!.id
      // invited_email: null (link-based, not email-based)
    })
    .select('token')
    .single();
  if (error) throw error;
  return `${window.location.origin}/einladen?token=${data.token}`;
}

// Validate (in AcceptInviteComponent):
async validateToken(token: string): Promise<{ valid: boolean; householdId?: string }> {
  const { data } = await this.supabase.client
    .from('household_invites')
    .select('household_id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (!data) return { valid: false };
  const expired = new Date(data.expires_at) < new Date();
  const used = data.used_at !== null;
  return { valid: !expired && !used, householdId: data.household_id };
}
```

### Angular DestroyRef Pattern for Cleanup
```typescript
// Source: https://angular.dev/api/core/DestroyRef
// Modern Angular pattern — no ngOnDestroy interface required
@Component({ ... })
export class DishesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private realtimeService = inject(RealtimeService);

  ngOnInit(): void {
    this.realtimeService.subscribeToHousehold(
      this.householdId,
      (payload) => this.onDishChange(payload)
    );

    // Cleanup channel on component destroy
    this.destroyRef.onDestroy(() => {
      this.realtimeService.unsubscribeFromHousehold(this.householdId);
    });
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase.from().on()` (v1 Realtime API) | `supabase.channel().on('postgres_changes', ...).subscribe()` | supabase-js v2 | Old API is removed; v2 channel API is what `@supabase/supabase-js` ^2.95.3 provides |
| `inviteUserByEmail` from frontend | Edge Function + service-role key | Always was requirement | Calling admin API from frontend was never correct; service-role key security |
| `ngOnDestroy` for cleanup | `DestroyRef.onDestroy()` | Angular 16+ | Both still work; `DestroyRef` is cleaner and works outside component classes |
| Anon key in environments | Publishable key (`sb_publishable_xxx`) | Supabase 2024-2025 | This project already uses `supabasePublishableKey` — already current |

**Deprecated/outdated:**
- `supabase.removeAllChannels()`: Still works but prefer `removeChannel(specificChannel)` to avoid accidentally removing channels managed by other services.
- Old-style `supabase_realtime` publication with `FOR ALL TABLES`: Creates unnecessary replication load. Use `ADD TABLE` per table instead.

---

## Open Questions

1. **weekly_plans UNIQUE constraint and household mode**
   - What we know: Current `UNIQUE (user_id, week_start)` works for solo. Household needs one plan per household per week, shared by all members.
   - What's unclear: Does the migration drop the old constraint and add a new one, or add a partial index alongside? Dropping the constraint risks breaking existing solo data integrity.
   - Recommendation: Keep the existing constraint (protects solo users), add a separate `CREATE UNIQUE INDEX ... WHERE household_id IS NOT NULL` partial index for household mode. Both constraints coexist safely.

2. **meal_assignments Realtime filter — household_id absent**
   - What we know: `meal_assignments` does not have a `household_id` column; it links via `weekly_plan_id`. The `filter` param in `postgres_changes` only supports direct column comparisons, not joins.
   - What's unclear: Will subscribing without a filter on `meal_assignments` cause performance concerns as the household grows?
   - Recommendation: Subscribe without filter. RLS policies already ensure each subscriber only receives rows they're authorized to see. For a family app with < 10 members, this is acceptable. If `meal_assignments` were high-frequency (it's not in this app), adding a denormalized `household_id` column would be the solution.

3. **Supabase Edge Functions deployment for Supabase hosted project**
   - What we know: Edge Functions are deployed via `supabase functions deploy invite-user`. The project uses a hosted Supabase instance (not local-only).
   - What's unclear: Whether the planning phase should include Edge Function local development setup steps or assume the Supabase CLI is already configured for function deployment.
   - Recommendation: Include Edge Function deployment steps in the plan. The project has `supabase/` directory already.

4. **category_preferences in household mode**
   - What we know: `category_preferences` is `user_id`-scoped. These are personal preferences for how many meals of each category per week. They do not need to be shared.
   - What's unclear: When two household members have different preferences, the plan generator uses whose preferences?
   - Recommendation: Keep `category_preferences` user-scoped (no migration needed). Each member sees their own preferences. The meal plan generator uses the current user's preferences when generating. This is out of scope for Phase 4 to resolve — defer the "whose preferences" question.

---

## Sources

### Primary (HIGH confidence)
- `https://supabase.com/docs/guides/realtime/postgres-changes` — Full channel API, filter syntax, RLS behavior, cleanup
- `https://supabase.com/docs/guides/realtime/authorization` — Private channels, RLS on `realtime.messages`, JWT caching notes
- `https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail` — Admin API requires service-role key confirmed
- `https://supabase.com/docs/guides/realtime/concepts` — Channel types, connection pool sizes, architecture
- `https://supabase.com/docs/guides/database/postgres/row-level-security` — Subquery patterns for multi-table policies
- `T:\test-repos-26-02\mahl-zeit-planer\supabase\migrations\` — Actual migration files (001, 002, 003) confirming patterns in use
- `T:\test-repos-26-02\mahl-zeit-planer\package.json` — Confirmed: `@supabase/supabase-js` ^2.95.3, `@angular/material` ^21.1.4, no new deps needed
- `https://angular.dev/api/core/DestroyRef` — Modern cleanup pattern

### Secondary (MEDIUM confidence)
- `https://github.com/orgs/supabase/discussions/6055` — Community discussion confirming Supabase does not provide built-in multi-tenant invite; custom invite table is the standard pattern
- `https://supabase.com/blog/realtime-row-level-security-in-postgresql` — Realtime + RLS integration blog confirming server-side RLS check before broadcast
- WebSearch results confirming: `postgres_changes` respects RLS, `inviteUserByEmail` requires admin key, `ALTER PUBLICATION supabase_realtime ADD TABLE` is the SQL to enable realtime per-table

### Tertiary (LOW confidence — needs validation)
- Claim that `REPLICA IDENTITY FULL` is needed to receive full old-record data on DELETE: confirmed by documentation but the exact migration SQL for enabling it per-table was not verified with a code example. Planner should research `ALTER TABLE ... REPLICA IDENTITY FULL` if DELETE events need the full old record (likely needed for "dish deleted" toasts to show the dish name).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries confirmed in package.json; Realtime API verified against current Supabase docs
- Architecture (data model): HIGH — Based on actual migration files and Supabase RLS documentation
- Invite flow: MEDIUM — Custom invite table pattern is community-verified; Edge Function email path is confirmed by docs; token-through-registration flow is designed but not verified against a live implementation
- Realtime patterns: HIGH — Channel API verified against current docs (supabase-js v2)
- Pitfalls: HIGH for DB/RLS pitfalls (based on actual codebase review); MEDIUM for invite token preservation (based on community discussions)

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (Supabase Realtime API is stable; Angular 21 patterns are stable)
