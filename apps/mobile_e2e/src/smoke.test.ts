import "dotenv/config";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { remote } from "webdriverio";

import { createAppiumRemoteOptions } from "./config";

describe("mobile e2e smoke", () => {
  it("starts an Appium session and opens the app", async (t) => {
    const config = createAppiumRemoteOptions();

    if (!config.options) {
      t.skip(config.skipReason ?? "Appium env is not configured.");
      return;
    }

    const driver = await remote(config.options);

    try {
      const source = await driver.getPageSource();
      assert.ok(source.length > 0, "Expected app page source to be non-empty");
    } finally {
      await driver.deleteSession();
    }
  });
});
