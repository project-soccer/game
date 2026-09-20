import RAPIER from "@dimforge/rapier3d-compat";
import {
  BALL_RADIUS,
  DT,
  PROTOCOL,
  crossedGoal,
  movePlayer,
  neutral,
  parseInput,
  type ActionName,
  type Controller,
  type Footballer,
  type Input,
  type LabEvent,
  type Mode,
  type Snapshot,
} from "./index.ts";
let initialization: Promise<void> | undefined;
export const initPhysics = () => (initialization ??= RAPIER.init());
type Slot = {
  controller: Controller;
  queue: Input[];
  last: Input;
  highest: number;
  silent: number;
};
export class Simulation {
  readonly world: RAPIER.World;
  readonly ball: RAPIER.RigidBody;
  readonly slots = new Map<string, Slot>();
  players: Footballer[] = [];
  tick = 0;
  owner: number | null = null;
  events: LabEvent[] = [];
  goals = [0, 0];
  private lastContactTick = -1;
  private nextEvent = 1;
  private touchTick = -100;
  private freeUntil = 0;
  private lastKicker = -1;
  constructor(readonly mode: Mode = "team") {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = DT;
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(25, 0.1, 18)
        .setTranslation(0, -0.1, 0)
        .setFriction(0.65)
        .setRestitution(0.45),
    );
    for (const x of [-20, 20]) {
      for (const z of [-2, 2])
        this.world.createCollider(
          RAPIER.ColliderDesc.cuboid(0.06, 1, 0.06)
            .setTranslation(x, 1, z)
            .setRestitution(0.7),
        );
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.06, 0.06, 2)
          .setTranslation(x, 2, 0)
          .setRestitution(0.7),
      );
    }
    this.ball = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(-4.35, BALL_RADIUS + 0.01, 0)
        .setCcdEnabled(true)
        .setLinearDamping(0.35)
        .setAngularDamping(0.5),
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.ball(BALL_RADIUS)
        .setMass(0.43)
        .setFriction(0.65)
        .setRestitution(0.45),
      this.ball,
    );
    this.reset();
  }
  private emit(type: string, actor: number) {
    this.events.push({ id: this.nextEvent++, tick: this.tick, type, actor });
    this.events = this.events.slice(-32);
  }
  reset() {
    this.players = [
      [-5, 0, 0],
      [3, -3, 0],
      [5, 4, 1],
      [-3, 5, 1],
    ].map(([x, z, team], id) => ({
      id,
      team,
      x,
      z,
      vx: 0,
      vz: 0,
      facing: team === 0 ? Math.PI / 2 : -Math.PI / 2,
      charge: 0,
      action: null,
      receiveUntil: 0,
    }));
    this.ball.setTranslation({ x: -4.35, y: BALL_RADIUS + 0.01, z: 0 }, true);
    this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.owner = 0;
    this.freeUntil = 0;
    this.lastKicker = -1;
    this.touchTick = this.tick - 20;
    for (const slot of this.slots.values()) {
      slot.controller.player = slot.controller.team * 2;
      slot.controller.assignment++;
      slot.queue = [];
      slot.last = neutral(slot.controller.ack, slot.controller.assignment);
    }
    this.emit("reset", -1);
  }
  addController(id: string) {
    if (this.slots.size >= 2) throw new Error("Laboratory is full");
    const team = [0, 1].find(
      (t) => ![...this.slots.values()].some((s) => s.controller.team === t),
    )!;
    this.slots.set(id, {
      controller: { team, player: team * 2, assignment: 0, ack: 0 },
      queue: [],
      last: neutral(),
      highest: 0,
      silent: 0,
    });
  }
  removeController(id: string) {
    this.slots.delete(id);
  }
  enqueue(id: string, value: unknown): boolean {
    const slot = this.slots.get(id),
      input = parseInput(value);
    if (
      !slot ||
      !input ||
      input.seq <= slot.highest ||
      input.seq > slot.highest + 1000 ||
      input.assignment !== slot.controller.assignment
    )
      return false;
    slot.highest = input.seq;
    // A burst cannot buy simulation time. Retain only a short bounded input queue.
    slot.queue.push(input);
    if (slot.queue.length > 6) slot.queue.shift();
    return true;
  }
  private switchTo(slot: Slot, id: number) {
    if (
      this.mode === "individual" ||
      this.players[id]?.team !== slot.controller.team
    )
      return;
    const old = this.players[slot.controller.player];
    old.charge = 0;
    slot.controller.player = id;
    slot.controller.assignment++;
    slot.queue = [];
    slot.last = neutral(slot.controller.ack, slot.controller.assignment);
  }
  private startAction(p: Footballer, name: ActionName, power = 0) {
    if (p.action) return;
    const ball = this.ball.translation();
    const reachable =
      Math.hypot(ball.x - p.x, ball.z - p.z) < 1.05 && ball.y < 0.65;
    if (name !== "tackle" && !reachable) return;
    let dx = Math.sin(p.facing),
      dz = Math.cos(p.facing),
      target: number | null = null;
    if (name === "pass") {
      let best = Infinity;
      for (const q of this.players)
        if (q.team === p.team && q.id !== p.id) {
          const x = q.x - p.x,
            z = q.z - p.z,
            d = Math.hypot(x, z),
            alignment = (x * dx + z * dz) / d;
          const score = (1 - alignment) * 20 + d * 0.15;
          if (alignment > 0.55 && score < best) {
            best = score;
            target = q.id;
            dx = x / d;
            dz = z / d;
          }
        }
    }
    const delay = name === "tackle" ? 8 : name === "pass" ? 10 : 14;
    p.action = {
      name,
      start: this.tick,
      contact: this.tick + delay,
      end: this.tick + (name === "shot" ? 43 : 32),
      done: false,
      dx,
      dz,
      power,
      target,
    };
    p.facing = Math.atan2(dx, dz);
    p.charge = 0;
    this.emit(`${name}-start`, p.id);
  }
  step() {
    this.tick++;
    const inputs = new Map<number, Input>();
    for (const slot of this.slots.values()) {
      const next = slot.queue.shift();
      const fresh = !!next;
      if (next) {
        slot.last = next;
        slot.controller.ack = next.seq;
        slot.silent = 0;
      } else slot.silent++;
      let i =
        slot.silent > 15
          ? neutral(slot.controller.ack, slot.controller.assignment)
          : { ...slot.last };
      if (!fresh)
        i = { ...i, pass: false, release: false, tackle: false, switch: false };
      let p = this.players[slot.controller.player];
      if (i.cancel) {
        p.charge = 0;
        i = { ...neutral(i.seq, i.assignment) };
      }
      if (i.switch && !p.action) {
        this.switchTo(slot, p.id === p.team * 2 ? p.id + 1 : p.id - 1);
        p = this.players[slot.controller.player];
        i = neutral(i.seq, slot.controller.assignment);
      }
      if (slot.silent > 15) p.charge = 0;
      if (!p.action) {
        if (i.charge) p.charge = Math.min(1, p.charge + DT / 0.85);
        if (i.release) {
          this.startAction(p, "shot", p.charge);
          p.charge = 0;
        } else if (i.pass) this.startAction(p, "pass");
        else if (i.tackle) this.startAction(p, "tackle");
      }
      inputs.set(p.id, i);
    }
    for (const p of this.players) {
      const i = inputs.get(p.id) ?? neutral();
      movePlayer(p, i);
      // Target teammates wait and face the ball; tactical match AI is a later milestone.
      if (!inputs.has(p.id) && !p.action) {
        const b = this.ball.translation();
        p.facing = Math.atan2(b.x - p.x, b.z - p.z);
      }
    }
    // Symmetric separation avoids update-order advantages between footballers.
    for (let a = 0; a < this.players.length; a++)
      for (let b = a + 1; b < this.players.length; b++) {
        const p = this.players[a],
          q = this.players[b],
          dx = q.x - p.x,
          dz = q.z - p.z,
          d = Math.hypot(dx, dz);
        if (d < 0.6) {
          const nx = d > 1e-6 ? dx / d : 1,
            nz = d > 1e-6 ? dz / d : 0,
            push = (0.6 - d) / 2;
          p.x -= nx * push;
          p.z -= nz * push;
          q.x += nx * push;
          q.z += nz * push;
        }
      }
    const contactBall = this.ball.translation();
    const contactOrder = [...this.players].sort(
      (a, b) =>
        Math.hypot(a.x - contactBall.x, a.z - contactBall.z) -
          Math.hypot(b.x - contactBall.x, b.z - contactBall.z) || a.id - b.id,
    );
    for (const p of contactOrder) {
      const action = p.action;
      if (!action) continue;
      if (!action.done && this.tick >= action.contact) {
        action.done = true;
        const b = this.ball.translation(),
          distance = Math.hypot(b.x - p.x, b.z - p.z);
        const front = (b.x - p.x) * action.dx + (b.z - p.z) * action.dz;
        if (
          distance < 1.05 &&
          b.y < 0.65 &&
          front > -0.15 &&
          this.lastContactTick !== this.tick
        ) {
          this.lastContactTick = this.tick;
          let speed =
            action.name === "shot"
              ? 15 + 13 * action.power
              : action.name === "tackle"
                ? 5
                : 10;
          if (action.name === "pass" && action.target !== null) {
            const q = this.players[action.target];
            speed = Math.min(16, 6 + Math.hypot(q.x - p.x, q.z - p.z) * 0.65);
          }
          this.ball.setLinvel(
            {
              x: action.dx * speed,
              y: action.name === "shot" ? 1.5 + 3 * action.power : 0.25,
              z: action.dz * speed,
            },
            true,
          );
          this.owner = null;
          this.freeUntil = this.tick + 10;
          this.lastKicker = p.id;
          this.emit(`${action.name}-contact`, p.id);
          if (action.name === "pass" && action.target !== null) {
            const slot = [...this.slots.values()].find(
              (s) => s.controller.player === p.id,
            );
            if (slot) this.switchTo(slot, action.target);
          }
        } else this.emit(`${action.name}-miss`, p.id);
      }
      if (this.tick >= action.end) p.action = null;
    }
    let b = this.ball.translation();
    if (this.owner !== null) {
      const p = this.players[this.owner];
      if (Math.hypot(b.x - p.x, b.z - p.z) > 1.3 || b.y > 0.65)
        this.owner = null;
    }
    if (this.owner === null && this.tick >= this.freeUntil && b.y < 0.5) {
      const speed = Math.hypot(this.ball.linvel().x, this.ball.linvel().z);
      const candidates = this.players
        .filter(
          (p) =>
            !p.action &&
            (p.id !== this.lastKicker || this.tick > this.freeUntil + 10) &&
            Math.hypot(b.x - p.x, b.z - p.z) < 0.85 &&
            speed < 19,
        )
        .sort(
          (a, c) =>
            Math.hypot(b.x - a.x, b.z - a.z) -
              Math.hypot(b.x - c.x, b.z - c.z) || a.id - c.id,
        );
      const p = candidates[0];
      if (p) {
        this.owner = p.id;
        p.receiveUntil = this.tick + 18;
        this.touchTick = this.tick - 15;
        this.emit("receive", p.id);
      }
    }
    if (this.owner !== null) {
      const p = this.players[this.owner],
        i = inputs.get(p.id) ?? neutral();
      if (!p.action && this.tick - this.touchTick >= (i.sprint ? 14 : 10)) {
        const reach = i.sprint ? 0.85 : 0.6;
        const vx = (p.x + Math.sin(p.facing) * reach - b.x) * 7 + p.vx,
          vz = (p.z + Math.cos(p.facing) * reach - b.z) * 7 + p.vz;
        const mag = Math.max(1, Math.hypot(vx, vz) / 10);
        this.ball.setLinvel(
          { x: vx / mag, y: Math.max(0, this.ball.linvel().y), z: vz / mag },
          true,
        );
        this.touchTick = this.tick;
      }
    }
    const before = { ...this.ball.translation() };
    this.world.step();
    b = this.ball.translation();
    const goal = crossedGoal(before, b);
    if (goal !== null) {
      this.goals[goal]++;
      this.emit("goal", goal);
      this.reset();
    } else if (Math.abs(b.x) > 22 || Math.abs(b.z) > 14 || b.y < -2) {
      this.emit("out", -1);
      this.reset();
    }
  }
  snapshot(): Snapshot {
    const b = this.ball.translation(),
      v = this.ball.linvel();
    return {
      protocol: PROTOCOL,
      tick: this.tick,
      players: this.players.map((p) => ({
        ...p,
        action: p.action ? { ...p.action } : null,
      })),
      ball: { ...b, vx: v.x, vy: v.y, vz: v.z },
      owner: this.owner,
      controllers: Object.fromEntries(
        [...this.slots].map(([id, s]) => [id, { ...s.controller }]),
      ),
      events: this.events.map((e) => ({ ...e })),
      goals: [...this.goals],
      mode: this.mode,
    };
  }
  dispose() {
    this.world.free();
  }
}
