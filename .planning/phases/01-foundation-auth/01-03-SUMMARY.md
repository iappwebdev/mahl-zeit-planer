---
phase: 01-foundation-auth
plan: 03
subsystem: ui
tags: [angular, responsive-design, navigation, app-shell, tailwind, german-ui, routing]
dependency-graph:
  requires: [auth-pages, route-guards, supabase-client, tailwind-css]
  provides: [app-shell, navigation-component, responsive-layout, placeholder-pages, complete-routing]
  affects: [all-future-features, phase-02-gerichte, phase-03-wochenplan]
tech-stack:
  added: []
  patterns: [responsive-navigation, bottom-tabs-mobile, nested-routes, layout-wrapper, standalone-components]
key-files:
  created:
    - src/app/shared/components/layout/layout.component.ts
    - src/app/shared/components/layout/layout.component.html
    - src/app/shared/components/navbar/navbar.component.ts
    - src/app/shared/components/navbar/navbar.component.html
    - src/app/features/dishes/dishes.component.ts
    - src/app/features/dishes/dishes.component.html
    - src/app/features/meal-plan/meal-plan.component.ts
    - src/app/features/meal-plan/meal-plan.component.html
  modified:
    - src/app/app.ts
    - src/app/app.routes.ts
    - .postcssrc.json (replaced postcss.config.js)
decisions:
  - decision: German route names (anmelden, registrieren, gerichte, wochenplan)
    rationale: Deutsch-only app per locked decision, German URLs consistent with UI
    alternatives: [English routes with German UI]
    impact: All routes use German names throughout application
  - decision: Bottom tabs on mobile, top bar on desktop
    rationale: Mobile-first touch targets, desktop horizontal space utilization
    alternatives: [hamburger menu, drawer navigation]
    impact: Navigation always visible, no hidden menus required
  - decision: Logout button directly visible in navigation
    rationale: Per locked decision from research - user must be able to log out quickly
    alternatives: [logout in profile menu or settings]
    impact: Logout is one click away on any authenticated page
  - decision: Placeholder pages with "Kommt bald" message
    rationale: Shows complete app structure before features built, validates routing
    alternatives: [empty pages, redirect to single dashboard]
    impact: Navigation testable immediately, user sees app vision
  - decision: Layout component as parent route with authGuard
    rationale: Children inherit guard, navbar only shows when authenticated
    alternatives: [guard on each child route, navbar in app component]
    impact: Auth pages render without navbar, DRY guard configuration
  - decision: .postcssrc.json format for Tailwind CSS v4
    rationale: Angular esbuild builder only reads JSON format, not .js config
    alternatives: [webpack custom config, different build tool]
    impact: Tailwind utility classes properly generated in production builds
metrics:
  duration: 35 minutes (includes checkpoint verification time)
  tasks-completed: 2
  files-created: 15
  commits: 2
  completed-at: 2026-02-16T14:35:00Z
---

# Phase 1 Plan 3: App Shell & Navigation Summary

**Responsive app shell with bottom-tab mobile navigation, desktop top bar, logout button visible in nav, German routes, and placeholder pages showing complete app structure.**

## What Was Built

This plan completes Phase 1 by delivering the full user-facing application structure:

1. **App Shell Architecture:**
   - Minimal root `app.component.ts` with single `<router-outlet>` for clean routing
   - `LayoutComponent` wrapping navbar and content area for authenticated pages
   - Green background (`bg-green-50`) with centered content (`max-w-4xl mx-auto`)
   - Bottom padding on mobile (`pb-20`) for space above fixed tabs, reduced on desktop (`md:pb-4`)

2. **Responsive Navigation (NavbarComponent):**
   - **Desktop (hidden on mobile: `hidden md:flex`):**
     - Top bar with green background (`bg-green-700 text-white`)
     - Brand link "MahlZeitPlaner" linking to `/gerichte`
     - Navigation links: "Meine Gerichte", "Wochenplan"
     - Logout button visible at far right (per locked decision)
     - Active route highlighted with green background

   - **Mobile (hidden on desktop: `md:hidden`):**
     - Fixed bottom tab bar (`fixed bottom-0`)
     - White background with shadow and border
     - Three tabs with icons and German labels:
       - 🍽 Gerichte
       - 📅 Wochenplan
       - 🚪 Abmelden
     - Active tab: green text (`text-green-700`), inactive: gray (`text-gray-500`)
     - Large touch targets (48px minimum)

