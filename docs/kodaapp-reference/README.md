<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Koda Educational App

A gamified educational platform for K-12 learning with adaptive skill mastery.

## Project Structure

```
src/
├── app/                    # App entry point
│   ├── App.tsx            # Main app component with routing
│   └── main.tsx           # React entry point
├── features/              # Feature-based modules
│   ├── admin/             # Admin panel (Dashboard, User Management, Library)
│   ├── auth/              # Authentication (Login, SignUp, RoleSelection)
│   ├── student/           # Student game view
│   ├── teacher/           # Teacher curriculum builder
│   ├── parent/            # Parent monitoring view
│   └── offline/           # Offline mode support
├── shared/                # Shared components
│   └── components/
│       ├── ui/            # UI primitives (Button, Card, Modal, Badge, etc.)
│       ├── layout/        # Layout components (Navbar, RoleCard)
│       └── renderers/     # Question renderers (VerticalMath, Numpad)
├── stores/                # Zustand/localStorage state management
├── services/              # External services (Gemini AI, registries)
├── types/                 # TypeScript type definitions
├── theme/                 # Theme provider and configuration
└── lib/                   # Firebase and config utilities
```

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run the app: `npm run dev`
4. Build for production: `npm run build`

## Design Guidelines

See [DESIGN_STANDARDS.md](./DESIGN_STANDARDS.md) for styling conventions and dark mode implementation.
