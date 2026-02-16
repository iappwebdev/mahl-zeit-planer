# Phase 3: Meal Planning - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Weekly dinner plan management — users see a Mon-Sun calendar, manually assign dishes to days or auto-generate a balanced weekly plan from their dish library. Includes category balance configuration, favorite preference, repeat avoidance, and single-meal swapping. Realtime collaboration and sharing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Weekly calendar layout
- Claude's discretion on layout structure (grid vs list, responsive behavior)
- Each day shows: dish name + category badge (colored, matching Gerichte page colors) + favorite indicator
- Empty days show "Kein Gericht" in muted text — tap the whole card to assign
- Day labels include actual calendar dates (e.g., "Montag, 17. Feb")
- Category distribution summary bar at top/bottom of the week (e.g., "2x Fleisch, 2x Vegetarisch, 1x Fisch")
- Category badge colors must match existing dish management page for consistency

### Generation rules
- Category balance is **user-configurable** — users set how many of each category per week (e.g., number inputs or sliders)
- Leftover days (when configured counts don't add up to 7) are filled with dishes from any category
- Avoid repeating dishes from the previous 2 weeks
- Prefer favorite dishes during generation
- Small library fallback: allow repeats but show warning ("Nicht genügend Gerichte für volle Abwechslung")

### Dish assignment interaction
- Tap empty day → dish picker opens (modal/bottom sheet)
- Dish picker includes category filter tabs/chips (matching Gerichte page filtering)
- Filled days show a swap/edit icon — tapping it opens the same dish picker, selecting replaces the dish
- Clear action available on filled days — can remove a dish without replacing it

### Week navigation
- Default view: current calendar week
- Can navigate to next week only (current + 1 week ahead)
- Past weeks viewable in read-only mode (to see what was eaten)
- Regenerating a week with existing assignments shows confirmation dialog: "Bestehende Einträge überschreiben?"

### Claude's Discretion
- Layout structure (grid vs vertical list, mobile vs desktop adaptation)
- Generate button placement and prominence
- Completion indicator when all 7 days are filled
- Exact category balance configuration UI (sliders, number inputs, etc.)
- Week navigation controls (arrows, swipe, etc.)
- Dish picker presentation (modal vs bottom sheet, search, sorting)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-meal-planning*
*Context gathered: 2026-02-16*
