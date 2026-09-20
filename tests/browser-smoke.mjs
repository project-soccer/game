import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
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
const pages = [];
mkdirSync("test-results", { recursive: true });
try {
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    pages.push(page);
  }
  const [a, b] = pages;
  await a.goto(process.env.CLIENT_URL ?? "http://127.0.0.1:5173/");
  await a.waitForFunction(() => window.soccerLab?.rigsReady === 4);
  await a.screenshot({ path: "test-results/lobby.png" });
  await a.getByRole("button", { name: "Enter the practice pitch" }).click();
  await a.waitForFunction(() => !!window.soccerLab?.snapshot);
  const room = await a.evaluate(() => window.soccerLab.roomId);
  await b.goto(
    `${process.env.CLIENT_URL ?? "http://127.0.0.1:5173/"}?room=${room}`,
  );
  await b.getByRole("button", { name: "Join pitch" }).click();
  await b.waitForFunction(
    () =>
      Object.keys(window.soccerLab?.snapshot?.controllers ?? {}).length === 2,
  );
  await a.bringToFront();
  const start = await a.evaluate(() => window.soccerLab.predicted.x);
  await a.keyboard.down("KeyD");
  await a.waitForTimeout(400);
  const pose = await a.evaluate(() => window.soccerLab.poses);
  assert.ok(
    pose.some((p) => p.state === "run" && Math.abs(p.leg) > 0.01),
    "skeletal locomotion must animate",
  );
  await a.keyboard.up("KeyD");
  await a.waitForFunction((x) => window.soccerLab.predicted.x > x + 0.3, start);
  await a.getByRole("button", { name: "Reset the exercise" }).click();
  await a.waitForTimeout(200);
  await a.keyboard.down("KeyK");
  await a.waitForTimeout(400);
  await a.keyboard.up("KeyK");
  await a.waitForFunction(() =>
    window.soccerLab.snapshot.events.some((e) => e.type === "shot-contact"),
  );
  await b.waitForFunction(() =>
    window.soccerLab.snapshot.events.some((e) => e.type === "shot-contact"),
  );
  // Wait out the reset cooldown, then exercise the off-ball path through real inputs.
  await a.waitForTimeout(1100);
  await a.getByRole("button", { name: "Reset the exercise" }).click();
  await a.waitForFunction(
    () =>
      window.soccerLab.snapshot.owner === 0 &&
      window.soccerLab.snapshot.controllers[window.soccerLab.sessionId]
        .player === 0,
  );
  await a.keyboard.press("KeyQ");
  await a.waitForFunction(
    () =>
      window.soccerLab.snapshot.controllers[window.soccerLab.sessionId]
        .player === 1,
  );
  await a
    .getByText("Off the ball · move into space", { exact: false })
    .waitFor();
  await a.keyboard.down("KeyS");
  await a.waitForTimeout(300);
  await a.keyboard.up("KeyS");
  await a.waitForTimeout(300);
  await a.screenshot({ path: "test-results/off-ball.png" });
  await a.keyboard.press("KeyJ");
  await a.waitForFunction(() => window.soccerLab.snapshot.owner === 1);
  await b.waitForFunction(() =>
    window.soccerLab.snapshot.events.some(
      (e) => e.type === "pass-contact" && e.actor === 0,
    ),
  );
  assert.equal(
    await a.evaluate(
      () =>
        window.soccerLab.snapshot.controllers[window.soccerLab.sessionId]
          .player,
    ),
    1,
  );
  await a.screenshot({ path: "test-results/practice.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: two browser contexts, animated pitch, movement, shared shot, off-ball switch/run/request, AI pass and controlled reception.",
  );
} finally {
  await browser.close();
}
