# Feature Research

**Domain:** Family Meal Planning
**Researched:** 2026-02-16
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dish Library | Every meal planner needs a place to store what you can cook | Low | Simple CRUD: name, category (Fish/Meat/Vegetarian). Already in scope. |
| Weekly Calendar View | Users plan in weekly cycles for dinner | Low | Standard calendar UI showing 7 days. Drag-drop is expected UX. |
| Auto-Generate Meal Plan | Core value proposition - saves mental load | Medium | Balance algorithm: ensure variety across categories (Fish/Meat/Veg). Most critical feature. |
| Edit/Swap Meals | Plans change - users need flexibility without starting over | Low | Allow replacing individual days or regenerating specific slots. |
| Multi-User Access | Family planning is collaborative by nature | Medium | Supabase handles auth/sharing. Need invitation system and shared workspace. |
| Mobile-Friendly UI | Users check plans while grocery shopping or in kitchen | Medium | Angular Material responsive design. Vercel handles deployment. |
| Data Persistence | Users don't want to lose their dish library or plans | Low | Supabase provides this out of box. Minimal effort. |

### Differentiators (Competitive Advantage)

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Simplicity-First Design | Most apps overwhelm with recipes/nutrition/shopping - focus on just dinner planning | Low | Anti-feature as differentiator. Build LESS. German market may prefer focused tools. |
| Balanced Variety Enforcement | Auto-planner ensures no category repeats 2 days in a row | Medium | Smart constraint in generation algorithm. Prevents "pasta every night" fatigue. |
| Category-Based Planning | Fish/Meat/Veg is simpler than calorie/macro/ingredient tracking | Low | Already in scope. Differentiates from diet-focused apps. |
| No Recipe Lock-In | Users just name dishes, not forced to add full recipes | Low | Reduces onboarding friction. Add recipes later if needed. |
| German-First UI | Most competitors are English-first with poor translations | Low | Native German builds trust in DACH market. |
| Quick Meal Swapping | One-click "I don't want chicken tonight" → instant replacement | Medium | Requires partial re-generation algorithm. High user value for flexibility. |
| Family Preference Voting | Let family members upvote/downvote dishes to guide auto-planner | High | Defer to v2. Requires user role system + preference weighting algorithm. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full Recipe Management | "I want to store cooking instructions" | Feature creep - delays core value delivery. 68% abandon recipes mid-cook due to poor organization. Competitors do this better already. | Just store dish name + category. Link to external recipe sites if user wants details. Add in v2+ only if validated. |
| Automated Shopping Lists | "Generate grocery list from meals" | Requires ingredient-level data entry = high onboarding friction. Meal planning apps fail on "tedious setup." | Defer to later milestone. User manually shops based on meal names (they know what "Spaghetti Bolognese" needs). |
| Nutrition Tracking | "I want to see calories/macros" | Shifts focus from simple planning to diet app. Creates "food relationship anxiety" and obsessive tracking. Different user segment. | Explicitly avoid. Refer users to dedicated nutrition apps. Stay focused on variety and balance. |
| Breakfast/Lunch Planning | "Plan all meals, not just dinner" | Scope explosion. Most families have routine breakfast/lunch but need help with dinner. Research shows dinner is the high-stress meal. | v1 = dinner only. Validate market need before expanding. |
| Inventory/Pantry Tracking | "Don't suggest meals I can't cook" | Requires manual input of fridge/pantry contents. High maintenance burden causes abandonment. | Trust users know their pantry. They can swap meals they can't cook. |
| Pre-Made Meal Plans | "Just tell me what to cook this week" | One-size-fits-all doesn't work - preferences vary widely. Users want personalization, not generic templates. | Auto-generate FROM user's dish library instead. Personalized by definition. |
| Social Features / Sharing Recipes | "Let me share with friends" | Adds complexity (permissions, discovery, moderation). Not core value. External recipe sites do this better. | Family sharing only (multi-user access). No public/social features in v1. |

## Feature Dependencies

```
Dish Library (base requirement)
    └──required by──> Auto-Generate Meal Plan
                          ├──required by──> Edit/Swap Individual Meals
                          ├──required by──> Balanced Variety Enforcement
                          └──required by──> Quick Meal Swapping

Multi-User Access (authentication)
    └──required by──> Family Preference Voting (defer to v2)

Weekly Calendar View
    └──enhanced by──> Drag-Drop Rescheduling (nice-to-have UX improvement)
```

