---
phase: 04-realtime-collaboration
plan: 02
subsystem: ui
tags: [angular, supabase, edge-functions, household, settings, invite, signals]

# Dependency graph
requires:
  - phase: 04-01
    provides: HouseholdService signals, household_invites table, household DB foundation
provides:
  - SettingsComponent at /einstellungen with HouseholdPanelComponent
  - HouseholdPanelComponent: create, view members, invite (link + email), leave, delete
  - AcceptInviteComponent at /einladen with authenticated and unauthenticated flows
  - LayoutComponent: post-auth invite token auto-acceptance via sessionStorage
  - Edge Function invite-user: server-side email invite via auth.admin.inviteUserByEmail
  - Updated navigation (desktop + mobile) with Einstellungen link
affects: [04-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SessionStorage invite token persistence: store token on /einladen (unauthenticated), consume in LayoutComponent.ngOnInit after auth"
    - "Edge Function validates invite before sending email — prevents abuse of inviteUserByEmail endpoint"
    - "SupabaseService.supabaseUrl getter exposes project URL without leaking protected SupabaseClient internals"
    - "Two-state UI pattern in HouseholdPanelComponent: solo mode (create form) vs household mode (members, invite, actions)"

key-files:
  created:
    - src/app/features/settings/settings.component.ts
    - src/app/features/settings/settings.component.html
    - src/app/features/settings/components/household-panel/household-panel.component.ts
    - src/app/features/settings/components/household-panel/household-panel.component.html
    - src/app/features/auth/accept-invite/accept-invite.component.ts
    - src/app/features/auth/accept-invite/accept-invite.component.html
    - supabase/functions/invite-user/index.ts
  modified:
    - src/app/app.routes.ts
    - src/app/shared/components/navbar/navbar.component.html
    - src/app/shared/components/layout/layout.component.ts
    - src/app/core/services/supabase.service.ts

key-decisions:
  - "SupabaseService.supabaseUrl getter added to expose project URL safely (SupabaseClient.supabaseUrl is protected)"
  - "AcceptInviteComponent created as stub in Task 1 to unblock route compilation, fleshed out in Task 2"
  - "SessionStorage (not localStorage) for invite token — cleared on tab close, appropriate for transient auth flow"
  - "Edge Function validates invite token before calling inviteUserByEmail — prevents spam/abuse"
  - "LayoutComponent.ngOnInit handles post-auth invite acceptance — runs on every authenticated page load but only acts when token present"

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 4 Plan 02: Household Settings UI & Invite System Summary

**Settings page with full household management UI (create/invite/leave/delete), accept-invite page with auth-aware flow, and Edge Function for secure server-side email invites**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T18:03:37Z
- **Completed:** 2026-02-17T18:07:25Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created SettingsComponent at `/einstellungen` hosting HouseholdPanelComponent with full household lifecycle UI
- HouseholdPanelComponent implements two states: solo mode (create household form) and household mode (members list with role badges, link invite, email invite, active invites list, leave/delete actions)
- Created AcceptInviteComponent at `/einladen` handling both authenticated users (direct `acceptInvite(token)` call) and unauthenticated users (sessionStorage token persistence, redirect to login/register)
- Updated LayoutComponent to auto-process `sessionStorage.invite_token` on first authenticated page load, enabling seamless post-registration household join
- Created Supabase Edge Function `invite-user` that validates invite token, sends email via `auth.admin.inviteUserByEmail` using `SUPABASE_SERVICE_ROLE_KEY` from Deno.env (never frontend-exposed)
- Updated navigation: Einstellungen link in desktop nav; mobile bottom tabs include gear (⚙️) tab linking to /einstellungen
- Added `/einstellungen` (auth-guarded) and `/einladen` (public) routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Settings page, household panel, navigation, routes** - `86191b5` (feat)
2. **Task 2: Accept-invite page, layout post-auth handling, Edge Function** - `e6936f9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/features/settings/settings.component.ts` - Container page with German heading "Einstellungen"
- `src/app/features/settings/settings.component.html` - Template with max-w-4xl layout
- `src/app/features/settings/components/household-panel/household-panel.component.ts` - Full household lifecycle with signals
- `src/app/features/settings/components/household-panel/household-panel.component.html` - Two-state template (solo/household)
- `src/app/features/auth/accept-invite/accept-invite.component.ts` - Auth-aware invite acceptance with 5 states
- `src/app/features/auth/accept-invite/accept-invite.component.html` - State-driven UI (loading/success/error/unauthenticated/no-token)
- `src/app/shared/components/layout/layout.component.ts` - Added HouseholdService + MatSnackBar, post-auth invite token check
- `supabase/functions/invite-user/index.ts` - Deno Edge Function with CORS, input validation, token verification, inviteUserByEmail
- `src/app/app.routes.ts` - Added /einstellungen (auth-guarded) and /einladen (public lazy-loaded) routes
- `src/app/shared/components/navbar/navbar.component.html` - Added Einstellungen link (desktop) and gear tab (mobile)
- `src/app/core/services/supabase.service.ts` - Added supabaseUrl getter for Edge Function URL construction

## Decisions Made

- Added `SupabaseService.supabaseUrl` getter rather than accessing the protected `SupabaseClient.supabaseUrl` property directly — cleaner encapsulation, fixes TypeScript protected access error
- Created AcceptInviteComponent stub in Task 1 (minimal placeholder) to satisfy route lazy-import at compile time, replaced with full implementation in Task 2 — ensures `ng build` passes after Task 1
- SessionStorage chosen for invite token persistence (vs localStorage) — cleared on browser close, appropriate for single-session invite flows
- Edge Function validates invite token in database before calling `inviteUserByEmail` — prevents email spam if token is guessed or reused
- Post-auth invite processing placed in LayoutComponent.ngOnInit rather than a separate service or app initializer — runs exactly once on first authenticated navigation, minimal complexity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SupabaseClient.supabaseUrl is a protected property**
- **Found during:** Task 1 build verification
- **Issue:** `this.supabaseService.client.supabaseUrl` caused TS2445 compile error — `supabaseUrl` is protected on SupabaseClient
- **Fix:** Added `get supabaseUrl(): string` getter to SupabaseService that returns `environment.supabaseUrl`
- **Files modified:** `src/app/core/services/supabase.service.ts`
- **Commit:** included in `86191b5`

**2. [Rule 3 - Blocking] AcceptInviteComponent needed for route compilation**
- **Found during:** Task 1 build verification
- **Issue:** `app.routes.ts` lazy-imports `./features/auth/accept-invite/accept-invite.component` which didn't exist yet, causing TS2307 compile error
- **Fix:** Created a minimal stub `AcceptInviteComponent` in Task 1 to unblock compilation; replaced with full implementation in Task 2
- **Files modified:** `src/app/features/auth/accept-invite/accept-invite.component.ts`
- **Commit:** included in `86191b5`, replaced in `e6936f9`

## Issues Encountered

None beyond the auto-fixed build errors above. Final `ng build` compiled cleanly with zero TypeScript errors.

## User Setup Required

To use email invites, the Edge Function must be deployed:
```
supabase functions deploy invite-user
```

The function requires `SUPABASE_SERVICE_ROLE_KEY` set as a Supabase secret:
- Supabase Dashboard → Settings → API → service_role key (secret)
- Set via: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>`

Optionally set `SITE_URL` for production:
- `supabase secrets set SITE_URL=https://your-domain.com`

## Next Phase Readiness

- Settings page and invite system complete; all household management UI delivered
- AcceptInviteComponent handles both authenticated and unauthenticated flows
- LayoutComponent auto-processes sessionStorage invite tokens on first authenticated load
- Edge Function code ready; needs `supabase functions deploy` when ready to test email invites
- No blockers for Plan 03 (Realtime collaboration sync)

---
*Phase: 04-realtime-collaboration*
*Completed: 2026-02-17*

## Self-Check: PASSED

All required files present and both task commits verified:
- `src/app/features/settings/settings.component.ts` - FOUND
- `src/app/features/settings/settings.component.html` - FOUND
- `src/app/features/settings/components/household-panel/household-panel.component.ts` - FOUND
- `src/app/features/auth/accept-invite/accept-invite.component.ts` - FOUND
- `src/app/features/auth/accept-invite/accept-invite.component.html` - FOUND
- `supabase/functions/invite-user/index.ts` - FOUND
- Commit `86191b5` - FOUND
- Commit `e6936f9` - FOUND
