# Phase 1: Foundation & Auth - Research

**Researched:** 2026-02-16
**Domain:** angular 21 + Supabase Auth + Tailwind CSS
**Confidence:** HIGH

## Summary

Phase 1 establishes secure authentication with email/password using Supabase Auth integrated into an angular 21 application with German-language UI and Tailwind CSS styling. The research confirms that this stack is well-documented and production-ready, with official guides for Angular + Supabase integration, comprehensive RLS patterns, and modern Angular i18n support.

The critical security concern is Row Level Security (RLS): Supabase tables default to RLS disabled, making all data publicly accessible through the API unless explicitly enabled. RLS must be configured before any data exists, with proper policies for authenticated user access. The free tier project pausing (after 7 days inactivity) requires early decision on mitigation strategy or upgrade path.

The warm, friendly green design with rounded corners is fully achievable with Tailwind CSS using its extensive color palette (50-950 shades per color), utility classes for rounded corners, and mobile-first responsive breakpoints. PrimeNG offers an optional component library with native Tailwind integration if custom components prove insufficient.

**Primary recommendation:** Start with Supabase service setup, enable RLS on all tables immediately, implement auth guards for protected routes, and use Angular's built-in i18n with @angular/localize for compile-time German translation. Use reactive forms with inline validation patterns for auth forms.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**Auth-Seiten Design:**
- Nach Registrierung: Bestaetigungsseite anzeigen ("Bitte E-Mail bestaetigen"), erst nach Bestaetigung Zugang zur App
- Fehlermeldungen: Inline unter den jeweiligen Eingabefeldern (rote Hinweise direkt unter dem Feld)

**App-Shell & Navigation:**
- Logout-Button: Direkt sichtbar in der Navigationsleiste (nicht versteckt in Submenue)
- Platzhalter-Seiten: Leere Seiten fuer Gerichte und Wochenplan mit "Kommt bald" Hinweis, damit die Navigation von Anfang an komplett wirkt

**Visuelles Design:**
- Gesamtstil: Warm und freundlich — weiche Farben, abgerundete Ecken, einladend wie eine Familien-App
- Farbrichtung: Gruentoene (natur, frisch, gesund — passend zu Essen/Kochen)
- UI-Framework: Tailwind CSS fuer maximale Designfreiheit beim warmen Stil

**Mobile Anpassung:**
- Primaergeraet: Mobile und Desktop gleich wichtig — kein Mobile-first oder Desktop-first, beide Erfahrungen gleichwertig
- Auth-Formulare auf Mobile: Voller Bildschirm nutzen mit grossen Touch-Targets
- Branding: App-Name und einfaches Logo/Icon auf den Auth-Seiten

### Claude's Discretion
- Login/Register als getrennte Seiten oder kombinierte Seite mit Tab-Wechsel
- Passwort-vergessen Funktion: Ob direkt dabei oder spaeter nachruesten (basierend auf Aufwand)
- Navigationstyp: Sidebar, Bottom-Tabs oder Top-Nav — passend zum Geraet
- Startseite nach Login: Claude waehlt die sinnvollste Landingpage
- PWA (Progressive Web App): Ob installierbar oder nur responsive
- Loading-Skeletons, exaktes Spacing und Typografie
- Error-State Handling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/core | 19.x | Framework | User has existing Angular experience; active development |
| @supabase/supabase-js | Latest | Auth & Database | Official Supabase JavaScript client; comprehensive auth with built-in session management |
| @angular/localize | 19.x | Internationalization | Official Angular i18n solution; compile-time translation for German |
| tailwindcss | 4.x | CSS Framework | Official Angular CLI integration via `ng add`; utility-first approach ideal for warm custom design |
| @tailwindcss/postcss | Latest | Build Integration | Required plugin for Angular + Tailwind v4 integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @angular/forms | 19.x (ReactiveFormsModule) | Form Handling | Required for auth forms with validation |
| @angular/router | 19.x | Routing & Guards | Required for protected routes and navigation |
| primeng | 19.x | UI Components (optional) | If custom Tailwind components insufficient; has native Tailwind integration |
| @ngx-env/builder | Latest | Environment Variables | For accessing process.env in Angular (Vercel deployment) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @angular/localize | ngx-translate (runtime) | Runtime translation allows language switching without rebuild; not needed for German-only v1 |
| Tailwind CSS | PrimeNG themes alone | Less design freedom; user specifically chose Tailwind for custom warm styling |
| Email/password | Magic links only | Supabase supports both; email/password more familiar for family app users |

