# Domain Pitfalls

**Domain:** Family Meal Planning Web Application
**Researched:** 2026-02-16
**Confidence:** MEDIUM

## Critical Pitfalls

Mistakes that cause rewrites or major security issues.

### Pitfall 1: RLS Not Enabled on Tables

**What goes wrong:**
Database tables created via SQL migrations have RLS disabled by default. Without RLS, all data becomes publicly accessible through the Supabase API using the `anon` key. In January 2025, CVE-2025-48757 exposed 170+ apps where 83% of exposed databases involved RLS misconfigurations.

**Why it happens:**
Developers focus on writing RLS policies but forget the critical first step: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`. The Supabase dashboard doesn't warn when tables lack RLS, and empty query results (when RLS is enabled without policies) look identical to working queries during development.

**How to avoid:**
- Always run `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;` immediately after creating any table
- Create a checklist for every new table: (1) Create table, (2) Enable RLS, (3) Write policies, (4) Test with client SDK
- Use Supabase dashboard "Table Editor" to verify RLS status (shield icon shows enabled/disabled)
- Never test policies from SQL Editor—it bypasses RLS and gives false confidence

**Warning signs:**
- Queries work perfectly in SQL Editor but fail silently in the app
- Dashboard shows policies but shield icon is gray/disabled on table
- `anon` key can fetch data it shouldn't access when tested with curl

**Phase to address:**
Phase 1 (Database Setup) - Create RLS checklist and enable by default for all tables. Phase 2 (Authentication) - Verify policies work correctly from client SDK.

---

### Pitfall 2: Using `raw_user_meta_data` for Family Member Roles

**What goes wrong:**
Storing family member roles (e.g., "admin", "member") in `raw_user_meta_data` allows authenticated users to elevate their privileges by calling `supabase.auth.update()` with modified metadata. A child account could grant itself admin privileges and delete the family's meal plans.

**Why it happens:**
The Supabase documentation mentions "user metadata" without clearly distinguishing writable (`raw_user_meta_data`) from read-only (`raw_app_meta_data`). Developers assume any auth metadata is secure because it's in the auth schema.

**How to avoid:**
- Store family membership and roles in a separate `family_members` table with RLS policies
- Use `auth.uid()` in RLS policies to verify membership, not metadata fields
- Structure: `family_members(id, family_id, user_id, role, created_at)` with policy `auth.uid() = user_id`
- Only use `raw_app_meta_data` for authorization data if needed (requires server-side admin API to write)

**Warning signs:**
- RLS policies reference `auth.jwt() ->> 'raw_user_meta_data'`
- User profile updates modify authorization-related fields
- No separate table for family membership relationships

**Phase to address:**
Phase 1 (Database Setup) - Design family membership table. Phase 2 (Authentication) - Implement proper role-based RLS policies.

---

### Pitfall 3: Supabase Realtime Subscriptions Not Cleaned Up

**What goes wrong:**
Angular components subscribe to Supabase Realtime channels but don't unsubscribe in `ngOnDestroy()`. Each navigation creates new WebSocket connections and event listeners that accumulate, causing memory leaks. After 200 concurrent connections (free tier limit), new connections fail silently.

**Why it happens:**
Supabase examples show subscription setup but rarely demonstrate cleanup. Angular developers accustomed to RxJS auto-unsubscribe via `async` pipe don't realize Supabase subscriptions require manual cleanup.

**How to avoid:**
```typescript
export class MealPlanComponent implements OnInit, OnDestroy {
  private subscription: RealtimeChannel | null = null;

