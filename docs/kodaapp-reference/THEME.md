# 🎨 Koda Brand & Theme Guide

> **Koda** — AI-powered tutor that makes learning fun for young people.

---

## Brand Identity

| Attribute | Value |
|---|---|
| **Name** | Koda |
| **Personality** | Smart, friendly, encouraging companion |
| **Target Audience** | Students (K-12), young learners |
| **Core Values** | Intelligence, Growth, Trust, Fun |
| **Font** | [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — modern, geometric, friendly |

---

## Color System

All colors are defined as CSS custom properties in [`src/index.css`](../src/index.css) and automatically adapt between light and dark mode.

### Primary: Electric Indigo

The core brand color. Represents **AI intelligence** and **trust**.

| Token | Light | Dark | Hex (Light) | Hex (Dark) |
|---|---|---|---|---|
| `--color-primary` | 🟦 | 🟦 | `#4F46E5` | `#818CF8` |
| `--color-primary-hover` | 🟦 | 🟦 | `#4338CA` | `#A5B4FC` |
| `--color-primary-light` | 🟦 | 🟦 | `#EEF2FF` | `rgba(99,102,241,0.15)` |
| `--color-primary-glow` | — | — | `rgba(79,70,229,0.25)` | `rgba(129,140,248,0.3)` |

**Usage:** Buttons, links, active states, navigation highlights, headers.

### Secondary: Vibrant Teal

Represents **growth, learning, and progress**.

| Token | Light | Dark | Hex (Light) | Hex (Dark) |
|---|---|---|---|---|
| `--color-secondary` | 🟩 | 🟩 | `#0D9488` | `#2DD4BF` |
| `--color-secondary-hover` | 🟩 | 🟩 | `#0F766E` | `#5EEAD4` |
| `--color-secondary-light` | 🟩 | 🟩 | `#F0FDFA` | `rgba(13,148,136,0.12)` |

**Usage:** Progress indicators, learning streaks, secondary actions, teal accent sections.

### Accent: Purple

Represents **creativity and achievement**.

| Token | Light | Dark | Hex (Light) | Hex (Dark) |
|---|---|---|---|---|
| `--color-accent` | 🟪 | 🟪 | `#7C3AED` | `#A78BFA` |
| `--color-accent-light` | 🟪 | 🟪 | `#F5F3FF` | `rgba(124,58,237,0.12)` |

**Usage:** Badges, special achievements, rank-up celebrations, gradient accents.

---

## Surfaces & Layout

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-background` | `#F8FAFC` | `#0B1120` | Page background |
| `--color-card` | `#FFFFFF` | `#151D2E` | Card / container background |
| `--color-foreground` | `#0F172A` | `#F1F5F9` | Primary text |
| `--color-foreground-muted` | `#64748B` | `#94A3B8` | Secondary / muted text |
| `--color-border` | `#E2E8F0` | `#1E293B` | Borders, dividers |
| `--color-muted` | `#F1F5F9` | `#1E293B` | Muted backgrounds, skeleton |
| `--color-surface-hover` | `#F8FAFC` | `#1E293B` | Hover state backgrounds |

---

## Gamification Colors

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-xp` | `#F59E0B` 🟡 | `#FBBF24` | XP points, coins, rewards |
| `--color-xp-glow` | amber glow | brighter | XP glow animation |
| `--color-streak` | `#F97316` 🟠 | `#FB923C` | Daily streaks, fire |
| `--color-streak-glow` | orange glow | brighter | Streak glow animation |
| `--color-success` | `#10B981` 🟢 | `#34D399` | Correct answers, mastery |
| `--color-success-light` | `#ECFDF5` | rgba | Success backgrounds |
| `--color-destructive` | `#EF4444` 🔴 | `#F87171` | Wrong answers, errors |
| `--color-destructive-light` | `#FEF2F2` | rgba | Error backgrounds |
| `--color-warning` | `#F59E0B` 🟡 | `#FBBF24` | Warnings, alerts |
| `--color-warning-light` | `#FFFBEB` | rgba | Warning backgrounds |

---

## Rank Colors

Each skill rank has its own themed color for visual progression:

| Rank | Icon | XP Threshold | Light | Dark |
|---|---|---|---|---|
| Beginner | 🌱 | 0 XP | `#10B981` | `#34D399` |
| Novice | 🥉 | 100 XP | `#F59E0B` | `#FBBF24` |
| Apprentice | 🥈 | 300 XP | `#64748B` | `#94A3B8` |
| Scholar | 🥇 | 600 XP | `#EAB308` | `#FDE047` |
| Master | 👑 | 1000 XP | `#6366F1` | `#818CF8` |

**Token pattern:** `--color-rank-beginner`, `--color-rank-novice`, etc.

---

## Gradient Utilities

Pre-built CSS gradient classes:

| Class | Gradient | Usage |
|---|---|---|
| `.bg-gradient-koda` | Indigo → Purple | Hero sections, CTAs |
| `.bg-gradient-teal` | Teal → Indigo | Progress sections |
| `.bg-gradient-xp` | Amber → Orange | XP rewards, streaks |
| `.bg-gradient-cosmic` | Indigo → Purple | Alias for `bg-gradient-koda` |
| `.bg-gradient-tech` | Teal → Indigo | Alias for `bg-gradient-teal` |

---

## Effect Utilities

| Class | Effect | Usage |
|---|---|---|
| `.glass` | Glassmorphism backdrop blur | Floating cards, overlays |
| `.glow-primary` | Indigo box-shadow glow | Active state emphasis |
| `.glow-xp` | Amber box-shadow glow | XP reward moments |
| `.glow-streak` | Orange box-shadow glow | Streak celebrations |
| `.animate-glow-pulse` | Pulsing glow animation | Drawing attention to rewards |
| `.animate-float` | Floating up/down animation | Decorative elements |
| `.animate-streak-fire` | Scale + brightness pulse | Streak fire icon |
| `.animate-bounce-in` | Spring bounce entrance | Modal/toast entrances |
| `.animate-slide-up` | Slide up with fade | List item entrances |

---

## Dark Mode

Dark mode is activated by the `dark` class on the `<html>` element:

```html
<!-- Light mode -->
<html>

<!-- Dark mode -->
<html class="dark">
```

### Dark Mode Principles

1. **Backgrounds get darker** — `#F8FAFC` → `#0B1120`
2. **Text gets lighter** — `#0F172A` → `#F1F5F9`
3. **Colors get brighter** — All accent/gamification colors shift to lighter variants for visibility
4. **Subtle backgrounds use rgba** — Light tints become translucent overlays (`rgba(...)`)
5. **Borders use lower contrast** — To avoid harsh lines on dark backgrounds

---

## Usage Examples

### Using CSS Variables in Components

```tsx
// Direct in style prop
<div style={{ color: 'var(--color-primary)' }}>Hello</div>

// With Tailwind (when tokens match Tailwind palette)
<div className="text-indigo-600 dark:text-indigo-400">Hello</div>

// Gradient utility
<div className="bg-gradient-koda text-white rounded-2xl p-6">
  Hero Section
</div>

// Glassmorphism
<div className="glass rounded-xl p-4">
  Floating Card
</div>
```

### Color Pairing Guidelines

| Context | Primary | Background | Text |
|---|---|---|---|
| Hero / CTA | `--color-primary` | gradient | white |
| Card | — | `--color-card` | `--color-foreground` |
| Muted info | — | `--color-muted` | `--color-foreground-muted` |
| Success state | — | `--color-success-light` | `--color-success` |
| Error state | — | `--color-destructive-light` | `--color-destructive` |
| XP display | — | amber-50 | `--color-xp` |

---

## Design Principles

1. **Clean & Minimal** — Use whitespace generously. Don't overcrowd.
2. **Strong Hierarchy** — Bold headings, muted descriptions, clear CTAs.
3. **Gamified but Not Childish** — Gradients and glows for rewards, but professional layout.
4. **Consistent Tokens** — Always use CSS variables, never hardcode colors.
5. **Accessible Contrast** — All text meets WCAG AA contrast ratios.
6. **Mobile-First** — Design for phone screens, then enhance for desktop.
