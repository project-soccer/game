import type { Footballer } from "./index.ts";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

// Positioning only: movement, contact, and action timing still use shared rules.
export function squadTargets(
  players: Footballer[],
  owner: number | null,
  ball: { x: number; z: number },
  velocity: { x: number; z: number },
) {
  const targets = new Map<number, { x: number; z: number }>();
  for (const team of [0, 1]) {
    const direction = team === 0 ? 1 : -1;
    const outfield = players.filter(
      (p) => p.team === team && p.role === "outfield",
    );
    const possession = owner !== null && players[owner].team === team;
    const nearest = [...outfield].sort(
      (a, b) =>
        Math.hypot(a.x - ball.x, a.z - ball.z) -
          Math.hypot(b.x - ball.x, b.z - ball.z) || a.id - b.id,
    )[0];
    for (const [index, p] of outfield.entries()) {
      const lane = index === 0 ? 0 : index === 1 ? -6 : 6;
      if (!possession && p.id === nearest.id)
        targets.set(p.id, { x: ball.x, z: ball.z });
      else
        targets.set(p.id, {
          x: clamp(
            ball.x + direction * (possession ? (index === 0 ? -5 : 3) : -4),
            -16,
            16,
          ),
          z: clamp(ball.z * 0.35 + lane * (possession ? 1 : 0.65), -10.5, 10.5),
        });
    }
    const keeper = players.find(
      (p) => p.team === team && p.role === "goalkeeper",
    );
    if (keeper) {
      const x = -direction * 18.5;
      const time = Math.abs(velocity.x) > 0.1 ? (x - ball.x) / velocity.x : -1;
      const aim =
        time > 0 && time < 1.2 ? ball.z + velocity.z * time : ball.z * 0.3;
      targets.set(keeper.id, { x, z: clamp(aim, -1.7, 1.7) });
    }
  }
  return targets;
}
