import test from "node:test";
import assert from "node:assert/strict";
import {
  BALL_RADIUS,
  neutral,
  type Input,
} from "../packages/game-core/src/index.ts";
import {
  Simulation,
  initPhysics,
} from "../packages/game-core/src/simulation.ts";

await initPhysics();
function setup() {
  const sim = new Simulation();
  sim.addController("a");
  sim.addController("b");
  let seq = 0;
  const step = (input: Partial<Input> = {}) => {
    const c = sim.snapshot().controllers.a;
    assert.ok(sim.enqueue("a", { ...neutral(++seq, c.assignment), ...input }));
    sim.step();
  };
  step({ switch: true });
  return { sim, step };
}

test("Switch away, position off the ball, request and receive without losing control", () => {
  const { sim, step } = setup();
  try {
    for (let n = 0; n < 180; n++) step(n < 20 ? { z: 1 } : {});
    assert.equal(sim.owner, 0, "unpressured AI carrier must retain possession");
    assert.equal(sim.players[0].x, -5);
    assert.ok(
      sim.players[1].z > -2.5,
      "the receiver can choose a different position",
    );
    const assignment = sim.snapshot().controllers.a.assignment;
    step({ pass: true });
    for (let n = 0; n < 180; n++) step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 1);
    assert.equal(
      sim.owner,
      1,
      "the physical ground pass reaches the waiting receiver",
    );
    assert.equal(sim.snapshot().controllers.a.player, 1);
    assert.equal(sim.snapshot().controllers.a.assignment, assignment);
  } finally {
    sim.dispose();
  }
});

test("AI can turn and pass to a caller behind it without teleporting the ball", () => {
  const { sim, step } = setup();
  try {
    sim.players[1].x = -11;
    sim.players[1].z = 0;
    step({ pass: true });
    let before = sim.ball.translation();
    for (let n = 0; n < 180; n++) {
      step();
      const after = sim.ball.translation();
      assert.ok(Math.hypot(after.x - before.x, after.z - before.z) < 0.5);
      before = after;
    }
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 1);
    assert.equal(sim.owner, 1);
  } finally {
    sim.dispose();
  }
});

test("An opponent in the lane can intercept a requested pass", () => {
  const { sim, step } = setup();
  try {
    sim.players[1].z = 0;
    sim.players[2].x = -0.5;
    sim.players[2].z = 0;
    step({ pass: true });
    for (let n = 0; n < 100; n++) step();
    assert.equal(sim.owner, 2);
    assert.equal(sim.snapshot().controllers.a.player, 1);
  } finally {
    sim.dispose();
  }
});

test("A committed pass does not home towards a receiver who changes direction", () => {
  const { sim, step } = setup();
  try {
    sim.players[1].z = 0;
    step({ pass: true });
    assert.equal(sim.players[0].action?.name, "pass");
    for (let n = 0; n < 120; n++) step({ z: 1 });
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 1);
    assert.notEqual(sim.owner, 1);
    assert.ok(Math.abs(sim.ball.translation().z) < 0.1);
  } finally {
    sim.dispose();
  }
});

for (const reason of ["possession", "switch", "disconnect", "focus"] as const) {
  test(`A pending AI pass is cancelled on ${reason} loss/change`, () => {
    const { sim, step } = setup();
    try {
      sim.players[1].z = 0;
      step({ pass: true });
      assert.equal(sim.players[0].action?.name, "pass");
      if (reason === "possession") {
        sim.owner = 2;
        sim.ball.setTranslation({ x: 5.6, y: BALL_RADIUS, z: 4 }, true);
      } else if (reason === "switch") step({ switch: true });
      else if (reason === "disconnect") sim.removeController("a");
      else step({ cancel: true });
      for (let n = 0; n < 100; n++) sim.step();
      assert.equal(
        sim.events.filter((e) => e.type === "pass-contact").length,
        0,
      );
      assert.equal(
        sim.events.filter((e) => e.type === "pass-request-cancelled").length,
        1,
      );
    } finally {
      sim.dispose();
    }
  });
}

test("Spam, excessive distance and opposing possession cannot force an AI pass", () => {
  const { sim, step } = setup();
  try {
    sim.players[1].x = 19;
    for (let n = 0; n < 30; n++) step({ pass: true });
    assert.equal(
      sim.events.filter((e) => e.type === "pass-request-unavailable").length,
      1,
    );
    assert.equal(sim.events.filter((e) => e.type === "pass-start").length, 0);
    sim.owner = 2;
    step({ pass: true });
    assert.equal(sim.events.filter((e) => e.type === "pass-start").length, 0);
  } finally {
    sim.dispose();
  }
});

test("A request cannot command a teammate controlled by another human", () => {
  const { sim, step } = setup();
  try {
    // The lab normally assigns opposing teams; exercise the future shared-team boundary.
    const other = sim.slots.get("b")!.controller;
    other.team = 0;
    other.player = 0;
    step({ pass: true });
    for (let n = 0; n < 100; n++) step();
    assert.equal(sim.events.filter((e) => e.type === "pass-start").length, 0);
    assert.equal(other.player, 0);
  } finally {
    sim.dispose();
  }
});

test("Requests expire rather than waiting indefinitely at an unusable distance", () => {
  const { sim, step } = setup();
  try {
    sim.players[1].x = -5;
    sim.players[1].z = -0.9;
    step({ pass: true });
    for (let n = 0; n < 100; n++) step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 0);
    assert.equal(
      sim.events.filter((e) => e.type === "pass-request-cancelled").length,
      1,
    );
  } finally {
    sim.dispose();
  }
});

test("Reset removes a requested pass before the contact window", () => {
  const { sim, step } = setup();
  try {
    sim.players[1].z = 0;
    step({ pass: true });
    sim.reset();
    for (let n = 0; n < 100; n++) step();
    assert.equal(sim.events.filter((e) => e.type === "pass-contact").length, 0);
    assert.equal(sim.owner, 0);
    assert.equal(sim.snapshot().controllers.a.player, 0);
  } finally {
    sim.dispose();
  }
});

test("Individual mode never lets a caller command another footballer", () => {
  const sim = new Simulation("individual");
  try {
    sim.addController("a");
    sim.owner = 1;
    sim.ball.setTranslation({ x: 3.6, y: BALL_RADIUS, z: -3 }, true);
    sim.enqueue("a", { ...neutral(1), pass: true });
    for (let n = 0; n < 100; n++) sim.step();
    assert.equal(sim.events.filter((e) => e.type === "pass-start").length, 0);
    assert.equal(sim.snapshot().controllers.a.player, 0);
  } finally {
    sim.dispose();
  }
});