**Installation:**
```bash
# Core Angular + Supabase
npm install @supabase/supabase-js

# Tailwind CSS (automated)
ng add tailwindcss

# i18n
ng add @angular/localize

# Environment variables (for Vercel)
npm install @ngx-env/builder --save-dev
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── core/                    # Singleton services, guards (imported once)
│   │   ├── services/
│   │   │   ├── supabase.service.ts    # Supabase client, auth methods
│   │   │   └── auth.service.ts         # High-level auth state management
│   │   └── guards/
│   │       └── auth.guard.ts           # Route protection (functional guard)
│   ├── features/                # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── confirm-email/
│   │   ├── dishes/              # Placeholder for Phase 2
│   │   └── meal-plan/           # Placeholder for Phase 2
│   ├── shared/                  # Reusable UI components, directives, pipes
│   │   ├── components/
│   │   │   ├── layout/          # App shell, nav, logout button
│   │   │   └── form-errors/     # Reusable inline validation display
│   │   └── directives/
│   ├── app.config.ts            # App configuration (angular 21 standalone)
│   └── app.routes.ts            # Route configuration with guards
├── environments/
│   ├── environment.ts           # Development (Supabase URL/Key)
│   └── environment.prod.ts      # Production (overridden by Vercel env vars)
├── assets/
│   └── i18n/                    # Translation files (if needed)
└── styles.css                   # Global Tailwind imports
```

### Pattern 1: Supabase Service (Singleton)
**What:** Centralized service managing Supabase client and auth operations
**When to use:** Required for all Supabase interactions
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/getting-started/tutorials/with-angular
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // Get current user (makes network request)
  async getUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // Sign up with email/password
  async signUp(email: string, password: string, metadata?: any) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
  }

  // Sign in with email/password
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  // Sign out
  async signOut() {
    return this.supabase.auth.signOut();
  }

  // Listen to auth state changes
  authChanges(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
```

### Pattern 2: Functional Route Guards (angular 21)
**What:** Function-based guards replacing class-based guards
**When to use:** Protect routes requiring authentication
**Example:**
```typescript
// Source: https://angular.dev/guide/routing/route-guards
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

// In app.routes.ts:
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dishes',
    component: DishesComponent,
    canActivate: [authGuard]  // Protect route
  }
];
```

### Pattern 3: Reactive Forms with Inline Validation
**What:** Angular reactive forms with template-driven error display
**When to use:** Auth forms (login, register) with inline validation messages
**Example:**
```typescript
// Component
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}

// Template with inline errors (under each field)
<form [formGroup]="loginForm">
  <div>
    <input type="email" formControlName="email" i18n-placeholder placeholder="E-Mail" />
    @if (email?.invalid && email?.touched) {
      <p class="text-red-600 text-sm mt-1">
        @if (email?.errors?.['required']) {
          <span i18n>E-Mail ist erforderlich</span>
        }
        @if (email?.errors?.['email']) {
          <span i18n>Ungültige E-Mail-Adresse</span>
        }
      </p>
    }
  </div>
  <!-- Similar for password -->
</form>
```

### Pattern 4: Angular i18n with @angular/localize
**What:** Compile-time translation for German-only UI
**When to use:** All user-facing text in templates
**Example:**
```html
<!-- Mark text with i18n attribute -->
<h1 i18n>Willkommen</h1>
<button i18n>Anmelden</button>

