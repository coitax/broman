# Wellness App Breakdown — Full Session Log

A chronological record of the design and build of **Morning**, a movement-first
meditation & wellness app. From the initial vision through Phases 0–3 on the
web target, the native Hermes build unblocked, and a handoff document. All
work landed on `coitax/broman` PR #1 (draft).

---

## 1. The vision (user's brief)

> "I need to plan out how to build a meditation wellness app that uses a
> certain modalities but definitely focuses on simple movement using yoga.
> maybe Tai Chi offering some sort of a graphical interface so the person can
> look at the moves real slowly on their phone. maybe they can move a figure
> around in 3D like an actual individual that are that's doing the moves and
> it has some sort of like meditation ambient music in it. maybe it has like
> three stages in order to get the individual into some easy movement in the
> morning. could possibly have like a built-in alarm in the morning to slowly
> wake the person up and then take them through a journey to start with some
> light meditation, guided meditation with a soft voice that then leads to
> some positive affirmation talking and then some light movement into possibly
> some more like heavier movement and then in a very sort of short window of
> time. this process can be customized for the individual as to how what
> their time limits are and how they like to do movement in the morning. I
> wanted to have like a mental health aspect to the app and encourage them to
> acknowledge any feelings they have and allow them to think positively about
> themselves and encourage them. it can use a different techniques in order
> to achieve this. a lot of the sounds will be custom and added into the app
> later. research different types of apps that are successful. how to build
> something that has a low barrier financially to get into and how it can
> have some features that are paid later on, but I'd like to keep it very
> inexpensive initially and have maybe a tiered system and how that would
> all work"

## 2. Plan mode — exploration and research

**Assistant:**

- Inspected the repo (greenfield — just a 24-byte README and an initial commit on `master`)
- Web-researched successful meditation apps (Calm/Headspace dominate revenue; Insight Timer dominates retention with a generous free tier; Down Dog wins on customization)
- Web-researched freemium pricing tiers for wellness apps (2–5% conversion typical; tiered + subscription + trial is standard)
- Web-researched cross-platform stacks (Flutter vs React Native vs Unity for animation/3D)

**Asked 4 clarifying questions:**

| Question | User's answer |
|---|---|
| Who will build it? | Experienced developer (solo) |
| Which platforms first? | Web first, but plan must cover iOS/Android too — *"I don't want to lose any functionality or speed or infrastructure by building the web app first and then wrapping it later. unless you think that's okay…"* |
| 3D figure approach for v1? | **Pro video, 3D later (Recommended)** |
| Real goal? | Validate cheaply (MVP) |

## 3. The plan

Addressed the user's "web-first without losing performance" concern head-on:

> **Don't build a web app and wrap it.** A WebView wrapper is precisely where
> performance is lost — and it degrades exactly what this app depends on:
> smooth movement video/animation, layered audio, and reliable alarms.
> Instead use **Expo (React Native + react-native-web)** — one codebase that
> ships a real web app today and compiles to **genuine native** iOS/Android
> later (not a WebView). One honest caveat: the real background alarm is
> native-only; on web it degrades to an in-app reminder.

**Tech stack chosen for low cost + solo maintainability:**

- Expo + Expo Router + TypeScript
- Supabase (auth/DB/storage, free tier)
- Audio behind an `AudioEngine` abstraction (no-op first, real Web Audio later)
- `react-native-track-player` (native) / Howler (web) when audio gets real
- PostHog for analytics, RevenueCat for cross-platform IAP
- EAS Build, Vercel/Netlify for web, all on free tiers

**Architectural keystone — the Journey Engine:**

- A `Journey` = ordered `Segments` (breath / meditation / affirmation / movement / transition)
- A `JourneyBuilder` assembles segments to fit the user's time budget and intensity
- A `Player` state machine drives the audio engine
- Journey manifests are JSON — adding new sounds/journeys later = upload media + add a row, no app release

**MVP scope (Phase 1 web validation):** onboarding, journey player, small content set, mood check-in, basic customization, freemium gate, in-app reminder, analytics.

**Monetization (modeled on what works):** Insight-Timer-style generous-but-limited free tier + a $8–13/mo premium (annual $50–70), 7-day trial. Stripe-on-web first; RevenueCat later for unified IAP.

**Five-phase roadmap:** Setup → Web MVP → Native (alarm + IAP) → 3D avatar → content scale.

Plan saved; user picked "Start Phase 0 scaffold."

## 4. Phase 0 — scaffold

Hand-rolled a clean Expo project (skipping the bloated default template).

**Built:**

