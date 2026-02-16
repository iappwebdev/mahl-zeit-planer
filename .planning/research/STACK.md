# Technology Stack

**Project:** Mahl-Zeit-Planer (Family Meal Planning Web App)
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular | 21.x | Frontend framework | Current stable version (as of Feb 2026). Standalone components are default. Signals stable and tightly integrated. SSR with hydration enabled for Vercel deployment. TypeScript 5.9+ support with strict typing. |
| TypeScript | 5.9.x | Type-safe development | Required by Angular 21. Strictly typed reactive forms by default. Enhanced autocomplete and compile-time safety. |
| Node.js | 22.x (LTS) | Development runtime | Angular 21 supports ^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0. Use 22.x for long-term stability. |
| RxJS | 7.x | Reactive programming | Angular 21 compatible with ^6.5.3 \|\| ^7.4.0. Use 7.x for latest features. Signals complement RxJS but don't replace it. |

### Backend & Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest (@supabase/supabase-js 2.95.x) | Backend-as-a-Service | PostgreSQL database, authentication, real-time subscriptions, Row Level Security. Free tier: 500MB DB, 2GB egress, 50K MAU. Projects pause after 7 days inactivity (acceptable for family app). Node 18 EOL reached Apr 2025, dropped in 2.79.0. |
| PostgreSQL | Managed by Supabase | Relational database | Supabase-managed. Supports vector search, full-text search, triggers. Standard SQL for complex meal planning queries. |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Hobby Plan | Hosting & deployment | Free tier: unlimited projects, 150K function invocations/month, 100GB data transfer, automatic HTTPS, Git integration. Excellent Angular SSR support. Non-commercial use only. Projects limited to 2GB/1vCPU. Source files max 100MB. |
| Angular SSR | 21.x | Server-side rendering | Enabled by default with `ng new --ssr`. Full hydration improves FCP/LCP to ~1.5s. Incremental hydration with `@defer` for code splitting. Required for optimal Vercel deployment. |

### UI Components
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Angular Material | 21.x | Material Design 3 components | **Recommended for this project.** MIT licensed, matches Angular version (21.x), M3 theme system, comprehensive component set (cards, dialogs, forms, tables), excellent i18n support, zero licensing concerns. Alternative to PrimeNG for free-tier projects. |
| Angular CDK | 21.x | Drag & Drop, Accessibility | Part of Angular Material. Use for weekly meal plan drag-drop interface. `CdkDragDrop` for reordering meals. Accessibility primitives (a11y). |
| PrimeNG | ~~Not recommended~~ | UI library alternative | **Avoid for free tier.** MIT license only for current version; older versions require LTS license after 6 months. Licensing complexity not worth it for hobby project. Use Angular Material instead. |

### Forms & Validation
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Angular Reactive Forms | Built-in | Form handling | Use exclusively (not template-driven forms). Strictly typed by default since Angular 14. Compile-time safety prevents accessing invalid properties. Validators: `Validators.required`, `Validators.minLength`, custom validators for dish categories. |
| @angular/forms | 21.x | Forms API | Built into Angular. `FormControl`, `FormGroup`, `FormBuilder` with full TypeScript generics. |

### Internationalization
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @angular/localize | 21.x | i18n support | Install with `ng add @angular/localize`. Compile-time translation (not runtime library). Mark templates with `i18n` attribute. Extract with `ng extract-i18n`. German strings ~40% longer than English—design for text expansion. Use custom translation IDs for stability. Produces separate bundles per locale (optimized for production). |

### State Management
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Angular Signals | Built-in | Local & shared state | **Recommended for this project.** Use signals for reactive state in services. No NgRx needed for family meal planner scope. Signal inputs/outputs for components. `computed()` for derived state (e.g., week balanced?). `effect()` for side effects (e.g., save to Supabase on change). |
| Supabase Realtime | Via @supabase/supabase-js | Multi-user sync | Listen to PostgreSQL changes. Update signals when family members modify meals. Use with RxJS `fromEvent` or convert to signals with `toSignal()`. |

