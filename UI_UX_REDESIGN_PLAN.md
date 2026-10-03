# Ascend UI/UX Rework Plan

## Context
Ascend is a habit/recovery app (Expo 54 / RN Web). It works, but it was built feature-first: `DashboardScreen.tsx` is ~4,000 lines, the theme has colours and sizes but no motion, elevation or type system, and feedback is almost entirely visual-static. The goal is a full rework so the app feels intuitive, responsive and emotionally rewarding, built on your five principles. Ascend is now free and open to guests, so the first-run experience must also convert a stranger into a daily user without any sign-up wall.

## Where we are (from the code inventory)
- **Tokens** (`src/utils/theme.ts`): colours (dark/light, 14 keys), Spacing, FontSize, BorderRadius, LineHeight, 4 animation durations. **Missing:** easing/spring, elevation, z-index, semantic text styles, font family, status tints, touch-target and icon sizes.
- **Components** (`src/components`): Button, Card, AppText, Toast, ProgressBar, DailyProgressRing, HabitCard, LoadingSkeleton, FadeInView, DesktopSidebar, TopHeader, etc. Reusable base, but styled inconsistently and bypassed by screens' own inline styles.
- **Feedback today:** RN `Animated` in ~11 files (fade, progress, toast). `expo-haptics`, `expo-av`, `react-native-reanimated` are installed but **never used**. No sound, no celebration, no reduced-motion handling.
- **Accessibility:** ~34 labels, 3 roles, no state/hint, no reduced-motion, untested touch targets and focus rings.
- **Navigation:** 5 destinations (Dashboard, Clock, Discover, Community, Settings); bottom tabs on mobile, sidebar >768px (tablet gets full desktop layout).
- **Screens:** ~12k lines; Dashboard, Community and Clock are the heaviest.

## Principles → what they mean in Ascend

### 1. Invisible friction
- **Primary action in one tap:** completing a habit is the hero action; no modal, no confirm. Undo via toast instead of confirmation dialogs.
- **Quick add everywhere:** one persistent "+" that adds a habit/task/journal line in ≤2 taps; smart defaults (name only required; type, time, category inferred or deferred).
- **Zero-state that leads:** a new guest lands on a pre-seeded "Start here" with 3 suggested habits they can tick immediately, not an empty dashboard.
- **Fewer destinations:** audit the 5 tabs; fold rarely-used surfaces (AI Generator already moved to Settings) and cut settings to a short list with progressive disclosure.
- **Remember context:** last tab, last filter, drafts preserved (autosave journal text).
- **Sign-in is optional and late:** ask only after value is felt (e.g. after a 3-day streak), via the existing banner → asix.live flow.

### 2. Immediate feedback
- **Motion system** (new tokens): easing curves + spring presets; durations 100/200/350/600 ms; every tap produces a response within one frame (press scale 0.97, ripple/highlight).
- **Completion moment:** checkbox morph + ring fill + XP count-up + streak flame bump; milestone/level-up gets a short confetti/particle burst.
- **Haptics (native)** via `expo-haptics`: light tap on toggle, success on completion, warning on destructive.
- **Sound (opt-in, off by default)** via `expo-av`/WebAudio: soft chime on completion, distinct milestone sound; master toggle + volume in Settings.
- **System states:** skeletons already exist; add optimistic updates, "saved" tick, and calm sync status (reuse `SyncStatusIndicator`, `Toast`).
- **Reduced motion respected** everywhere (`AccessibilityInfo.isReduceMotionEnabled` / `prefers-reduced-motion`): swap animation for instant state change, keep haptics/sound toggles independent.

### 3. Visual hierarchy
- **One focal point per screen:** Dashboard top = today's progress ring + next best action; secondary = habit list; tertiary = analytics/links.
- **Type scale with semantic styles** (Display, Title, Heading, Body, Label, Caption) in one `Typography` token set + a loaded display/body font pair (`expo-font`, with system fallback).
- **Spacing rhythm** on a 4/8 grid; consistent card padding; max content width on desktop.
- **Elevation & contrast tokens:** 3 elevation levels, WCAG AA text contrast verified with the existing `contrastChecker.ts`; accent used sparingly for the single primary action.
- **Declutter Dashboard:** split into focused views (Today / Progress / Journal / Goals / Calendar already tabs) and move modal-heavy features behind clear entry points.

### 4. Familiar patterns
- Tab bar (mobile) / sidebar (desktop) stays; standard gestures: swipe a habit row to complete/skip, pull-to-refresh sync, long-press for edit, bottom sheets instead of full modals on mobile.
- Checklist-style habit rows (Todoist/Apple Reminders model), streak flame + weekly dots (Duolingo/Streaks model), calendar heatmap (GitHub/Strava model), settings list with toggles (iOS model).
- Standard icons/labels; no novel navigation to learn.

### 5. Emotional resonance
- **Voice & microcopy:** warm, brief, non-judgemental recovery tone; replace generic strings ("0/0 completed", error toasts) with contextual lines; relapse flows are compassionate, never shaming.
- **Brand layer:** keep emerald accent; add a distinct illustration/icon style, empty-state art, time-of-day greeting, personalised milestones, a signature celebration.
- **Meaningful progress:** streak freeze, recovery timeline and certificates (already built) promoted as emotional high points.
- **Dark/light themes** polished equally; optional calm "night" mode.

