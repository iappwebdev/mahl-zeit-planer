# Interface Design System
## MahlZeitPlaner — Kitchen Notebook Aesthetic

### Direction & Feel
Warm, kitchen-notebook aesthetic that feels like a well-organized home kitchen. The interface should evoke the tactile quality of recipe cards, meal planning boards, and kitchen organization tools. Not corporate or clinical — personal, warm, and inviting.

### Intent
**Who:** Home cooks and families planning weekly meals at the kitchen table
**What:** Organize dishes, plan weekly meals, reduce decision fatigue
**Feel:** Warm like a kitchen notebook, organized like a recipe box, tactile like a meal planning board

### Color Palette

#### Primitives
```css
/* Kitchen-inspired warm palette */
--parchment-50: #fdfbf7;      /* Lightest cream, main background */
--parchment-100: #f9f5ed;     /* Subtle surface lift */
--parchment-200: #f3ebe0;     /* Card backgrounds */
--parchment-300: #e8dcc8;     /* Hover states */

--terracotta-50: #fef5f3;
--terracotta-100: #fde8e3;
--terracotta-200: #fac7ba;
--terracotta-400: #f4967d;
--terracotta-500: #e8744f;    /* Primary brand */
--terracotta-600: #d35a38;
--terracotta-700: #b14428;

--sage-50: #f4f7f4;
--sage-100: #e6ede6;
--sage-200: #c8d9c8;
--sage-400: #8fb88f;
--sage-500: #6b9d6b;          /* Success, vegetarian */
--sage-600: #527d52;
--sage-700: #3d5e3d;

--slate-50: #f8f9fa;
--slate-100: #e9ecef;
--slate-200: #dee2e6;
--slate-300: #ced4da;
--slate-400: #adb5bd;
--slate-500: #6c757d;
--slate-600: #495057;
--slate-700: #343a40;
--slate-800: #212529;

--ocean-100: #e3f2f9;
--ocean-500: #4a9aba;         /* Fish category */
--ocean-600: #357a94;

--coral-100: #ffe8e3;
--coral-500: #e87461;         /* Meat category */
--coral-600: #c85a48;
```

#### Semantic Tokens
```css
/* Backgrounds */
--bg-canvas: var(--parchment-50);
--bg-surface: var(--parchment-200);
--bg-surface-hover: var(--parchment-300);
--bg-elevated: var(--parchment-100);

/* Text */
--text-primary: var(--slate-800);
--text-secondary: var(--slate-600);
--text-tertiary: var(--slate-500);
--text-muted: var(--slate-400);

/* Borders */
--border-subtle: rgba(107, 114, 128, 0.12);
--border-standard: rgba(107, 114, 128, 0.18);
--border-emphasis: rgba(107, 114, 128, 0.25);
--border-strong: rgba(107, 114, 128, 0.35);

/* Brand */
--brand-primary: var(--terracotta-500);
--brand-hover: var(--terracotta-600);
--brand-active: var(--terracotta-700);
--brand-subtle: var(--terracotta-50);

/* Semantic */
--success: var(--sage-500);
--success-bg: var(--sage-50);
--warning: #d97706;
--warning-bg: #fef3c7;
--error: #dc2626;
--error-bg: #fef2f2;
```

### Typography
**Typeface:** System font stack with warmth — prioritize -apple-system, SF Pro, Segoe UI
**Scale:** 
- Headings: 600-700 weight, -0.02em tracking
- Body: 400 weight, normal tracking
- Labels: 500 weight, -0.01em tracking
- Data: Tabular nums for alignment

### Spacing
**Base unit:** 4px
**Scale:** 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px)

### Depth Strategy
**Subtle shadows** — Soft paper-layer effect
- Cards: `0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)`
- Hover: `0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)`
- Elevated: `0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.05)`

### Border Radius
- Small (inputs, buttons): 8px
- Medium (cards): 12px
- Large (modals, containers): 16px

### Component Patterns

#### Weekly Timeline (Signature)
Horizontal flowing day cards with tactile feel — not a grid, but a vertical stack of day slots that feel like recipe cards in a holder. Each day is a distinct card with warm background, subtle shadow, and clear typography hierarchy.

#### Category Badges
- Fish: Ocean blue background
- Meat: Coral background  
- Vegetarian: Sage green background
All with matching text colors and subtle styling

#### Form Controls
- Inputs: Slightly darker than surface (inset feel), warm borders
- Buttons: Terracotta primary, sage for success actions
- Focus rings: Terracotta with subtle glow

#### Navigation
Same background as canvas with border separation. Mobile bottom nav with warm active states.