  ngOnInit() {
    this.subscription = this.supabase
      .channel('meal-plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plans' },
         (payload) => this.handleChange(payload))
      .subscribe();
  }

  ngOnDestroy() {
    // Critical: Always unsubscribe
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
```

**Warning signs:**
- Browser DevTools Network tab shows increasing WebSocket connections during navigation
- Memory usage climbs continuously as users navigate between pages
- Console errors: "Maximum concurrent connections reached"
- Realtime features stop working after extended app usage

**Phase to address:**
Phase 3 (Realtime Features) - Establish cleanup pattern before implementing any subscriptions. Add linting rule to detect components with subscriptions but no `ngOnDestroy`.

---

### Pitfall 4: Free Tier Project Pausing Kills Production

**What goes wrong:**
Supabase free tier projects automatically pause after 7 days of inactivity (no API requests). When a family doesn't use the app for a week (e.g., vacation), the project pauses and all functionality breaks until manually resumed in the dashboard. Users perceive this as "the app is broken."

**Why it happens:**
Developers test locally where activity is constant, or they test for a few days post-launch when usage is high. The free tier documentation mentions pausing but doesn't emphasize that "inactivity" means zero API requests—even from a deployed frontend.

**How to avoid:**
- **For production**: Upgrade to Pro tier ($25/month) which eliminates auto-pausing
- **For pre-launch**: Set up a cron job (e.g., GitHub Actions, Vercel Cron) to ping a health-check endpoint every 6 days
- **MVP alternative**: Show a banner: "Free tier may pause after 7 days of inactivity. Upgrade for 24/7 availability."
- Monitor project status via Supabase dashboard or API

**Warning signs:**
- Deployed app works perfectly for days, then suddenly all API calls return 503
- Supabase dashboard shows "Project Paused" status
- Users report "app stopped working" after period of non-use

**Phase to address:**
Phase 0 (Infrastructure Planning) - Decide on free tier vs. Pro based on expected usage patterns and reliability requirements. If free tier chosen, implement keepalive strategy before launch.

---

### Pitfall 5: Algorithm Complexity Explosion with Variety Constraints

**What goes wrong:**
The meal plan generation algorithm needs to balance category rules (e.g., "2x Fish, 3x Meat, 2x Vegetarian per week"), favorite meals, and variety (avoid repeating meals too frequently). As constraints increase, finding a valid combination becomes computationally expensive. With 50+ dishes and strict variety rules, generation can take 30+ seconds or fail to find solutions.

**Why it happens:**
This is a constraint satisfaction problem similar to the multi-dimensional knapsack problem. Naive approaches try random combinations or exhaustive search. Developers underestimate complexity, thinking "it's just picking 7 meals from a list."

**How to avoid:**
- **Phase 1**: Implement simple random selection with category constraints only (no variety constraints). Establish performance baseline.
- **Phase 2**: Add variety via greedy algorithm with backtracking:
  1. Track last N weeks of generated plans
  2. Score each dish: (category match) + (is favorite) - (recent usage penalty)
  3. Select highest-scoring dish for each day, backtrack if category quota violated
- **Set limits**: Maximum backtrack depth (10 iterations), timeout (5 seconds), fallback to "best effort" plan
- **Algorithm validation**: If generation fails, relax constraints progressively (variety → favorites → strict categories)
- Consider PostgreSQL-based generation using recursive CTEs for constraint evaluation

**Warning signs:**
- Plan generation takes >3 seconds during testing with 20 dishes
- Algorithm frequently fails to generate plans with "no valid solution"
- Users with large dish libraries (100+) report timeouts
- CPU spikes to 100% during generation on client side

**Phase to address:**
Phase 2 (Core Functionality - Algorithm) - Implement with fallback strategies. Phase 4 (Performance Optimization) - Profile and optimize if needed.

---

### Pitfall 6: Text Expansion Breaks German UI Layout

**What goes wrong:**
UI designed with English text looks perfect, but German translations are 30-40% longer. Buttons overflow, navigation menus wrap awkwardly, and cards break layout. Words like "Fish" (4 chars) become "Fisch" (5 chars), but "Vegetarian" (10 chars) becomes "Vegetarisch" (12 chars), and compound phrases expand even more.

**Why it happens:**
Developers design layouts with fixed widths or tight spacing based on English content length. Angular i18n is implemented after UI is complete, as an afterthought. German's tendency for long compound words (Wochenspeiseplan = weekly meal plan) amplifies the problem.

**How to avoid:**
- Design UI with 40% extra space from the start (minimum button width, flexible containers)
- Use CSS `overflow: hidden; text-overflow: ellipsis;` for constrained spaces
- Test with German translations during initial development, not at the end
- Use Angular i18n's built-in template syntax: `<span i18n="@@mealPlanTitle">Meal Plan</span>`
- Provide translation context with descriptions: `<span i18n="Button to generate new meal plan|@@generateButton">Generate</span>`
- Consider icon + text buttons instead of text-only for space efficiency

**Warning signs:**
- Fixed-width buttons (e.g., `width: 120px;`)
- Hardcoded strings in TypeScript files instead of templates
- No translation context attributes (`i18n="contextDescription|@@customId"`)
- Layout tested only with English content

**Phase to address:**
Phase 1 (UI Foundation) - Implement i18n infrastructure from the start, test with German immediately. Phase 2 (Feature Implementation) - Mark all text for translation as features are built.

---

### Pitfall 7: Angular SSR + Vercel Environment Variable Leakage

**What goes wrong:**
Angular apps with Server-Side Rendering on Vercel expose server-side environment variables to the client bundle if `process.env` is accessed incorrectly. The Supabase `service_role` key (which bypasses RLS) could leak to the browser, granting users admin-level database access.

**Why it happens:**
Vercel documentation mentions `process.env` works in SSR contexts, but Angular's build process bundles server code differently. Developers copy environment variable patterns from Node.js apps without understanding Angular's build phases. `process.env` is often undefined in Angular SSR unless explicitly configured.

**How to avoid:**
- **Never use service_role key in Angular code** (not even in server-side SSR code)
- Store secrets in Vercel environment variables with `NEXT_PUBLIC_` prefix ONLY for public keys
- Use Angular's `environment.ts` files for client-side config:
  ```typescript
  // environment.ts
  export const environment = {
    supabaseUrl: 'https://xxx.supabase.co',
    supabaseAnonKey: 'public_anon_key_safe_to_expose'
  };
  ```
- For server-side operations requiring service_role, create Vercel serverless functions (separate from Angular build)
- Audit code for any `process.env` references and replace with environment object

**Warning signs:**
- `process.env` referenced anywhere in Angular components or services
- Environment variables accessed outside `environment.ts` configuration files
- Service role key stored in any frontend-accessible location
- Vercel environment variables without clear public/private designation

**Phase to address:**
Phase 1 (Infrastructure Setup) - Configure environment variables correctly. Phase 2 (Authentication) - Security audit before connecting to Supabase.

---

## Moderate Pitfalls

Mistakes that cause delays or user frustration but are recoverable.

### Pitfall 8: Meal Plan Regeneration Overwrites Manual Edits

**What goes wrong:**
Users manually adjust an auto-generated meal plan (swap Fish for Vegetarian on Wednesday), then click "Regenerate" expecting a new plan. The app overwrites their edits without warning, losing their customizations.

**Prevention:**
- Implement "draft" vs. "confirmed" plan states
- Show warning modal: "Regenerating will discard your changes. Continue?"
- Offer "Regenerate from scratch" vs. "Adjust current plan" options
- Store edit history for one-level undo

---

### Pitfall 9: Category Quota Confusion ("2x Fish per Week" Ambiguity)

**What goes wrong:**
Users set "2x Fish per week" but the algorithm interprets this as "exactly 2" (rigid) when users meant "at least 2" (minimum). Or algorithm allows "0-2 Fish" when users expected exactly 2. Requirements are ambiguous, leading to unexpected plans.

**Prevention:**
- UI explicitly states "Exactly X per week" vs. "At least X per week" vs. "Up to X per week"
- Default to "At least" interpretation with explanation tooltip
- Provide example: "At least 2x Fish = 2-7 fish meals possible"
- Allow users to toggle constraint mode per category

---

### Pitfall 10: Favorite Meals Never Rotate Out

**What goes wrong:**
Algorithm heavily weights "favorite" meals to satisfy users, but with 5 favorites and 7-day plans, the same meals repeat every 1-2 weeks. Favorites become boring, defeating the variety goal.

**Prevention:**
- Limit favorites to 20% of any single week's plan (max 1-2 meals)
- Track favorite meal frequency and apply diminishing returns: `favoriteBonus = baseFavoriteBonus / (1 + recentUseCount)`
- UI sets expectations: "Favorites appear regularly but not every week"
- Allow "tired of this meal" temporary exclusion (cooldown period)

---

### Pitfall 11: No Handling for Insufficient Dishes

**What goes wrong:**
User has 5 dishes (2 Fish, 1 Meat, 2 Vegetarian) and sets constraints "2x Fish, 3x Meat, 2x Vegetarian." Algorithm can't satisfy constraints and shows error "Unable to generate plan" with no guidance.

**Prevention:**
- Validate constraints against available dishes before generation
- Show warning: "You need at least 3 Meat dishes to satisfy '3x Meat per week'. You have 1. Add more or adjust constraints."
- Suggest specific actions: "Add 2 more Meat dishes" button navigates to dish creation
- Fallback: Generate "best effort" plan with explanation of unmet constraints

---

### Pitfall 12: Family Member Removal Breaks Meal Plan Ownership

**What goes wrong:**
Meal plans are tied to the user who created them. When a family member leaves or is removed, their plans become orphaned (no owner) or inaccessible, breaking UI queries that expect a valid creator.

**Prevention:**
- Meal plans should be owned by `family_id`, not individual `user_id`
- Track creator as metadata (`created_by_user_id`) but don't use for RLS
- RLS policy: `family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())`
- When member removed, retain their historical contributions

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code 7-day week | Simpler algorithm, no date complexity | Can't support flexible plan lengths (5-day weekdays, 14-day biweekly) | MVP only, refactor in Phase 3 |
| Store generated plans as JSON array | Single database field, easy to implement | Can't query meals within plans, reporting breaks, hard to migrate | Never—use proper relational structure |
| Skip "previous plans" tracking | Faster implementation, no history table | Can't analyze variety over time, favorites based on single week | MVP only if variety constraints simple |
| Use Angular built-in i18n (compile-time) | Zero runtime overhead, official approach | Can't switch language without rebuild, requires multiple deploys | Acceptable if only German supported |
| Client-side algorithm execution | No backend needed, simple architecture | Slow for large dish libraries, can't leverage PostgreSQL constraints | Acceptable for <50 dishes, <5 sec generation |
| Combine dish creation + category in one form | Faster UX, fewer clicks | Can't reuse categories, category list grows uncontrolled | MVP only, extract category management later |

---

## Integration Gotchas

Common mistakes when connecting external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth | Checking `session` once in `AppComponent` and assuming it persists | Use `supabase.auth.onAuthStateChange()` to handle session refresh/expiry |
| Vercel Deployment | Using `ng build` instead of `ng build --configuration production` | Configure vercel.json with proper build command: `ng build --prod` |
| Supabase Storage (for dish photos) | Not setting CORS policies, uploads fail from frontend | Configure CORS in Supabase Storage settings for your domain |
| Angular Signals + Supabase | Reading signals inside Supabase callbacks creates untracked dependencies | Use `untracked()` when reading signals in async callbacks: `untracked(() => this.mySignal())` |
| Vercel Cron Jobs (keepalive) | Setting cron to call frontend URL which just renders HTML | Create API endpoint in Vercel Functions that makes actual Supabase query |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all family dishes on app init | App loads slowly, network tab shows large JSON payload | Lazy-load dishes when needed, paginate dish library, search-as-you-type | >100 dishes per family |
| Realtime subscription to entire `dishes` table | Every family sees every other family's dish updates, excessive messages | Subscribe to specific family: `filter: 'family_id=eq.' + familyId` | >50 active families |
| Regenerating plans on every constraint change | UI lags as users adjust sliders, users wait for each change | Debounce generation (wait 500ms after last change), show "Generating..." state | >30 dishes, complex constraints |
| Storing meal plan history without limit | Database grows indefinitely, queries slow | Retain last 52 weeks (1 year), archive or delete older plans | After 1 year of active use |
| N+1 query for meal plan display | Fetches plan, then fetches each dish individually (7 queries) | Use Supabase joins: `select('*, dishes(*)')` to fetch in one query | Any scale—fix immediately |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allowing family member invites without verification | Attackers join random families by guessing IDs, access private meal data | Use invite tokens (UUID), expire after 7 days, require email verification |
| Exposing other families' dish names in search | Privacy leak—users see neighbors' custom dishes | RLS on dishes table, filter by `family_id` in all queries |
| No rate limiting on plan generation | Resource exhaustion—malicious user generates 1000 plans/minute | Supabase Edge Functions with rate limiting, or client-side debounce + daily quota |
| Shared family account for all members | Can't track who made changes, no individual preferences | One user account per person, family membership table links them |
| Storing dietary restrictions in public profile | Medical data exposed (e.g., "allergic to shellfish") | Separate table with stricter RLS, only accessible to family members |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Auto-generating plan on first login with no dishes | Empty or error-filled plan, confusing first impression | Onboarding flow: (1) Add 10 dishes → (2) Set preferences → (3) Generate first plan |
| No visual indication of which days are Fish/Meat/Vegetarian | Users can't verify category rules were followed | Color-code meal cards by category, show category icons |
| "Regenerate" button without preview | Users gamble on whether new plan is better | Show preview comparison: "Current plan vs. New plan" with Accept/Reject |
| Requiring exact category counts (2+3+2=7) for 7-day week | Users frustrated by math, can't create valid constraints | Auto-calculate remaining slots: "2 Fish, 3 Meat, ? Vegetarian (2 remaining)" |
| Hiding manual edit option | Users feel trapped by algorithm, abandon app | Always show "Edit Plan" button, allow drag-and-drop meal swapping |
| No explanation when generation fails | Users don't know if bug or data issue | Specific error messages: "Not enough Vegetarian dishes. You have 1, need 2. Add dishes or reduce constraint." |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Meal Plan Generation:** Often missing variety tracking across multiple weeks—verify algorithm doesn't repeat same meal every Monday
- [ ] **Family Sharing:** Often missing invite expiration and revocation—verify invites expire and can be cancelled
- [ ] **Dish Library:** Often missing duplicate detection—verify can't add "Spaghetti Bolognese" twice with slightly different names
- [ ] **Authentication:** Often missing session refresh handling—verify app handles expired sessions gracefully without logout loop
- [ ] **German Localization:** Often missing date/number formatting—verify dates show "13.4.2026" not "4/13/2026", numbers use comma decimal separator
- [ ] **Category Constraints:** Often missing validation on save—verify can't set constraints requiring more dishes than exist
- [ ] **Realtime Updates:** Often missing cleanup on navigation—verify WebSocket connections close when leaving pages
- [ ] **RLS Policies:** Often missing edge cases—verify policies work for new family members, removed members, and users with no family

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS not enabled | MEDIUM | Enable RLS immediately: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`. Verify policies work. Check audit logs for unauthorized access. |
| Memory leak from subscriptions | LOW | Add `ngOnDestroy()` to affected components, redeploy. Users need to refresh browser to clear accumulated connections. |
| Free tier project paused | LOW | Upgrade to Pro ($25/month) or implement keepalive cron job. Resume paused project in dashboard (immediate). |
| Algorithm too slow | HIGH | Requires algorithm rewrite or migration to server-side generation. Temporary: reduce constraint complexity, limit dish library size. |
| German text overflow | MEDIUM | Redesign affected components with flexible layouts. Use abbreviations where acceptable. May require UX review. |
| Service role key exposed | CRITICAL | Rotate key immediately in Supabase dashboard. Audit database for unauthorized changes. Review all access logs. |
| Meal plans overwritten | LOW | Add confirmation dialog, implement undo feature. Lost data cannot be recovered without backups. |
| Insufficient dishes for constraints | LOW | Add validation before generation, show actionable error messages. Users manually add dishes or relax constraints. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS not enabled | Phase 1 (Database Setup) | Test with `anon` key from curl, verify no unauthorized access |
| Wrong metadata for roles | Phase 1 (Database Setup) | Attempt to modify role via `auth.update()`, verify it fails |
| Realtime subscription leaks | Phase 3 (Realtime Features) | Monitor WebSocket connections during navigation, verify cleanup |
| Free tier project pausing | Phase 0 (Planning) | Decide Pro vs. Free, document keepalive strategy if free |
| Algorithm complexity | Phase 2 (Generation Algorithm) | Benchmark with 50 dishes, 100 iterations, verify <3 sec generation |
| German text expansion | Phase 1 (UI Foundation) | Test all UI components with German translations immediately |
| Environment variable leakage | Phase 1 (Infrastructure) | Audit for `process.env` usage, verify no secrets in client bundle |
| Manual edit overwrites | Phase 4 (Plan Management) | Test regenerate flow, verify warning appears |
| Category ambiguity | Phase 2 (Constraints UI) | User testing: ask 5 users to interpret constraint labels |
| Favorites never rotate | Phase 2 (Algorithm Refinement) | Generate 10 consecutive weeks, verify variety metrics |
| Insufficient dishes | Phase 2 (Generation Logic) | Test with 3 dishes, constraints requiring 5, verify error message |
| Member removal breaks plans | Phase 2 (Family Features) | Remove member, verify plans still accessible to remaining family |

