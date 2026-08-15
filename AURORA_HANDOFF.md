# Aurora Lunar Spike Handoff

## Repository State

- Repository root: `/Users/laurencemaultsby/Projects/Aurora-People-Lunar-Spike`
- Branch: `master`
- Current commit: `7bf9ab8 docs: explicita perigo real em Weak Villain`
- Origin: `https://github.com/larsmaultsby/Aurora-People-Lunar-Spike.git`
- Upstream: `https://github.com/horizonfps/project-lunar.git`
- Python version used: `Python 3.11.15`
- Node version: `v22.21.1`
- npm version: `10.9.4`
- Docker/Neo4j status: `lunar-neo4j` is running and healthy from `docker compose ps`

Notes:

- This repository is separate from Aurora People. No Aurora People files were modified.
- Homebrew Python 3.12 was not installed locally. The venv was created with Homebrew Python 3.11, which satisfies upstream's `Python 3.10+` README requirement but differs from the intended Python 3.12 spike runtime.
- Port `8000` was already occupied by an unrelated Docker-published service during smoke testing, so the backend was verified on `8001`.

## Local Setup

Backend environment:

```bash
/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv --clear backend/venv
backend/venv/bin/python -m pip install --upgrade pip
backend/venv/bin/python -m pip install -r backend/requirements.txt
backend/venv/bin/python -m pip install -r backend/requirements-dev.txt
```

Frontend environment:

```bash
cd frontend
npm ci
```

Local config:

- `.env` was created from `.env.example`.
- No cloud API keys were added.
- The existing OpenAI-compatible proxy settings are:
  - `OPENAI_PROXY_URL=http://127.0.0.1:8318/v1`
  - `OPENAI_PROXY_KEY=lunar-proxy-key`
- LM Studio is normally compatible with OpenAI-style local endpoints at `http://127.0.0.1:1234/v1`, but Lunar's provider layer was not redesigned in this pass.

## Dependency Changes

Conservative backend dependency fixes were required for installation:

- `litellm==1.43.0` -> `litellm==1.43.19`
- `pydantic==2.8.0` -> `pydantic==2.8.2`
- `neo4j==5.22.0` -> `neo4j==5.26.0`
- `graphiti-core>=0.5.0` -> `graphiti-core==0.3.21`

Reasoning:

- LiteLLM `1.43.0` was unavailable.
- The unbounded `graphiti-core>=0.5.0` no longer resolves against the pinned Pydantic, Neo4j, Instructor, and Anthropic stack.
- `graphiti-core==0.3.21` is the narrowest tested Graphiti pin that resolves with `instructor==1.4.0` and `anthropic==0.116.0`; it requires `neo4j>=5.23.0`.

## Run Commands

Start Neo4j:

```bash
docker compose up -d neo4j
docker compose ps
```

Start backend on the default documented port when available:

```bash
cd backend
venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

If port `8000` is occupied, use:

```bash
cd backend
venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Start frontend against the default backend:

```bash
cd frontend
npm run dev
```

Start frontend against backend port `8001`:

```bash
cd frontend
LUNAR_API_TARGET=http://localhost:8001 npm run dev -- --host 127.0.0.1
```

Open the app at:

```text
http://127.0.0.1:5173/
```

## Smoke Results

Verified:

- Python imports: `fastapi`, `pydantic`, `litellm`, `neo4j`
- Docker Compose: `neo4j` service healthy
- Backend health: `GET /api/health` returned `{"status":"ok"}`
- Backend Neo4j health: `GET /api/health/neo4j` returned `{"status":"ok"}`
- Frontend dev server: Vite served `http://127.0.0.1:5173/`
- Frontend proxy: `GET /api/health` and `GET /api/health/neo4j` through Vite returned ok
- Frontend build: `npm run build` completed
- Backend tests: `276 passed, 3 warnings`

Warnings observed:

- `docker-compose.yml` uses obsolete top-level `version`; Docker Compose ignores it.
- `npm ci` reported 15 audit findings. No audit fix was run because that would broadly alter the frontend dependency tree.
- Vite build warned that the bundle is larger than 500 kB and Browserslist data is stale.
- Backend tests emitted Pydantic and LiteLLM deprecation warnings.

## Architecture Summary

Project Lunar is a React product shell over a FastAPI RPG/story engine.

Frontend:

- `frontend/src/App.jsx`: main application shell and routing/state composition.
- `frontend/src/api.js`: REST/SSE client, using `/api` with Vite proxy to the backend.
- `frontend/src/components/`: canvas, scenario builder, setup wizard, action input, settings, memory, NPC, journal, inventory, plot, combat, and world map panels.

Backend:

- `backend/app/main.py`: FastAPI app, CORS, health routes, settings routes, scenario/game routers.
- `backend/app/api/routes_scenarios.py`: scenario, story card, campaign, setup/opening endpoints.
- `backend/app/api/routes_game.py`: game action streaming, rewind/history, memory, journal, NPC minds, inventory, graph, plot, timeskip, settings-adjacent game APIs.
- `backend/app/services/game_session.py`: main orchestration layer for player actions, mode detection, narration, combat, persistence, memory, Graphiti, world ticks, journals, NPC minds, inventory, plot generation, and audit.
- `backend/app/db/`: SQLite-backed event, scenario, and trace stores.
- `backend/app/engines/`: narrator, LLM router, memory, combat, NPC mind, journal, graph, Graphiti wrapper, world reactor, plot generator, inventory, opening, and auditor engines.

Persistence and state:

- Durable event log is SQLite-backed through `EventStore`.
- Scenario/campaign/story-card data is SQLite-backed through `ScenarioStore`.
- Neo4j is used for the knowledge/world graph.
- Graphiti is wrapped as an optional temporal graph integration.
- In-memory gameplay state is rebuilt from persisted events when sessions are recreated.

## Aurora People Adaptation Notes

Keep Aurora People authoritative for durable identity, canonical facts, provenance, witnesses/privacy, consent, relationships, schedules, agreements, inventory/state authority, and validated world-state transitions.

Most likely adaptation boundary:

```text
Project Lunar React shell
  -> Aurora presentation/API adapter
  -> Aurora People canonical state and simulation services
  -> selectively adopted Lunar/Axiom/Uro engine patterns
```

Useful Lunar pieces to inspect first:

- React shell and panel ergonomics in `frontend/src/components/`
- SSE action streaming shape in `frontend/src/api.js` and `backend/app/api/routes_game.py`
- `GameSession` orchestration boundaries
- Event rebuild pattern from `EventStore`
- Memory/journal/NPC/graph side-effect pipeline
- Scenario builder and setup wizard data model

Avoid treating Lunar's backend as the new source of truth for Aurora People without an adapter layer.
