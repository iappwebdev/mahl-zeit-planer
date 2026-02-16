# Roadmap: MahlZeitPlaner

## Overview

This roadmap delivers a family meal planning app that eliminates daily dinner decisions through automated weekly meal plan generation. The journey starts with secure authentication and infrastructure, builds the dish library foundation, implements both manual and automated meal planning, and finishes with realtime collaboration for family members to share and edit plans together.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Auth** - Secure infrastructure, authentication, and database setup with RLS
- [ ] **Phase 2: Dish Management** - Complete dish library CRUD with categories and favorites
- [ ] **Phase 3: Meal Planning** - Manual and automated weekly meal plan generation
- [ ] **Phase 4: Realtime Collaboration** - Multi-user sync and family workspace sharing

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can securely register, login, and access a German-language web app on any device
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. User can register with email/password and receive confirmation
  2. User can log in and stay authenticated across browser sessions
  3. User can log out from any page
  4. App displays in German on both mobile and desktop devices
  5. Database tables have Row Level Security enabled before any data exists
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Project infrastructure: Angular scaffold, Supabase client, Tailwind CSS, DB schema with RLS
- [ ] 01-02-PLAN.md — Auth flow: login, register, confirm-email, reset-password pages with guards
- [ ] 01-03-PLAN.md — App shell: responsive navigation, logout, placeholder pages, visual verification

### Phase 2: Dish Management
**Goal**: Families can build and maintain their personal dish library with categories and favorites
**Depends on**: Phase 1
**Requirements**: DISH-01, DISH-02, DISH-03, DISH-04, DISH-05
**Success Criteria** (what must be TRUE):
  1. User can create a dish with name and category (Fisch/Fleisch/Vegetarisch)
  2. User can edit existing dish name or category
  3. User can delete dishes from their library
  4. User can filter dish list by category
  5. User can mark dishes as favorites and see favorites indicated in the list
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Meal Planning
**Goal**: Users can generate balanced weekly dinner plans automatically or build them manually
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07
**Success Criteria** (what must be TRUE):
  1. User sees a Monday-to-Sunday weekly calendar with dinner assignment for each day
  2. User can manually assign dishes to specific days
  3. User can click a button to auto-generate a complete weekly meal plan
  4. Auto-generated plan respects category balance rules (e.g., 2x Fleisch, 2x Vegetarisch, 1x Fisch)
  5. Auto-generated plan prefers favorite dishes and avoids recent repeats
  6. User can swap individual meals in the plan without regenerating the entire week
  7. User can regenerate the entire week with one click
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Realtime Collaboration
**Goal**: Family members share one workspace and see each other's changes instantly
**Depends on**: Phase 3
**Requirements**: AUTH-04, AUTH-05, AUTH-06, UI-03
**Success Criteria** (what must be TRUE):
  1. User can create a family workspace (household)
  2. User can invite family members via email or shareable link
  3. All family members see the same dish library and meal plans
  4. Changes made by one family member appear instantly for others without page refresh
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/3 | Not started | - |
| 2. Dish Management | 0/2 | Not started | - |
| 3. Meal Planning | 0/3 | Not started | - |
| 4. Realtime Collaboration | 0/2 | Not started | - |