- `src/engine/JourneyEngine.ts` — `buildJourney()` allocates a time budget across segments by intensity-weighted shares, using largest-remainder rounding so durations always sum exactly
- `src/engine/player.ts` — pure, testable segment state machine driven by `TICK` events
- `src/engine/audioEngine.ts` — `AudioEngine` interface + no-op impl
- `src/content/manifests/sunriseFlow.ts` — a 6-segment journey encoding the "three stages" arc (breath → meditation → affirmation → light movement → flow → close)
- `src/data/supabase.ts` — lazy Supabase client (optional)
- `src/design/` — calm palette + shared UI primitives
- `app/` — Expo Router screens (home → onboarding → journey → check-in)

**Verified:** 12 unit tests pass, typecheck clean, web bundle compiles (776 modules).

**Committed, pushed, opened draft PR #1.**

## 5. Live walkthrough

User asked for a live walkthrough. Used the `verify` skill — set up Playwright + Chromium in `/tmp/pw/` (kept the repo clean), served the static `dist/` via `python3 -m http.server`, drove the app at phone viewport (390×844).

**Results:**
- Home → onboarding (selected 5 min / Gentle / Tai Chi) → journey auto-started at Step 1/6
- Timer `0:46 → 0:44` over 2.3 s — proves the 1 Hz tick drives the real player
- Skipped through all 6 segments → auto-navigated to check-in → mood selected → encouragement card → back to home
- **Probe:** Pause froze timer (`1:25 → 1:25` over 2.5 s); Resume restarted (`1:25 → 1:23`)
- Intensity allocation works in the live UI: same segment got 46 s (5-min Gentle) vs 85 s (10-min Balanced)
- **Zero console/page errors**

Sent screenshots; verdict PASS.

## 6. Phase 1 — web validation MVP

User: *"start phase one"*

**Built (all behind the existing interfaces):**

- **Real web audio** — `WebAudioEngine` via Web Audio API: synthesized ambient pad (detuned sine partials through a lowpass) + soft chime cues + gain ducking + a one-time gesture-unlock for autoplay policy. Picked per-platform via `createAudioEngine.web.ts`. Native stays no-op.
- **Persistence** — `Repository` interface with two implementations:
  - `SupabaseRepository` — anonymous auth + RLS-scoped tables
  - `LocalRepository` — localStorage fallback so the app runs with no backend
  - `usePreferences` hook + `supabase/migrations/0001_init.sql` (preferences, mood_checkins, journey_completions, RLS policies)
- **Analytics** — typed `track(event)` funnel: `app_opened`, `onboarding_completed`, `journey_started`, `journey_completed`, `checkin_saved`. Platform-split sinks: PostHog on web, no-op without a key. In dev, events also push to a global buffer for verification.
- Screens wired: home personalizes from saved prefs ("Continue · 5 min Tai Chi"); journey records completions + fires events; check-in saves mood.
- **Web-only libs (PostHog, Web Audio) isolated in `*.web.ts`** so they never enter the native bundle.

**Verified live (against `expo start --web` to get `__DEV__` debug hooks):**
- `AudioContext.state === 'running'`, ambient pad playing (`ambient/morning-light`) — real audio, not a stub
- Preferences saved exactly (`{5, gentle, taichi}`), 1 check-in, 1 completion persisted to localStorage
- Full funnel captured
- After reload, prefs persisted → home shows the personalized "Continue · 5 min Tai Chi"
- **Zero errors**

17 tests pass, typecheck clean, prod web export 1.6 MB (PostHog + audio + persistence added; native unchanged).

**Committed, pushed, PR description updated.**

## 7. Phase 2 — monetization + reminder + native config

User: *"phase 2"*

**Flagged the real constraint:** Phase 2 is fundamentally native, but this cloud sandbox is web-only — no simulator, no EAS account, no RevenueCat. Asked which scope:

| Option | Choice |
|---|---|
| Verifiable slice + native config (Recommended) | **User picked this** |
| Full native wiring (unverified here) | — |
| Defer native, do web-verifiable work | — |

**Built:**

- **Freemium paywall + premium gating**
  - `BillingProvider` interface; `LocalBillingProvider` mock (purchase flips a flag — stand-in for Stripe/RevenueCat)
  - Pure `isLocked(item, tier)` gating, unit-tested
  - **Entitlement in a shared store** (`useSyncExternalStore`) so a purchase on the paywall unlocks every screen *live* — caught the staleness bug before it shipped
  - `app/paywall.tsx` (benefits list, $8.99/mo + 7-day trial, Start/Restore/Maybe-later)
  - `app/library.tsx` (catalog with 1 free + 2 premium journeys, lock badges)
  - Premium-gated content
