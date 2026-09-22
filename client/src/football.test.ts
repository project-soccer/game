import test from "node:test";
import assert from "node:assert/strict";
import { footballPanels } from "./football.ts";
import { BALL_RADIUS } from "@project-soccer/game-core";

test("Football has 12 black and 20 white spherical panels with outward-facing triangles", () => {
  const panels = footballPanels();
  assert.equal(panels.filter((p) => p.dark).length, 12);
  assert.equal(panels.filter((p) => !p.dark).length, 20);
  for (const p of panels) {
    for (let i = 0; i < p.positions.length; i += 3) {
      const radius = Math.hypot(...p.positions.slice(i, i + 3));
      assert.ok(radius <= BALL_RADIUS + 1e-8 && radius >= BALL_RADIUS - 0.0005);
    }
    for (let i = 0; i < p.indices.length; i += 3) {
      const [a, b, c] = p.indices
        .slice(i, i + 3)
        .map((n) => p.positions.slice(n * 3, n * 3 + 3));
      const u = b.map((v, k) => v - a[k]),
        v = c.map((v, k) => v - a[k]);
      const normal = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      assert.ok(normal.reduce((sum, value, k) => sum + value * a[k], 0) > 0);
    }
  }
});
