import test from "node:test";
import assert from "node:assert/strict";
import {
  analogStick,
  createRoster,
  DT,
  movePlayer,
  neutral,
} from "../packages/game-core/src/index.ts";
import {
  Simulation,
  initPhysics,
} from "../packages/game-core/src/simulation.ts";
await initPhysics();
test("Radial stick filtering removes drift and preserves proportional diagonal input", () => {
  assert.deepEqual(analogStick(0.08, -0.08), { x: 0, z: 0 });
  assert.deepEqual(analogStick(NaN, 1), { x: 0, z: 0 });
  const low = analogStick(0.1401, 0),
    mid = analogStick(0.57, 0),
    full = analogStick(1, 1);
  assert.ok(low.x > 0 && low.x < 0.001);
  assert.ok(Math.abs(mid.x - 0.5) < 1e-12);
  assert.ok(Math.abs(Math.hypot(full.x, full.z) - 1) < 1e-12);
  assert.equal(full.x, full.z);
});
test("Motion study supports distinct walking, running and sprint speeds, then stops without gait drift", () => {
  const speeds = [];
  for (const [x, sprint] of [
    [0.25, false],
    [1, false],
    [1, true],
  ] as const) {
    const p = createRoster("motion")[0];
    for (let n = 0; n < 60; n++) movePlayer(p, { x, z: 0, sprint });
    speeds.push(Math.hypot(p.vx, p.vz));
    for (let n = 0; n < 30; n++) movePlayer(p, neutral());
    assert.equal(Math.hypot(p.vx, p.vz), 0);
    const gait = p.gait;
    for (let n = 0; n < 60; n++) movePlayer(p, neutral());
    assert.equal(p.gait, gait);
  }
  assert.ok(speeds[0] > 0.5 && speeds[0] < 2);
  assert.ok(Math.abs(speeds[1] - 4.8) < 1e-9);
  assert.ok(Math.abs(speeds[2] - 7) < 1e-9);
});
test("Reversal decelerates and rotates within the turn limit instead of snapping", () => {
  const p = createRoster("motion")[0];
  for (let n = 0; n < 40; n++) movePlayer(p, { x: 1, z: 0, sprint: false });
  const facing = p.facing,
    vx = p.vx;
  movePlayer(p, { x: -1, z: 0, sprint: false });
  assert.ok(Math.abs(p.facing - facing) <= 9 * DT + 1e-12);
  assert.ok(p.vx < vx && p.vx > 0);
  for (let n = 0; n < 90; n++) movePlayer(p, { x: -1, z: 0, sprint: false });
  assert.ok(p.vx < -4.5);
});
test("Solo study rejects a second human and switching preserves the control assignment", () => {
  const sim = new Simulation("team", "motion");
  try {
    sim.addController("a");
    assert.throws(() => sim.addController("b"), /full/);
    sim.enqueue("a", { ...neutral(1), switch: true });
    sim.step();
    assert.equal(sim.players.length, 1);
    assert.equal(sim.snapshot().controllers.a.assignment, 0);
  } finally {
    sim.dispose();
  }
});
test("Motion dribble announces touches before impulses and snapshots do not share touch state", () => {
  const sim = new Simulation("team", "motion");
  try {
    sim.addController("a");
    let observed = 0;
    for (let seq = 1; seq <= 120; seq++) {
      sim.enqueue("a", { ...neutral(seq), x: 0.5 });
      sim.step();
      const p = sim.players[0],
        t = p.touch;
      assert.ok(Number.isFinite(sim.ball.translation().x));
      if (t && t.start === sim.tick) {
        assert.equal(t.contact - t.start, 6);
        observed++;
      }
      if (t) {
        const snapshot = sim.snapshot();
        snapshot.players[0].touch!.x = 12345;
        assert.notEqual(t.x, 12345);
      }
    }
    assert.ok(observed >= 3);
    assert.equal(sim.owner, 0);
    sim.reset();
    assert.equal(sim.players[0].touch, null);
    sim.enqueue("a", { ...neutral(121, 1), pass: true });
    for (let n = 0; n < 20; n++) sim.step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 1);
    assert.equal(sim.players[0].touch, null);
  } finally {
    sim.dispose();
  }
});
