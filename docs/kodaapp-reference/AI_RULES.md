---
description: Project-level AI rules for kodaapp
---

# AI Rules for kodaapp

## Protected Directories — DO NOT MODIFY

### `src/games/*` — Game Components (Developer-Owned)

> **IMPORTANT:** The `src/games/` directory contains pluggable game components that are developed and maintained by external developers. AI assistants **MUST NOT** modify, delete, rename, or refactor any files inside individual game folders under `src/games/`.

**What is protected:**
- All files inside `src/games/<game-id>/` folders (e.g., `src/games/flow-connect/`, `src/games/visual-math/`, `src/games/sudoku/`, etc.)
- This includes `manifest.ts`, `schema.md`, and all game component `.tsx` files within each game folder.

**What is NOT protected (can be modified):**
- `src/games/gameRegistry.ts` — the auto-discovery registry (shared infrastructure)
- `src/games/manifest.types.ts` — the shared type definitions (shared infrastructure)

---

### `src/components/*` — Skill Components (Developer-Owned)

> **IMPORTANT:** The `src/components/` directory contains pluggable skill renderer components that are developed and maintained by external developers. AI assistants **MUST NOT** modify, delete, rename, or refactor any files inside individual component folders under `src/components/`.

**What is protected:**
- All files inside `src/components/<component-id>/` folders (e.g., `src/components/counting-grid/`, `src/components/flash-card/`, `src/components/measurement/`, `src/components/two-d-shapes/`, etc.)
- This includes `manifest.ts`, `schema.md`, and all renderer `.tsx` files within each component folder.

**What is NOT protected (can be modified):**
- `src/components/manifest.types.ts` — the shared type definitions (shared infrastructure)
- `src/components/categories.ts` — the shared category definitions (shared infrastructure)

---

### Why both directories are protected

These folders are maintained by individual developers who build, test, and push their own components via GitHub. Both use a pluggable auto-discovery architecture (`import.meta.glob`), meaning each folder is completely self-contained. AI modifications could break their work, introduce merge conflicts, or override intended logic.

**What to do instead:** If a change is needed inside a game or skill component, inform the user and suggest the change without applying it directly. The developer who owns the component should make the change themselves.

---

## No Silent Changes

This rule ensures the AI assistant respects the user's existing process and codebase.

### Scope Adherence
- **Stick to the Request:** Only modify files and code paths that are strictly necessary to fulfill the user's current prompt.
- **No "Cleanup":** Do not refactor, reformat, or "optimize" code that is not part of the active task unless explicitly asked.
- **No Deletions:** Never delete files or large blocks of code without first explaining why and getting confirmation.

### Notification & Consent
- **Propose, Don't Assume:** If you see a better way to do something that involves changing an established pattern or file structure, **ask first**.
  - *Bad:* "I noticed your file structure was messy so I reorganized it."
  - *Good:* "I see an opportunity to reorganize the file structure for better clarity. Would you like me to do that?"
- **Highlight Side Effects:** If a requested change requires modifying a configuration file or a shared utility, explicitly state this in your plan.

### Process Respect
- **Follow Existing Patterns:** When adding new code, mimic the style and patterns of the surrounding code/project, even if it's not "standard" best practice, unless told otherwise.
- **Don't Change Workflows:** Do not alter build scripts, CI/CD pipelines, or project root configurations (`package.json`, `tsconfig.json`) without a direct request.

### Critical Infrastructure
- **Explicit Permission for Security:** You must **NEVER** modify `firestore.rules`, `firebase.json`, or any authentication logic without explicit user permission.
  - *Required:* "This task requires updating `firestore.rules`. Here is the proposed change. Do you approve?"
- **No Hidden Updates:** Silent updates to security rules or backend configuration are strictly forbidden. You must stop and ask for confirmation before applying these changes.

---

## Koda Design System & Branding

All UI components must adhere strictly to these design tokens to maintain the "Koda" look and feel.

### Color Palette (The "Koda Spectrum")

