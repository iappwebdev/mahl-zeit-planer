# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Secure auth (register, login, logout) with email/password, German-language responsive app shell on any device, and database setup with Row Level Security. Users can register, confirm via email, log in, stay authenticated, and log out. App displays in German on mobile and desktop. Dish management, meal planning, and collaboration are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Auth-Seiten Design
- Nach Registrierung: Bestaetigungsseite anzeigen ("Bitte E-Mail bestaetigen"), erst nach Bestaetigung Zugang zur App
- Fehlermeldungen: Inline unter den jeweiligen Eingabefeldern (rote Hinweise direkt unter dem Feld)

### App-Shell & Navigation
- Logout-Button: Direkt sichtbar in der Navigationsleiste (nicht versteckt in Submenue)
- Platzhalter-Seiten: Leere Seiten fuer Gerichte und Wochenplan mit "Kommt bald" Hinweis, damit die Navigation von Anfang an komplett wirkt

### Visuelles Design
- Gesamtstil: Warm und freundlich — weiche Farben, abgerundete Ecken, einladend wie eine Familien-App
- Farbrichtung: Gruentoene (natur, frisch, gesund — passend zu Essen/Kochen)
- UI-Framework: Tailwind CSS fuer maximale Designfreiheit beim warmen Stil

### Mobile Anpassung
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

</decisions>

<specifics>
## Specific Ideas

- Keine bestimmte Design-Referenz — "warm und freundlich mit Gruentoenen" als Richtung reicht
- App soll sich anfuehlen wie eine einladende Familien-App, nicht wie ein technisches Tool
- Logo/Branding soll auf Auth-Seiten sichtbar sein fuer Wiedererkennung

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-02-16*
