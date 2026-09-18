# Ascend

A habit-tracking and recovery app built with Expo/React Native, running on iOS,
Android, and web from one codebase. Supabase provides auth, cloud sync, and
the community forum; the app also works fully signed-out ("guest mode") with
local-only data.

## Stack

- **Client:** Expo ~54, React Native 0.81, React 19, TypeScript (strict mode)
- **Navigation:** React Navigation (bottom tabs on mobile, a sidebar layout on
  desktop web — see `src/navigation/AppNavigator.tsx`)
- **Backend:** Supabase (Postgres + Auth + Row-Level Security); see
  `src/utils/supabase.ts` for the schema reference and RLS policies
- **State:** a single React Context (`src/contexts/AppContext.tsx`) backed by
  `AsyncStorage` locally and Supabase for cross-device sync
- **Web hosting:** Vercel (see `vercel.json`) — this is the only web
  deployment target; native builds go through EAS (see `eas.json`)

## Getting started

```bash
npm install
npm run web      # or: npm start / npm run ios / npm run android
```

The app works out of the box against a shared demo Supabase project (see
`src/utils/config.ts`) and runs in guest mode with no login required when the
hostname is `localhost`. To point at your own Supabase project instead, set
these env vars (see `src/utils/config.ts` for the full list and fallback
behavior):

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Scripts

| Command | What it does |
|---|---|
| `npm run web` / `start` / `ios` / `android` | Run the Expo dev server |
| `npm test` | Run the Jest test suite |
| `npm run test:coverage` | Run tests with coverage (see `jest.config.js` for current thresholds) |
| `npm run lint` | ESLint (flat config, `eslint.config.js`) |
| `npm run format` / `format:check` | Prettier |
| `npm run build` / `export` | Build the static web export (`web-build/`), used by Vercel |

## Project structure

```
App.tsx                    Root component: auth bootstrap, guest/sign-in gate
src/contexts/AppContext.tsx  Single global context: local state + cloud sync
src/navigation/             Bottom-tab (mobile) and sidebar (desktop) navigators
src/screens/                One folder per top-level screen
src/components/             Shared UI components
src/utils/                  Business logic, Supabase client, sync engine, helpers
src/data/                   Static content (recovery milestones, EQ lessons, etc.)
src/types/                  Shared TypeScript types
supabase/functions/         Supabase Edge Functions (Deno runtime)
supabase/migrations/        Tracked SQL migrations
```

## Testing

`npm test` runs the Jest suite (`src/**/__tests__/*.test.ts`). Coverage
collection spans the whole `src/` tree — most of the UI layer (screens,
components, the app context) doesn't have tests yet; see `jest.config.js`'s
`coverageThreshold` for the current honest baseline per area. The best-tested
module is `src/utils/syncEngine.ts` (conflict resolution + retry logic).

## Further reading

- [`CLOUD_SYNC_IMPLEMENTATION.md`](./CLOUD_SYNC_IMPLEMENTATION.md) — how cross-device sync, offline queueing, and conflict resolution work
- [`SUPABASE_MIGRATION.md`](./SUPABASE_MIGRATION.md) — the `user_data` schema and how to apply new column migrations
- [`RLS_AUDIT_CHECKLIST.md`](./RLS_AUDIT_CHECKLIST.md) — Row-Level Security policy status and how to verify it
- [`supabase/functions/send-weekly-partner-updates/DEPLOY.md`](./supabase/functions/send-weekly-partner-updates/DEPLOY.md) — deploying the weekly accountability-partner email job
