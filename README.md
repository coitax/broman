# Morning

A movement-first meditation & wellness app. A short, customizable **morning journey**
eases you from light meditation → guided breathing → positive affirmations → light
movement (yoga / Tai Chi) → heavier movement, over a time window you control, with an
ambient music bed and a mental-health check-in woven through.

This is the **Phase 0 scaffold**: a single Expo (React Native) codebase that runs on
the **web today** and compiles to **native iOS/Android** later — no WebView wrapper, so
no performance penalty. See the full plan for product scope, monetization, and roadmap.

## Stack

- **Expo (React Native) + Expo Router + react-native-web** — one codebase, web + native
- **TypeScript**, Jest (`jest-expo`) for the engine tests
- **Supabase** (auth/DB/storage) — lazily initialized; optional in Phase 0
- Audio behind a swappable `AudioEngine` interface (no-op in Phase 0)

## Architecture

The core is a **content-driven Journey Engine**:

- `src/content/` — `JourneyTemplate`/`SegmentTemplate` data model + sample manifest
- `src/engine/JourneyEngine.ts` — `buildJourney()` allocates a time budget across
  segments by intensity-weighted shares (durations always sum to the exact budget)
- `src/engine/player.ts` — pure, testable segment state machine driven by `TICK` events
- `src/engine/audioEngine.ts` — cross-platform audio abstraction (real impls land later)
- `app/` — Expo Router screens: home → onboarding → journey player → mood check-in

Adding new journeys/sounds later means adding data + media, not code.

## Getting started

```bash
npm install
npm run web        # run in the browser
npm test           # engine unit tests
npm run typecheck  # tsc --noEmit
```

Copy `.env.example` to `.env` and fill in Supabase keys to enable the backend
(optional in Phase 0).
