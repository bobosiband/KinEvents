# KinEvents Design Tokens & CSS Quick Reference

## 🎨 Color Palette Quick Reference

### Primary Colors
```
Coral Red (Primary):      #EF6C6C
Light Coral:              #F49090
Dark Coral:               #D94F4F
Coral Ghost (10%):        rgba(239, 108, 108, 0.1)
```

### Secondary Colors
```
Teal (Accent):            #4ECDC4
Light Teal:               #7EDDD7
Teal Ghost (10%):         rgba(78, 205, 196, 0.1)
```

### Celebration Colors
```
Gold (Birthday):          #FFD166
Gold Ghost (12%):         rgba(255, 209, 102, 0.12)
```

### Status Colors
```
Success (Green):          #06D6A0
Danger (Red):             #EF476F
Neutral (Gray):           #8B8FA8
```

### Semantic Colors
```
Background:               #FDF8F5
Surface (Cards):          #FFFFFF
Surface Raised:           #FEF6F2
Surface Hover:            #FDF0EC
Border Light:             #EDE8E4
Border Strong:            #CCC6C0

Text Primary:             #2D2926
Text Secondary:           #7A7067
Text Muted:               #B0A89E
Text Inverse (White):     #FFFFFF
```

### Dark Mode Overrides
```css
[data-theme="dark"] {
  --color-bg: #1A1512;
  --color-surface: #231F1C;
  --color-surface-raised: #2C2724;
  --color-border: #3D3633;
  --color-text-primary: #F5F0EB;
  --color-text-secondary: #A09890;
  --color-text-muted: #6E6560;
}
```

### Using Colors
```typescript
// In React component
<div style={{ color: 'var(--color-primary)' }}>
  This is primary color
</div>

// In CSS
.button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}
```

---

## 📏 Spacing Scale (12px Grid)

### Reference
```
--space-1:  4px       /* 1 unit */
--space-2:  8px       /* 2 units */
--space-3:  12px      /* 3 units */
--space-4:  16px      /* 4 units - MOST COMMON */
--space-5:  20px      /* 5 units */
--space-6:  24px      /* 6 units */
--space-8:  32px      /* 8 units */
--space-10: 40px      /* 10 units */
--space-12: 48px      /* 12 units */
```

### Common Usage Patterns
```css
/* Button padding */
padding: var(--space-2) var(--space-4);           /* 8px 16px */

/* Card padding */
padding: var(--space-4);                          /* 16px */

/* Section padding */
padding: var(--space-6);                          /* 24px */

/* Margins between elements */
margin-bottom: var(--space-4);                    /* 16px */

/* Gap between grid/flex items */
gap: var(--space-4);                              /* 16px */

/* Form spacing */
.form-group {
  margin-bottom: var(--space-5);                  /* 20px */
}
```

### Responsive Spacing Example
```css
.section {
  padding: var(--space-3);                        /* Mobile: 12px */
}

@media (min-width: 768px) {
  .section {
    padding: var(--space-6);                      /* Tablet: 24px */
  }
}

@media (min-width: 1024px) {
  .section {
    padding: var(--space-8);                      /* Desktop: 32px */
  }
}
```

---

## 🔤 Typography System

### Font Family
```css
--font-family-display: 'DM Sans', system-ui, sans-serif;
--font-family-body: 'DM Sans', system-ui, sans-serif;
--font-family: var(--font-family-body);
```

### Font Sizes
```
11px  (xs)    - Captions, badges, small text
13px  (sm)    - Small labels, helper text
15px  (base)  - Body text, default
17px  (md)    - Subtitles, section headers
20px  (lg)    - Heading 3
24px  (xl)    - Heading 2
30px  (2xl)   - Heading 1
38px  (3xl)   - Hero heading
```

### Font Weights
```
400 (regular)   - Body text
500 (medium)    - Emphasis, semi-bold text
600 (semibold)  - Section headers
700 (bold)      - Main headings
```

### Line Heights
```
1.2 (tight)     - Headings (tighter spacing)
1.5 (normal)    - Body text (comfortable reading)
1.8 (loose)     - Descriptions (relaxed reading)
```

