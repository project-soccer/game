import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
  args: [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    ...(process.platform === "linux"
      ? ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"]
      : []),
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
mkdirSync("test-results", { recursive: true });
try {
  await page.addInitScript(() => {
    window.testPad = {
      connected: true,
      mapping: "standard",
      id: "Synthetic standard gamepad",
      axes: [0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [window.testPad],
    });
  });
  await page.goto(process.env.CLIENT_URL ?? "http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: "Character & movement study" })
    .click();
  await page.waitForFunction(
    () =>
      window.soccerLab?.snapshot?.scenario === "motion" &&
      window.soccerLab.rigsReady === 1,
  );
  assert.equal(await page.locator("#motion-tools").isVisible(), true);
  assert.equal(await page.locator("#invite").isVisible(), false);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/character-idle.png" });
  const start = await page.evaluate(() => window.soccerLab.predicted.z);
  await page.evaluate(() => {
    window.testPad.axes = [0, 0.4];
  });
  await page.waitForFunction(() => window.soccerLab.poses[0].state === "walk");
  await page.waitForFunction(
    (z) => window.soccerLab.predicted.z > z + 0.3,
    start,
  );
  await page.screenshot({ path: "test-results/character-walk.png" });
  await page.evaluate(() => {
    window.testPad.axes = [0, 1];
  });
  await page.waitForFunction(() => window.soccerLab.poses[0].state === "run");
  await page.screenshot({ path: "test-results/character-run.png" });
  await page.evaluate(() => {
    window.testPad.buttons[7] = { pressed: true, value: 1 };
  });
  await page.waitForFunction(
    () => window.soccerLab.poses[0].state === "sprint",
  );
  await page.evaluate(() => {
    window.testPad.axes = [0, 0];
    window.testPad.buttons[7] = { pressed: false, value: 0 };
  });
  await page.waitForFunction(() => window.soccerLab.poses[0].state === "idle");
  await page.getByRole("button", { name: "Reset the exercise" }).click();
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.contactSamples = [];
    window.contactTimer = setInterval(() => {
      const l = window.soccerLab,
        a = l.snapshot.players[0].action;
      if (a && Math.abs(l.renderedTick - a.contact) <= 3)
        window.contactSamples.push({
          renderedTick: l.renderedTick,
          snapshotTick: l.snapshot.tick,
          contact: a.contact,
          error: l.poses[0].contactError,
        });
    }, 10);
    window.testPad.buttons[0] = { pressed: true, value: 1 };
  });
  await page.waitForFunction(() =>
    window.soccerLab.snapshot.events.some((e) => e.type === "pass-start"),
  );
  await page.evaluate(() => {
    window.testPad.buttons[0] = { pressed: false, value: 0 };
  });
  await page.waitForFunction(() =>
    window.soccerLab.snapshot.events.some((e) => e.type === "pass-contact"),
  );
  await page.waitForTimeout(200);
  const samples = await page.evaluate(() => {
    clearInterval(window.contactTimer);
    return window.contactSamples;
  });
  writeFileSync(
    "test-results/motion-contact.json",
    JSON.stringify(samples, null, 2),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: detailed character, synthetic analog walk/run/sprint/stop and authoritative pass.",
    samples,
  );
} catch (error) {
  console.log(
    "Diagnostics",
    errors,
    await page.evaluate(() => window.soccerLab),
  );
  await page.screenshot({ path: "test-results/motion-failure.png" });
  throw error;
} finally {
  await browser.close();
}