## Approach & phases
Rework in thin, shippable slices so the live app never regresses. Each phase ends with a deploy-safe branch.

**Phase 0 — Research & direction (1 wk)**
- Define personas (guest day-1, returning daily user, premium), top 5 journeys, success metrics (day-1 first completion, day-7 return, tasks/min).
- Heuristic audit of current screens (existing report card is the baseline), competitor teardown (Streaks, Finch, Fabulous, Duolingo, Apple Reminders).
- Produce low-fi wireframes + a clickable prototype for Today, Quick Add, Completion moment, Onboarding.

**Phase 1 — Design system foundation (1–2 wks)**
- Extend `src/utils/theme.ts`: typography, motion (easing/springs/durations), elevation, z-index, touch-target (≥44px), icon sizes, status tints, chart palette.
- Add `src/utils/motion.ts` (`useReducedMotion`, `usePressScale`, spring presets) and `src/utils/feedback.ts` (single `feedback.success()/tap()/milestone()` that fans out to haptics + sound + visual, honouring settings).
- Rebuild primitives on the tokens: Button, Card, AppText, ListRow, Checkbox, Chip, Sheet, Toast, EmptyState, Skeleton. Add Storybook-style preview screen (dev-only) to review them.
- Load fonts via `expo-font` in `App.tsx` (keep skeleton until ready).
- Add a lint rule/test: no raw hex or magic spacing in screens.

**Phase 2 — Core loop: Today & habit completion (2 wks)**
- Rebuild Dashboard "Today": hero ring + next action, swipe-to-complete rows, quick-add sheet, undo toast, completion celebration (haptics/sound/animation).
- Break `DashboardScreen.tsx` into per-tab files under `src/screens/Dashboard/` (Today, Progress, Journal, Goals, Calendar) as the redesign touches each.
- Reuse: `DailyProgressRing`, `HabitCard`, `StreakBadge`, `streakFreeze.ts`, `dashboardStats.ts`, `AppContext` actions (`toggleHabit`, `addHabit`).

**Phase 3 — First-run & guest conversion (1 wk)**
- Seeded "Start here" for new guests; gentle value-first sign-in prompt (reuses `buildSignInUrl`, `GuestBanner`); premium upsell only at the Analytics gate (`usePremium`).

**Phase 4 — Remaining surfaces (2–3 wks)**
- Navigation simplification + tablet layout; Clock, Discover/Learn, Community, Settings (short list + Advanced), Goals. Apply microcopy pass and illustration/empty states throughout.

**Phase 5 — Accessibility, performance, polish (1–2 wks)**
- Roles/labels/state/hints on all interactive elements, focus rings, keyboard paths, screen-reader pass, AA contrast, reduced motion, dynamic type. Perf: memoised rows, virtualised lists, bundle check (currently ~2.6 MB).

**Phase 6 — Validate & roll out**
- Usability tests (5 users per persona), compare metrics, staged rollout behind an `EXPO_PUBLIC_UI_V2` flag so old and new can be compared; remove the flag when v2 wins.

## Files most affected
- `src/utils/theme.ts`, new `src/utils/motion.ts`, `src/utils/feedback.ts`
- `src/components/*` (Button, Card, AppText, Toast, HabitCard, DailyProgressRing, DesktopSidebar, TopHeader, LoadingSkeleton) + new Sheet, Checkbox, EmptyState
- `src/screens/Dashboard/DashboardScreen.tsx` (split), `DashboardScreen.styles.ts`, `GoalsScreen.tsx`
- `src/navigation/AppNavigator.tsx`, `src/utils/responsive.ts`
- `src/screens/{Clock,Learn,Community,Settings}/*`
- `App.tsx` (font loading, first-run), `src/contexts/AppContext.tsx` (settings for sound/haptics/motion)

## Risks / decisions to settle early
- **Scope:** a "total rework" of ~12k lines of screens — hence phased slices behind a flag.
- **Sound:** autoplay rules on web and annoyance risk → opt-in, off by default.
- **Fonts/bundle size:** limit to 1–2 families, subset weights.
- **Native vs web parity:** haptics/gestures are native-only; web gets equivalent visual feedback.
- **Data safety:** UI work must not touch the sync/migration logic recently hardened.

## Verification
- Each phase: `npx tsc --noEmit` (no new errors), `npx jest`, `expo export --platform web` builds.
- Interaction checks in the browser pane: tap-to-feedback latency, completion animation, reduced-motion on/off, 375/768/1280 widths, light/dark.
- Accessibility: automated contrast checks (`contrastChecker.ts`), keyboard-only walkthrough, screen-reader spot check.
- Metrics before/after: first-completion rate, day-7 return, time-to-add-habit; usability test task success.
- Add tests for new utilities (motion/feedback gating, token invariants).

## Guardrail: no feature is removed
The rework changes how things look, feel and where they are reached, never whether they exist. Anything that moves must stay reachable, and any proposal to actually delete a feature needs your explicit sign-off first.

