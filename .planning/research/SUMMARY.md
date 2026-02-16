# Project Research Summary

**Project:** Mahl-Zeit-Planer (Family Meal Planning Web App)
**Domain:** Family Meal Planning Application
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

This is a German-focused family meal planning application that automates weekly dinner scheduling while ensuring balanced variety across Fish, Meat, and Vegetarian categories. Expert implementations emphasize simplicity over feature bloat—the primary failure mode for meal planning apps is overwhelming users with recipe management, shopping lists, and nutrition tracking before delivering core value. The recommended approach uses Angular 21 (standalone components, signals for state), Supabase (PostgreSQL + auth + realtime), and Vercel (SSR hosting), all viable on free tiers with minor caveats.

The critical technical risk is Row Level Security (RLS) misconfiguration in Supabase, which recently exposed 83% of audited databases (CVE-2025-48757). This must be addressed in Phase 1 by enabling RLS immediately on all tables and testing policies with the anonymous key, not just SQL Editor. Secondary risks include meal plan generation algorithm complexity (constraint satisfaction problem) and free tier project pausing after 7 days of inactivity, both mitigable through phased implementation and deliberate infrastructure choices.

Research reveals a clear path: build dish library → manual meal planning → auto-generation algorithm → realtime collaboration. This sequence validates data models before adding algorithmic complexity and establishes single-user workflows before multi-user sync challenges.

## Key Findings

### Recommended Stack

Angular 21 provides a modern foundation with standalone components as default, signals for reactive state management (eliminating NgRx for this scope), and stable SSR with hydration for Vercel deployment. The stack deliberately avoids complexity: no external state management libraries, no runtime i18n overhead (compile-time translations), no PrimeNG licensing concerns (Angular Material suffices).

**Core technologies:**
- **Angular 21 + TypeScript 5.9**: Standalone components, signals for state, strict typing, SSR with hydration
- **Supabase (PostgreSQL)**: BaaS with auth, realtime sync, RLS for multi-tenant isolation—free tier supports 500MB DB and 50K MAU
- **Vercel Hobby Plan**: Hosting with automatic HTTPS, 150K function invocations/month, non-commercial use acceptable for family app
- **Angular Material 21**: MIT-licensed UI components, Material Design 3, CDK for drag-drop meal scheduling
- **Vitest**: Default test runner in Angular 21, replacing deprecated Karma

