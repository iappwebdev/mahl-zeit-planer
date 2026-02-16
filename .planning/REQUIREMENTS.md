# Requirements: MahlZeitPlaner

**Defined:** 2026-02-16
**Core Value:** Die Familie muss nie wieder täglich überlegen, was es zum Abendessen gibt — ein Klick generiert einen ausgewogenen Wochenplan aus dem eigenen Gerichtepool.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Gerichte

- [ ] **DISH-01**: User kann Gericht erstellen mit Name und Kategorie (Fisch/Fleisch/Vegetarisch)
- [ ] **DISH-02**: User kann Gericht bearbeiten (Name und Kategorie ändern)
- [ ] **DISH-03**: User kann Gericht löschen
- [ ] **DISH-04**: User kann Gerichte nach Kategorie filtern
- [ ] **DISH-05**: User kann Gericht als Favorit markieren/entmarkieren

### Wochenplan

- [ ] **PLAN-01**: User sieht Wochenkalender (Mo-So) mit zugewiesenem Abendessen pro Tag
- [ ] **PLAN-02**: App generiert automatisch einen Wochenplan aus dem Gerichtepool
- [ ] **PLAN-03**: Auto-Generierung berücksichtigt Kategorie-Mix (konfigurierbare Verteilung z.B. 2x Fleisch, 2x Vegetarisch, 1x Fisch, 2x frei)
- [ ] **PLAN-04**: Auto-Generierung bevorzugt Favoriten-Gerichte
- [ ] **PLAN-05**: Auto-Generierung vermeidet Wiederholung der letzten Wochen
- [ ] **PLAN-06**: User kann einzelnes Gericht im Plan gegen anderes aus der Bibliothek tauschen
- [ ] **PLAN-07**: User kann kompletten Wochenplan mit einem Klick neu generieren

### Auth & Familie

- [ ] **AUTH-01**: User kann sich mit Email und Passwort registrieren
- [ ] **AUTH-02**: User kann sich einloggen und bleibt über Browser-Refresh eingeloggt
- [ ] **AUTH-03**: User kann sich ausloggen
- [ ] **AUTH-04**: User kann Familien-Workspace erstellen (Haushalt)
- [ ] **AUTH-05**: User kann Familienmitglieder per Email/Link einladen
- [ ] **AUTH-06**: Alle Familienmitglieder teilen Gerichte und Wochenpläne

### UI & Realtime

- [ ] **UI-01**: App ist responsive (funktioniert auf Handy und Desktop)
- [ ] **UI-02**: Oberfläche ist auf Deutsch
- [ ] **UI-03**: Änderungen von Familienmitgliedern sind sofort sichtbar (Realtime)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Erweiterte Gerichte

- **DISH-06**: User kann Zutaten zu einem Gericht hinzufügen
- **DISH-07**: User kann Zubereitungsanleitung/Rezept erfassen
- **DISH-08**: User kann externen Rezept-Link zu einem Gericht speichern

### Erweiterte Planung

- **PLAN-08**: User kann Gerichte per Drag-Drop im Kalender verschieben
- **PLAN-09**: User kann einen guten Wochenplan als Template speichern
- **PLAN-10**: User kann Mahlzeitenhistorie einsehen ("Was hatten wir letzte Woche?")

### Einkauf

- **SHOP-01**: App generiert automatisch Einkaufsliste aus Wochenplan-Zutaten
- **SHOP-02**: User kann Einkaufsliste abhaken

### Erweiterte Familie

- **AUTH-07**: Familienmitglieder können Gerichte bewerten/voten
- **AUTH-08**: Präferenz-Gewichtung fließt in Auto-Generierung ein

### Erweiterte Mahlzeiten

- **MEAL-01**: User kann auch Mittagessen planen
- **MEAL-02**: User kann auch Frühstück planen

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Nährwertberechnung/Kalorien | Verschiebt Fokus von Planung zu Diät-App. Andere Zielgruppe. |
| Native Mobile App | Web-first, responsive reicht für v1. PWA oder Native später. |
| Mehrsprachigkeit | Deutsch reicht für v1. Internationalisierung bei Bedarf. |
| Rezept-Import/Web-Clipper | Zu komplex, andere Apps machen das besser. Gerichte starten minimal. |
| Social Features / Rezepte teilen | Nicht Kernwert. Nur Familien-Sharing, kein öffentliches Netzwerk. |
| Vorrats-/Kühlschrankverwaltung | Hoher Pflegeaufwand führt zu Abbruch. Users kennen ihren Vorrat. |
| AI-gestützte Vorschläge (LLM) | Kosten und Komplexität. Einfacher Algorithmus reicht für v1. |
| Event Sourcing | Overkill für Mahlzeitplaner. CRUD + Supabase Realtime deckt alles ab. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISH-01 | Phase 2 | Pending |
| DISH-02 | Phase 2 | Pending |
| DISH-03 | Phase 2 | Pending |
| DISH-04 | Phase 2 | Pending |
| DISH-05 | Phase 2 | Pending |
| PLAN-01 | Phase 3 | Pending |
| PLAN-02 | Phase 3 | Pending |
| PLAN-03 | Phase 3 | Pending |
| PLAN-04 | Phase 3 | Pending |
| PLAN-05 | Phase 3 | Pending |
| PLAN-06 | Phase 3 | Pending |
| PLAN-07 | Phase 3 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 4 | Pending |
| AUTH-05 | Phase 4 | Pending |
| AUTH-06 | Phase 4 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after roadmap creation*
