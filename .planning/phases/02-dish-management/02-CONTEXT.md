# Phase 2: Dish Management - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete dish library CRUD with categories and favorites. Users can create, edit, delete, filter, and favorite dishes with three categories (Fisch/Fleisch/Vegetarisch). This phase delivers the full dish management UI and data layer. Meal planning and collaboration are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Dish list layout
- Simple list rows — compact, scannable format with dish name, category tag, and favorite icon per row
- Favorites indicated with a heart icon toggle (filled = favorite, outline = not)
- Categories shown as colored badge/pill per dish (e.g., green = Vegetarisch, red = Fleisch, blue = Fisch)
- Default sort: favorites first, then alphabetical A–Z
- Total dish count visible (e.g., "12 Gerichte")

### Add/Edit experience
- Add new dish via inline form at top of list — type name, pick category, done
- Edit uses same inline area at top, pre-filled with current values
- Category selection via dropdown/select in the form
- Minimal fields: name + category only (no notes/description field)

### Category filtering
- Horizontal tab bar: Alle | Fisch | Fleisch | Vegetarisch | Favoriten
- Dedicated "Favoriten" tab shows only favorited dishes across all categories
- Text search field to find dishes by name, narrows results within active tab

### Delete behavior
- Delete icon (trash/X) always visible on every row
- No confirmation dialog — delete immediately
- Show "Rückgängig" undo toast/snackbar for a few seconds after deletion

### Empty state
- Friendly message: "Noch keine Gerichte — füge dein erstes hinzu!" with prominent add button
- Shown when dish list is completely empty

### Claude's Discretion
- Search field placement relative to tabs (above or below)
- Exact color choices for category badges
- Undo toast duration and styling
- Loading states and error handling
- Exact spacing, typography, and responsive breakpoints

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

*Phase: 02-dish-management*
*Context gathered: 2026-02-16*