---

## Sources

**Meal Planning Domain:**
- [Meal Planning Apps Common Mistakes](https://www.menumagic.ai/blog/10-common-mistakes-in-weekly-meal-planning)
- [Why Finding Meal Planning Variety Feels Impossible](https://blog.mealestroai.com/meal-planning-variety/)
- [Mobile Apps to Support Healthy Family Food - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6320405/)
- [An Extensive Search Algorithm to Find Feasible Healthy Menus](https://link.springer.com/article/10.1007/s12351-022-00702-4)
- [Computational Nutrition: Algorithm to Generate Diet Plan](https://scholarworks.gvsu.edu/cgi/viewcontent.cgi?article=1068&context=oapsf_articles)

**Supabase RLS:**
- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) (HIGH confidence - official docs)
- [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase Row Level Security Complete Guide](https://designrevision.com/blog/supabase-row-level-security)

**Supabase Free Tier:**
- [Supabase Pricing 2026 Complete Breakdown](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [Supabase Billing Documentation](https://supabase.com/docs/guides/platform/billing-on-supabase) (HIGH confidence - official docs)
- [Supabase Pricing Explained 2026](https://designrevision.com/blog/supabase-pricing)

**Supabase Realtime:**
- [Supabase Realtime Client-Side Memory Leak](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak)
- [Using Supabase Realtime Subscriptions](https://medium.com/@saravananshanmugam/what-weve-learned-using-supabase-real-time-subscriptions-in-our-browser-extension-d82126c236a1)
- [Building Real-Time Apps with Supabase](https://www.supadex.app/blog/building-real-time-apps-with-supabase-a-step-by-step-guide)

**Angular + Supabase:**
- [Build User Management App with Angular - Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-angular) (HIGH confidence - official docs)
- [Supabase and Angular: Powerful Combination](https://christianlydemann.com/supabase-and-angular-a-powerful-combination-for-building-web-applications/)
- [Supabase Angular Authentication with RxJS](https://gist.github.com/kylerummens/c2ec82e65d137f3220748ff0dee76c3f)

**Angular Signals:**
- [Angular Signals Overview](https://angular.dev/guide/signals) (HIGH confidence - official docs)
- [Application State Management with Angular Signals](https://medium.com/@eugeniyoz/application-state-management-with-angular-signals-b9c8b3a3afd7)
- [Angular State Management for 2025](https://nx.dev/blog/angular-state-management-2025)

**Angular i18n:**
- [Angular Internationalization Overview](https://angular.dev/guide/i18n) (HIGH confidence - official docs)
- [Angular i18n: Internationalization & Localization](https://lokalise.com/blog/angular-i18n/)
- [Angular Localization Complete Guide](https://centus.com/blog/angular-localization)

**Vercel + Angular:**
- [Deploy Angular with Vercel](https://vercel.com/guides/deploying-angular-with-vercel) (HIGH confidence - official docs)
- [Angular Server-Side Rendering SSR with Vercel](https://medium.com/@parasbhatiwal/the-complete-guide-to-angular-server-side-rendering-ssr-with-vercel-deployment-629579e5f2dd)
- [Angular SSR on Vercel - Deploy Like a Senior](https://javascript.plainenglish.io/angular-ssr-on-vercel-deploy-like-a-senior-laugh-like-a-junior-c894f0dc80d2)

---

*Pitfalls research for: Family Meal Planning Web Application (Angular + Supabase + Vercel)*
*Researched: 2026-02-16*
*Confidence: MEDIUM (combination of official docs HIGH, community best practices MEDIUM, domain patterns LOW)*