- **Wake-up reminder** — one `ReminderScheduler` interface, platform-split:
  - `scheduler.web.ts` — persists the reminder + uses pure `shouldShowMorningPrompt(state, now, lastShown)` to surface an in-app banner on home (since browsers can't fire a real background alarm)
  - `scheduler.ts` — daily `Notifications.scheduleNotificationAsync` via `expo-notifications` for native (built + typechecked; runs on a device)
  - `app/reminder.tsx` (On/Off + preset times 6:00 / 6:30 / 7:00 / 7:30)
- **Native config** — `expo-notifications` plugin in `app.json`, `eas.json` build profiles
- **Analytics** added: `library_opened`, `paywall_viewed`, `premium_unlocked`, `reminder_set`

**Verified live:**
- Library showed **2 locked premium journeys**; tapping one → paywall (`paywall_viewed`)
- "Start free trial" → upgrade → **locks dropped to 0** across the library (shared store works); previously-locked journey then opened
- Reminder saved (On, 7:00); persisted to localStorage
- On a fresh open, the in-app morning prompt appeared
- Full funnel: `app_opened, library_opened, paywall_viewed, premium_unlocked, journey_started, reminder_set`
- **Zero errors**; 26 tests pass; typecheck clean; web export bundles with `expo-notifications` correctly excluded

**Committed, pushed, PR title + description updated.**

## 8. Phase 3 — rotatable 3D movement studio

User: *"go phase 3"* (after switching model to `claude-opus-4-8`)

The signature feature. Fully web-verifiable here (WebGL via SwiftShader in headless Chromium).

**Installed** `three@^0.169 @react-three/fiber@^9 @react-three/drei@^10` (with `@types/three`, three.js declared as a runtime dependency).

**Built:**

- **Pure pose math** (`src/avatar/poses.ts`) — unit-tested:
  - `lerpPose(a, b, alpha)` — interpolates joint rotations, treats missing joints as zero
  - `interpolateSequence(seq, q)` — samples a sequence at normalized time `q ∈ [0,1]`, bracketing keyframes
  - `advancePlayhead(q, dt, duration, speed, loop)` — playhead advancement with slow-mo and looping
- **Procedural articulated humanoid** (`Figure.tsx`) — renders the rig from a `Pose`; ready to be replaced by a rigged Mixamo glTF behind the same `pose` prop
- **`PoseViewer.web.tsx`** — three.js + R3F `<Canvas>` with **drei `OrbitControls`** (orbit/zoom), a timeline scrubber (0%/25%/50%/75%/100%), slow-mo toggle (1.0× ↔ 0.35×), and yoga/Tai Chi sequence switching. Includes two starter sequences: **Sun Salutation** and **Cloud Hands**
- **`PoseViewer.tsx`** (native placeholder) keeps three.js *out* of the native bundle
- **Premium-gated pose studio screen** (`app/pose.tsx`) + home entry "Movement studio (3D)"
- Analytics added: `pose_studio_opened`

**Verified live (Chromium with SwiftShader):**
- Free user tapping "Movement studio (3D)" → **redirected to the paywall** (gate works)
- After upgrade → studio loads; `__MORNING_3D__.ready` true
- **WebGL actually rendered the figure** — ~7% of canvas pixels differ from background (a blank canvas would be ~0%); screenshots showed the shaded 3D humanoid in Sun Salutation pose
- Scrub (50% → 0%), slow-mo (speed 0.35×), sequence switch (→ Cloud Hands) all updated live
- **Orbit-drag rotated the figure** (visible 3/4 angle in the post-drag screenshot)
- **Zero console errors**; 35 tests pass; typecheck clean; prod web export 6.5 MB (three.js is heavy, as expected)

**While confirming three.js stayed out of the native bundle, discovered a separate problem:** native export failed. The fatal Hermes error was *not* in three.js — it was `@supabase/supabase-js`'s dynamic `import(OTEL_PKG)` for opt-in OpenTelemetry. Pre-existing since Phase 1, only surfaced when I tried a native export for the first time.

Committed Phase 3 with the blocker documented in the README; pushed; PR description updated.

## 9. Tackling the native build

User: *"tackle native build"*

**Root cause (precise):** Hermes can't parse `import(varname)`. The supabase ESM build (`dist/index.mjs`) does `import(/* */ OTEL_PKG).catch(...)`. The CJS build (`dist/index.cjs`) implements the same opt-in OTEL hook with `require(s)` inside a caught Promise — Hermes accepts that. OTEL is unused, so runtime behavior is identical.

**Fix:** a Metro resolver that forces the CJS entry **only on native targets**. Web keeps the modern ESM entry.

```js
// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const supabaseCjs = path.resolve(
  __dirname,
  'node_modules/@supabase/supabase-js/dist/index.cjs',
);
const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '@supabase/supabase-js' &&
    (platform === 'android' || platform === 'ios')
  ) {
    return { type: 'sourceFile', filePath: supabaseCjs };
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(
    context, moduleName, platform,
  );
};

module.exports = config;
```

No supabase source patching, no postinstall hooks. 4 lines of meaningful logic.

**Verified:**
- `expo export --platform android` → succeeds, produces a **4.4 MB Hermes bytecode bundle**. Previously: `Emitted 1 errors. exiting.`
- `expo export --platform web` → still bundles cleanly
- 35/35 tests pass, typecheck clean
- Re-ran the Phase 2 browser walkthrough → identical results (gating 2 → 0, banner, persistence, full funnel, zero errors). The resolver only fires on native, so web is provably unaffected.

**Honest caveat:** the native bundle *compiles*; nobody has *run* the `.hbc` on a device yet. That's the next checkpoint.

Committed, pushed, PR title updated to *"Morning meditation app: Phases 0–3 + native Hermes build unblocked"*, "known blocker" warning removed from README.

## 10. Handoff

User: *"create a handoff file for the next step called wellness app"*

Created `wellness-app.md` at the repo root (~150 lines). It captures:
- Current state + PR
- Local run + verify commands
- Architecture seams table (interface → web impl → native impl)
- Decisions locked in (don't re-litigate)
- **Three concrete next-step options** (first EAS native build / real services + e2e / replace placeholder assets) with prereqs and commands
- Pick-up checklist
- Known quirks (don't remove `metro.config.js`, dev server's stale-mount artifact, etc.)
- File map + verification cheatsheet

Stop hook flagged the untracked file; committed and pushed.

## 11. Status check & preview

User: *"where are we at with this project? How can i see a preview"*

Sent a curated **9-screen tour** captured from the actual running app (phone viewport, 390×844), in narrative order: home with morning prompt → onboarding → journey player → check-in → library locked → paywall → library unlocked → 3D studio (front) → 3D studio (after orbit-drag).

Noted that the 3D figure is a procedural placeholder (rigged Mixamo glTF later), audio is synthesized (recorded content later), and the paywall is a working mock (Stripe/RevenueCat later) — all by design.

Offered three preview options:
1. Screenshot tour (delivered)
2. Run locally — `git checkout` + `npm install` + `npm run web`
3. Public URL via a static host (Vercel/Netlify, needs an account)

## 12. Local run instructions

User: *"ok do all this for me so i can see it on my machine"*

Clarified honestly that I'm in a remote sandbox and can't reach their laptop, but handed over the minimum copy-paste:

```bash
git clone https://github.com/coitax/broman.git
cd broman
git checkout claude/meditation-wellness-app-plan-3lCPp
npm install
npm run web   # http://localhost:8081
```

Told them what to expect (2–5 min install, 15–30 s first bundle), how to install Node if needed, and offered the truly turnkey alternative: I push a `gh-pages` branch with the built static app → they toggle Pages on once → public URL at `https://coitax.github.io/broman/`.

---

## Final state — what's on PR #1

**Commits on the branch:**
1. Initial commit (master baseline)
2. Scaffold Morning app: Expo web+native base with Journey Engine
3. Phase 1: real web audio, persistence, and analytics
4. Phase 2: freemium paywall, gating, wake-up reminder + native config
5. Phase 3: rotatable 3D movement studio (premium, web)
6. Fix Hermes native bundle: force CJS entry for @supabase/supabase-js
7. Add wellness-app.md handoff doc

**Quality gates:** 35 unit tests · clean typecheck · `expo export --platform web` (6.5 MB) · `expo export --platform android` (4.4 MB Hermes `.hbc`) · zero console errors in all browser walkthroughs.

**Architecture (one-line per seam):**

| Surface | Interface | Web impl | Native impl |
|---|---|---|---|
| Journey | `JourneyEngine` + `PlayerState` (pure) | same | same |
| Audio | `AudioEngine` | `WebAudioEngine` synth | `NoopAudioEngine` |
| Data | `Repository` | `SupabaseRepository` / `LocalRepository` | same |
| Billing | `BillingProvider` + shared store | `LocalBillingProvider` (mock) | same; Stripe/RevenueCat later |
| Reminders | `ReminderScheduler` | persist + in-app prompt | `expo-notifications` daily |
| 3D viewer | `PoseViewer` | three.js + R3F + drei | placeholder card |
| Analytics | typed `track(event)` | PostHog | dev console |

**Web-only libs (PostHog, Web Audio, three.js) live in `*.web.ts(x)` so they never enter the native bundle.**

**Three honest things that are placeholders by design:**
- The 3D figure is procedural primitives (not a rigged human) — swap for Mixamo glTF later
- Web audio is synthesized (not recorded) — swap for custom audio later
- Paywall is a local mock (not Stripe/RevenueCat) — swap when real billing lands

**The next step (per the handoff) is one of:**
1. First EAS native build on a device (untested runtime is the only remaining uncertainty)
2. Stand up real Supabase + PostHog and do an end-to-end run with live data
3. Replace placeholder assets (rigged glTF + CC0 audio + recorded voice)