### Dependency Notes

- **Dish Library → Auto-Generate Meal Plan:** Cannot generate plans without dishes to choose from. Must build library management first.
- **Auto-Generate → Balanced Variety:** Balance algorithm is embedded in generation logic, not separate feature.
- **Auto-Generate → Edit/Swap:** Editing assumes a plan exists. Generation must work first.
- **Multi-User Access → Preference Voting:** Voting requires identifying which family member voted. Auth prerequisite.
- **Weekly Calendar → Drag-Drop:** Can launch with basic calendar and click-to-edit. Drag-drop is UX polish, not blocker.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Dish Library (CRUD)** — Cannot plan without dishes. Store name + category (Fish/Meat/Vegetarian). Essential.
- [x] **Auto-Generate Weekly Plan** — Core value proposition. Algorithm that picks 7 dinners ensuring category variety. Make or break feature.
- [x] **Weekly Calendar View** — Users need to see "what's for dinner Monday-Sunday." Basic display required.
- [x] **Swap Individual Meal** — Plans fail without flexibility. Allow clicking a day and picking different dish from library.
- [x] **Multi-User Access (Basic)** — Family planning requires sharing. Implement Supabase auth + invite family members to shared workspace.
- [x] **Mobile-Responsive UI** — Users check plans on phone while shopping. Angular Material responsive grid non-negotiable.

**Why this set:**
- Delivers core value: "Stop thinking about dinner variety, we'll balance it for you"
- Minimal onboarding: Add a few dishes, click generate, done
- Avoids high-friction features (recipes, shopping lists, inventory)
- Validates hypothesis: Do families value auto-balanced meal planning?

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Drag-Drop Calendar Rescheduling** — Trigger: Users request easier rescheduling. Improves UX but not essential for validation. Common in competitor apps.
- [ ] **Regenerate Full Week** — Trigger: "I don't like any of these meals." One-click to generate entirely new plan. Low complexity add.
- [ ] **Dish Favorites/Frequency Preference** — Trigger: "Too much fish" or "More vegetarian please." Simple tagging system to guide auto-generation weights.
- [ ] **Week Template Saving** — Trigger: "I want to repeat this week." Save good weeks as templates. Low complexity, high user retention value.
- [ ] **Basic Recipe Links** — Trigger: Users ask "Where's the recipe?" Add optional URL field to dishes. Compromise between no recipes and full recipe management.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Shopping List Generation** — Why defer: Requires ingredient-level data. High setup friction. Most meal planning apps fail here. Only add if users validate they want this AND will maintain ingredient data.
- [ ] **Family Preference Voting** — Why defer: Complex feature (roles, voting UI, preference algorithm). Validate simpler "frequency preference" first. May not be needed if basic preferences work.
- [ ] **Breakfast/Lunch Planning** — Why defer: Scope explosion. Validate dinner-only first. Different meal types have different planning patterns.
- [ ] **Meal History / "What did we eat last month?"** — Why defer: Nice-to-have. Not blocking core value. Add when users ask for it.
- [ ] **Export to Calendar (Google Cal, iCal)** — Why defer: Integration complexity. Users can manually add if needed. Validate demand first.
- [ ] **AI Meal Suggestions (LLM)** — Why defer: 2026 trend in market but adds cost and complexity. Current category-balance algorithm may be sufficient. Validate before adding AI.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dish Library (CRUD) | HIGH | LOW | P1 |
| Auto-Generate Weekly Plan | HIGH | MEDIUM | P1 |
| Weekly Calendar View | HIGH | LOW | P1 |
| Swap Individual Meal | HIGH | LOW | P1 |
| Multi-User Access | HIGH | MEDIUM | P1 |
| Mobile-Responsive UI | HIGH | MEDIUM | P1 |
| Balanced Variety Enforcement | MEDIUM | MEDIUM | P1 |
| Drag-Drop Rescheduling | MEDIUM | MEDIUM | P2 |
| Regenerate Full Week | MEDIUM | LOW | P2 |
| Dish Frequency Preference | MEDIUM | LOW | P2 |
| Week Template Saving | MEDIUM | LOW | P2 |
| Basic Recipe Links | LOW | LOW | P2 |
| Shopping List Generation | MEDIUM | HIGH | P3 |
| Family Preference Voting | LOW | HIGH | P3 |
| Breakfast/Lunch Planning | LOW | MEDIUM | P3 |
| Meal History | LOW | LOW | P3 |
| Calendar Export | LOW | MEDIUM | P3 |
| AI Meal Suggestions | LOW | HIGH | P3 |