<!-- With description and meaning for translators (not needed for German-only, but good practice) -->
<p i18n="Welcome message|User greeting@@welcomeMessage">
  Willkommen bei Mahl Zeit Planer
</p>
```

```bash
# Extract strings (creates messages.xlf)
ng extract-i18n --output-path src/locale

# Build for German (configure in angular.json)
ng build --configuration production
```

### Pattern 5: Tailwind Responsive Design (Mobile + Desktop Equal Priority)
**What:** Mobile-first breakpoints with equal attention to both experiences
**When to use:** All layouts, especially auth forms and navigation
**Example:**
```html
<!-- Auth form: full-screen on mobile, card on desktop -->
<div class="min-h-screen flex items-center justify-center p-4">
  <div class="w-full md:max-w-md lg:max-w-lg">
    <form class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <!-- Large touch targets on mobile -->
      <button class="w-full py-3 md:py-4 text-lg rounded-lg">
        Anmelden
      </button>
    </form>
  </div>
</div>

<!-- Navigation: bottom tabs on mobile, top/side nav on desktop -->
<nav class="fixed bottom-0 md:static md:top-0 w-full">
  <!-- Responsive navigation structure -->
</nav>
```

### Anti-Patterns to Avoid
- **Directly referencing auth.users columns other than `id`:** Only use `auth.users.id` as foreign key; other columns may change (Supabase-managed schema)
- **Storing secrets in environment.ts:** Use Vercel environment variables for production; environment.ts values are bundled into client code
- **Creating tables without RLS:** Always enable RLS before inserting data; default is RLS disabled (public access)
- **Using class-based guards:** angular 21 recommends functional guards; cleaner injection and composition
- **Bypassing RLS testing via SQL Editor:** SQL Editor has superuser access; always test policies from client SDK
- **Using `auth.uid()` directly in policies:** Wrap in `(select auth.uid())` for 94-99% performance improvement via query plan caching
- **Not indexing policy columns:** Always index columns used in RLS policies (e.g., user_id)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom JWT system | Supabase Auth | Handles token refresh, email confirmation, password reset, session persistence; edge cases like concurrent tab logout |
| Form Validation | Custom validation logic | Angular Validators | Built-in validators (required, email, minLength) cover common cases; compose for complex rules |
| Responsive Breakpoints | Custom media queries | Tailwind responsive utilities | Predefined breakpoints (sm, md, lg, xl, 2xl); consistent across app |
| Email Sending | Custom SMTP client | Supabase Auth emails + custom SMTP | Built-in templates for auth emails; handles rate limiting, link tracking issues |
| Route Protection | Manual auth checks in components | Angular Router Guards | Centralized logic; prevents component load before auth check; composable |
| Session Persistence | Manual localStorage management | Supabase Auth session handling | Automatic token storage, refresh, and cleanup; handles security concerns |
| i18n | Custom translation service | @angular/localize | AOT compilation with translations; no runtime overhead for single locale |

**Key insight:** Authentication and authorization are deceptively complex domains with numerous edge cases (token expiration, concurrent sessions, email deliverability, RLS performance). Using battle-tested solutions (Supabase Auth, Angular Router Guards, Postgres RLS) prevents months of debugging and security vulnerabilities.

## Common Pitfalls

### Pitfall 1: RLS Disabled by Default
**What goes wrong:** Tables created via SQL default to RLS disabled, making all rows publicly readable/writable through the Supabase API, even for authenticated-only apps.
**Why it happens:** Postgres/Supabase design decision; SQL Editor creates tables without RLS unless explicitly enabled.
**How to avoid:**
- Enable RLS immediately after table creation: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Create an event trigger to auto-enable RLS on new tables in public schema
- Verify RLS status before deploying: check dashboard or query `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;`
**Warning signs:**
- Data accessible via API without authentication
- No policies listed in Supabase dashboard for table
- Security audit warnings in Supabase dashboard

### Pitfall 2: auth.uid() Returns NULL for Unauthenticated Requests
**What goes wrong:** RLS policies using `auth.uid() = user_id` silently fail for unauthenticated requests because NULL = anything returns NULL (not false), causing queries to return empty results without errors.
**Why it happens:** SQL NULL comparison semantics; unauthenticated requests have no JWT token, so auth.uid() returns NULL.
**How to avoid:**
- Explicitly check for authentication: `auth.uid() IS NOT NULL AND auth.uid() = user_id`
- Use role-based policies with `TO authenticated` clause to restrict policy evaluation
**Warning signs:**
- Authenticated users can query data, but API returns empty results for same query without token
- No error messages despite failed queries

### Pitfall 3: Supabase Free Tier Project Pausing (7 Days Inactivity)
**What goes wrong:** Projects inactive for 7+ days are automatically paused; app becomes unavailable until manually resumed (or via automated pings).
**Why it happens:** Free tier cost control mechanism.
**How to avoid:**
- **Option 1 (Recommended for production):** Upgrade to Pro tier ($25/month) for always-on hosting
- **Option 2 (Development/demo):** Implement automated "heartbeat" calls:
  - GitHub Actions cron job (twice weekly, runs on UTC schedule)
  - Vercel Edge Function with cron trigger
  - External uptime monitoring service (UptimeRobot, etc.)
- **Option 3:** Accept pausing for low-traffic demos; document resume process for users
**Warning signs:**
- Project status shows "Paused" in dashboard
- API requests fail with connection errors
- Users report app not loading

### Pitfall 4: Email Link Tracking Breaking Confirmation URLs
**What goes wrong:** Some email providers (Gmail, Outlook) prefetch links for security scanning, consuming the one-time confirmation token before the user clicks. Custom SMTP services may rewrite URLs for click tracking, corrupting the token.
**Why it happens:** Email security features and marketing tool defaults.
**How to avoid:**
- Disable link tracking in custom SMTP service settings (SendGrid, Mailgun, etc.)
- Use email OTP codes instead of magic links if prefetching is common for target users
- Set appropriate token expiration (longer than default if prefetching delays user clicks)
**Warning signs:**
- Users report "Invalid or expired link" errors immediately after receiving email
- Confirmation works in some email clients but not others (Gmail issues vs. others work)

### Pitfall 5: Redirect URL Not in Allow List
**What goes wrong:** Email confirmation or auth redirects fail silently or redirect to default Site URL because the target URL is not in the configured allow list.
**Why it happens:** Supabase security feature requires explicit allow list; easy to forget when adding preview URLs or changing domains.
**How to avoid:**
- Configure Site URL immediately (change from localhost:3000 default)
- Add all deployment URLs to allow list: production, preview (wildcards: `https://*-team.vercel.app/**`)
- Update email templates to use `{{ .RedirectTo }}` instead of `{{ .SiteURL }}` if using explicit redirects
- Test confirmation flow on all deployment targets before launch
**Warning signs:**
- Confirmation emails redirect to localhost or wrong domain
- "Invalid redirect URL" errors in browser console after clicking email links

