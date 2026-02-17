# MahlZeitPlaner

Ein Mahlzeitplaner für Familien, der die tägliche Frage "Was kochen wir heute?" eliminiert. Familienmitglieder erfassen gemeinsam Gerichte, kategorisieren sie (Fisch/Fleisch/Vegetarisch), und die App generiert automatisch ausgewogene Wochenpläne für das Abendessen.

## 🎯 Core Value

Die Familie muss nie wieder täglich überlegen, was es zum Abendessen gibt — ein Klick generiert einen ausgewogenen Wochenplan aus dem eigenen Gerichtepool.

## ✨ Features

- ✅ **Gerichte-Verwaltung**: Gerichte erfassen, bearbeiten, löschen mit Kategorien (Fisch/Fleisch/Vegetarisch)
- ✅ **Favoriten**: Beliebte Gerichte markieren und bevorzugt vorschlagen lassen
- ✅ **Wochenplan-Ansicht**: Übersichtlicher Kalender von Montag bis Sonntag
- ✅ **Automatische Generierung**: Ein Klick generiert einen ausgewogenen Wochenplan
- ✅ **Kategorie-Balance**: Konfigurierbare Mix-Regeln (z.B. 2x Fleisch, 2x Vegetarisch, 1x Fisch)
- ✅ **Abwechslung**: Vermeidet Wiederholungen der letzten Wochen
- ✅ **Manuelle Anpassung**: Einzelne Tage tauschen oder ändern
- ✅ **Benutzer-Authentifizierung**: Sichere Registrierung und Login
- 🚧 **Familien-Sharing**: Mehrere Mitglieder teilen sich einen Haushalt (in Arbeit)

## 🛠️ Tech Stack

- **Frontend**: Angular 21 (Standalone Components, Signals)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS v4 + Angular Material
- **Hosting**: Vercel
- **Language**: TypeScript, Deutsch-only UI

## 🚀 Getting Started

### Voraussetzungen

- Node.js 18+ und npm
- Supabase Account (kostenlos)

### Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd mahl-zeit-planer
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Supabase Projekt einrichten**
   - Erstelle ein Projekt auf [supabase.com](https://supabase.com)
   - Kopiere Project URL und Publishable Key aus Settings → API
   - Aktualisiere `src/environments/environment.ts`:
     ```typescript
     export const environment = {
       production: false,
       supabaseUrl: 'DEINE_SUPABASE_URL',
       supabasePublishableKey: 'DEIN_PUBLISHABLE_KEY',
     };
     ```

4. **Datenbank-Migrationen ausführen**
   - Öffne Supabase Dashboard → SQL Editor
   - Führe die Migrationen in dieser Reihenfolge aus:
     1. `supabase/migrations/001_profiles.sql`
     2. `supabase/migrations/002_dishes.sql`
     3. `supabase/migrations/003_meal_plans.sql`

5. **Auth konfigurieren**
   - Supabase Dashboard → Authentication → Providers → Email
   - Aktiviere "Confirm email"
   - Setze Site URL: `http://localhost:4200`

6. **Dev Server starten**
   ```bash
   ng serve
   ```
   App läuft auf `http://localhost:4200`

### Testdaten einfügen (optional)

Um 30 deutsche Beispiel-Gerichte einzufügen:

```bash
npx tsx scripts/seed-dishes.ts
```

Das Script fragt nach deinen Supabase-Zugangsdaten und fügt 10 Fisch-, 10 Fleisch- und 10 vegetarische Gerichte ein.

## 📁 Projekt-Struktur

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth & Guest Guards
│   │   └── services/        # SupabaseService
│   ├── features/
│   │   ├── auth/            # Login, Register, Reset Password
│   │   ├── dishes/          # Gerichte-Verwaltung
│   │   └── meal-plan/       # Wochenplan & Generierung
│   └── shared/              # Wiederverwendbare Components
├── environments/            # Supabase Config
└── styles.css              # Tailwind Imports

supabase/
└── migrations/             # Datenbank-Schema & RLS Policies
```

## 🔒 Sicherheit

- **Row Level Security (RLS)**: Alle Tabellen haben RLS aktiviert
- **Optimierte Policies**: Verwendet `(SELECT auth.uid())` Pattern für 94-99% Performance-Gewinn
- **Publishable Key**: Verwendet neue Supabase Publishable Keys (anon keys deprecated)
- **Client-Safe**: Alle Keys im Frontend sind öffentlich sicher (RLS schützt Daten)

## 🧪 Development

### Build

```bash
ng build
```

Build-Artefakte werden in `dist/` gespeichert.

### Tests

```bash
ng test
```

Verwendet [Vitest](https://vitest.dev/) als Test Runner.

### Code Scaffolding

```bash
ng generate component component-name
ng generate service service-name
```

## 📝 Roadmap

- [x] **Phase 1**: Foundation & Auth
- [x] **Phase 2**: Dish Management
- [x] **Phase 3**: Meal Planning
- [ ] **Phase 4**: Realtime Collaboration (in Arbeit)

Details siehe `.planning/ROADMAP.md`

## 🤝 Contributing

Dieses Projekt ist ein privates Familien-Tool. Contributions sind aktuell nicht vorgesehen.

## 📄 License

Private Project - All Rights Reserved

## 🙏 Acknowledgments

- [Angular](https://angular.dev/) - Frontend Framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS
- [Angular Material](https://material.angular.io/) - UI Components