We use specific hex values mapped to CSS variables. **Do not use arbitrary hex values.**

**Core Colors:**
- **Primary (Indigo):** Intelligence, Trust.
  - Light: `#4F46E5` (`bg-indigo-600`) / Dark: `#818CF8` (`bg-indigo-400`)
- **Secondary (Teal):** Growth, Progress.
  - Light: `#0D9488` (`bg-teal-600`) / Dark: `#2DD4BF` (`bg-teal-400`)
- **Accent (Purple):** Creativity.
  - Light: `#7C3AED` (`bg-violet-600`) / Dark: `#A78BFA` (`bg-violet-400`)

**Functional Colors:**
- **Success:** Emerald (`text-emerald-600`)
- **Error/Destructive:** Rose (`text-rose-600`)
- **Warning/XP:** Amber (`text-amber-500`)

### Dark Mode Strategy
The app uses the **class-based** dark mode strategy (`html.dark`).
- **Rule:** EVERY color utility must have a `dark:` variant.
- **Backgrounds:** Light: `bg-slate-50` or `bg-white` / Dark: `dark:bg-slate-900` or `dark:bg-slate-800` (Never pure black)
- **Text:** Light: `text-slate-900` (Headings), `text-slate-600` (Body) / Dark: `dark:text-white` (Headings), `dark:text-slate-300` (Body)

### Typography
- **Font:** `Space Grotesk` (Sans).
- **Headings:** Bold/Black weights (`font-bold`, `font-black`).
- **Tracking:** Tight tracking for large text (`tracking-tight` or `tracking-tighter`).

### UI Effects & Components

**Glassmorphism:** Use the custom `.glass` utility class for cards floating over complex backgrounds.

**Gradients:** Use the pre-defined brand gradients:
- `.bg-gradient-koda`: Indigo → Purple
- `.bg-gradient-teal`: Teal → Indigo
- `.bg-gradient-xp`: Amber → Orange

**Buttons & Interactions:**
- **Radius:** `rounded-2xl` or `rounded-3xl` (Friendly, playful).
- **Hover:** All interactive elements must have a hover state (`hover:scale-105`, `hover:bg-opacity-90`).
- **Active:** Click effects are encouraged (`active:scale-95`).

---

## Role & Platform Consistency

This project serves 4 distinct user roles and targets 3 platforms.

### User Roles

| Role | Focus | Directory | Key Rules |
|------|-------|-----------|-----------|
| 🎓 Student | Engagement, Simplicity, Gamification | `src/features/student/` | Large, touch-friendly, colorful. Read-only curriculum. XP/Stars mandatory for progress. |
| 👨‍👩‍👧‍👦 Parent | Monitoring, Safety, Settings | `src/features/parent/` | Simple dashboard of student progress. Mobile-first critical. |
| 🍎 Teacher | Management, Analytics, Content Creation | `src/features/teacher/` | High-density data views. "Teacher View" must allow Student preview. Desktop/Tablet optimized. |
| 🛡️ Admin | System Configuration, User Management | `src/features/admin/` | Full access. Functional, utilitarian UI. |

### Platform Targets (Responsiveness)

The app is a **Progressive Web App (PWA)** targeting 3 form factors. **Every UI component must be responsive.**

| Platform | Key Rules |
|----------|-----------|
| 📱 Phone | `flex-col` default. Collapsible navigation. Touch targets ≥ 44px. No horizontal scrolling. |
| 📟 Tablet | 2-3 column grids. Collapsible sidebar nav. Slightly larger fonts. |
| 💻 Desktop | `max-w-7xl` containers. Hover states required. Dense tables/grids allowed. |

### Implementation Checklist
When creating a new feature, answer:
1. **Which roles need this?** (e.g., Student does the quiz, Teacher validates it)
2. **Is it responsive?** (Does it stack on mobile and expand on desktop?)
3. **Is permission logic applied?** (Can a Student accidentally access the Teacher view?)
