import * as pc from "playcanvas";
import {
  DT,
  strideLength,
  type Footballer,
  type Snapshot,
} from "@project-soccer/game-core";

/** Original procedural pose controller; no downloaded motion clips or physics authority. */
export class CharacterMotion {
  private bones = new Map<string, pc.GraphNode>();
  private rest = new Map<string, pc.Vec3>();
  private root: pc.GraphNode;
  private rootRest: pc.Vec3;
  private speed = 0;
  private lastFacing = 0;
  private lean = 0;
  contactError = 0;
  state = "idle";
  constructor(model: pc.Entity) {
    const inverse = model.getWorldTransform().clone().invert();
    for (const node of model.find(() => true)) {
      this.bones.set(node.name, node);
      this.rest.set(node.name, inverse.transformPoint(node.getPosition()));
    }
    this.root = this.bones.get("root")!;
    this.rootRest = this.root.getLocalPosition().clone();
  }
  private rotate(name: string, x = 0, y = 0, z = 0) {
    this.bones
      .get(name)
      ?.setLocalEulerAngles(
        (x * 180) / Math.PI,
        (y * 180) / Math.PI,
        (z * 180) / Math.PI,
      );
  }
  private leg(side: string, x: number, y: number, z: number, drop: number) {
    const hip = this.rest.get(`upperleg01.${side}`)!,
      knee = this.rest.get(`lowerleg01.${side}`)!,
      ankle = this.rest.get(`foot.${side}`)!;
    const a = Math.hypot(knee.y - hip.y, knee.z - hip.z),
      b = Math.hypot(ankle.y - knee.y, ankle.z - knee.z);
    const dy = y - (hip.y + drop),
      dz = z - hip.z;
    const d = Math.min(
      a + b - 0.003,
      Math.max(Math.abs(a - b) + 0.01, Math.hypot(dy, dz)),
    );
    const restHip = Math.atan2(-(knee.z - hip.z), -(knee.y - hip.y));
    const restCalf = Math.atan2(-(ankle.z - knee.z), -(ankle.y - knee.y));
    const absoluteHip =
      Math.atan2(-dz, -dy) -
      Math.acos(
        Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))),
      );
    const bend =
      Math.PI -
      Math.acos(
        Math.max(-1, Math.min(1, (a * a + b * b - d * d) / (2 * a * b))),
      );
    const hipAngle = absoluteHip - restHip,
      kneeAngle = absoluteHip + bend - restCalf - hipAngle;
    this.rotate(
      `upperleg01.${side}`,
      hipAngle,
      0,
      Math.atan2(x - ankle.x, -dy),
    );
    this.rotate(`lowerleg01.${side}`, kneeAngle);
    this.rotate(`foot.${side}`, -hipAngle - kneeAngle);
  }
  update(
    p: Footballer,
    tick: number,
    dt: number,
    ball: Snapshot["ball"],
    owner: number | null,
  ) {
    const actual = Math.hypot(p.vx, p.vz);
    this.speed += (actual - this.speed) * (1 - Math.exp(-dt * 12));
    const moving = Math.min(1, this.speed / 0.6),
      running = Math.min(1, Math.max(0, (this.speed - 1.8) / 3));
    const angle = Math.atan2(
      Math.sin(p.facing - this.lastFacing),
      Math.cos(p.facing - this.lastFacing),
    );
    this.lastFacing = p.facing;
    this.lean +=
      (Math.max(-0.14, Math.min(0.14, -angle * Math.min(1, actual / 4))) -
        this.lean) *
      (1 - Math.exp(-dt * 8));
    const action = p.action;
    const elapsed = action ? Math.max(0, (tick - action.start) * DT) : 0;
    const duration = action ? (action.end - action.start) * DT : 1;
    const actionWeight = action
      ? Math.sin(Math.min(1, elapsed / duration) * Math.PI)
      : 0;
    const drop = -0.035 - running * 0.085 - actionWeight * 0.09;
    this.root.setLocalPosition(
      this.rootRest.x,
      this.rootRest.y + drop + moving * 0.012 * Math.cos(p.gait * Math.PI * 4),
      this.rootRest.z,
    );
    this.rotate("spine04", 0.04 + running * 0.09, 0, this.lean);
    this.rotate(
      "spine01",
      0,
      Math.sin(p.gait * Math.PI * 2) * 0.04 * moving,
      0,
    );
    this.rotate("head", -0.025 - running * 0.035);
    const stance = 0.62 - running * 0.2,
      stride = strideLength(this.speed);
    const targets: Record<string, number[]> = {};
    for (const [side, offset, sign] of [
      ["L", 0, 1],
      ["R", 0.5, -1],
    ] as const) {
      const phase = (((p.gait + offset) % 1) + 1) % 1,
        rest = this.rest.get(`foot.${side}`)!;
      let z = 0,
        y = rest.y;
      if (phase < stance) z = stride * (stance / 2 - phase);
      else {
        const swing = (phase - stance) / (1 - stance),
          ease = swing * swing * (3 - 2 * swing);
        z = stride * stance * (ease - 0.5);
        y += Math.sin(swing * Math.PI) * (0.08 + running * 0.12);
      }
      targets[side] = [
        rest.x,
        rest.y + (y - rest.y) * moving,
        rest.z + z * moving,
      ];
      const arm = Math.sin((p.gait + offset) * Math.PI * 2) * 0.43 * moving;
      this.rotate(`upperarm01.${side}`, arm, 0, -sign * 0.55);
      this.rotate(`lowerarm01.${side}`, -0.14 - running * 0.5);
      for (let finger = 2; finger <= 5; finger++)
        for (let part = 1; part <= 3; part++)
          this.rotate(`finger${finger}-${part}.${side}`, 0.16, 0, 0);
    }
    if (action) {
      const contact = (action.contact - action.start) * DT;
      const localX =
        (ball.x - p.x) * Math.cos(p.facing) -
        (ball.z - p.z) * Math.sin(p.facing);
      const localZ =
        (ball.x - p.x) * Math.sin(p.facing) +
        (ball.z - p.z) * Math.cos(p.facing);
      const rest = this.rest.get("foot.R")!;
      // Freeze the target at the contact window: after the impulse the ball must travel freely.
      const progress = Math.min(1, elapsed / contact);
      const reach = progress * progress * progress;
      const recovery = Math.min(
        1,
        Math.max(0, (elapsed - contact) / (duration - contact)),
      );
      const kickZ =
        elapsed <= contact
          ? -0.18 * Math.sin(progress * Math.PI) +
            Math.min(0.58, localZ - 0.14) * reach
          : 0.46 * (1 - recovery);
      targets.R = [
        rest.x +
          (Math.max(-0.18, Math.min(0.18, localX)) - rest.x) *
            reach *
            (1 - recovery),
        rest.y +
          Math.sin(progress * Math.PI) * 0.09 +
          (elapsed > contact ? Math.sin(recovery * Math.PI) * 0.13 : 0),
        rest.z + kickZ,
      ];
      targets.L = [
        this.rest.get("foot.L")!.x,
        this.rest.get("foot.L")!.y,
        this.rest.get("foot.L")!.z,
      ];
      this.rotate("upperarm01.L", -0.32 * actionWeight, 0, -0.6);
      this.rotate("upperarm01.R", 0.28 * actionWeight, 0, 0.6);
    } else if (
      p.touch &&
      tick >= p.touch.start &&
      tick <= p.touch.end &&
      owner === p.id
    ) {
      const t = p.touch,
        side = t.foot;
      const progress =
        tick <= t.contact
          ? (tick - t.start) / (t.contact - t.start)
          : (t.end - tick) / (t.end - t.contact);
      const weight = Math.sin(
        (Math.max(0, Math.min(1, progress)) * Math.PI) / 2,
      );
      const x =
        (t.x - p.x) * Math.cos(p.facing) - (t.z - p.z) * Math.sin(p.facing);
      const z =
        (t.x - p.x) * Math.sin(p.facing) + (t.z - p.z) * Math.cos(p.facing);
      const rest = this.rest.get(`foot.${side}`)!;
      const goal = [
        Math.max(-0.2, Math.min(0.2, x)),
        Math.max(rest.y, Math.min(0.35, t.y + 0.02)),
        Math.max(-0.1, Math.min(0.55, z - 0.14)),
      ];
      targets[side] = targets[side].map((v, k) => v + (goal[k] - v) * weight);
    } else if (owner === p.id && this.speed < 0.2) {
      targets.R[2] += 0.08;
    }
    for (const side of ["L", "R"])
      this.leg(side, ...(targets[side] as [number, number, number]), drop);
    const toe = this.bones
      .get("foot.R")!
      .getWorldTransform()
      .transformPoint(new pc.Vec3(0, -0.02, 0.14));
    this.contactError = Math.hypot(
      toe.x - ball.x,
      toe.y - ball.y,
      toe.z - ball.z,
    );
    this.state =
      action?.name ??
      (this.speed > 5.2
        ? "sprint"
        : this.speed > 2.3
          ? "run"
          : this.speed > 0.15
            ? "walk"
            : "idle");
  }
}
