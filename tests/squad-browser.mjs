import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
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
const errors = [];
const base = process.env.CLIENT_URL ?? "http://127.0.0.1:5173/";
mkdirSync("test-results", { recursive: true });
try {
  const a = await (
    await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  ).newPage();
  const b = await (
    await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  ).newPage();
  for (const page of [a, b]) {
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
  }
  await a.goto(base);
  for (const href of await a
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((nodes) => nodes.map((n) => n.href))) {
    const response = await a.request.get(href);
    assert.equal(response.status(), 200);
    assert.ok((await response.body()).length > 100);
  }
  await a.getByRole("button", { name: "Train with 3 + keeper" }).click();
  await a.waitForFunction(
    () =>
      window.soccerLab?.snapshot?.scenario === "squad" &&
      window.soccerLab.rigsReady === 8,
  );
  assert.equal(
    await a.evaluate(
      () =>
        window.soccerLab.snapshot.players.filter((p) => p.role === "goalkeeper")
          .length,
    ),
    2,
  );
  const room = await a.evaluate(() => window.soccerLab.roomId);
  await b.goto(`${base}?room=${room}`);
  await b.getByRole("button", { name: "Join pitch" }).click();
  await b.waitForFunction(
    () =>
      window.soccerLab.rigsReady === 8 &&
      Object.keys(window.soccerLab.snapshot.controllers).length === 2,
  );
  assert.equal(
    await b.evaluate(
      () =>
        window.soccerLab.snapshot.controllers[window.soccerLab.sessionId]
          .player,
    ),
    4,
  );
  await a.bringToFront();
  for (const id of [1, 2, 0]) {
    await a.waitForFunction(() => !window.soccerLab.predicted.action);
    await a.keyboard.press("KeyQ");
    await a.waitForFunction(
      (id) =>
        window.soccerLab.snapshot.controllers[window.soccerLab.sessionId]
          .player === id,
      id,
    );
  }
  const start = await a.evaluate(() => window.soccerLab.predicted.z);
  await a.keyboard.down("KeyS");
  await a.waitForFunction((z) => window.soccerLab.predicted.z > z + 0.3, start);
  await a.keyboard.up("KeyS");
  await a.screenshot({ path: "test-results/squad-training.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: favicon assets, two clients, eight animated footballers, two keeper roles, squad switching and human movement.",
  );
} finally {
  await browser.close();
}