### Testing
| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit testing | **Default in Angular 21 CLI.** Replaces Karma/Jasmine for new projects. Fast startup (built on Vite), ESM-first, TypeScript-native. Same syntax as Jasmine/Jest (minimal migration if needed). Vitest fully stable in Angular 21. |
| Jasmine | Test syntax | Still supported as testing framework syntax. Tests written in Jasmine work with Vitest runner. |
| @angular/testing | Component testing | Angular TestBed, fixture, async utilities. Works with Vitest. |

### Code Quality
| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | TSLint deprecated since 2019. Use `angular-eslint` with flat config (ESLint v9 default). Configure for standalone components and signals. |
| Prettier | Code formatting | Pair with ESLint. Standardize formatting across team. |

## Installation

```bash
# Create Angular app with SSR
ng new mahl-zeit-planer --ssr --standalone --style=scss --routing

# Core dependencies (most included by default)
npm install @angular/material @angular/cdk
npm install @supabase/supabase-js

# Internationalization
ng add @angular/localize

# Dev dependencies (included by Angular 21 CLI)
# - Vitest (default test runner)
# - ESLint (angular-eslint)
# - TypeScript 5.9+
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI Library | Angular Material 21 | PrimeNG | PrimeNG has LTS licensing complexity. Free MIT tier only for current version; older versions need paid license after 6 months. Angular Material is MIT forever, version-matched, and sufficient for this use case. |
| State Management | Signals + Services | NgRx Signal Store | NgRx overkill for family meal planner. Signals provide reactivity without boilerplate. Scale to NgRx only if multi-module enterprise complexity emerges (unlikely). |
| Testing | Vitest | Karma/Jasmine | Karma deprecated 2023. Vitest is faster, modern, default in Angular 21. Migration guide exists for older projects. |
| i18n | @angular/localize | ngx-translate | Angular's native i18n is compile-time optimized (smaller bundles). ngx-translate is runtime library (larger bundles, more flexible for dynamic language switching). Compile-time better for single-language deployment (German only). |
| Backend | Supabase | Firebase | Supabase chosen (per project context). PostgreSQL vs Firestore: better relational queries for meal planning (dish categories, weekly plans with joins). Row Level Security vs Firebase Rules: RLS more powerful for multi-user family access patterns. Free tier comparable. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| NgModules | Deprecated pattern since Angular 15. Standalone components are default in v19+. Adds unnecessary boilerplate. | Standalone components (`standalone: true` is default in Angular 21) |
| Template-driven forms | Weak typing, harder to test, less control over validation. | Reactive forms (typed, testable, composable validators) |
| TSLint | Deprecated since 2019. No longer maintained. | ESLint with `angular-eslint` |
| Karma | Deprecated since 2023. Slow startup, outdated. | Vitest (default in Angular 21) |
| @angular/platform-browser-dynamic | Used for JIT compilation. Angular 21 defaults to AOT (Ahead-of-Time). | @angular/platform-browser (AOT only) |
| PrimeNG LTS versions | Paid license required after 6 months for older Angular versions. Licensing risk. | Angular Material (MIT, version-matched, free forever) |

## Stack Patterns by Variant

**For German-only UI (this project):**
- Use `@angular/localize` with compile-time i18n
- Extract strings to `messages.de.xlf`
- Build single German bundle: `ng build --localize=de`
- Smaller bundle size than runtime i18n libraries

**For multi-language future (not now):**
- Stay with `@angular/localize` (supports multiple locales)
- Build multiple bundles: `ng build --localize`
- Serve locale-specific bundles based on URL or Accept-Language header
- Do NOT switch to ngx-translate unless dynamic language switching within session is required

**For Supabase Row Level Security:**
- Enable RLS on all tables: `ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;`
- Create policies for family members: `CREATE POLICY family_read ON dishes FOR SELECT USING (family_id = auth.uid());`
- Use service role key ONLY on server (Edge Functions), never in browser
- Use anon key in Angular app (safe with RLS enabled)

**For Vercel deployment:**
- Use Angular CLI builder for Vercel (auto-detected)
- Add `vercel.json` for custom routing if needed:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- Create `api/index.js` for serverless function entry point (recent best practice as of Dec 2025):
  ```javascript
  export default async function handler(req, res) {
    const { default: reqHandler } = await import('../dist/server/main.js');
    return reqHandler(req, res);
  }
  ```
- Enable SSR: `ng new --ssr` or `ng add @angular/ssr`

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Angular 21.x | TypeScript 5.9.x | TS 6.x not yet supported |
| Angular 21.x | Node 22.x LTS | Also supports 20.19+, 24.x |
| Angular 21.x | RxJS 7.x | Also supports RxJS 6.5.3+ |
| @angular/material 21.x | Angular 21.x | Must match major version |
| @supabase/supabase-js 2.95.x | Node 20+ | Node 18 support dropped in 2.79.0 |
| Vercel Hobby Plan | Angular SSR | Free tier limits: 150K function invocations/month, 100GB transfer, 2GB/1vCPU serverless functions |
| Supabase Free Tier | PostgreSQL | 500MB DB, 2GB egress, 50K MAU. Project pauses after 7 days inactivity (ping endpoint or upgrade to Pro for 24/7). |

## Free Tier Constraints Summary

**Supabase Free Tier:**
- 500MB database storage (enough for thousands of dishes and weekly plans)
- 2GB database egress per month (low for family use; read-heavy workload)
- 50,000 monthly active users (way more than needed for family)
- **Critical limitation:** Project pauses after 7 days of inactivity
  - Mitigation: Set up weekly cron job to ping health endpoint (e.g., via GitHub Actions, UptimeRobot free tier, or external service)
  - Or: Upgrade to Pro ($25/month) for always-on hosting

**Vercel Hobby Plan:**
- 150,000 function invocations per month (adequate for family app; ~5K/day)
- 100GB Fast Data Transfer (generous for SSR app)
- 2GB memory / 1 vCPU per serverless function (sufficient for Angular SSR)
- 100MB source file upload limit (should be fine; Angular builds compress well)
- **Critical limitation:** Non-commercial use only
  - This is a personal family app, so Hobby plan is appropriate
  - If you commercialize (e.g., SaaS for other families), upgrade to Pro ($20/month)

**Combined Free Tier Viability:**
- **Yes, viable for family meal planner** with caveats:
  - Set up health check to prevent Supabase pause
  - Monitor Vercel function invocations (150K = ~5K/day = ~208/hour sustained)
  - Plan migration to paid tiers if usage grows or commercialization happens

## Sources

**High Confidence (Official Docs & Context7):**
- [Angular Version Compatibility](https://angular.dev/reference/versions) — Angular 21.x, TypeScript 5.9, Node 22.x, RxJS 7.x
- [Supabase Angular Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-angular) — Integration patterns, service architecture
- [Angular SSR Hydration Guide](https://angular.dev/guide/hydration) — Performance benefits, incremental hydration
- [Angular Drag and Drop](https://angular.dev/guide/drag-drop) — CDK drag-drop for meal planning UI
- [Angular i18n Overview](https://angular.dev/guide/i18n) — Localization setup, compile-time translation
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms) — Typed forms, validation patterns
- [Angular Signals](https://angular.dev/guide/signals) — Reactive state management
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby) — Free tier limits, restrictions
- [Angular Testing with Vitest](https://angular.dev/guide/testing/migrating-to-vitest) — Migration guide, Vitest as default

**Medium Confidence (WebSearch + Official Sources):**
- [Supabase Pricing 2026](https://uibakery.io/blog/supabase-pricing) — Free tier limits, project pausing
- [Angular 21 Vitest Default](https://angular.love/angular-21-whats-new/) — Vitest stable in Angular 21
- [PrimeNG Licensing](https://github.com/primefaces/primeng/blob/master/LICENSE.md) — MIT for current, LTS paid
- [Angular Material vs PrimeNG 2026](https://www.infragistics.com/blogs/angular-material-alternatives/) — Component library comparison
- [Angular ESLint Migration](https://github.com/angular-eslint/angular-eslint) — TSLint deprecation, flat config
- [Vercel Angular SSR Deployment](https://medium.com/@vincentdecooman/how-to-publish-angular-19-ssr-to-vercel-67b0f3fb43fa) — Recent deployment patterns (Dec 2025)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — Version 2.95.3 (latest as of Feb 2026)

**Low Confidence (WebSearch only, flagged for validation):**
- None (all key recommendations verified with official docs or Context7)

---

*Stack research for: Family Meal Planning Web App (Angular + Supabase + Vercel)*
*Researched: 2026-02-16*
*Confidence: HIGH (all core technologies verified with official documentation)*