### Typography Usage Examples
```css
/* Heading styles */
h1 {
  font-size: var(--font-size-3xl);           /* 38px */
  font-weight: var(--font-weight-bold);      /* 700 */
  line-height: var(--line-height-tight);     /* 1.2 */
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

h2 {
  font-size: var(--font-size-2xl);           /* 30px */
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-3);
}

h3 {
  font-size: var(--font-size-lg);            /* 20px */
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}

/* Body text */
p {
  font-size: var(--font-size-base);          /* 15px */
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);    /* 1.5 */
  color: var(--color-text-primary);
}

/* Small text/labels */
.label {
  font-size: var(--font-size-sm);            /* 13px */
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

/* Captions/badges */
.caption {
  font-size: var(--font-size-xs);            /* 11px */
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
}
```

---

## 🔲 Border Radius (Soft Corners)

### Preset Values
```
--radius-sm:   8px      /* Small buttons, badges */
--radius-md:   14px     /* Cards, inputs, standard */
--radius-lg:   20px     /* Large cards, modals */
--radius-xl:   28px     /* Extra large components */
--radius-full: 9999px   /* Pills, avatars, fully rounded */
```

### Usage Examples
```css
/* Small buttons & badges */
.button-small {
  border-radius: var(--radius-sm);            /* 8px */
}

/* Standard components (cards, inputs) */
.card, input {
  border-radius: var(--radius-md);            /* 14px */
}

/* Modals & large cards */
.modal, .card-large {
  border-radius: var(--radius-lg);            /* 20px */
}

/* Avatars & pills */
.avatar, .badge-pill {
  border-radius: var(--radius-full);          /* 9999px */
}
```

---

## 🌓 Shadow System (Elevation Levels)

### Shadow Presets
```
xs:      0 1px 2px rgba(45, 41, 38, 0.04)
sm:      0 2px 8px rgba(45, 41, 38, 0.06), 0 1px 2px rgba(45, 41, 38, 0.04)
md:      0 4px 20px rgba(45, 41, 38, 0.08), 0 2px 6px rgba(45, 41, 38, 0.05)
lg:      0 8px 32px rgba(45, 41, 38, 0.1), 0 4px 12px rgba(45, 41, 38, 0.06)
xl:      0 20px 60px rgba(45, 41, 38, 0.14)

primary: 0 8px 24px rgba(239, 108, 108, 0.28)    /* Coral shadow */
accent:  0 8px 24px rgba(78, 205, 196, 0.28)     /* Teal shadow */
```

### Shadow Elevation Guide
```
Level 0 (None):    No shadow - flat, minimal elevation
Level 1 (xs):      Subtle depth - small components
Level 2 (sm):      Slight lift - buttons, inputs
Level 3 (md):      Standard elevation - cards
Level 4 (lg):      Prominent elevation - modals, featured cards
Level 5 (xl):      Maximum elevation - floating content

Colored Shadows:   For brand emphasis - only on special components
                   (primary buttons, accent cards, featured items)
```

### Shadow Usage
```css
/* Subtle shadow for interactive elements */
button {
  box-shadow: var(--shadow-sm);               /* xs elevation */
}

button:hover {
  box-shadow: var(--shadow-md);               /* Lift on hover */
}

/* Standard card shadow */
.card {
  box-shadow: var(--shadow-md);               /* md elevation */
}

/* Modal shadow (more pronounced) */
.modal {
  box-shadow: var(--shadow-lg);               /* lg elevation */
}

/* Brand-emphasized component */
.featured-card {
  box-shadow: var(--shadow-primary);          /* Coral shadow */
}

/* Accent-emphasized component */
.accent-card {
  box-shadow: var(--shadow-accent);           /* Teal shadow */
}
```

### Dark Mode Shadows
Shadows work automatically in dark mode due to CSS variable inheritance. The dark background naturally makes shadows less visible (as they should be).

---

## ⏱️ Transition Timing