**Priority key:**
- **P1:** Must have for launch — validates core hypothesis, enables basic workflow
- **P2:** Should have, add when possible — improves UX, requested by early users, low cost
- **P3:** Nice to have, future consideration — not validated, high cost, or scope expansion

## Competitor Feature Analysis

| Feature | Plan to Eat | Mealime | Ollie (AI) | Our Approach |
|---------|-------------|---------|------------|--------------|
| **Dish/Recipe Storage** | Full recipe manager (web clipper) | Curated recipe database | AI generates suggestions | Simple name + category only (defer full recipes) |
| **Meal Plan Generation** | Manual drag-drop | AI personalized plans | AI weekly plans | Auto-generate from user's library with balance algorithm |
| **Calendar View** | Drag-drop planner | Weekly view | Weekly view | Weekly calendar (P1), drag-drop later (P2) |
| **Shopping Lists** | Auto-generated by ingredient | Auto-generated | Auto-generated by aisle | Defer to v2+ (high friction) |
| **Dietary Filters** | Tags (vegan, GF, etc.) | Filter recipes by diet | AI adapts to restrictions | Category-based (Fish/Meat/Veg) - simpler |
| **Collaboration** | Shared account (limited) | Single user | Family profiles with preferences | Multi-user shared workspace (P1) |
| **Recipe Import** | Web clipper, manual entry | Not allowed (curated only) | Not needed (AI suggests) | Optional URL field later (P2) |
| **Nutrition Tracking** | Basic nutrition display | Macros and nutrition focus | Nutrition goals | Explicitly avoid (anti-feature) |
| **Variety Enforcement** | User responsibility | Some variety logic | AI variety controls | Automatic balance (no 2 days same category) |
| **Pricing** | $5.95/month or $49/year | Free, $6/month premium | Premium subscription | TBD - validate willingness to pay first |

**Market Gap Our App Fills:**
- **Simpler than Plan to Eat** — No recipe management complexity, just dish names
- **More flexible than Mealime** — Generate from YOUR dishes, not curated database
- **Less AI-dependent than Ollie** — Simple algorithm, no AI costs, more transparent
- **Family-first** — Multi-user access from day 1, unlike single-user apps
- **German market** — Native UI, not translation, builds trust

## User Pain Points Addressed

Based on research into why meal planning apps fail:

| Pain Point | How We Address It |
|------------|-------------------|
| **"Setup takes too long"** | No recipe entry required. Just add dish names. 5 minutes to first meal plan. |
| **"Too rigid - doesn't adapt to life"** | One-click meal swapping. Regenerate individual days. Flexibility built in. |
| **"I don't want to track calories"** | No nutrition tracking. Focus on variety and balance, not diet. |
| **"Recipes are too complex"** | No recipes required. Users choose dishes they already know how to cook. |
| **"Shopping lists don't match how I shop"** | No shopping lists in v1. Users shop based on meal names (they know ingredients). |
| **"App doesn't fit my preferences"** | Generate from YOUR dish library. Inherently personalized. |
| **"Plans fail when schedules change"** | Swap meals without regenerating entire week. Low-friction adjustments. |
| **"Apps are too diet-focused"** | Category balance (Fish/Meat/Veg) not calorie tracking. About variety, not restriction. |
| **"Cost doesn't justify value"** | Start with free tier to prove value. Charge only after validation. |
| **"Privacy concerns about food tracking"** | Self-hosted on user's Supabase project? Or transparent data policy. Users own their data. |

## Research Confidence Assessment

| Finding | Confidence | Source |
|---------|------------|--------|
| **Table stakes features** | MEDIUM | WebSearch (multiple sources agree), competitor analysis |
| **User pain points** | MEDIUM | WebSearch + research papers on meal planning app failures |
| **Differentiator potential** | LOW | Hypothesis based on market gap, needs validation |
| **Anti-features validity** | MEDIUM | Research on app abandonment reasons, but context-dependent |
| **MVP feature set** | MEDIUM | Based on competitor analysis + Food on the Table MVP case study |
| **Complexity estimates** | LOW | Angular/Supabase stack known, but no detailed technical planning yet |