3. **Placeholder Pages:**
   - **DishesComponent** (`/gerichte`):
     - Centered card with emoji, heading, and "Kommt bald!" message
     - German text: "Meine Gerichte" heading, "Hier kannst du bald deine Lieblingsgerichte verwalten"
     - Warm green design with rounded corners (`rounded-2xl`)

   - **MealPlanComponent** (`/wochenplan`):
     - Same card layout structure
     - German text: "Wochenplan" heading, "Hier wird bald dein Wochenplan erscheinen"
     - Calendar emoji and matching green styling

4. **Complete Route Configuration:**
   - Auth routes with `guestGuard`: `/anmelden`, `/registrieren`, `/passwort-vergessen`
   - Email confirmation (no guard): `/email-bestaetigen`
   - Protected routes under `LayoutComponent` parent with `authGuard`:
     - `/gerichte` (DishesComponent)
     - `/wochenplan` (MealPlanComponent)
     - `/` redirects to `/gerichte` (default landing page)
   - Fallback: `**` redirects to `/anmelden`
   - Lazy loading for auth pages (`loadComponent`)
   - Children inherit `authGuard` from layout parent (DRY principle)

## Task Breakdown

| Task | Name                                               | Status | Commit  | Duration |
| ---- | -------------------------------------------------- | ------ | ------- | -------- |
| 1    | Create responsive app shell with navigation        | ✓      | 5b22b42 | ~10m     |
| 2    | Verify complete auth flow and responsive design    | ✓      | N/A     | ~25m     |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced postcss.config.js with .postcssrc.json**
- **Found during:** Task 2 (Human verification - Tailwind classes not applying)
- **Issue:** Angular's esbuild builder (used in `ng serve` and `ng build`) only reads `.postcssrc.json` format, not `.js` config files. Tailwind theme and base styles loaded, but utility classes were not generated.
- **Fix:** Replaced `postcss.config.js` with `.postcssrc.json` containing identical configuration:
  ```json
  {
    "plugins": {
      "@tailwindcss/postcss": {}
    }
  }
  ```
- **Files modified:** `.postcssrc.json` (created), `postcss.config.js` (deleted)
- **Verification:** Ran `ng serve`, confirmed Tailwind utilities now apply correctly
- **Committed in:** 9255034

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix essential for Tailwind functionality. This is an Angular/esbuild-specific requirement not documented in Tailwind v4 general setup guides.

## Files Created/Modified

### Created (15 files)

**App Shell Components:**
- `src/app/shared/components/layout/layout.component.ts` - Layout wrapper with navbar and router-outlet
- `src/app/shared/components/layout/layout.component.html` - Layout template with green background
- `src/app/shared/components/layout/layout.component.css` - Empty (Tailwind utilities only)

**Navigation Component:**
- `src/app/shared/components/navbar/navbar.component.ts` - Responsive navbar with logout logic
- `src/app/shared/components/navbar/navbar.component.html` - Desktop top bar and mobile bottom tabs
- `src/app/shared/components/navbar/navbar.component.css` - Empty (Tailwind utilities only)

**Placeholder Pages:**
- `src/app/features/dishes/dishes.component.ts` - Dishes placeholder page
- `src/app/features/dishes/dishes.component.html` - "Kommt bald" message with emoji
- `src/app/features/dishes/dishes.component.css` - Empty (Tailwind utilities only)

- `src/app/features/meal-plan/meal-plan.component.ts` - Meal plan placeholder page
- `src/app/features/meal-plan/meal-plan.component.html` - "Kommt bald" message with emoji
- `src/app/features/meal-plan/meal-plan.component.css` - Empty (Tailwind utilities only)

**PostCSS Config:**
- `.postcssrc.json` - Tailwind CSS v4 PostCSS configuration (Angular-compatible format)

### Modified (3 files)

- `src/app/app.ts` - Updated to minimal router-outlet (removed default Angular welcome template)
- `src/app/app.routes.ts` - Complete route tree with guards, layout wrapper, German route names
- `postcss.config.js` - Deleted (replaced by .postcssrc.json)

## Verification Results

All verification criteria passed during human verification:

