# Project Architecture Guide

This document outlines the architecture patterns and conventions for the Koda educational platform.

## Directory Structure

```
src/
├── app/                    # Application entry point
├── features/               # Feature-based modules (vertical slices)
│   ├── admin/             # Admin dashboard & management
│   ├── auth/              # Authentication & authorization
│   ├── offline/           # Offline support
│   ├── parent/            # Parent monitoring
│   ├── student/           # Student learning experience
│   └── teacher/           # Teacher curriculum tools
├── shared/                 # Shared components & utilities
│   └── components/
│       ├── ui/            # Primitives (Button, Card, Modal)
│       ├── layout/        # Layout components (Navbar)
│       └── renderers/     # Question type renderers
├── stores/                 # State management (Zustand/localStorage)
├── services/               # External services (AI, registries)
├── types/                  # TypeScript type definitions
├── theme/                  # Theme configuration
└── lib/                    # Firebase & config utilities
```

## Feature Module Pattern

Each feature follows this structure:

```
features/<feature>/
├── components/            # Feature-specific components
│   ├── <FeatureName>View.tsx  # Main view component
│   └── ...                # Sub-components
├── hooks/                 # Feature-specific hooks
├── services/              # Feature-specific services
└── index.ts               # Barrel exports
```

### Barrel Export Convention
```typescript
// features/<feature>/index.ts
export { MainView } from './components/MainView';
export { SubComponent } from './components/SubComponent';
export * from './hooks/useFeatureHook';
```

## Import Aliases

| Alias | Path | Usage |
|-------|------|-------|
| `@features` | `src/features` | Feature modules |
| `@shared` | `src/shared` | Shared components |
| `@stores` | `src/stores` | State management |
| `@types` | `src/types` | Type definitions |
| `@services` | `src/services` | External services |
| `@theme` | `src/theme` | Theme utilities |
| `@auth` | `src/features/auth` | Auth feature shortcut |
| `@lib` | `src/lib` | Firebase/config |

## Component Guidelines

### File Naming
- **Components**: `PascalCase.tsx` (e.g., `StudentView.tsx`)
- **Hooks**: `use<Name>.ts` (e.g., `useGameEngine.ts`)
- **Stores**: `<name>Store.ts` (e.g., `studentStore.ts`)
- **Types**: `<domain>.types.ts` (e.g., `skill.types.ts`)

### Component Size Limits
- **Target**: < 250 lines per component
- **Maximum**: 400 lines (extract sub-components if exceeding)

### Shared vs Feature Components
| Put in `shared/` | Put in `features/<feature>/` |
|------------------|------------------------------|
| Used by 2+ features | Used only in one feature |
| Domain-agnostic (Button, Card) | Domain-specific (AdminSidebar) |
| Question renderers | Feature views |

## State Management

### Store Organization
- One store per domain: `userStore`, `studentStore`, `skillStore`
- Export all stores via `stores/index.ts`
- Use Zustand for complex state, localStorage for persistence

### Store Pattern
```typescript
// stores/<domain>Store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
    items: Item[];
    actions: {
        add: (item: Item) => void;
    };
}

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            items: [],
            actions: {
                add: (item) => set((s) => ({ items: [...s.items, item] })),
            },
        }),
        { name: 'store-key' }
    )
);
```

## Adding New Features

1. Create feature directory: `src/features/<feature-name>/`
2. Add components in `components/` subdirectory
3. Create `index.ts` with barrel exports
4. Add path alias if needed in `tsconfig.json`
5. Follow dark mode guidelines in `DESIGN_STANDARDS.md`

## Testing

- Test files co-located: `<name>.test.ts`
- Run tests: `npm test`
- Coverage included in `stores/` directory