**Overall confidence:** MEDIUM
- Strong evidence on what users expect (table stakes)
- Good evidence on what causes app failures (anti-features)
- Weaker evidence on what will differentiate successfully (needs market validation)
- Complexity estimates are preliminary (technical research needed in architecture phase)

## Sources

### Meal Planning App Features & Trends (2026)
- [The Best Meal Planning Apps for Families in 2026 | Ollie](https://ollie.ai/2025/10/29/best-meal-planning-apps-2025/)
- [CNN Underscored: Best meal-planning apps in 2026](https://www.cnn.com/cnn-underscored/reviews/best-meal-planning-apps)
- [Top Meal Planning Apps with Grocery Lists (2026) | Fitia](https://fitia.app/learn/article/7-meal-planning-apps-smart-grocery-lists-us/)
- [Meal Planning Apps That You Will Actually Use (2026) | PlanEat AI](https://planeatai.com/blog/meal-planning-apps-that-you-will-actually-use-2026)

### Feature Comparisons
- [6 Best Meal Planning Apps For Families | Scratch To Basics](https://www.scratchtobasics.com/best-meal-planning-apps/)
- [Expert Reviewed: Best Meal Planner Apps of 2025 | Fitia](https://fitia.app/learn/article/best-meal-planner-apps-2025-expert-review/)
- [Breaking Down the Top Meal Planning Apps | Systems By Susie](https://systemsbysusie.com/breaking-down-the-top-meal-planning-apps/)

### Essential Features & Must-Haves
- [How to Choose a Family Meal Planner App | Family Daily](https://www.familydaily.app/blog/how-to-choose-a-family-meal-planner-app)
- [Plan to Eat: Meal Planner Features](https://www.plantoeat.com/)
- [Eat This Much: Automatic Meal Planner](https://www.eatthismuch.com/)

### Why Apps Fail & User Complaints
- [Why don't more people use meal planning apps? | Oha Potato](https://ohapotato.app/potato-files/why-dont-more-people-use-meal-planning-apps)
- [Why Week Meal Planning Fails | Oha Potato](https://ohapotato.app/potato-files/why-week-meal-planning-fails-(and-how-to-actually-make-it-stick))
- [10 Common Mistakes in Weekly Meal Planning | MenuMagic](https://www.menumagic.ai/blog/10-common-mistakes-in-weekly-meal-planning)
- [Mobile Apps to Support Healthy Family Food Provision: Systematic Assessment | PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6320405/)
- [Commercially Available Apps: User Testing | PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8140382/)

### MVP Strategy
- [10 Proven Minimum Viable Product Examples (2024) | 100tasks](https://www.100tasks.com/blog/minimum-viable-product-examples)
- [What Is a Minimum Viable Product? Complete 2026 Guide | Presta](https://wearepresta.com/what-is-a-minimum-viable-product-mvp-the-complete-2026-guide-to-startup-validation/)

### Specific Feature Research
- [Meal Planner App: Drag & Drop Features](https://www.mealplanner.app/features)
- [AnyList: Plan Your Meals](https://www.anylist.com/meal-planning)
- [Samsung Food: Shared Meal Plans](https://samsungfood.com/blog/shared-meal-plans/)
- [Family Meal Planning App with Collaboration | Family Daily](https://www.familydaily.app/blog/family-meal-planning-app)

### Weekly Rotation & Variety
- [Our Meal Rotation: Easy Meal Planning | Home and on the Way](https://www.homeandontheway.com/blog/how-we-meal-plan-amp-sample-weeks)
- [Rotating Meal Plan Tutorial | Healthfully Rooted Home](https://healthfullyrootedhome.com/rotating-meal-plan/)
- [Meal Planning 101: Two-Week Rotation | Good Cheap Eats](https://goodcheapeats.com/meal-planning-101-make-a-two-week-rotation/)

---
*Feature research for: Family Meal Planning (Dinner Focus)*
*Researched: 2026-02-16*
*Confidence: MEDIUM (validated against multiple sources, complexity estimates preliminary)*