### Pitfall 6: Environment Variables Not Available in Angular Build
**What goes wrong:** Supabase URL/Key hardcoded in environment.ts work locally but fail in production; or secrets leak into client bundle.
**Why it happens:** Angular bundles environment.ts into client code; process.env not available without special configuration.
**How to avoid:**
- Use @ngx-env/builder for process.env support in Angular
- Configure Vercel environment variables in dashboard (never commit .env)
- Use NEXT_PUBLIC_* prefix for client-safe variables (or Angular equivalent)
- Verify variables loaded: `console.log(process.env)` in app.config.ts during development
- Redeploy after adding new environment variables (changes don't auto-apply to existing deployments)
**Warning signs:**
- Supabase errors in production but not locally
- Hardcoded localhost URLs appear in production logs
- "Invalid API key" errors in production

### Pitfall 7: Not Testing RLS Policies from Client SDK
**What goes wrong:** Policies work in SQL Editor but fail from app because SQL Editor uses superuser role that bypasses RLS.
**Why it happens:** SQL Editor privilege escalation for convenience; doesn't reflect real-world API calls.
**How to avoid:**
- Always test policies via Supabase client in app code or via API directly
- Use pgTAP for database-level policy testing with proper role simulation
- Create test users with different access levels; verify data isolation
**Warning signs:**
- SQL Editor shows data, but API returns empty or unauthorized errors
- Policy looks correct but doesn't work as expected from app

### Pitfall 8: Missing Indexes on RLS Policy Columns
**What goes wrong:** Queries with RLS policies become extremely slow (seconds for small tables, minutes for large tables) due to full table scans.
**Why it happens:** RLS policies add WHERE clauses; without indexes, Postgres scans every row.
**How to avoid:**
- Index all columns referenced in RLS policies: `CREATE INDEX idx_table_user_id ON table(user_id);`
- Wrap functions in SELECT for caching: `(select auth.uid())` instead of `auth.uid()` (94-99% improvement)
- Check query plans with EXPLAIN ANALYZE for slow queries
**Warning signs:**
- Queries fast in SQL Editor but slow from app
- Query time scales poorly with table size
- EXPLAIN shows "Seq Scan" on large tables

## Code Examples

Verified patterns from official sources:

### Supabase Client Setup with Environment Variables
```typescript
// Source: https://supabase.com/docs/guides/getting-started/tutorials/with-angular
// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  // Auth methods
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
```

### Database Schema with RLS (Profiles Table)
```sql
-- Source: https://supabase.com/docs/guides/auth/managing-user-data
-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS (CRITICAL: do this before inserting any data)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

-- Index for RLS performance (IMPORTANT)
CREATE INDEX idx_profiles_user_id ON public.profiles(id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Functional Auth Guard
```typescript
// Source: https://angular.dev/guide/routing/route-guards
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getUser();

  if (!user) {
    // Redirect to login, preserving attempted URL
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};

// Usage in app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dishes',
    component: DishesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'meal-plan',
    component: MealPlanComponent,
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/dishes', pathMatch: 'full' }
];
```

### Tailwind Configuration for Warm Green Design
```javascript
// Source: https://tailwindcss.com/docs/colors
// tailwind.config.js (if using manual config; ng add creates this)
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom warm green palette (nature, fresh, healthy)
        primary: {
          50: '#f0fdf4',   // Lightest green
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Main brand green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',  // Darkest green
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
```

### Angular i18n Usage
```html
<!-- Source: https://angular.dev/guide/i18n -->
<!-- Mark all user-facing text with i18n attribute -->

<!-- Simple text -->
<h1 i18n>Willkommen bei Mahl Zeit Planer</h1>

<!-- Button text -->
<button i18n class="btn-primary">Anmelden</button>

<!-- Input placeholder -->
<input type="email" i18n-placeholder placeholder="E-Mail-Adresse" />

<!-- With context for better translation tooling (optional for German-only) -->
<p i18n="Login page|Welcome message@@loginWelcome">
  Melden Sie sich an, um fortzufahren
</p>

<!-- Plural forms (for future multi-language) -->
<span i18n>
  {count, plural, =0 {Keine Gerichte} =1 {1 Gericht} other {{{count}} Gerichte}}
</span>
```

```json
// angular.json configuration for i18n
{
  "projects": {
    "mahl-zeit-planer": {
      "i18n": {
        "sourceLocale": "de",
        "locales": {
          "de": {
            "translation": "src/locale/messages.de.xlf"
          }
        }
      },
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "localize": ["de"]
            }
          }
        }
      }
    }
  }
}
```

### Reactive Form with Inline Validation (German)
```typescript
// Component
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label i18n class="block text-sm font-medium mb-1">E-Mail</label>
        <input
          type="email"
          formControlName="email"
          class="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary-500"
          [class.border-red-500]="email?.invalid && email?.touched"
        />
        <!-- Inline error under field (user requirement) -->
        @if (email?.invalid && email?.touched) {
          <p class="text-red-600 text-sm mt-1">
            @if (email?.errors?.['required']) {
              <span i18n>E-Mail ist erforderlich</span>
            }
            @if (email?.errors?.['email']) {
              <span i18n>Ungültige E-Mail-Adresse</span>
            }
          </p>
        }
      </div>

      <div>
        <label i18n class="block text-sm font-medium mb-1">Passwort</label>
        <input
          type="password"
          formControlName="password"
          class="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary-500"
          [class.border-red-500]="password?.invalid && password?.touched"
        />
        @if (password?.invalid && password?.touched) {
          <p class="text-red-600 text-sm mt-1">
            @if (password?.errors?.['required']) {
              <span i18n>Passwort ist erforderlich</span>
            }
            @if (password?.errors?.['minlength']) {
              <span i18n>Passwort muss mindestens 8 Zeichen lang sein</span>
            }
          </p>
        }
      </div>

      <button
        type="submit"
        [disabled]="loginForm.invalid"
        class="w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
        i18n
      >
        Anmelden
      </button>
    </form>
  `
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  async onSubmit() {
    if (this.loginForm.valid) {
      // Auth logic here
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based guards | Functional guards (CanActivateFn) | Angular 15+ | Simpler dependency injection; guards are pure functions; easier testing and composition |
| NgModules for routing | Standalone components with routes | Angular 14+ | No need for NgModule; direct component imports in routes; smaller bundle size |
| Magic links only | Email/password + magic links | Supabase Auth stable | Both methods supported; email/password more familiar for mainstream users |
| Manual SMTP in app | Supabase Auth emails + custom SMTP | Supabase v2 | Built-in templates, rate limiting, and deliverability best practices |
| Runtime i18n (ngx-translate) | Compile-time (@angular/localize) | Angular 9+ | For single-locale apps: smaller bundles, better performance; multi-locale: still needs runtime |
| Tailwind v3 with separate config | Tailwind v4 with @tailwindcss/postcss | 2024 | Simpler setup; automatic optimization; works with Angular's build system |
| Template-driven forms | Reactive forms | Angular 2+ stable | Reactive forms preferred for complex validation, testing, and dynamic forms |
| Row-level policies with direct auth.uid() | Wrapped in SELECT: (select auth.uid()) | Supabase RLS optimization | 94-99% performance improvement via query plan caching |

**Deprecated/outdated:**
- **HttpModule**: Replaced by HttpClientModule (Angular 4.3+); HttpClient required for modern API calls
- **MD5 password hashing**: Supabase uses bcrypt; never implement custom password hashing
- **Class-based interceptors**: Functional interceptors available (Angular 15+); cleaner but class-based still supported
- **auth.session()**: Replaced by auth.getSession() in Supabase v2; old method may return stale data

## Open Questions

1. **Free Tier Project Pausing Mitigation**
   - What we know: 7-day inactivity threshold; can be mitigated with automated heartbeats or Pro upgrade
   - What's unclear: User's budget and expected traffic; whether this is production or demo
   - Recommendation: Make decision in Phase 1 before deployment; document choice in implementation plan. If budget allows, upgrade to Pro ($25/month) for production; if demo only, implement GitHub Actions heartbeat or accept manual resume.

2. **Passwort-vergessen Flow Implementation Timing**
   - What we know: Supabase has built-in password reset with email templates; marked as "Claude's discretion"
   - What's unclear: User priority vs. implementation effort
   - Recommendation: Include basic password reset in Phase 1 (low effort: single route, uses Supabase built-in flow); only defer if time-constrained, as users expect this feature in auth flows.

3. **Navigation Pattern Selection (Sidebar vs. Bottom Tabs vs. Top Nav)**
   - What we know: Marked as "Claude's discretion"; must support mobile and desktop equally
   - What's unclear: User's aesthetic preference; whether they have design mockups
   - Recommendation: Use responsive navigation: bottom tabs on mobile (better thumb reach), top navigation bar on desktop (more space, familiar pattern). Implement in app shell (shared/layout component) for consistency.

4. **Post-Login Landing Page**
   - What we know: Marked as "Claude's discretion"; dishes and meal plan are placeholders
   - What's unclear: Which placeholder is primary; whether a dedicated dashboard is needed
   - Recommendation: Redirect to "Meine Gerichte" (dishes) as landing page; more intuitive entry point for food planning. Meal plan as secondary nav destination. Defer dedicated dashboard until features exist.

5. **PWA Installation vs. Responsive Web Only**
   - What we know: Marked as "Claude's discretion"; mobile and desktop equally important
   - What's unclear: User's expectations for app-like experience; whether offline support needed
   - Recommendation: Start with responsive web only (simpler); add PWA manifest in later phase if users request "install to home screen". PWA adds complexity (service workers, offline support) without clear v1 benefit.

## Sources

### Primary (HIGH confidence)
- [Supabase Angular Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-angular) - Complete integration guide with code examples
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security) - Official RLS setup and policies
- [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data) - Profiles table patterns and triggers
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) - Email confirmation flow configuration
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp) - Custom email setup for production
- [Angular Routing Guards](https://angular.dev/guide/routing/route-guards) - Functional guard patterns
- [Angular i18n Guide](https://angular.dev/guide/i18n) - Official internationalization setup
- [Angular Tailwind Integration](https://angular.dev/guide/tailwind) - Official CLI setup guide
- [Tailwind CSS Installation (Angular)](https://tailwindcss.com/docs/installation/framework-guides/angular) - Framework-specific setup
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design) - Mobile-first breakpoint system
- [Tailwind CSS Colors](https://tailwindcss.com/docs/colors) - Default palette and customization

### Secondary (MEDIUM confidence)
- [Supabase RLS Best Practices (DesignRevision)](https://designrevision.com/blog/supabase-row-level-security) - Performance optimization patterns
- [Supabase Free Tier Pausing (Medium)](https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263) - Mitigation strategies
- [GitHub: Supabase Pause Prevention](https://github.com/travisvn/supabase-pause-prevention) - Automated heartbeat solution
- [Angular Forms Validation (Pluralsight)](https://www.pluralsight.com/resources/blog/guides/how-to-display-validation-messages-using-angular) - Inline error patterns
- [PrimeNG Tailwind Integration](https://primeng.org/tailwind) - Official plugin documentation
- [Angular Project Structure (Medium)](https://medium.com/@dragos.atanasoae_62577/angular-project-structure-guide-small-medium-and-large-projects-e17c361b2029) - Feature-based organization
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables) - Production deployment config
- [Angular Environment Variables on Vercel (Dotenv)](https://www.dotenv.org/docs/frameworks/angular/vercel) - Angular-specific setup

### Tertiary (LOW confidence - marked for validation)
- Various Stack Overflow posts and community discussions (not authoritative but useful for pitfall discovery)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official, well-documented, and actively maintained; Angular + Supabase integration has official tutorial
- Architecture: HIGH - Patterns sourced from official Angular and Supabase documentation; feature-based structure is industry standard
- Pitfalls: HIGH - RLS issues, free tier pausing, and redirect URL problems are documented in official Supabase troubleshooting; other pitfalls verified across multiple sources
- User constraints: HIGH - Directly copied from CONTEXT.md with clear locked decisions
- Open questions: MEDIUM - Based on "Claude's discretion" items; recommendations are reasonable but not user-confirmed

**Research date:** 2026-02-16
**Valid until:** ~30 days (2026-03-18) - Stack is stable; angular 21 and Supabase are mature; Tailwind v4 recently released but stabilized