✓ Full registration flow: form → submit → email confirmation page
✓ Full login flow: form → submit → redirect to /gerichte
✓ Logout flow: click Abmelden → redirect to /anmelden
✓ Route guards: unauthenticated users redirected to /anmelden
✓ Route guards: authenticated users skip auth pages (redirect to /gerichte)
✓ Responsive navigation: bottom tabs visible on mobile, top bar on desktop
✓ Logout button visible in navigation (not hidden in menu)
✓ Placeholder pages show "Kommt bald" message in German
✓ All text in German
✓ Warm green design with rounded corners (`bg-green-50`, `rounded-2xl`)
✓ Inline validation errors in red below form fields
✓ Active route highlighting works in navigation
✓ Dev server runs without errors
✓ Tailwind utility classes apply correctly after .postcssrc.json fix

## Key Technical Decisions

### 1. German Route Names
- **Context**: Application is Deutsch-only per locked decision
- **Decision**: Use German route names (`/anmelden`, `/registrieren`, `/gerichte`, `/wochenplan`)
- **Impact**: URL bar matches UI language, consistent user experience

### 2. Layout Component as Route Parent
- **Context**: Need navbar only on authenticated pages
- **Decision**: Wrap protected routes in `LayoutComponent` parent with `authGuard` on parent
- **Impact**: Children inherit guard automatically, navbar only renders when logged in, auth pages stay full-screen

### 3. Responsive Navigation Pattern
- **Context**: Different navigation paradigms for mobile vs desktop
- **Decision**: Fixed bottom tabs on mobile, horizontal top bar on desktop
- **Impact**: No hamburger menu needed, navigation always visible, native app feel on mobile

### 4. Placeholder Pages with "Kommt bald"
- **Context**: Features not yet built but navigation structure needs validation
- **Decision**: Create placeholder pages with friendly German messages
- **Impact**: Complete routing testable immediately, users see app vision, navigation UX validated

### 5. .postcssrc.json Format
- **Context**: Angular's esbuild builder config file format requirements
- **Decision**: Use `.postcssrc.json` instead of `postcss.config.js`
- **Impact**: Tailwind utility classes properly generated in both dev and production builds

## Phase 1 Complete

This plan completes **Phase 1: Foundation & Auth**. All three plans delivered:

1. **Plan 01**: angular 21 scaffolding, Supabase integration, Tailwind CSS, RLS-secured database
2. **Plan 02**: Authentication pages with reactive forms, route guards, German validation
3. **Plan 03**: Responsive app shell, navigation, complete routing, placeholder pages

**Phase 1 Accomplishments:**
- User can register, confirm email, log in, and log out
- Complete auth flow with inline validation in German
- Responsive navigation (mobile bottom tabs, desktop top bar)
- Protected routes with functional guards
- Warm green design system applied throughout
- Placeholder pages showing future app structure
- Tailwind CSS v4 configured and working
- RLS-secured profiles table with optimized auth patterns

## Next Phase Readiness

**Ready for Phase 2: Gerichte (Dish Management)**

Phase 1 provides everything needed for feature development:
- Authentication and user management working end-to-end
- App shell and navigation in place
- Route guards protecting authenticated content
- Design system established (warm green, rounded corners, German text)
- Placeholder page at `/gerichte` ready to be replaced with dish management UI
- Database schema with profiles table and RLS policies

**No Blockers** - Phase 2 can begin immediately.

**User Action Completed:**
- Supabase credentials configured in `src/environments/environment.ts`
- Database migration (`001_profiles.sql`) executed in Supabase SQL Editor
- Email confirmation enabled in Supabase Auth settings
- Dev server runs at http://localhost:4200 with all auth flows working

## Self-Check: PASSED

All claimed files and commits verified:

**Files:**
- ✓ src/app/shared/components/layout/layout.component.ts exists
- ✓ src/app/shared/components/layout/layout.component.html exists
- ✓ src/app/shared/components/navbar/navbar.component.ts exists
- ✓ src/app/shared/components/navbar/navbar.component.html exists
- ✓ src/app/features/dishes/dishes.component.ts exists
- ✓ src/app/features/dishes/dishes.component.html exists
- ✓ src/app/features/meal-plan/meal-plan.component.ts exists
- ✓ src/app/features/meal-plan/meal-plan.component.html exists
- ✓ .postcssrc.json exists
- ✓ src/app/app.ts modified
- ✓ src/app/app.routes.ts modified

**Commits:**
- ✓ 5b22b42: feat(01-foundation-auth-03): create responsive app shell with navigation and placeholder pages
- ✓ 9255034: fix(01-foundation-auth): use .postcssrc.json for Tailwind CSS v4 with Angular
