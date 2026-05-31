# Wellness App — Handoff

This is what the next session (or person) needs to pick up where we left off.

## Where things stand

- **Repo:** `coitax/broman`, branch `claude/meditation-wellness-app-plan-3lCPp`
- **PR:** [#1](https://github.com/coitax/broman/pull/1) (draft) — *"Morning meditation app: Phases 0–3 + native Hermes build unblocked"*
- **Shipped (web target, fully verified):**
  - **Phase 0** — Expo scaffold + content-driven Journey Engine + pure player state machine
  - **Phase 1** — real Web Audio engine, persistence (Supabase or local fallback), PostHog analytics funnel
  - **Phase 2** — freemium paywall + premium gating, wake-up reminder (web in-app prompt; native local-notification path written), `eas.json` + `expo-notifications` plugin
  - **Phase 3** — rotatable 3D **Movement Studio** (premium): three.js / react-three-fiber, orbit + scrub + slow-mo, yoga/Tai Chi sequence switch
  - **Native fix** — `metro.config.js` resolver swaps `@supabase/supabase-js` to its CJS entry on iOS/Android (the ESM entry has a Hermes-unparseable dynamic import). `expo export --platform android` now produces a 4.4 MB Hermes bytecode bundle.
- **35 unit tests pass, typecheck clean, both `web` and `android` exports succeed.**
- **Not yet verified on a real device** — that's the next step.

## How to run locally

```bash
git fetch && git checkout claude/meditation-wellness-app-plan-3lCPp
npm install
npm run web        # http://localhost:8081
npm test
npm run typecheck
```

Optional env (`.env`, see `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

To enable the real backend: create a Supabase project → enable **Anonymous sign-ins** (Authentication → Providers) → run `supabase/migrations/0001_init.sql`. Without these the app uses local-storage fallback and analytics is a no-op (mirrored to a dev buffer).

## Architecture seams (do not break)

Every product surface talks to an interface; concrete implementations are platform-split (`*.web.ts(x)` for web-only libs like three.js, PostHog, Web Audio).

| Surface | Interface | Web impl | Native impl |
|---|---|---|---|
| Movement journey | `JourneyEngine` + `PlayerState` (pure) | same | same |
| Audio | `AudioEngine` | `WebAudioEngine` (synthesized) | `NoopAudioEngine` (placeholder) |
| Data | `Repository` | `SupabaseRepository` / `LocalRepository` | same |
| Billing | `BillingProvider` + global `store.ts` | `LocalBillingProvider` (mock) | same; swap to Stripe (web) / RevenueCat (native) |
| Reminders | `ReminderScheduler` | persist + in-app prompt | `expo-notifications` daily |
| 3D viewer | `PoseViewer` component | three.js + R3F + drei | placeholder card |
| Analytics | `track(event)` typed union | PostHog | dev console |

**Pattern:** pure logic (`buildJourney`, `lerpPose`, `shouldShowMorningPrompt`, `isLocked`) is unit-tested; UI is glue around interfaces; real implementations slot in behind those interfaces without touching screens.

## Decisions locked in (don't re-litigate)

- One Expo codebase → web now, real native iOS/Android later (no WebView wrapper)
- Web-first for cheap validation; native bits live behind interfaces
- Insight-Timer-style generous free tier; ~$8.99/mo · $50–70/yr · 7-day trial; Stripe (web) + RevenueCat (native) later
- Procedural 3D figure now → rigged Mixamo glTF later (same `pose` prop)
- Synthesized web audio now → recorded custom audio later (manifest swap, no code changes)
- Backend = Supabase free tier (anon auth + RLS); analytics = PostHog free tier

## Next step — your call between three concrete options

### Option A — first **EAS native build** (the moment of truth)
The Hermes bundle *compiles*; the next checkpoint is it *runs* on a device.

- **Prereqs:** Expo account (free), `npx eas login`, optionally Apple Dev ($99/yr) for TestFlight or Google Play Console ($25 once) for internal testing. Internal-distribution EAS builds need neither for sideloading.
- **Commands:**
  ```bash
  npm install -g eas-cli
  eas login
  eas build --profile preview --platform android   # ~15–25 min cloud build
  # download the APK from the build URL and install on a device
  ```
- **On the device, verify:**
  - App launches; home renders; the journey player ticks
  - **Supabase requests work under Hermes** (this is the runtime question the resolver fix doesn't answer — OTEL was unused, so this should be fine, but it's untested)
  - **`expo-notifications` schedules + fires** a real daily local alarm (the gentle wake-up)
  - The native `PoseViewer` placeholder shows on the Movement Studio screen
- If something breaks, the issue is now isolated to native runtime — not the bundle.

### Option B — stand up real services + end-to-end test
- Create Supabase project, run `supabase/migrations/0001_init.sql`, enable Anonymous auth
- Create PostHog project, copy the public key
- Fill in `.env`, restart `npm run web`
- Click through the flows; confirm rows appear in Supabase tables (`preferences`, `mood_checkins`, `journey_completions`) and events appear in PostHog
- ~30 min total

### Option C — replace placeholder assets with real content
The biggest "is this a real product?" perception lift, all web-verifiable:
- Drop a rigged **glTF** (e.g. free Mixamo character + a yoga animation clip) into `src/avatar/`; load with `useGLTF` + `useAnimations` in `PoseViewer.web.tsx`. The pose-driven `Figure.tsx` becomes optional.
- Replace the Web Audio synth pad with 1–2 royalty-free CC0 ambient loops; swap track keys in `src/content/manifests/*.ts`.
- Record a short voice narration for one journey; slot the audio key in the segments.

## Pick-up checklist

- [ ] `git fetch && git checkout claude/meditation-wellness-app-plan-3lCPp`
- [ ] `npm install`
- [ ] `npm test && npm run typecheck` (expect green)
- [ ] `npm run web` and click through home → onboarding → journey → check-in
- [ ] Pick A, B, or C above

## Known quirks

- **Don't remove `metro.config.js`** — it's what makes the Hermes native bundle compile (comment in the file explains why).
- `expo-status-bar` is registered as an Expo config plugin in `app.json` (added automatically by `npx expo install`; harmless).
- The Expo dev server keeps prior screens mounted-but-hidden in the DOM — any DOM/automation tooling needs a `:visible` filter or it will hit stale nodes. The production export does not have this issue.
- The home **morning-prompt banner** only re-checks on app open (mount), not the instant you save a reminder. By design — it's an "open the app" prompt, not a real-time alarm.
- **Audio + the 3D figure are placeholders** by design (synthesized pad + procedural humanoid). Real assets land via Option C.
- Browsers can't fire a background alarm on a sleeping phone. The real gentle-wake alarm only exists on the native build (Option A).
- **Playwright walkthrough scripts** I used to verify each phase live under `/tmp/pw/` and are not committed. If you want durable e2e, move them into `e2e/` in the repo.

## File map (where things live)

```
app/                      # Expo Router screens
  _layout.tsx             # Stack + route registration
  index.tsx               # Home (+ morning-prompt banner)
  onboarding.tsx          # Time/intensity/style selection
  journey.tsx             # Player; reads ?id&minutes&intensity
  checkin.tsx             # Mood + encouragement
  library.tsx             # Journey catalog + premium gating
  paywall.tsx             # Tiers + Start free trial
  reminder.tsx            # Wake-up reminder settings
  pose.tsx                # Premium-gated 3D Movement Studio

src/
  engine/                 # JourneyEngine (pure), player (pure), audio
    audioEngine.ts        # interface + Noop
    createAudioEngine.{ts,web.ts}
    webAudioEngine.ts     # Web Audio API synth pad + chimes
  content/
    types.ts              # JourneyTemplate / SegmentTemplate (+ premium flag)
    manifests/            # sunriseFlow (free), catalog (+2 premium)
  data/                   # Repository (Supabase or local), usePreferences
  billing/                # Tier, Provider, gating, store, useEntitlement
  reminder/               # ReminderScheduler (web in-app / native expo-notifications)
  avatar/                 # Pose math, Figure, PoseViewer (web/native split)
  analytics/              # track() + typed event union (sink.web.ts → PostHog)
  design/                 # tokens + shared UI primitives

supabase/migrations/      # 0001_init.sql (preferences, mood_checkins, journey_completions, RLS)
metro.config.js           # @supabase native-CJS resolver workaround
eas.json                  # EAS build profiles (development / preview / production)
app.json                  # Expo config + notifications plugin
```

## Verification cheatsheet

| Goal | Command |
|---|---|
| Engine/data/billing/reminder/pose math | `npm test` |
| Type safety incl. native scheduler | `npm run typecheck` |
| Web bundle | `npx expo export --platform web` |
| Native Hermes bundle | `npx expo export --platform android --output-dir /tmp/nativecheck` |
| Run web dev | `npm run web` |
| Run native dev (needs device/simulator) | `npm run ios` or `npm run android` |
