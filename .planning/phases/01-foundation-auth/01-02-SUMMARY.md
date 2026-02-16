---
phase: 01-foundation-auth
plan: 02
subsystem: auth-ui
tags: [angular, auth-pages, reactive-forms, route-guards, tailwind, german-ui]
dependency-graph:
  requires: [supabase-client, tailwind-css, angular-app]
  provides: [auth-pages, route-guards, login-flow, registration-flow]
  affects: [app-routing, user-onboarding]
tech-stack:
  added: []
  patterns: [functional-guards, reactive-forms, angular-19-control-flow, standalone-components]
key-files:
  created:
    - src/app/core/guards/auth.guard.ts
    - src/app/core/guards/guest.guard.ts
    - src/app/features/auth/login/login.component.ts
    - src/app/features/auth/login/login.component.html
    - src/app/features/auth/register/register.component.ts
    - src/app/features/auth/register/register.component.html
    - src/app/features/auth/confirm-email/confirm-email.component.ts
    - src/app/features/auth/confirm-email/confirm-email.component.html
    - src/app/features/auth/reset-password/reset-password.component.ts
    - src/app/features/auth/reset-password/reset-password.component.html
  modified: []
decisions:
  - decision: Use functional CanActivateFn guards over class-based guards
    rationale: Angular 19 best practice, simpler and more testable with inject()
    alternatives: [class-based guards with CanActivate interface]
    impact: Guards are more concise and align with modern Angular patterns
  - decision: Show generic success message for password reset regardless of email existence
    rationale: Security best practice to prevent email enumeration attacks
    alternatives: [show different messages for existing/non-existing emails]
    impact: Improved security, prevents attackers from discovering valid user emails
  - decision: Use display_name in user metadata instead of separate profile field
    rationale: Simplifies registration flow, leverages Supabase auth metadata
    alternatives: [update profiles table directly after signup]
    impact: Name available immediately in auth.users().user_metadata
metrics:
  duration: 170 seconds
  tasks-completed: 1
  files-created: 10
  commits: 1
  completed-at: 2026-02-16T12:58:14Z
---

# Phase 1 Plan 2: Authentication Pages & Route Guards Summary

**One-liner:** Complete authentication UI flow with German-language reactive forms (login, register, email confirmation, password reset) and functional route guards protecting authenticated routes.

## What Was Built

This plan delivers the complete user-facing authentication experience:

1. **Route Guards (Functional Guards):**
   - `authGuard`: Protects routes requiring authentication, redirects to `/anmelden` with return URL
   - `guestGuard`: Prevents authenticated users from accessing auth pages, redirects to `/gerichte`
   - Both use Angular 19 functional `CanActivateFn` pattern with `inject()` for cleaner code

2. **Login Page (`/anmelden`):**
   - Reactive form with email and password fields
   - Real-time inline validation in German (required, email format, minLength 8)
   - Server error handling ("E-Mail oder Passwort falsch")
   - Return URL support (redirects to original destination after login)
   - Links to register and password reset pages
   - Loading spinner during authentication

3. **Register Page (`/registrieren`):**
   - Reactive form with display name, email, and password fields
   - Inline validation for all fields in German
   - Calls Supabase signUp with display_name in user metadata
   - Redirects to email confirmation page on success
   - Server error display for registration failures
   - Link to login page for existing users

4. **Email Confirmation Page (`/email-bestaetigen`):**
   - Static informational page shown after registration
   - Green checkmark icon with mail envelope
   - Instructions to check email and spam folder
   - Link back to login page
   - Per locked decision: users cannot access app until email confirmed

5. **Password Reset Page (`/passwort-vergessen`):**
   - Single email field with validation
   - Calls Supabase `resetPasswordForEmail()` with redirect to login
   - Generic success message (security best practice - no email enumeration)
   - Link back to login page

**Design System Applied:**
- Warm green color palette (green-50 to green-800)
- Rounded corners (rounded-xl on inputs, rounded-2xl on cards)
- Soft shadows on card containers
- Full-screen centered layout: `min-h-screen flex items-center justify-center`
- Large touch targets: `py-3` on buttons/inputs, `text-base` minimum font size
- App branding: "MahlZeitPlaner" title with fork emoji (🍴) on every page
- Consistent white card on green background across all auth pages

## Task Breakdown

| Task | Name                                    | Status | Commit  | Duration |
| ---- | --------------------------------------- | ------ | ------- | -------- |
| 1    | Create route guards and auth pages      | ✓      | b7432fe | ~170s    |

## Deviations from Plan

None - plan executed exactly as written. All components compile successfully and meet all specified requirements.

## Key Technical Decisions

