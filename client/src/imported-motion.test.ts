import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as pc from "playcanvas";
const bytes = readFileSync("client/public/assets/footballer-animated.glb");
const length = bytes.readUInt32LE(12),
  gltf = JSON.parse(bytes.subarray(20, 20 + length).toString()),
  bin = bytes.subarray(28 + length);
function values(index: number) {
  const a = gltf.accessors[index],
    v = gltf.bufferViews[a.bufferView],
    size = ({ SCALAR: 1, VEC3: 3, VEC4: 4 } as Record<string, number>)[a.type];
  return Array.from({ length: a.count }, (_, i) =>
    Array.from({ length: size }, (_, k) =>
      bin.readFloatLE(
        (v.byteOffset ?? 0) + (a.byteOffset ?? 0) + (i * size + k) * 4,
      ),
    ),
  );
}
test("Imported locomotion and soccer takes contain finite normalized motion on the existing rig", () => {
  assert.deepEqual(
    gltf.animations.map((a: { name: string }) => a.name),
    ["idle", "walk", "run", "sprint", "soccer-kick-a", "soccer-kick-b"],
  );
  for (const a of gltf.animations) {
    let changing = 0;
    for (const c of a.channels) {
      const sampler = a.samplers[c.sampler],
        frames = values(sampler.output),
        times = values(sampler.input).flat();
      assert.ok(times.at(-1)! > 0);
      assert.equal(frames.length, times.length);
      assert.ok(times.every((t, i) => i === 0 || t > times[i - 1]));
      assert.ok(frames.flat().every(Number.isFinite));
      if (c.target.path === "rotation") {
        assert.ok(frames.every((q) => Math.abs(Math.hypot(...q) - 1) < 1e-5));
        const first = frames[0];
        if (
          frames.some((q) =>
            q.some(
              (v, i) =>
                Math.abs(v - first[i]) > (a.name === "idle" ? 0.002 : 0.05),
            ),
          )
        )
          changing++;
      }
    }
    assert.ok(changing >= 5, `${a.name} must animate multiple joints`);
  }
});
test("Retargeted loops do not translate the player across the pitch or jump at the loop seam", () => {
  for (const a of gltf.animations.filter(
    (a: { name: string }) => !a.name.startsWith("soccer-"),
  )) {
    const c = a.channels.find(
      (c: { target: { path: string } }) => c.target.path === "translation",
    );
    assert.equal(gltf.nodes[c.target.node].name, "root");
    const positions = values(a.samplers[c.sampler].output);
    assert.ok(
      positions.every((p) => Math.abs(p[0]) < 0.2 && Math.abs(p[2]) < 0.35),
    );
    const first = positions[0],
      last = positions.at(-1)!;
    assert.ok(
      Math.hypot(...first.map((v, i) => v - last[i])) < 0.02,
      `${a.name} translation seam`,
    );
    assert.ok(
      positions.every((p) => p[1] > 0.4 && p[1] < 1.2),
      `${a.name} root height`,
    );
  }
});

test("Recorded shot contact frames put the right boot near a stationary reachable ball", () => {
  for (const a of gltf.animations.filter((a: { name: string }) =>
    a.name.startsWith("soccer-"),
  )) {
    const nodes = gltf.nodes.map(
      (n: { name: string; translation?: number[] }) => {
        const node = new pc.Entity(n.name);
        if (n.translation)
          node.setLocalPosition(...(n.translation as [number, number, number]));
        return node;
      },
    );
    gltf.nodes.forEach((n: { children?: number[] }, i: number) =>
      n.children?.forEach((c) => nodes[i].addChild(nodes[c])),
    );
    for (const c of a.channels) {
      const sampler = a.samplers[c.sampler];
      const times = values(sampler.input).flat();
      const i = times.findIndex((t) => Math.abs(t - 0.3) < 1e-6);
      assert.ok(i >= 0, "Contact frame must be explicitly sampled");
      const v = values(sampler.output)[i];
      if (c.target.path === "rotation")
        nodes[c.target.node].setLocalRotation(
          new pc.Quat(...(v as [number, number, number, number])),
        );
      else
        nodes[c.target.node].setLocalPosition(
          ...(v as [number, number, number]),
        );
    }
    const toe =
      nodes[
        gltf.nodes.findIndex((n: { name: string }) => n.name === "toe2-1.R")
      ].getPosition();
    assert.ok(
      Math.hypot(toe.x, toe.y - 0.11, toe.z - 0.65) < 0.13,
      `${a.name}: reachable contact`,
    );
    const ankle =
      nodes[
        gltf.nodes.findIndex((n: { name: string }) => n.name === "foot.L")
      ].getPosition();
    assert.ok(
      ankle.y > 0.05 && ankle.y < 0.16,
      `${a.name}: support foot height`,
    );
  }
});
