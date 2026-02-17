# Phase 4: Realtime Collaboration - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Family members share one workspace (household) and see each other's changes to dishes and meal plans instantly via Supabase Realtime. Users can create a household, invite members, and collaborate on the shared dish library and weekly plans.

</domain>

<decisions>
## Implementation Decisions

### Household setup
- Household creation is a **separate step after login** — not part of registration
- Users access it from a new "Haushalt" section in the settings page
- One user can belong to **one household only** (no multi-household switching)
- Creator becomes **owner** — only owner can remove members and delete household
- Day-to-day usage is equal for all members (add/edit dishes, modify plans, invite others)
- App works **fully functional solo** without a household — household is optional

### Invitation flow
- **Both methods available:** shareable link + email invitation
- Shareable links **expire after 7 days** — owner/member generates a new one when needed
- **Any member** can invite others (not restricted to owner)
- Invited users without an account: registration flow → **auto-join household** after signup (invite token preserved through registration)

### Data sharing model
- When joining: existing dishes **merge into household** — no data lost
- When leaving: dishes **stay with household** — leaving member starts fresh
- **No individual dish ownership** within a household — all dishes belong to the shared pool, any member can edit or delete any dish
- Meal plans are shared per household — all members see and can modify the same weekly plans

### Realtime sync UX
- **Inline updates + subtle toast** — changes appear immediately in the UI, plus a brief toast confirms what changed (e.g., "Lisa hat Montag geändert")
- **Last write wins** for concurrent edits — with instant sync, conflicts are rare in a family context
- **Activity feed** showing recent household changes (who added/changed what)

### Claude's Discretion
- Activity feed placement (notification bell vs. settings section vs. other)
- Toast styling and duration
- Exact Supabase Realtime channel architecture
- RLS policy design for household-scoped data
- Migration strategy for existing user data when creating/joining a household

</decisions>

<specifics>
## Specific Ideas

- Household management lives in the existing settings page as a "Haushalt" section
- Toasts should reference the person's name: "Lisa hat Lachs hinzugefügt", "Max hat Montag geändert"
- Solo usage must remain unchanged — no degradation for users who never create a household

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-realtime-collaboration*
*Context gathered: 2026-02-17*