### 1. Functional Guards with inject()
- **Context**: Angular 19 supports both class-based and functional guards
- **Decision**: Used functional `CanActivateFn` pattern with `inject()` for dependency injection
- **Impact**: Simpler code, better testability, aligns with Angular 19 best practices

### 2. Security-First Password Reset
- **Context**: Password reset could reveal if email exists in system
- **Decision**: Always show generic success message regardless of email existence
- **Impact**: Prevents email enumeration attacks, improves security posture

### 3. User Metadata for Display Name
- **Context**: Registration needs to capture user's display name
- **Decision**: Store in Supabase auth.users().user_metadata.display_name
- **Impact**: Name immediately available without separate database query, simplifies registration flow

## Files Created/Modified

### Created (10 files)

**Route Guards:**
- `src/app/core/guards/auth.guard.ts` - Protects authenticated routes, redirects to /anmelden
- `src/app/core/guards/guest.guard.ts` - Prevents authenticated users from auth pages

**Login Component:**
- `src/app/features/auth/login/login.component.ts` - Login form logic with SupabaseService integration
- `src/app/features/auth/login/login.component.html` - Login UI with German validation messages

**Register Component:**
- `src/app/features/auth/register/register.component.ts` - Registration form with display_name metadata
- `src/app/features/auth/register/register.component.html` - Registration UI with German validation

**Confirm Email Component:**
- `src/app/features/auth/confirm-email/confirm-email.component.ts` - Static confirmation component
- `src/app/features/auth/confirm-email/confirm-email.component.html` - Email confirmation message UI

**Reset Password Component:**
- `src/app/features/auth/reset-password/reset-password.component.ts` - Password reset form with Supabase integration
- `src/app/features/auth/reset-password/reset-password.component.html` - Password reset UI

### Modified (0 files)
No existing files were modified. All changes are new component additions.

## Verification Results

All verification criteria passed:

✓ `npm run build` completes successfully without errors
✓ All auth component files exist in correct directories
✓ All form components import `ReactiveFormsModule`
✓ All validation messages are in German
✓ Error displays use `text-red-600` class (9 occurrences across 3 files)
✓ Submit buttons have `[disabled]` binding when form invalid (3 occurrences)
✓ Guards use functional `CanActivateFn` pattern (4 occurrences across 2 files)
✓ All pages use Angular 19 `@if` control flow syntax (6 validation blocks)
✓ All pages display "MahlZeitPlaner" branding (4 occurrences)
✓ Login form has email and password fields with German inline validation
✓ Register form has displayName, email, and password fields with German inline validation
✓ Confirm-email page shows static confirmation message in German
✓ Reset-password page has email field with Supabase resetPasswordForEmail integration
✓ Auth guard redirects to /anmelden when no user detected
✓ Guest guard redirects to /gerichte when user authenticated
✓ All pages use warm green Tailwind design with rounded corners

## German Validation Messages Implemented

**Email Field:**
- "E-Mail ist erforderlich" (required)
- "Bitte gib eine gueltige E-Mail-Adresse ein" (invalid format)

**Password Field:**
- "Passwort ist erforderlich" (required)
- "Passwort muss mindestens 8 Zeichen lang sein" (minLength 8)

**Display Name Field:**
- "Name ist erforderlich" (required)
- "Name muss mindestens 2 Zeichen lang sein" (minLength 2)

**Server Errors:**
- "E-Mail oder Passwort falsch" (login failed)
- "Registrierung fehlgeschlagen" (signup failed)
- "Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zuruecksetzen geschickt." (password reset)

## Next Steps

This plan provides the authentication UI foundation for:
1. **Phase 1 Plan 3**: App shell with routing configuration, connecting these pages to actual routes (/anmelden, /registrieren, etc.)
2. **Protected routes**: Future feature pages can use `authGuard` to require authentication
3. **Guest routes**: Auth pages will use `guestGuard` to redirect logged-in users

**No User Action Required** - This plan is fully self-contained. The next plan will wire these components into the app routing.

## Self-Check: PASSED

All claimed files and commits verified:

**Files:**
- ✓ src/app/core/guards/auth.guard.ts exists
- ✓ src/app/core/guards/guest.guard.ts exists
- ✓ src/app/features/auth/login/login.component.ts exists
- ✓ src/app/features/auth/login/login.component.html exists
- ✓ src/app/features/auth/register/register.component.ts exists
- ✓ src/app/features/auth/register/register.component.html exists
- ✓ src/app/features/auth/confirm-email/confirm-email.component.ts exists
- ✓ src/app/features/auth/confirm-email/confirm-email.component.html exists
- ✓ src/app/features/auth/reset-password/reset-password.component.ts exists
- ✓ src/app/features/auth/reset-password/reset-password.component.html exists

**Commits:**
- ✓ b7432fe: feat(01-foundation-auth-02): create auth pages and route guards