### Preset Durations
```
--transition-fast:   120ms ease      /* Quick micro-interactions */
--transition-normal: 220ms ease      /* Standard transitions */
--transition-slow:   380ms ease      /* Complex animations */
```

### Usage Examples
```css
/* Quick hover effects */
.button {
  transition: all var(--transition-fast);     /* 120ms */
}

/* Standard state transitions */
.input:focus {
  transition: border-color var(--transition-normal);  /* 220ms */
}

/* Complex page transitions */
.page {
  transition: opacity var(--transition-slow);  /* 380ms */
}

/* Smooth theme toggle */
body, button, input, .card {
  transition: background-color var(--transition-normal),
              color var(--transition-normal),
              border-color var(--transition-normal),
              box-shadow var(--transition-normal);
}
```

### Easing Function
```
cubic-bezier(0, 0, 0.2, 1)  /* Material default easing */
cubic-bezier(0.4, 0, 0.2, 1) /* Material emphasis easing */

Current: ease (cubic-bezier(0.25, 0.1, 0.25, 1.0))
         Smooth and natural feeling
```

---

## 📐 Layout System

### Container Sizes
```
--max-width-app:  500px       /* Mobile app max width */
--max-width-wide: 1280px      /* Desktop max width */
```

### Navigation Dimensions
```
--nav-height:              68px      /* Top navigation bar height */
--bottom-nav-height:       72px      /* Bottom mobile nav height */
--sidebar-width:           260px     /* Desktop sidebar width */
--sidebar-collapsed:       72px      /* Collapsed sidebar width */
--admin-sidebar-width:     260px     /* Admin panel sidebar */
--admin-sidebar-collapsed: 72px      /* Admin sidebar collapsed */
```

### Responsive Breakpoints
```
Mobile:   0px - 480px
Tablet:   481px - 1024px
Desktop:  1025px+
```

### Layout Pattern Examples
```css
/* Mobile-first: single column */
.container {
  width: 100%;
  max-width: 100%;
  padding: var(--space-4);
}

/* Tablet: two columns */
@media (min-width: 768px) {
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    max-width: 900px;
  }
}

/* Desktop: three columns with sidebar */
@media (min-width: 1024px) {
  .container {
    display: grid;
    grid-template-columns: var(--sidebar-width) 1fr 1fr 1fr;
    gap: var(--space-6);
    max-width: var(--max-width-wide);
  }
}
```

---

## 🎯 Gradient Presets

### Available Gradients
```css
--gradient-hero:   linear-gradient(135deg, #EF6C6C 0%, #F49090 50%, #4ECDC4 100%)
--gradient-primary: linear-gradient(135deg, #EF6C6C 0%, #F49090 100%)
--gradient-accent: linear-gradient(135deg, #4ECDC4 0%, #7EDDD7 100%)
--gradient-gold:   linear-gradient(135deg, #FFD166 0%, #FFBE33 100%)
--gradient-card:   linear-gradient(145deg, #FFFFFF 0%, #FDF8F5 100%)
--gradient-sidebar: linear-gradient(180deg, #FFFFFF 0%, #FDF8F5 100%)
```

### Usage Examples
```css
/* Hero section background */
.hero {
  background: var(--gradient-hero);
}

/* Primary button background */
.button-primary {
  background: var(--gradient-primary);
}

/* Card elevation effect */
.card {
  background: var(--gradient-card);
}

/* Accent accent section */
.accent-section {
  background: var(--gradient-accent);
}

/* Birthday/celebration theme */
.birthday-section {
  background: var(--gradient-gold);
}
```

---

## 🎨 CSS Variable Usage Patterns

### Pattern 1: Complete Component Styling
```css
.button {
  /* Layout */
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  
  /* Typography */
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  
  /* Colors */
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: 1px solid var(--color-primary);
  
  /* Effects */
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  
  /* Responsive */
  min-height: 44px;                           /* Touch target */
  cursor: pointer;
}

.button:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.button:active {
  transform: translateY(0);
  opacity: 0.95;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Pattern 2: Variant Styling
```css
/* Base component */
.button {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

/* Primary variant */
.button.primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-primary);
}

