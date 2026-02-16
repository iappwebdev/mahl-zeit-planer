# MahlZeitPlaner

## What This Is

Ein Mahlzeitplaner für Familien, der die tägliche Frage "Was kochen wir heute?" eliminiert. Familienmitglieder erfassen gemeinsam Gerichte, kategorisieren sie (Fisch/Fleisch/Vegetarisch), und die App generiert automatisch ausgewogene Wochenpläne für das Abendessen. Vorschläge können von der Familie angepasst werden.

## Core Value

Die Familie muss nie wieder täglich überlegen, was es zum Abendessen gibt — ein Klick generiert einen ausgewogenen Wochenplan aus dem eigenen Gerichtepool.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Gerichte erfassen mit Name und Kategorie (Fisch/Fleisch/Vegetarisch)
- [ ] Gerichte bearbeiten und löschen
- [ ] Automatische Wochenplan-Generierung (7x Abendessen)
- [ ] Kategorie-Mix-Regeln bei der Generierung (z.B. 2x Fleisch, 2x Vegetarisch, 1x Fisch)
- [ ] Favoriten-Berücksichtigung (beliebte Gerichte öfter vorschlagen)
- [ ] Abwechslung sicherstellen (keine Wiederholung der letzten Wochen)
- [ ] Generierten Wochenplan anpassen (einzelne Tage tauschen/ändern)
- [ ] Wochenplan-Ansicht (Montag bis Sonntag)
- [ ] Benutzer-Registrierung und Login
- [ ] Familien-Zugang: mehrere Mitglieder teilen sich einen Haushalt/Plan
- [ ] Responsive Web-App (Handy + Desktop)

### Out of Scope

- Mobile Native App — Web-first, ggf. später als PWA oder native App
- Einkaufsliste — kommt in späterer Version wenn Zutaten erfasst werden
- Zutatenverwaltung & Rezepte — Gerichte starten minimal (Name + Kategorie), Erweiterung später
- Frühstück/Mittagessen — nur Abendessen in v1
- Nährwertberechnung — nicht geplant
- Mehrsprachigkeit — Deutsch reicht für v1

## Context

- Die App löst ein reales Familien-Problem: tägliche Entscheidungsmüdigkeit beim Kochen
- Die Gerichte-Erfassung ist bewusst minimal gehalten (Name + Kategorie), um den Einstieg niedrigschwellig zu halten
- Stufenweiser Ausbau geplant: erst Gerichte-Basis aufbauen, dann Zutaten ergänzen, dann Einkaufsliste
- Supabase Auth wird für Benutzer-Management und Familien-Sharing genutzt
- Supabase Realtime ermöglicht, dass Familienmitglieder Änderungen sofort sehen

## Constraints

- **Tech Stack**: Angular + Supabase + Vercel — entschieden basierend auf vorhandener Angular-Erfahrung
- **Datenbank**: Supabase PostgreSQL — Auth, Realtime und DB aus einem Service
- **Hosting**: Vercel — einfaches Deployment, kostenloser Starter-Plan
- **Sprache**: Deutsch als UI-Sprache
- **Kosten**: Free-Tier-kompatibel (Supabase Free + Vercel Hobby)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Angular statt Next.js | Vorhandene Erfahrung nutzen, kein neues Framework lernen | — Pending |
| Supabase als Backend | Auth + DB + Realtime aus einer Hand, kein eigenes Backend nötig | — Pending |
| Nur Abendessen in v1 | Fokus auf Kernproblem, Komplexität reduzieren | — Pending |
| Gerichte minimal starten | Name + Kategorie reicht zum Start, Zutaten/Rezepte kommen später | — Pending |
| Vercel Hosting | Einfaches Deployment, gute Angular-Unterstützung | — Pending |

---
*Last updated: 2026-02-16 after initialization*
