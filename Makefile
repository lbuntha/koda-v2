.PHONY: dev dev-local local-api local-web local-mongo down logs build api web mongo seed admin-seed settings-seed test typecheck clean

COMPOSE := docker compose --env-file .env -f infra/docker-compose.yml

dev:
	$(COMPOSE) up --build

dev-local:
	@echo "Starting API and web against local MongoDB. Run 'make local-mongo' first if Mongo is not already running."
	@trap 'kill 0' INT TERM EXIT; \
		PYTHONPATH=apps/api .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload & \
		npm --prefix apps/web run dev -- --host 0.0.0.0 --port 5173 & \
		wait

local-api:
	PYTHONPATH=apps/api .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

local-web:
	npm --prefix apps/web run dev -- --host 0.0.0.0 --port 5173

local-mongo:
	mkdir -p .mongo-data
	mongod --dbpath .mongo-data --bind_ip 127.0.0.1 --port 27017

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

build:
	$(COMPOSE) build

api:
	$(COMPOSE) up api

web:
	$(COMPOSE) up web

mongo:
	$(COMPOSE) up mongo

seed:
	$(COMPOSE) exec api python -m app.seeds.loader

admin-seed:
	@if [ -z "$(EMAIL)" ]; then echo "Usage: make admin-seed EMAIL=you@example.com"; exit 1; fi
	PYTHONPATH=apps/api .venv/bin/python -m app.seeds.admin --email $(EMAIL) --role $(or $(ROLE),superadmin) $(if $(PASSWORD),--password $(PASSWORD),)

settings-seed:
	PYTHONPATH=apps/api .venv/bin/python -m app.seeds.settings

test:
	cd apps/web && npm test -- --run
	cd apps/api && ../../.venv/bin/pytest

typecheck:
	cd apps/web && npx tsc --noEmit
	cd apps/api && ../../.venv/bin/mypy app

clean:
	$(COMPOSE) down -v
	rm -rf apps/web/node_modules apps/web/dist
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
