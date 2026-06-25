# Koda v2

Duolingo-style learning platform with parent/teacher-authored skills.

## Stack

- **Web:** React 18 + Vite + TypeScript + Tailwind 3 (PWA)
- **API:** FastAPI + Python 3.11 + Motor (async MongoDB)
- **DB:** MongoDB 7
- **Hosting (prod):** Firebase Hosting (web) + Cloud Run (api) + MongoDB Atlas

## Local development

Requires Docker Desktop.

```bash
cp .env.example .env
make dev
```

- Web: http://localhost:5173
- API: http://localhost:8000/health
- Mongo: localhost:27017

## Repo layout

```
apps/web                React + Vite frontend
apps/api                FastAPI backend
packages/contracts      Shared TS types
infra/                  Docker Compose
seeds/skills/           JSON skill content (loaded into Mongo)
```

## Make targets

| Command | Purpose |
|---|---|
| `make dev` | Boot Mongo + API + Web |
| `make dev-local` | Boot API + Web against local MongoDB |
| `make local-mongo` | Boot local MongoDB using `.mongo-data/` |
| `make local-api` | Boot FastAPI only against local MongoDB |
| `make local-web` | Boot Vite only |
| `make down` | Stop everything |
| `make seed` | Load seed skills into Mongo |
| `make admin-seed EMAIL=…` | Promote account to superadmin |
| `make settings-seed` | Seed default app settings |
| `make test` | Run vitest + pytest |
| `make typecheck` | tsc + mypy |
| `make clean` | Wipe volumes and node_modules |

## Build milestones

See [docs/MILESTONES.md](docs/MILESTONES.md) — currently shipping **Milestone 1 (chunk 6/9)**, with admin roles/rights started early.

## Source project context

Reference docs from the original `kodaapp` project live in [docs/kodaapp-reference/INDEX.md](docs/kodaapp-reference/INDEX.md). Use them for product priorities, role behavior, and Koda design standards while building the `koda-v2` milestone plan.
