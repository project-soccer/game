import test from "node:test";
import assert from "node:assert/strict";
import {
  BALL_RADIUS,
  createRoster,
  neutral,
} from "../packages/game-core/src/index.ts";
import {
  Simulation,
  initPhysics,
} from "../packages/game-core/src/simulation.ts";
await initPhysics();

test("Squad roster has three outfield footballers and one keeper per team", () => {
  const roster = createRoster("squad");
  assert.equal(roster.length, 8);
  for (const team of [0, 1]) {
    assert.equal(
      roster.filter((p) => p.team === team && p.role === "outfield").length,
      3,
    );
    assert.equal(
      roster.filter((p) => p.team === team && p.role === "goalkeeper").length,
      1,
    );
  }
});

test("Squad switching cycles only outfield players and assigns opposing teams", () => {
  const sim = new Simulation("team", "squad");
  try {
    sim.addController("a");
    sim.addController("b");
    assert.equal(sim.snapshot().controllers.b.player, 4);
    for (const [index, expected] of [1, 2, 0, 1].entries()) {
      sim.enqueue("a", { ...neutral(index + 1, index), switch: true });
      sim.step();
      assert.equal(sim.snapshot().controllers.a.player, expected);
    }
    sim.reset();
    assert.equal(sim.snapshot().controllers.a.player, 0);
    assert.equal(sim.snapshot().controllers.b.player, 4);
  } finally {
    sim.dispose();
  }
});

test("Squad AI offers width and cover without moving the human's player", () => {
  const sim = new Simulation("team", "squad");
  try {
    sim.addController("a");
    sim.addController("b");
    const start = sim.snapshot();
    for (let n = 0; n < 30; n++) sim.step();
    assert.equal(sim.players[0].x, start.players[0].x);
    assert.equal(sim.players[0].z, start.players[0].z);
    assert.ok(sim.players[1].x !== start.players[1].x);
    assert.ok(sim.players[1].z < -4 && sim.players[2].z > 4);
    assert.equal(sim.owner, 0);
  } finally {
    sim.dispose();
  }
});

test("A requested pass in squad training preserves the selected off-ball footballer", () => {
  const sim = new Simulation("team", "squad");
  try {
    sim.addController("a");
    sim.addController("b");
    sim.enqueue("a", { ...neutral(1), switch: true });
    sim.step();
    sim.enqueue("a", { ...neutral(2, 1), pass: true });
    for (let n = 0; n < 100; n++) sim.step();
    assert.ok(
      sim.events.some((e) => e.type === "pass-contact" && e.actor === 0),
    );
    assert.equal(sim.snapshot().controllers.a.player, 1);
    assert.equal(sim.snapshot().controllers.a.assignment, 1);
  } finally {
    sim.dispose();
  }
});

test("Keeper parries a fast shot using swept contact, without awarding a goal", () => {
  const sim = new Simulation("team", "squad");
  try {
    sim.owner = null;
    sim.ball.setTranslation({ x: 17.4, y: 0.7, z: 0 }, true);
    sim.ball.setLinvel({ x: 100, y: 0, z: 0 }, true);
    sim.step();
    assert.ok(
      sim.events.some((e) => e.type === "keeper-parry" && e.actor === 7),
    );
    assert.ok(sim.ball.linvel().x < 0);
    assert.deepEqual(sim.goals, [0, 0]);
  } finally {
    sim.dispose();
  }
});

test("Keeper controls a slow low shot and distributes through a normal pass", () => {
  const sim = new Simulation("team", "squad");
  try {
    sim.addController("a");
    sim.addController("b");
    sim.owner = null;
    sim.ball.setTranslation({ x: 17.65, y: BALL_RADIUS + 0.02, z: 0 }, true);
    sim.ball.setLinvel({ x: 5, y: 0, z: 0 }, true);
    for (let n = 0; n < 6; n++) sim.step();
    assert.equal(sim.owner, 7);
    assert.ok(sim.events.some((e) => e.type === "keeper-control"));
    for (let n = 0; n < 210; n++) sim.step();
    assert.ok(
      sim.events.some((e) => e.type === "pass-contact" && e.actor === 7),
    );
    assert.equal(
      sim.snapshot().controllers.b.player,
      4,
      "keeper must never take human control",
    );
  } finally {
    sim.dispose();
  }
});

test("Keeper cannot reach a high or wide shot", () => {
  for (const [y, z] of [
    [3, 0],
    [0.2, 3.5],
  ]) {
    const sim = new Simulation("team", "squad");
    try {
      sim.owner = null;
      sim.ball.setTranslation({ x: 17.4, y, z }, true);
      sim.ball.setLinvel({ x: 28, y: 0, z: 0 }, true);
      for (let n = 0; n < 8; n++) sim.step();
      assert.equal(
        sim.events.filter((e) => e.type.startsWith("keeper-")).length,
        0,
      );
    } finally {
      sim.dispose();
    }
  }
});

test("Squad individual mode forbids switches and long AI play remains bounded", () => {
  const sim = new Simulation("individual", "squad");
  try {
    sim.addController("a");
    sim.enqueue("a", { ...neutral(1), switch: true });
    for (let n = 0; n < 7200; n++) {
      sim.step();
      if (n % 600 === 0) sim.reset();
      const s = sim.snapshot();
      assert.equal(s.controllers.a.player, 0);
      assert.ok(
        s.players.every(
          (p) =>
            Number.isFinite(p.x) &&
            Number.isFinite(p.z) &&
            Math.abs(p.x) < 20 &&
            Math.abs(p.z) < 13,
        ),
      );
      assert.ok(Number.isFinite(s.ball.x) && Number.isFinite(s.ball.y));
    }
  } finally {
    sim.dispose();
  }
});
