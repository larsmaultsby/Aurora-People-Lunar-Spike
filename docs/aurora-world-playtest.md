# Aurora World playtest

This project now treats native Project Lunar as the playable runtime. Aurora People is not on the gameplay path.

## Local inference

The default provider is `openai`, routed through Lunar's existing OpenAI-compatible proxy support. The managed runtime points that provider at LM Studio:

- API base: `http://127.0.0.1:1234/v1`
- default model: `undi95_-_llama-3-roleplay-8b-evo`

The model field remains editable. Other OpenAI-compatible / LM Studio model identifiers can be entered directly in Settings.

## Play flow

Use Lunar's native game path, not `/aurora`.

The native composer preserves Lunar's original action modes:

- `DO` — physical or intentional action
- `SAY` — spoken dialogue
- `CONTINUE` — let the scene advance without adding a new player action
- `META` — out-of-character/directorial input supported by Lunar

Native actions stream from Lunar's FastAPI backend over SSE.

When Aurora World is served under the shared `/lunar/` public base path, Vite hot-module reload and its development WebSocket are disabled. This keeps public play sessions stable behind the shared ngrok proxy and prevents another Aurora Vite application's reload socket from triggering page refreshes. Root-hosted local development keeps normal Vite HMR.

## Seeded sandbox

When `LUNAR_SEED_PLAYTEST=1`, the scenario list creates `Aurora World: Open Sandbox` once if it does not already exist. Normal production/data flows are unchanged when the flag is absent.

The sandbox asks four setup questions:

1. who the player is;
2. what kind of world they want;
3. what they want to be doing at the start;
4. the desired tone.

It then uses Lunar's AI-opening flow to generate an immediate playable scene. The scenario intentionally avoids assigning a mandatory quest or narrating unchosen player thoughts/actions.

## Evaluation rule

Play first. Import architecture from Aurora People, Uro, Axiom, or other systems only when repeated playtesting exposes a concrete problem worth fixing.
