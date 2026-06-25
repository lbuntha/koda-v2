
# Koda App Design System & Standards

This document serves as the **single source of truth** for maintaining design consistency across the Koda application. All future development (human or AI) must adhere to these guidelines to ensure a seamless "Premium Dark Mode" experience.

## 1. Core Philosophy
- **Responsive & Adaptive**: Everything must work on mobile, tablet, and desktop.
- **Dark Mode First Mentalty**: Always implement `dark:` variants immediately. Do not ship a component without verifying it in dark mode.
- **Premium Feel**: Use subtle gradients, glassmorphism (`backdrop-blur`), and refined shadows/borders instead of flat blocks (especially in dark mode).

## 2. Color Palette & Theming

### Backgrounds
- **Light Mode**: `bg-slate-50` (App Background), `bg-white` (Cards/Panels).
- **Dark Mode**: `dark:bg-[#0B1120]` (App Background - "Deep Space"), `dark:bg-slate-900` or `dark:bg-slate-900/50` (Cards).
- **Transitions**: Always add `transition-colors duration-300` to main containers for smooth theme switching.

### Text Hierarchy
- **Headings**: `text-slate-900` (Light) / `dark:text-white` (Dark).
- **Body**: `text-slate-600` (Light) / `dark:text-slate-300` (Dark).
- **Muted/Subtitles**: `text-slate-500` (Light) / `dark:text-slate-400` (Dark).
- **Interactive/Accent**: `text-indigo-600` (Light) / `dark:text-indigo-400` (Dark).

### Borders & Separators
- **Light Mode**: `border-slate-100` or `border-slate-200`.
- **Dark Mode**: `dark:border-slate-800`.
- **Glass Effect**: `border-white/20` or `dark:border-slate-700/50`.

## 3. Component Patterns

### Cards & Containers
```tsx
// Pattern for a premium card
<div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl p-6">
  {/* content */}
</div>
```

### Glassmorphism Headers/Overlays
Used for top navigation bars or floating modals.
```tsx
<header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-50">
  {/* content */}
</header>
```

### Inputs & Forms
Inputs must handle dark backgrounds gracefully.
```tsx
<input 
  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-indigo-500"
/>
```

## 4. Development Workflow for AI
When asking an AI to build or refactor a component, include this instruction:

> "Ensure the component strictly follows the 'Koda Premium Design' standards. Use `slate-50` for light backgrounds and `#0B1120` for dark backgrounds. Apply `dark:` utility classes for ALL colors (text, bg, border). verify contrast ratios for text in dark mode (use lighter weights like 400/300 for dark mode text). Use glassmorphism for sticky headers."

## 5. Do's and Don'ts

| Do | Don't |
| -- | -- |
| Use `dark:text-slate-400` for subtitles | Use `text-gray-500` (too dark) |
| Use `dark:bg-slate-900` for cards | Use pure black `dark:bg-black` |
| Test white text against dark backgrounds | Assume default text color works everywhere |
| Use `backdrop-blur` for depth | Use simple opacity which looks muddy |

---
**Last Updated**: 2026-01-26
