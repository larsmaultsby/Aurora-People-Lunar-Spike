# Aurora People mode

Project Lunar remains available at its existing routes. The experimental Aurora People shell is opt-in at `/aurora`.

## Authority boundary

Aurora mode is a presentation adapter only. It does not create or update Lunar scenarios, campaigns, memory crystals, NPC minds, inventory records, Neo4j world state, or Lunar event history.

Canonical gameplay remains owned by Aurora People through `player-view-v1` and these authoritative routes:

- `GET /api/play`
- `POST /api/play/interact`
- `POST /api/play/move`
- `POST /api/play/wait`

The React shell keeps only ephemeral UI state such as the selected person and open context panel.

## Development routing

By default Vite proxies `/aurora-api/*` to `http://localhost:4173` and strips the `/aurora-api` prefix. Override the development target with `AURORA_PEOPLE_API_TARGET`. For a direct deployed origin, set `VITE_AURORA_PEOPLE_BASE_URL` at build time.

## Current vertical slice

The shell renders world/time/location, present people, visible conversation, inventory, journal, relationships, commitments/pending matters, and connected destinations. It supports Do, Say, movement, one-step wait, and authoritative refresh.

Lunar's NPC-mind editor, crystal memory, plot generator, rewind, combat, and graph mutation tools are intentionally not exposed in Aurora mode because those surfaces are backed by Lunar-owned state rather than Aurora player-safe contracts.

## Testing

`npm run build` runs the Aurora adapter's Node tests before the Vite production build. The tests cover base URL normalization, DO/SAY scene compilation, player-view context projection, and conversation projection.