### Feature map (current → after the rework)
| Feature | Today | After |
|---|---|---|
| Habits (good/bad), streaks, streak freeze | Dashboard → Today/Habits | Same; one-tap completion, celebration |
| **Recovery Timeline** | Small unlabeled 📈 button on **bad-habit rows only** (opens `RecoveryTimelineModal`) | Labeled entry on each quit-habit row **and** a "Recovery" section in Progress; milestone unlock triggers a celebration |
| Tempted / Relapsed / Accountability partner | Buttons on habit rows | Same actions, grouped in a row menu / bottom sheet |
| Goals, Quick Tasks | Dashboard → Goals / Today | Same |
| Progress, Weekly Insights, charts | Dashboard → Progress | Same, clearer hierarchy |
| Analytics modal (premium) | 📊 button | Same gate, same upsell |
| Journal, Calendar, Real-world wins, Reflections | Dashboard tabs | Same |
| Certificates, milestones | Modals | Same, promoted at milestone moments |
| Clock: Alarm, Pomodoro, Detox | Clock tab | Same |
| Discover: Habit Library, EQ Lab, Conversation Master | Discover tab | Same |
| AI Generator | Settings → Advanced | Same |
| Community: forum, events | Community tab | Same |
| Settings, theme, sync, guest sign-in | Settings / banner | Same options; fewer shown by default, rest under Advanced |

## Decisions (confirmed)
1. **Tone: serious.** Calm, respectful, recovery-first. No cartoons, no jokey copy; celebrations are restrained and meaningful (a clean fill and a soft burst, not confetti spam). Relapse and "tempted" flows are supportive, never shaming.
2. **Sound: not a goal, nice to have.** Haptics and visuals carry the feedback. A subtle opt-in chime (off by default) is built after the visual and haptic feedback is done, and can be cut without affecting anything else.
3. **Web first.** Design and test at 375 / 768 / 1280 on the web build. Native gestures and haptics are progressive enhancements; web gets equivalent visual feedback (keyboard, hover, focus states matter as much as touch).
4. **Full rebrand with a dark, blue-leaning theme.**
   - Dark is the primary theme; blue becomes the brand colour, replacing emerald as the accent.
   - Phase 0 produces 2-3 palette options (deep navy / slate backgrounds, a blue accent, semantic success/warning/danger tuned to sit well on blue) for you to pick from before any code changes. Light theme stays supported but is secondary.
   - Rebrand scope: palette, logo/wordmark, icon set and illustration style, typography pair, app icon/favicon, and microcopy voice. All palettes are checked for WCAG AA with `contrastChecker.ts`.
   - Colours live only in tokens (`theme.ts`), so the swap is one change and the rest of the work can proceed in parallel.

### What these change in the plan
- Phase 0 now includes the brand/palette exploration above and a short brand brief (serious, calm, trustworthy, quietly encouraging).
- Phase 1 tokens are built around the chosen blue palette; sound moves to the end of Phase 2 as an optional extra.
- Phase 5 prioritises keyboard and focus behaviour (web first).

## Brand palette (chosen)
Base colours from you: **#007DB8** (blue), **#7E9AA6** (slate), **#293033** (background).

WCAG contrast measured against the background (AA needs 4.5 for body text, 3 for large text and UI shapes):

| Use | Colour | Ratio | Verdict |
|---|---|---|---|
| Background | #293033 | - | base |
| Primary text | #FFFFFF (white) | 13.4 | pass |
| Secondary text | #7E9AA6 | 4.5 on bg, 3.9 on surface | passes on bg only; use for captions on the base background, not on raised cards |
| Brand blue as a fill (buttons, ring, active tab) | #007DB8 | white text on it 4.5 | pass for button labels |
| Brand blue as text or thin line on bg | #007DB8 | 2.96 | **fails** |
| Link / accent text | #5BB8E6 (lighter blue) | 6.0 on bg, 5.2 on surface | pass |

### Derived tokens (proposed, to be finalized in Phase 1)
- background #293033, surface (cards) a step lighter around #323A3E, surface-raised around #3A444A, border around #46525A
- text #FFFFFF; #7E9AA6 and #007DB8 are accent colours (borders, icons, fills, charts, highlights, section tints), not the main text colours; if slate is used for secondary text it stays on the base background only
- accent #007DB8 (fills), accent-text #5BB8E6, accent-light a low-opacity blue tint for selected states
- success, warning and danger tuned to sit calmly on blue-slate (muted green, amber, red) and each verified at AA

### Rules
- Body text is white. #007DB8 and #7E9AA6 add colour: buttons, rings, active states, icons, dividers, chart series, tinted cards. Never put #007DB8 text on the background; if blue text or a link is needed, use #5BB8E6.
- Secondary slate text on cards must be lightened or moved to the base background to stay AA.
- Light theme is derived from the same hues (slate-tinted whites, dark text, #007DB8 accent) and gets its own contrast pass.
- All values live in `theme.ts` only; `contrastChecker.ts` plus a unit test enforce the ratios above so they can't regress.