**Critical version constraints:**
- Node 22.x LTS (Supabase client dropped Node 18 support in v2.79.0)
- RxJS 7.x for Angular compatibility (signals complement, don't replace RxJS)
- Angular Material must match Angular major version (21.x)

**What NOT to use:**
- PrimeNG (LTS licensing complexity—MIT only for current version, paid after 6 months)
- NgRx (overkill for family meal planner scope)
- Template-driven forms (weak typing, use reactive forms exclusively)

### Expected Features

Research shows meal planning apps fail when they prioritize breadth (recipes, shopping lists, nutrition) over depth (reliable, fast meal scheduling). Users abandon apps with "tedious setup" and complex recipe entry. Success requires focusing on the high-stress decision—"what's for dinner?"—and deferring everything else.

**Must have (table stakes):**
- **Dish Library (CRUD)**: Name + category (Fish/Meat/Vegetarian), no recipe entry required—reduces onboarding friction
- **Auto-Generate Weekly Plan**: Core value proposition that saves mental load, must include category balance algorithm
- **Weekly Calendar View**: Users plan in weekly cycles, expect to see Monday-Sunday at a glance
- **Swap Individual Meals**: Plans change, need flexibility without regenerating entire week
- **Multi-User Access**: Family planning is collaborative, requires Supabase auth + shared workspace
- **Mobile-Responsive UI**: Users check plans while shopping and in kitchen

**Should have (competitive):**
- **Balanced Variety Enforcement**: Prevent "pasta every night" by ensuring no category repeats 2 days consecutively
- **Quick Meal Swapping**: One-click replacement when user doesn't want the suggested meal
- **German-First UI**: Native translations build trust in DACH market (most competitors translate poorly)
- **No Recipe Lock-In**: Users just name dishes they already know how to cook—differentiates from recipe-heavy competitors

**Defer (v2+):**
- **Shopping List Generation**: High friction (requires ingredient-level data entry), primary cause of app abandonment
- **Full Recipe Management**: Feature creep, competitors do this better, delays core value
- **Nutrition Tracking**: Different user segment (diet-focused vs. variety-focused), creates food anxiety
- **Breakfast/Lunch Planning**: Scope explosion, validate dinner-only first
- **Family Preference Voting**: Complex role system, defer until basic preferences validated

### Architecture Approach

Use feature-first organization with smart/dumb component separation, service-based state management via signals, and centralized Supabase client. The architecture prioritizes PostgreSQL Row Level Security for multi-tenant isolation at the database layer, eliminating application-level access control complexity.

**Major components:**
1. **Core Services** (SupabaseService, AuthService): Singleton services managing backend connection and authentication state via `onAuthStateChange`
2. **Feature Modules** (dishes/, meal-plans/, auth/): Self-contained with pages (smart), components (dumb), services, and lazy-loaded routes
3. **Signal-Based State**: Each feature service exposes signals for reactive state (`dishesSignal`, `mealPlansSignal`), with computed values for derived state (filtered dishes, category counts)
4. **PostgreSQL + RLS**: `family_id`-based row filtering enforced at database layer, preventing data leakage even if client code has bugs
5. **Realtime Sync**: Supabase WebSocket subscriptions for collaborative editing, filtered by `family_id` to avoid unnecessary broadcasts

**Critical patterns:**
- Always enable RLS before writing policies (`ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;`)
- Never initialize Supabase client multiple times—use singleton SupabaseService
- Unsubscribe from Realtime channels in `ngOnDestroy` to prevent memory leaks
- Use optimistic UI updates + server reconciliation for responsive multi-user experience

**Build order implications:** Must establish authentication and RLS foundation before any features. Meal plan generation depends on stable dish data model. Realtime features require solid state management patterns.

### Critical Pitfalls

1. **RLS Not Enabled on Tables** — Tables default to RLS disabled, exposing all data via anon key. CVE-2025-48757 showed 83% of vulnerable databases had RLS misconfigurations. **Prevent:** Enable RLS immediately after creating tables, test with client SDK (not SQL Editor which bypasses RLS), verify shield icon in dashboard.

2. **Realtime Subscription Memory Leaks** — Components subscribe but forget `ngOnDestroy` cleanup, accumulating WebSocket connections until 200-connection free tier limit. **Prevent:** Store channel reference, always unsubscribe in lifecycle hook, monitor Network tab during navigation.

3. **Free Tier Project Pausing** — Projects pause after 7 days of zero API activity, breaking production for families on vacation. **Prevent:** Upgrade to Pro ($25/month) for always-on, or implement keepalive cron (GitHub Actions pinging endpoint every 6 days).

4. **Algorithm Complexity Explosion** — Meal plan generation with variety constraints is a constraint satisfaction problem (similar to knapsack). Naive random selection fails with 50+ dishes and strict rules. **Prevent:** Start with simple category-only constraints, implement greedy algorithm with backtracking, set timeout (5 sec) and fallback to best-effort plans.

5. **German Text Expansion Breaking Layout** — German translations are 30-40% longer than English, causing button overflow and layout breaks. "Vegetarian" → "Vegetarisch", compound words like "Wochenspeiseplan" are long. **Prevent:** Design with 40% extra space from start, test with German immediately, use flexible CSS (no fixed widths).

6. **Environment Variable Leakage (SSR)** — Angular SSR on Vercel can expose server environment variables if `process.env` accessed incorrectly. Service role key leak bypasses RLS. **Prevent:** Never use service_role key in Angular code, store only anon key in `environment.ts`, audit for `process.env` references.

## Implications for Roadmap

Based on research, suggested phase structure follows architectural dependencies and risk mitigation:

### Phase 1: Foundation (Infrastructure + Authentication)
**Rationale:** Security and data access patterns must be established before any features. RLS misconfiguration is the highest-impact risk (Pitfall #1). Authentication gates all user data. Database schema locks in data model that meal plans depend on.

**Delivers:**
- Supabase project configured with RLS-enabled tables (dishes, meal_plans, meal_plan_days, profiles)
- Authentication flow (magic link email, session management, protected routes)
- Core services (SupabaseService, AuthService) with proper environment configuration
- German i18n infrastructure (`@angular/localize` installed, extraction configured)

**Addresses:**
- Multi-User Access (table stakes feature)
- RLS Not Enabled pitfall (critical)
- Environment Variable Leakage pitfall (critical)
- German Text Expansion pitfall (design with i18n from start)

**Avoids:**
- Building features without security foundation
- Retrofitting RLS after data model established
- Text overflow issues by testing German immediately

**Research flags:** Standard patterns, skip detailed research. RLS policies follow Supabase documentation. Magic link auth is well-documented.

---

### Phase 2: Dish Management (Data Foundation)
**Rationale:** Meal plans cannot exist without dishes to select from. This phase validates the core data model (dish name + category) before algorithmic complexity. Implements smart/dumb component pattern that all features will follow.

**Delivers:**
- Dish CRUD (create, list, edit, delete) with category selection (Fish/Meat/Vegetarian)
- DishService with signal-based state management
- Smart components (dish-list, dish-form) and dumb components (dish-card, category-filter)
- Category filtering and basic search

**Addresses:**
- Dish Library (table stakes feature)
- Service-Based State with Signals (architectural pattern)
- Smart/Dumb Component Architecture (architectural pattern)

**Avoids:**
- Recipe management feature creep (anti-feature from FEATURES.md)
- Storing all dishes upfront (performance trap—implement pagination if needed)

**Research flags:** Standard CRUD, skip research. Angular Material form components well-documented.

---

### Phase 3: Manual Meal Planning (Workflow Validation)
**Rationale:** Before building auto-generation algorithm, validate the meal plan data model and weekly calendar UI work correctly. Manual planning establishes single-user workflows before multi-user realtime complexity. Allows users to start using app while algorithm is developed.

**Delivers:**
- Weekly calendar view showing 7 days (Monday-Sunday)
- Manual meal plan creation (user selects dish for each day)
- Meal plan persistence with `family_id` isolation
- Basic edit/swap functionality (click day, pick different dish)

**Addresses:**
- Weekly Calendar View (table stakes)
- Swap Individual Meal (table stakes)
- Meal plan data model validation (architecture)

**Avoids:**
- Building complex algorithm without validating UI/UX first
- Data model mismatches that require migration later

**Research flags:** Calendar UI patterns standard, skip research. Date handling in Angular well-documented.

---

### Phase 4: Auto-Generation Algorithm (Core Value)
**Rationale:** This is the make-or-break feature—the reason users choose this app. Must be implemented after data model is stable. Algorithm complexity is a critical pitfall (#4), so start simple and iterate.

**Delivers:**
- MealPlanGeneratorService with category balance algorithm
- Constraint UI (how many Fish/Meat/Vegetarian per week)
- Generation flow: preferences → algorithm → preview → save
- Variety enforcement (no category repeats 2 days consecutively)
- Fallback for insufficient dishes or unsolvable constraints

**Addresses:**
- Auto-Generate Meal Plan (table stakes, core value)
- Balanced Variety Enforcement (differentiator)
- Algorithm Complexity Explosion (critical pitfall)
- Category Quota Confusion (moderate pitfall)
- Insufficient Dishes Handling (moderate pitfall)

**Avoids:**
- Constraint satisfaction problem complexity by starting with greedy algorithm + backtracking
- Client-side performance issues with timeout (5 sec) and best-effort fallback
- User frustration with clear error messages when generation fails

**Research flags:** **NEEDS RESEARCH.** Algorithm for constraint satisfaction with variety rules is domain-specific. Recommend `/gsd:research-phase` on meal plan generation algorithms, greedy vs. backtracking approaches, and PostgreSQL recursive CTE options for server-side generation.

---

### Phase 5: Realtime Collaboration (Multi-User Sync)
**Rationale:** Families need to see each other's meal plan edits in real time. Requires solid state management foundation (Phase 2-4) before adding websocket complexity. Realtime subscription cleanup is critical pitfall (#2).

**Delivers:**
- Supabase Realtime subscription filtered by `family_id`
- Optimistic UI updates (immediate feedback, sync with server, reconcile on conflict)
- Subscription cleanup in `ngOnDestroy` to prevent memory leaks
- Visual indicators when family member edits plan

**Addresses:**
- Multi-user collaboration (table stakes)
- Optimistic UI pattern (architecture)
- Realtime Subscription Memory Leaks (critical pitfall)

**Avoids:**
- WebSocket connection accumulation with proper cleanup
- Subscribing to entire tables (filter by `family_id`)
- Update conflicts with optimistic UI + reconciliation strategy

**Research flags:** Realtime patterns documented in Supabase. Conflict resolution strategy may need research if complex scenarios emerge, but basic "last write wins" sufficient for MVP.

---

### Phase 6: Polish & Enhancements (Post-MVP)
**Rationale:** After core features validated, add UX improvements that increase retention. These features emerged as "should have" in research but not blockers for launch.

**Delivers:**
- Drag-drop calendar rescheduling (Angular CDK)
- Regenerate full week (one-click new plan)
- Dish favorites/frequency preferences (guide algorithm weighting)
- Week template saving (repeat successful weeks)
- Manual edit overwrite warnings (UX pitfall mitigation)

**Addresses:**
- Drag-Drop Rescheduling (P2 feature)
- Week Template Saving (P2 feature)
- Manual Edit Overwrites (moderate pitfall)
- Favorite Meals Rotation (moderate pitfall)

**Research flags:** Standard patterns, skip research. Angular CDK drag-drop well-documented.

---

### Phase Ordering Rationale

1. **Security first**: RLS misconfiguration is highest-impact risk (CVE-2025-48757 precedent). Phase 1 addresses this before any data exists.

2. **Data before logic**: Dish library (Phase 2) must exist before meal plans (Phase 3) can reference dishes. Manual planning (Phase 3) validates data model before algorithm (Phase 4) complexity.

3. **Single-user before multi-user**: Establish workflows in Phase 2-4 before adding realtime sync complexity in Phase 5. Memory leaks (#2 pitfall) only affect realtime subscriptions.

4. **Algorithm after UI**: Phase 3 manual planning validates calendar UI and data model. Phase 4 algorithm can focus on generation logic without concurrent UI bugs.

5. **Core value before polish**: Phases 1-4 deliver minimum viable product (dish library + auto-generation). Phase 5 adds collaboration. Phase 6 is retention optimization.

6. **Free tier mitigation**: Project pausing (#3 pitfall) decision needed in Phase 1 (Pro vs. keepalive). Algorithm complexity (#4 pitfall) addressed incrementally in Phase 4 with timeouts and fallbacks.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Auto-Generation Algorithm)**: Constraint satisfaction algorithms, greedy vs. backtracking approaches, PostgreSQL recursive CTEs for server-side generation, variety tracking across multiple weeks
- **Phase 5 (Realtime Sync)** (optional): Conflict resolution strategies if "last write wins" proves insufficient for concurrent family editing

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Supabase auth and RLS extensively documented, Angular SSR deployment to Vercel standard
- **Phase 2 (Dish Management)**: CRUD with Angular Material forms well-established
- **Phase 3 (Manual Meal Planning)**: Calendar UI patterns standard, date handling documented
- **Phase 6 (Polish)**: Angular CDK drag-drop, template saving (simple persistence)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All core technologies verified with official docs (Angular 21, Supabase, Vercel). Version compatibility confirmed. Free tier limits documented. PrimeNG licensing alternative researched. |
| Features | **MEDIUM** | Table stakes validated against 10+ competitor analyses and meal planning app research. User pain points sourced from abandonment studies. Differentiator potential is hypothesis (needs market validation). Complexity estimates preliminary. |
| Architecture | **HIGH** | Patterns sourced from Supabase official architecture docs, Angular style guides, and verified industry sources. Smart/dumb, signal-based state, RLS are well-established. Realtime patterns documented. Build order derived from dependency analysis. |
| Pitfalls | **MEDIUM** | RLS issues verified with CVE-2025-48757 analysis and official Supabase docs (HIGH). Realtime cleanup and free tier pausing confirmed with documentation (HIGH). Algorithm complexity based on constraint satisfaction literature (MEDIUM). German text expansion from i18n research (MEDIUM). |

**Overall confidence:** **HIGH**

Research is comprehensive with official sources for stack and architecture. Feature prioritization is informed but requires market validation. Pitfall mitigation strategies are concrete and actionable.

### Gaps to Address

**Algorithm performance at scale:** Research identified constraint satisfaction complexity but didn't benchmark specific approaches. **Handle during Phase 4 planning:** Prototype with 50 dishes, measure generation time, implement timeout/fallback if >3 seconds.

**Free tier project pausing strategy:** Research confirmed 7-day pausing but didn't evaluate keepalive implementations. **Handle during Phase 1 planning:** Decide Pro ($25/month) vs. GitHub Actions cron (free) based on project budget and uptime requirements.

**Family invitation flow security:** Pitfalls mentioned invite tokens but didn't detail expiration/revocation. **Handle during Phase 1 planning:** Research Supabase invite patterns or implement UUID-based invites with 7-day expiry in family_members table.

**Localization edge cases:** Research covered text expansion but not date/number formatting. **Handle during Phase 1 validation:** Verify German date format (DD.MM.YYYY), comma decimal separator, Angular locale configuration.

**Realtime conflict resolution:** Research recommended "last write wins" but didn't explore complex concurrent editing scenarios (e.g., both family members swap same day simultaneously). **Handle during Phase 5 planning:** Start with simple approach, add versioning/timestamps if conflicts reported during testing.

## Sources

### Primary (HIGH confidence - Official Docs & Context7)
- Angular Version Compatibility (angular.dev) — Angular 21.x, TypeScript 5.9, Node 22.x, RxJS 7.x
- Supabase Architecture (supabase.com/docs) — Core architectural components, RLS, Realtime
- Angular SSR Hydration Guide (angular.dev) — Performance benefits, incremental hydration
- Supabase Angular Tutorial (supabase.com/docs) — Integration patterns, service architecture
- Angular Signals Overview (angular.dev) — Reactive state management
- Vercel Hobby Plan Docs (vercel.com/docs) — Free tier limits, restrictions
- Angular i18n Overview (angular.dev) — Localization setup, compile-time translation
- Supabase RLS Documentation (supabase.com/docs) — Row Level Security policies
- Vercel Angular Deployment (vercel.com/guides) — SSR deployment patterns

### Secondary (MEDIUM confidence - Community + Research Papers)
- Supabase Pricing 2026 (uibakery.io, metacto.com) — Free tier limits, project pausing
- PrimeNG Licensing (github.com/primefaces) — MIT vs. LTS licensing complexity
- Angular Material vs PrimeNG 2026 (infragistics.com) — Component library comparison
- Plan to Eat Feature Analysis (plantoeat.com) — Competitor feature set
- Why Meal Planning Apps Fail (ohapotato.app) — User pain points, abandonment reasons
- 10 Common Meal Planning Mistakes (menumagic.ai) — UX pitfalls
- Mobile Apps for Family Food (PMC article PMC6320405) — Systematic app assessment
- State Management Patterns in Angular 21 (medium.com/@dipaksahirav) — Signals vs NgRx
- Angular 2025 Project Structure (ismaelramos.dev) — Feature-first organization
- Supabase Best Practices (leanware.co) — Production patterns
- CVE-2025-48757 Context (research on RLS misconfigurations) — Security pitfall validation

### Tertiary (LOW confidence - Needs validation)
- Algorithm for meal plan generation — Literature on constraint satisfaction (springer.com) and greedy algorithms, but no Angular-specific implementations found
- Conflict resolution for realtime — General patterns described, but meal-planning-specific strategies not documented

---
*Research completed: 2026-02-16*
*Ready for roadmap: yes*
