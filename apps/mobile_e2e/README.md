# mobile_e2e (Appium)

Appium-based end-to-end smoke tests for `apps/mobile`.

This project uses **Appium** + **WebdriverIO** as the test client, following the Appium docs:

- Appium docs: https://appium.io/docs/en/latest/
- Getting started: https://appium.io/docs/en/latest/quickstart/
- Drivers: https://appium.io/docs/en/latest/guides/managing-exts/

## 1) Install dependencies

From repo root:

```bash
pnpm install
```

> If pnpm warns about ignored build scripts for Appium-related packages, run `pnpm approve-builds` once.

## 2) Install Appium drivers

```bash
pnpm --filter @offline/mobile-e2e appium:driver:install:android
# or
pnpm --filter @offline/mobile-e2e appium:driver:install:ios
```

> `appium:driver:install:ios` pins `appium-xcuitest-driver@9` to stay compatible with Appium 2.

### Android prerequisites

Before running Android tests, make sure these are available to the Appium process:

- `ANDROID_HOME` (usually `$HOME/Library/Android/sdk` on macOS)
- `JAVA_HOME`
- `adb` and `emulator` on `PATH`

You can validate setup with:

```bash
pnpm --filter @offline/mobile-e2e appium driver doctor uiautomator2
```

## 3) Configure env

Copy the env file:

```bash
cp apps/mobile_e2e/.env.example apps/mobile_e2e/.env
```

`dotenv` is loaded automatically by the test runner.

Minimum required:

- `MOBILE_E2E_DEVICE_NAME`
- one of: `MOBILE_E2E_APP` OR `MOBILE_E2E_APP_PACKAGE` OR `MOBILE_E2E_BUNDLE_ID`

Recommended for iOS simulators:

- `MOBILE_E2E_PLATFORM_VERSION` matching an installed simulator runtime (for example `18.5`)

Current repo-specific target info:

- iOS native project bundle id: `ca.sumisura.offline.dev`
- Android package/activity are not committed in this repo yet, so set `MOBILE_E2E_APP_PACKAGE` / `MOBILE_E2E_APP_ACTIVITY` to match your local generated or installed Android app

Examples:

```dotenv
# iOS simulator / dev build
MOBILE_E2E_PLATFORM_NAME=iOS
MOBILE_E2E_AUTOMATION_NAME=XCUITest
MOBILE_E2E_DEVICE_NAME=iPhone 16
MOBILE_E2E_PLATFORM_VERSION=18.5
MOBILE_E2E_BUNDLE_ID=ca.sumisura.offline.dev
```

```dotenv
# Android emulator / dev build
MOBILE_E2E_PLATFORM_NAME=Android
MOBILE_E2E_AUTOMATION_NAME=UiAutomator2
MOBILE_E2E_DEVICE_NAME=Android Emulator
MOBILE_E2E_APP_PACKAGE=<your.android.package>
MOBILE_E2E_APP_ACTIVITY=.MainActivity
```

Useful optional vars:

- `MOBILE_E2E_EMAIL` (default `tech@test.com`)
- `MOBILE_E2E_PASSWORD` (default `password1234`)
- `MOBILE_E2E_TIMEOUT_MS` (default `20000`)
- `MOBILE_E2E_ALLOW_EMPTY_PROJECTS` (default `true`)

## 4) Start Appium server

```bash
pnpm --filter @offline/mobile-e2e appium
```

Default host/port expected by tests:

- `127.0.0.1:4723`
- path: `/`

Make sure the process listening on `4723` is actually Appium. If that port is already in use, set `MOBILE_E2E_APPIUM_PORT` in `apps/mobile_e2e/.env` (or inline when running tests).

## 5) Run smoke test

```bash
pnpm --filter @offline/mobile-e2e test:smoke
```

## 6) Run projects navigation flow

This test validates:

- projects list screen appears
- opens first project
- navigates to comments
- navigates back to detail and list

```bash
pnpm --filter @offline/mobile-e2e test:projects-flow
```

> If env vars are not configured, tests are skipped with a reason.
> The flow test signs in first when the login screen is present.
> If there are no assigned projects for the logged-in mobile user, the flow test skips by default.
> Override `MOBILE_E2E_EMAIL` / `MOBILE_E2E_PASSWORD` in `apps/mobile_e2e/.env` to target a different user.
> `pnpm --filter @offline/api db:seed` creates `tech@test.com` / `password1234` with assigned projects for this flow.
