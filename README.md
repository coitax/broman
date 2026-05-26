# Morning

A movement-first meditation & wellness app. A short, customizable **morning journey**
eases you from light meditation → guided breathing → positive affirmations → light
movement (yoga / Tai Chi) → heavier movement, over a time window you control, with an
ambient music bed and a mental-health check-in woven through.

A single Expo (React Native) codebase that runs on the **web today** and compiles to
**native iOS/Android** later — no WebView wrapper, so no performance penalty. See the
full plan for product scope, monetization, and roadmap.

**Status:** Phase 1 (web validation MVP) — real web audio, persistence, and analytics
are wired. Native builds, alarm, IAP, and the 3D avatar are later phases.

## Stack

- **Expo (React Native) + Expo Router + react-native-web** — one codebase, web + native
- **TypeScript**, Jest (`jest-expo`) for engine + data tests
- **Supabase** (anonymous auth/DB) — persists preferences, check-ins, completions;
  falls back to local storage when no backend is configured
- **PostHog** — analytics funnel (no-ops without a key)
- Audio behind a swappable `AudioEngine` interface (real Web Audio engine on web)

## Architecture

The core is a **content-driven Journey Engine**:

- `src/content/` — `JourneyTemplate`/`SegmentTemplate` data model + sample manifest
- `src/engine/JourneyEngine.ts` — `buildJourney()` allocates a time budget across
  segments by intensity-weighted shares (durations always sum to the exact budget)
- `src/engine/player.ts` — pure, testable segment state machine driven by `TICK` events
- `src/engine/audioEngine.ts` + `createAudioEngine.web.ts` / `webAudioEngine.ts` —
  audio abstraction; web uses a synthesized ambient pad + chimes (Web Audio API)
- `src/data/` — `Repository` (Supabase or local fallback), `usePreferences` hook
- `src/analytics/` — typed `track()` events with platform-split sinks (PostHog on web)
- `app/` — Expo Router screens: home → onboarding → journey player → mood check-in
- `supabase/migrations/` — schema + RLS for preferences, check-ins, completions

Web-only libraries (PostHog, Web Audio) live in `*.web.ts` files so they never enter
the native bundle. Adding new journeys/sounds means adding data + media, not code.

## Getting started

```bash
npm install
npm run web        # run in the browser
npm test           # engine unit tests
npm run typecheck  # tsc --noEmit
```

Copy `.env.example` to `.env` and fill in Supabase + PostHog keys to enable the
backend and analytics (both optional — the app runs locally without them). To enable
the backend, run the migration in `supabase/migrations/` and turn on Anonymous
sign-ins in the Supabase dashboard.
