import "dotenv/config";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { remote } from "webdriverio";

import { createAppiumRemoteOptions } from "./config";

type Driver = Awaited<ReturnType<typeof remote>>;

function readTimeoutMs(): number {
  const value = process.env.MOBILE_E2E_TIMEOUT_MS ?? "20000";
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid MOBILE_E2E_TIMEOUT_MS: ${value}`);
  }

  return parsed;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return defaultValue;
  }

  return value === "1" || value === "true" || value === "yes";
}

function readStringEnv(name: string, defaultValue: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : defaultValue;
}

async function waitForAccessibilityId(
  driver: Driver,
  id: string,
  timeoutMs: number
) {
  const element = await driver.$(`~${id}`);
  await element.waitForExist({ timeout: timeoutMs });
  return element;
}

async function waitForAnyAccessibilityId(
  driver: Driver,
  ids: string[],
  timeoutMs: number
): Promise<string | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const id of ids) {
      const element = await driver.$(`~${id}`);

      if (await element.isExisting()) {
        return id;
      }
    }

    await driver.pause(250);
  }

  return null;
}

describe("mobile e2e projects flow", () => {
  it("navigates projects list -> detail -> comments -> back", async (t) => {
    const config = createAppiumRemoteOptions();

    if (!config.options) {
      t.skip(config.skipReason ?? "Appium env is not configured.");
      return;
    }

    const timeoutMs = readTimeoutMs();
    const allowEmptyProjects = readBooleanEnv(
      "MOBILE_E2E_ALLOW_EMPTY_PROJECTS",
      true
    );

    const driver = await remote(config.options);

    try {
      const firstScreen = await waitForAnyAccessibilityId(
        driver,
        ["login-title", "projects-header-title", "projects-empty-title"],
        timeoutMs
      );

      assert.ok(
        firstScreen,
        "Expected login or projects screen (header or empty state) to appear"
      );

      if (firstScreen === "login-title") {
        const emailInput = await waitForAccessibilityId(
          driver,
          "login-email-input",
          timeoutMs
        );
        const passwordInput = await waitForAccessibilityId(
          driver,
          "login-password-input",
          timeoutMs
        );
        const submitButton = await waitForAccessibilityId(
          driver,
          "login-submit-button",
          timeoutMs
        );

        await emailInput.setValue(
          readStringEnv("MOBILE_E2E_EMAIL", "tech@test.com")
        );
        await passwordInput.setValue(
          readStringEnv("MOBILE_E2E_PASSWORD", "password1234")
        );
        await submitButton.click();

        const postLoginScreen = await waitForAnyAccessibilityId(
          driver,
          ["projects-header-title", "projects-empty-title"],
          timeoutMs
        );

        assert.ok(postLoginScreen, "Expected projects screen after logging in");

        if (postLoginScreen === "projects-empty-title") {
          if (allowEmptyProjects) {
            t.skip(
              "No assigned projects available for this user. Assign projects to the logged-in tech or override MOBILE_E2E_EMAIL/MOBILE_E2E_PASSWORD."
            );
            return;
          }

          assert.fail(
            "Projects list is empty after login and MOBILE_E2E_ALLOW_EMPTY_PROJECTS=false"
          );
        }
      } else if (firstScreen === "projects-empty-title") {
        if (allowEmptyProjects) {
          t.skip(
            "No assigned projects available for this user. Log in as a tech with assigned projects or override MOBILE_E2E_EMAIL/MOBILE_E2E_PASSWORD."
          );
          return;
        }

        assert.fail(
          "Projects list is empty and MOBILE_E2E_ALLOW_EMPTY_PROJECTS=false"
        );
      }

      const firstProjectCard = await waitForAccessibilityId(
        driver,
        "project-card-first",
        timeoutMs
      );
      await firstProjectCard.click();

      await waitForAccessibilityId(driver, "project-detail-title", timeoutMs);

      const commentsEntryButton = await waitForAccessibilityId(
        driver,
        "project-detail-comments",
        timeoutMs
      );
      await commentsEntryButton.click();

      await waitForAccessibilityId(driver, "comments-header-title", timeoutMs);

      const commentsBackButton = await waitForAccessibilityId(
        driver,
        "comments-back",
        timeoutMs
      );
      await commentsBackButton.click();

      await waitForAccessibilityId(driver, "project-detail-title", timeoutMs);

      const detailBackButton = await waitForAccessibilityId(
        driver,
        "project-detail-back",
        timeoutMs
      );
      await detailBackButton.click();

      await waitForAccessibilityId(driver, "projects-header-title", timeoutMs);
    } finally {
      await driver.deleteSession();
    }
  });
});
