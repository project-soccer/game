import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as pc from "playcanvas";
import { CharacterMotion } from "./character-motion.ts";
import { createRoster, DT } from "../../packages/game-core/src/index.ts";
function character(facing = 0) {
  const bytes = readFileSync("client/public/assets/footballer-detail.glb");
  const gltf = JSON.parse(
    bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
  );
  const nodes = gltf.nodes.map(
    (n: { name: string; translation?: number[] }) => {
      const e = new pc.Entity(n.name);
      if (n.translation)
        e.setLocalPosition(...(n.translation as [number, number, number]));
      return e;
    },
  );
  gltf.nodes.forEach((n: { children?: number[] }, i: number) =>
    n.children?.forEach((c) => nodes[i].addChild(nodes[c])),
  );
  const holder = new pc.Entity("holder");
  holder.addChild(nodes[0]);
  holder.setPosition(-5, 0, 0);
  holder.setEulerAngles(0, (facing * 180) / Math.PI, 0);
  return {
    holder,
    model: nodes[0] as pc.Entity,
    motion: new CharacterMotion(nodes[0]),
  };
}
test("Detailed rig places the kicking foot near a reachable ball at server contact", () => {
  for (const facing of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const { holder, motion } = character(facing),
      p = createRoster("motion")[0];
    p.facing = facing;
    holder.setPosition(p.x, 0, p.z);
    holder.setEulerAngles(0, (facing * 180) / Math.PI, 0);
    p.action = {
      name: "pass",
      start: 0,
      contact: 10,
      end: 32,
      done: false,
      dx: Math.sin(facing),
      dz: Math.cos(facing),
      power: 0,
      target: null,
    };
    const ball = {
      x: p.x + Math.sin(facing) * 0.6,
      y: 0.11,
      z: p.z + Math.cos(facing) * 0.6,
      vx: 0,
      vy: 0,
      vz: 0,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    for (let t = 0; t <= 10; t++) motion.update(p, t, DT, ball, 0);
    assert.ok(
      motion.contactError < 0.18,
      `facing ${facing}: contact error ${motion.contactError}`,
    );
  }
});