.button.primary:hover {
  box-shadow: var(--shadow-primary);
  opacity: 0.9;
}

/* Secondary variant */
.button.secondary {
  background: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.button.secondary:hover {
  background: var(--color-primary-ghost);
}

/* Danger variant */
.button.danger {
  background: var(--color-danger);
  color: var(--color-text-inverse);
  border-color: var(--color-danger);
}
```

### Pattern 3: Dark Mode Support
```css
/* Light mode (default) */
.component {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

/* Dark mode - colors change automatically via variables */
[data-theme="dark"] .component {
  /* No changes needed - variables update automatically */
  /* background, color, border-color all use updated --color-* variables */
}
```

---

## 🚀 Quick Copy-Paste Snippets

### Button Component Base
```css
.button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}
```

### Card Component Base
```css
.card {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Input Component Base
```css
input {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: all var(--transition-normal);
  font-family: var(--font-family-body);
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-ghost);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface-raised);
}
```

### Container Layout Base
```css
.container {
  width: 100%;
  max-width: var(--max-width-wide);
  padding: var(--space-4);
  margin: 0 auto;
}
```

### Grid Layout Base
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}
```

### Flexbox Layout Base
```css
.flex {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
}

.flex-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
```

---

## 📱 Responsive Utilities

### Mobile-First Media Query Template
```css
/* Mobile first (0px - 480px) */
.component {
  width: 100%;
  font-size: var(--font-size-base);
  padding: var(--space-3);
}

/* Tablet (481px - 1024px) */
@media (min-width: 768px) {
  .component {
    width: 50%;
    font-size: var(--font-size-md);
    padding: var(--space-4);
  }
}

/* Desktop (1025px+) */
@media (min-width: 1024px) {
  .component {
    width: 33.333%;
    font-size: var(--font-size-lg);
    padding: var(--space-6);
  }
}
```

### Common Responsive Patterns

**Two Column Split:**
```css
.split {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .split {
    grid-template-columns: 1fr 1fr;
  }
}
```

**Three Column Grid:**
```css
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
}
```

**Sidebar Layout:**
```css
.sidebar-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: var(--sidebar-width) 1fr;
  }
}
```

---

## ♿ Accessibility Utilities

### Screen Reader Only Text
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Focus Visible Outline
```css
:focus-visible {
  outline: 3px solid var(--color-primary-ghost);
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-ghost);
}
```

### Skip Link
```css
.skip-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  position: fixed;
  left: var(--space-4);
  top: var(--space-4);
  width: auto;
  height: auto;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  z-index: 9999;
}
```

---

## 🎬 Animation Utilities

### Smooth Page Transition
```css
::view-transition-old(*),
::view-transition-new(*) {
  animation-duration: var(--transition-normal);
  animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
}
```

### Fade In Animation
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--transition-normal);
}
```

### Slide Up Animation
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp var(--transition-normal);
}
```

### Shimmer/Skeleton Loading
```css
@keyframes shimmer {
  0% { background-position: 400% 0; }
  100% { background-position: -400% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-raised) 25%,
    var(--color-border) 50%,
    var(--color-surface-raised) 75%
  );
  background-size: 400% 100%;
  animation: shimmer var(--transition-slow) infinite;
}
```

---

## 💡 Tips & Tricks

### Always Use Variables
Never hardcode colors, spacing, or sizes. Always use CSS variables.

### Responsive First
Write mobile styles first, then add media queries for larger screens.

### Consistent Spacing
Always use the spacing scale. Never use arbitrary values like `15px` or `25px`.

### Touch Targets
All interactive elements should be at least 44x44px (48px recommended).

### High Contrast
Use `var(--color-primary-ghost)` for semi-transparent overlays and focus states.

### Dark Mode Default
Most colors already support dark mode. Just use CSS variables everywhere.

### Test Everything
Remember to test all components in:
- Light mode
- Dark mode
- Mobile (375px)
- Tablet (768px)
- Desktop (1280px)

---

**Quick Reference Version**: 1.0
**Last Updated**: May 2026
**Status**: Ready to Use
