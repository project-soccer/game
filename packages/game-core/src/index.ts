export const PROTOCOL = "soccer-lab-4";
export const DT = 1 / 60;
export const BALL_RADIUS = 0.11;
export const PITCH = {
  halfLength: 20,
  halfWidth: 13,
  goalHalfWidth: 2,
  goalHeight: 2,
};
export type Mode = "team" | "individual";
export type Scenario = "technical" | "squad" | "motion";
export type ActionName = "pass" | "shot" | "tackle" | "receive";
export type Input = {
  seq: number;
  assignment: number;
  x: number;
  z: number;
  sprint: boolean;
  pass: boolean;
  charge: boolean;
  release: boolean;
  tackle: boolean;
  switch: boolean;
  cancel: boolean;
};
export const neutral = (seq = 0, assignment = 0): Input => ({
  seq,
  assignment,
  x: 0,
  z: 0,
  sprint: false,
  pass: false,
  charge: false,
  release: false,
  tackle: false,
  switch: false,
  cancel: false,
});
export function parseInput(value: unknown): Input | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(v.seq) ||
    Number(v.seq) < 1 ||
    Number(v.seq) > 2147483647 ||
    !Number.isSafeInteger(v.assignment) ||
    Number(v.assignment) < 0
  )
    return null;
  if (
    typeof v.x !== "number" ||
    typeof v.z !== "number" ||
    !Number.isFinite(v.x) ||
    !Number.isFinite(v.z) ||
    Math.abs(v.x) > 1 ||
    Math.abs(v.z) > 1
  )
    return null;
  const keys = [
    "sprint",
    "pass",
    "charge",
    "release",
    "tackle",
    "switch",
    "cancel",
  ] as const;
  if (keys.some((k) => typeof v[k] !== "boolean")) return null;
  const n = Math.max(1, Math.hypot(v.x, v.z));
  return {
    seq: Number(v.seq),
    assignment: Number(v.assignment),
    x: v.x / n,
    z: v.z / n,
    ...Object.fromEntries(keys.map((k) => [k, v[k]])),
  } as Input;
}
export type Action = {
  name: ActionName;
  start: number;
  contact: number;
  end: number;
  done: boolean;
  dx: number;
  dz: number;
  power: number;
  target: number | null;
};
export type BallTouch = {
  start: number;
  contact: number;
  end: number;
  x: number;
  y: number;
  z: number;
  foot: "L" | "R";
};
export type Footballer = {
  id: number;
  team: number;
  role: "outfield" | "goalkeeper";
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number;
  charge: number;
  action: Action | null;
  receiveUntil: number;
  touch: BallTouch | null;
  gait: number;
  motion: boolean;
};
export type Controller = {
  team: number;
  player: number;
  assignment: number;
  ack: number;
};
export type LabEvent = {
  id: number;
  tick: number;
  type: string;
  actor: number;
};
export type Snapshot = {
  protocol: string;
  tick: number;
  players: Footballer[];
  ball: { x: number; y: number; z: number; vx: number; vy: number; vz: number };
  owner: number | null;
  controllers: Record<string, Controller>;
  events: LabEvent[];
  goals: number[];
  mode: Mode;
  scenario: Scenario;
};
export function createRoster(scenario: Scenario): Footballer[] {
  const positions =
    scenario === "squad"
      ? [
          [-5, 0, 0],
          [-1, -6, 0],
          [-8, 6, 0],
          [-18.5, 0, 0],
          [5, 0, 1],
          [1, 6, 1],
          [8, -6, 1],
          [18.5, 0, 1],
        ]
      : [
          [-5, 0, 0],
          [3, -3, 0],
          [5, 4, 1],
          [-3, 5, 1],
        ];
  return (scenario === "motion" ? [[-5, 0, 0]] : positions).map(
    ([x, z, team], id) => ({
      id,
      team,
      role:
        scenario === "squad" && (id === 3 || id === 7)
          ? "goalkeeper"
          : "outfield",
      x,
      z,
      vx: 0,
      vz: 0,
      facing: team === 0 ? Math.PI / 2 : -Math.PI / 2,
      charge: 0,
      action: null,
      receiveUntil: 0,
      touch: null,
      gait: 0,
      motion: scenario === "motion",
    }),
  );
}
export function analogStick(x: number, z: number, deadZone = 0.14) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return { x: 0, z: 0 };
  const radius = Math.hypot(x, z),
    threshold = Math.max(0, Math.min(0.4, deadZone));
  if (radius <= threshold) return { x: 0, z: 0 };
  const magnitude = Math.min(1, (radius - threshold) / (1 - threshold));
  return { x: (x / radius) * magnitude, z: (z / radius) * magnitude };
}
export const strideLength = (speed: number) => 1.2 + Math.min(7, speed) * 0.23;
export function movePlayer(
  p: Footballer,
  input: Pick<Input, "x" | "z" | "sprint">,
  dt = DT,
) {
  const beforeX = p.x,
    beforeZ = p.z;
  const n = Math.max(1, Math.hypot(input.x, input.z));
  let speed = p.action ? 1.6 : input.sprint ? 7 : 4.8;
  let tx = (input.x / n) * speed,
    tz = (input.z / n) * speed;
  if (p.motion && !p.action && Math.hypot(input.x, input.z) > 0.01) {
    const desired = Math.atan2(input.x, input.z);
    const diff = Math.atan2(
      Math.sin(desired - p.facing),
      Math.cos(desired - p.facing),
    );
    const turn = (input.sprint ? 6 : 9) * dt;
    p.facing += Math.max(-turn, Math.min(turn, diff));
    const magnitude = Math.min(1, Math.hypot(input.x, input.z));
    speed = input.sprint
      ? 7 * magnitude
      : magnitude < 0.55
        ? (magnitude / 0.55) * 2
        : 2 + ((magnitude - 0.55) / 0.45) * 2.8;
    speed *= 0.2 + 0.8 * Math.max(0, Math.cos(diff));
    tx = Math.sin(p.facing) * speed;
    tz = Math.cos(p.facing) * speed;
  }
  const ax = tx - p.vx,
    az = tz - p.vz,
    delta = Math.hypot(ax, az),
    max =
      (p.motion
        ? Math.hypot(tx, tz) < Math.hypot(p.vx, p.vz)
          ? 25
          : 16
        : 22) * dt;
  if (delta > 0) {
    const f = Math.min(1, max / delta);
    p.vx += ax * f;
    p.vz += az * f;
  }
  p.x = Math.max(-19.3, Math.min(19.3, p.x + p.vx * dt));
  p.z = Math.max(-12.3, Math.min(12.3, p.z + p.vz * dt));
  p.gait +=
    Math.hypot(p.x - beforeX, p.z - beforeZ) /
    strideLength(Math.hypot(p.vx, p.vz));
  if (!p.motion && !p.action && Math.hypot(input.x, input.z) > 0.1) {
    const desired = Math.atan2(input.x, input.z);
    const diff = Math.atan2(
      Math.sin(desired - p.facing),
      Math.cos(desired - p.facing),
    );
    const turn = (input.sprint ? 4.8 : 8) * dt;
    p.facing += Math.max(-turn, Math.min(turn, diff));
  }
}
export function crossedGoal(
  before: { x: number; y: number; z: number },
  after: { x: number; y: number; z: number },
): number | null {
  for (const sign of [-1, 1]) {
    const plane = sign * (PITCH.halfLength + BALL_RADIUS);
    if (sign * before.x < sign * plane && sign * after.x >= sign * plane) {
      const t = (plane - before.x) / (after.x - before.x);
      const y = before.y + (after.y - before.y) * t,
        z = before.z + (after.z - before.z) * t;
      if (
        Math.abs(z) + BALL_RADIUS < PITCH.goalHalfWidth &&
        y - BALL_RADIUS >= -0.02 &&
        y + BALL_RADIUS < PITCH.goalHeight
      )
        return sign === 1 ? 0 : 1;
    }
  }
  return null;
}
