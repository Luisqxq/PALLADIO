This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Palladio Health: project rules

- Security comes first. Read `docs/SEGURIDAD.md` before changing permissions, storage, networking or dependencies. Every new dependency must be justified.
- No navigation library on purpose (no Expo Router): it would add a deep-link scheme. Tabs are plain state in `App.tsx`; screens live in `src/screens/`.
- All data goes through `src/db/repo.ts` with parameterized queries. The database is SQLCipher-encrypted (`src/db/database.ts`). Schema changes are new entries in `MIGRATIONS` (never edit old ones); existing users' data must survive (CI upgrade test).
- Health conditions are declarative modules in `src/modules/` (fields, red flags, triggers, reliefs, questionnaire). Each user picks their conditions (profile) and only sees those. Daily data is `day_entry(date, module, data JSON)`, plus a `general` row.
- Screen capture blocking is a runtime toggle via the local native module `modules/secure-window` (FLAG_SECURE only).
- Pure logic lives in `src/logic/` and is tested with `npm test` (Node test runner, `.ts` import extensions).
- User-facing text is Spanish (Peru).
- Android permissions are allow-listed in `app.json` and enforced on the built APK by `scripts/verify_apk.py` in CI.

## Building

This project builds the APK with GitHub Actions (`.github/workflows/android.yml`), not EAS. Over-the-air updates are disabled on purpose; do not add `expo-updates`.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. This app uses SQLCipher, so it never runs in Expo Go; test with the APK built by CI.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
