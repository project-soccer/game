import test from "node:test";
import assert from "node:assert/strict";
import {
  DT,
  BALL_RADIUS,
  crossedGoal,
  neutral,
  parseInput,
} from "../packages/game-core/src/index.ts";
import {
  Simulation,
  initPhysics,
} from "../packages/game-core/src/simulation.ts";
await initPhysics();
test("Ball snapshots expose physical rotation and reset it without sharing mutable state", () => {
  const sim = new Simulation();
  try {
    sim.ball.setTranslation({ x: 0, y: 2, z: 0 }, true);
    sim.ball.setAngvel({ x: 5, y: 1, z: 0 }, true);
    for (let i = 0; i < 12; i++) sim.step();
    const q = sim.snapshot().ball.rotation;
    assert.ok(Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) < 1e-5);
    assert.ok(Math.abs(q.x) > 0.1);
    q.x = 999;
    assert.notEqual(sim.snapshot().ball.rotation.x, 999);
    sim.reset();
    assert.deepEqual(sim.snapshot().ball.rotation, { x: 0, y: 0, z: 0, w: 1 });
    assert.deepEqual({ ...sim.ball.angvel() }, { x: 0, y: 0, z: 0 });
  } finally {
    sim.dispose();
  }
});
function fixture() {
  const sim = new Simulation();
  sim.addController("a");
  sim.addController("b");
  return sim;
}
test("Reject malformed input and normalize diagonals", () => {
  assert.equal(parseInput({ ...neutral(1), x: NaN }), null);
  assert.equal(parseInput({ ...neutral(1), x: Infinity }), null);
  assert.equal(parseInput({ ...neutral(1), seq: 1.5 }), null);
  assert.equal(parseInput({ ...neutral(1), charge: "yes" }), null);
  assert.equal(parseInput({ ...neutral(1), x: 2 }), null);
  const i = parseInput({ ...neutral(1), x: 1, z: 1 })!;
  assert.ok(Math.abs(Math.hypot(i.x, i.z) - 1) < 1e-8);
});
test("Input bursts cannot buy movement or control the opponent", () => {
  const sim = fixture();
  try {
    const before = sim.players[0].x;
    for (let seq = 1; seq <= 100; seq++)
      sim.enqueue("a", { ...neutral(seq), x: 1, sprint: true });
    sim.step();
    assert.ok(sim.players[0].x - before <= 7 * DT);
    assert.equal(sim.players[2].x, 5);
    assert.equal(sim.enqueue("a", { ...neutral(100), x: 1 }), false);
    assert.equal(sim.enqueue("intruder", neutral(1)), false);
  } finally {
    sim.dispose();
  }
});
test("Pass contacts once at the action tick and invalidates stale control inputs", () => {
  const sim = fixture();
  try {
    sim.players[0].facing = Math.atan2(8, -3);
    sim.enqueue("a", { ...neutral(1), pass: true });
    for (let i = 0; i < 10; i++) sim.step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 0);
    sim.step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 1);
    const c = sim.snapshot().controllers.a;
    assert.equal(c.player, 1);
    assert.equal(c.assignment, 1);
    assert.equal(sim.enqueue("a", { ...neutral(2, 0), x: 1 }), false);
    for (let i = 0; i < 50; i++) sim.step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 1);
  } finally {
    sim.dispose();
  }
});
test("A ball lost during wind-up produces a miss, not a remote kick", () => {
  const sim = fixture();
  try {
    sim.enqueue("a", { ...neutral(1), release: true });
    sim.step();
    sim.ball.setTranslation({ x: 10, y: BALL_RADIUS, z: 10 }, true);
    for (let i = 0; i < 20; i++) sim.step();
    assert.equal(sim.events.filter((e) => e.type === "shot-contact").length, 0);
    assert.equal(sim.events.filter((e) => e.type === "shot-miss").length, 1);
  } finally {
    sim.dispose();
  }
});
test("Individual mode forbids switching and stale input times out", () => {
  const sim = new Simulation("individual");
  try {
    sim.addController("a");
    sim.enqueue("a", { ...neutral(1), switch: true, x: 1, charge: true });
    for (let i = 0; i < 100; i++) sim.step();
    assert.equal(sim.snapshot().controllers.a.player, 0);
    assert.equal(sim.players[0].charge, 0);
    assert.ok(Math.abs(sim.players[0].vx) < 1e-8);
  } finally {
    sim.dispose();
  }
});
test("A goal requires whole-ball crossing inside the opening", () => {
  assert.equal(
    crossedGoal({ x: 19.8, y: 0.2, z: 0 }, { x: 20.05, y: 0.2, z: 0 }),
    null,
  );
  assert.equal(
    crossedGoal({ x: 19.8, y: 0.2, z: 0 }, { x: 20.3, y: 0.2, z: 0 }),
    0,
  );
  assert.equal(
    crossedGoal({ x: -19.8, y: 0.2, z: 0 }, { x: -20.3, y: 0.2, z: 0 }),
    1,
  );
  assert.equal(
    crossedGoal({ x: 19.8, y: 2, z: 0 }, { x: 20.3, y: 2, z: 0 }),
    null,
  );
  assert.equal(
    crossedGoal({ x: 19.8, y: 0.2, z: 2 }, { x: 20.3, y: 0.2, z: 2 }),
    null,
  );
});
test("World survives repeated resets and bounded player/ball movement", () => {
  const sim = fixture();
  try {
    for (let n = 0; n < 1800; n++) {
      const c = sim.snapshot().controllers.a;
      sim.enqueue("a", {
        ...neutral(n + 1, c.assignment),
        x: Math.sin(n / 90),
        z: Math.cos(n / 90),
        sprint: true,
      });
      sim.step();
      if (n % 300 === 0) sim.reset();
      const state = sim.snapshot();
      assert.ok(Number.isFinite(state.ball.x));
      assert.ok(
        state.players.every(
          (p) =>
            Number.isFinite(p.x) && Math.abs(p.x) < 20 && Math.abs(p.z) < 13,
        ),
      );
    }
    assert.equal(sim.snapshot().controllers.a.assignment >= 6, true);
  } finally {
    sim.dispose();
  }
});
test("Simultaneous kick windows cannot apply two impulses on one tick", () => {
  const sim = fixture();
  try {
    const b = sim.ball.translation();
    for (const id of [0, 2]) {
      const p = sim.players[id];
      p.x = b.x - 0.65;
      p.z = id === 0 ? -0.25 : 0.25;
      p.facing = Math.atan2(b.x - p.x, b.z - p.z);
      p.action = {
        name: "shot",
        start: 0,
        contact: 1,
        end: 40,
        done: false,
        dx: Math.sin(p.facing),
        dz: Math.cos(p.facing),
        power: 0.5,
        target: null,
      };
    }
    sim.step();
    assert.equal(sim.events.filter((e) => e.type === "shot-contact").length, 1);
  } finally {
    sim.dispose();
  }
});
