interface Env {
  [key: string]: string | undefined;
}

function readEnv(name: string, env: Env): string | undefined {
  const value = env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function readPort(env: Env): number {
  const raw = readEnv("MOBILE_E2E_APPIUM_PORT", env) ?? "4723";
  const parsed = Number.parseInt(raw, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid MOBILE_E2E_APPIUM_PORT: ${raw}`);
  }

  return parsed;
}

export interface AppiumRemoteOptions {
  hostname: string;
  port: number;
  path: string;
  logLevel: "error";
  capabilities: Record<string, string | number>;
}

export interface AppiumConfigResult {
  options: AppiumRemoteOptions | null;
  skipReason?: string;
}

export function createAppiumRemoteOptions(
  env: Env = process.env
): AppiumConfigResult {
  const platformName = readEnv("MOBILE_E2E_PLATFORM_NAME", env) ?? "Android";
  const deviceName = readEnv("MOBILE_E2E_DEVICE_NAME", env);
  const platformVersion = readEnv("MOBILE_E2E_PLATFORM_VERSION", env);
  const app = readEnv("MOBILE_E2E_APP", env);
  const appPackage = readEnv("MOBILE_E2E_APP_PACKAGE", env);
  const appActivity = readEnv("MOBILE_E2E_APP_ACTIVITY", env);
  const bundleId = readEnv("MOBILE_E2E_BUNDLE_ID", env);

  const automationName =
    readEnv("MOBILE_E2E_AUTOMATION_NAME", env) ??
    (platformName.toLowerCase() === "ios" ? "XCUITest" : "UiAutomator2");

  if (!deviceName) {
    return {
      options: null,
      skipReason:
        "Missing MOBILE_E2E_DEVICE_NAME. See apps/mobile_e2e/.env.example.",
    };
  }

  const hasLaunchTarget = Boolean(app || appPackage || bundleId);

  if (!hasLaunchTarget) {
    return {
      options: null,
      skipReason:
        "Set one of MOBILE_E2E_APP, MOBILE_E2E_APP_PACKAGE, or MOBILE_E2E_BUNDLE_ID.",
    };
  }

  const capabilities: Record<string, string | number> = {
    platformName,
    "appium:automationName": automationName,
    "appium:deviceName": deviceName,
    "appium:newCommandTimeout": 120,
  };

  if (platformVersion) {
    capabilities["appium:platformVersion"] = platformVersion;
  }

  if (app) {
    capabilities["appium:app"] = app;
  }

  if (appPackage) {
    capabilities["appium:appPackage"] = appPackage;
  }

  if (appActivity) {
    capabilities["appium:appActivity"] = appActivity;
  }

  if (bundleId) {
    capabilities["appium:bundleId"] = bundleId;
  }

  return {
    options: {
      hostname: readEnv("MOBILE_E2E_APPIUM_HOST", env) ?? "127.0.0.1",
      port: readPort(env),
      path: readEnv("MOBILE_E2E_APPIUM_PATH", env) ?? "/",
      logLevel: "error",
      capabilities,
    },
  };
}
