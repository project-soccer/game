import RAPIER from "@dimforge/rapier3d-compat";
import { squadTargets } from "./squad-ai.ts";
import {
  BALL_RADIUS,
  DT,
  PROTOCOL,
  crossedGoal,
  createRoster,
  movePlayer,
  neutral,
  parseInput,
  strideLength,
  type ActionName,
  type Controller,
  type Footballer,
  type Input,
  type LabEvent,
  type Mode,
  type Snapshot,
  type Scenario,
} from "./index.ts";
let initialization: Promise<void> | undefined;
export const initPhysics = () => (initialization ??= RAPIER.init());
type Slot = {
  controller: Controller;
  queue: Input[];
  last: Input;
  highest: number;
  silent: number;
  requestCooldown: number;
  request?: {
    carrier: number;
    receiver: number;
    expires: number;
    started: boolean;
  };
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
  private aiTargets = new Map<number, { x: number; z: number }>();
  private aiNextAction = new Map<number, number>();
  private keeperPossession = new Map<number, number>();
  private keeperSaveAfter = new Map<number, number>();
  private passFlight?: { receiver: number; until: number };
  constructor(
    readonly mode: Mode = "team",
    readonly scenario: Scenario = "technical",
  ) {
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
    this.players = createRoster(this.scenario);
    this.aiTargets.clear();
    this.aiNextAction.clear();
    this.keeperPossession.clear();
    this.keeperSaveAfter.clear();
    this.passFlight = undefined;
    this.ball.setTranslation({ x: -4.35, y: BALL_RADIUS + 0.01, z: 0 }, true);
    this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.ball.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    this.owner = 0;
    this.freeUntil = 0;
    this.lastKicker = -1;
    this.touchTick = this.tick - 20;
    for (const slot of this.slots.values()) {
      slot.controller.player = this.outfield(slot.controller.team)[0].id;
      slot.controller.assignment++;
      slot.queue = [];
      slot.last = neutral(slot.controller.ack, slot.controller.assignment);
      slot.request = undefined;
      slot.requestCooldown = 0;
    }
    this.emit("reset", -1);
  }
  addController(id: string) {
    if (this.slots.size >= (this.scenario === "motion" ? 1 : 2))
      throw new Error("Laboratory is full");
    const team = [0, 1].find(
      (t) => ![...this.slots.values()].some((s) => s.controller.team === t),
    )!;
    this.slots.set(id, {
      controller: {
        team,
        player: this.outfield(team)[0].id,
        assignment: 0,
        ack: 0,
      },
      queue: [],
      last: neutral(),
      highest: 0,
      silent: 0,
      requestCooldown: 0,
    });
  }
  removeController(id: string) {
    const slot = this.slots.get(id);
    if (slot) this.cancelRequest(slot);
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
      id === slot.controller.player ||
      this.players[id]?.team !== slot.controller.team ||
      this.players[id]?.role === "goalkeeper"
    )
      return;
    const old = this.players[slot.controller.player];
    this.cancelRequest(slot);
    old.charge = 0;
    slot.controller.player = id;
    slot.controller.assignment++;
    slot.queue = [];
    slot.last = neutral(slot.controller.ack, slot.controller.assignment);
  }
  private outfield(team: number) {
    return this.players.filter((p) => p.team === team && p.role === "outfield");
  }
  private updateSquadAI(inputs: Map<number, Input>) {
    const b = this.ball.translation();
    // Bounded 10 Hz tactical perception, with ordinary acceleration between decisions.
    if (this.tick % 6 === 1 || !this.aiTargets.size)
      this.aiTargets = squadTargets(
        this.players,
        this.owner,
        b,
        this.ball.linvel(),
      );
    if (
      this.owner !== null ||
      (this.passFlight && this.tick > this.passFlight.until)
    )
      this.passFlight = undefined;
    for (const p of this.players) {
      if (inputs.has(p.id)) continue;
      const i = neutral();
      const teamHasHuman = [...this.slots.values()].some(
        (s) => s.controller.team === p.team,
      );
      let target = this.aiTargets.get(p.id) ?? p;
      const waitingForPass =
        this.players.some(
          (q) =>
            q.action?.name === "pass" &&
            !q.action.done &&
            q.action.target === p.id,
        ) || this.passFlight?.receiver === p.id;
      if (this.owner === p.id) {
        if (p.role === "goalkeeper") {
          const since = this.keeperPossession.get(p.id) ?? this.tick;
          this.keeperPossession.set(p.id, since);
          target = p;
          // Offer the normal pass-request path first, then distribute automatically.
          if (
            this.tick - since >= 120 &&
            !p.action &&
            ![...this.slots.values()].some((s) => s.request?.carrier === p.id)
          ) {
            const receiver = [...this.outfield(p.team)].sort(
              (a, c) =>
                Math.hypot(a.x - p.x, a.z - p.z) -
                Math.hypot(c.x - p.x, c.z - p.z),
            )[0];
            // Reuse the turn/contact preparation even for a completely AI team below.
            const angle = Math.atan2(receiver.x - p.x, receiver.z - p.z);
            const turn = Math.atan2(
              Math.sin(angle - p.facing),
              Math.cos(angle - p.facing),
            );
            p.facing += Math.max(-6 * DT, Math.min(6 * DT, turn));
            const front =
              (b.x - p.x) * Math.sin(angle) + (b.z - p.z) * Math.cos(angle);
            if (Math.abs(turn) < 0.12 && front > 0.1)
              this.startAction(p, "pass", 0, receiver.id);
          }
        } else if (teamHasHuman) target = p;
        else {
          const direction = p.team === 0 ? 1 : -1;
          target = { x: direction * 19, z: 0 };
          if (
            direction * p.x > 8 &&
            !p.action &&
            this.tick >= (this.aiNextAction.get(p.id) ?? 0)
          ) {
            this.startAction(p, "shot", 0.45);
            this.aiNextAction.set(p.id, this.tick + 60);
          }
        }
      } else {
        this.keeperPossession.delete(p.id);
        if (waitingForPass) target = p;
        const carrier =
          this.owner === null ? undefined : this.players[this.owner];
        if (
          p.role === "outfield" &&
          carrier &&
          carrier.team !== p.team &&
          Math.hypot(b.x - p.x, b.z - p.z) < 0.95 &&
          this.tick >= (this.aiNextAction.get(p.id) ?? 0) &&
          !p.action
        ) {
          this.startAction(p, "tackle");
          this.aiNextAction.set(p.id, this.tick + 60);
        }
      }
      if (!p.action) {
        const dx = target.x - p.x,
          dz = target.z - p.z,
          d = Math.hypot(dx, dz);
        if (d > 0.2) {
          const scale = Math.min(p.role === "goalkeeper" ? 0.85 : 0.8, d / 1.5);
          i.x = (dx / d) * scale;
          i.z = (dz / d) * scale;
        }
      }
      inputs.set(p.id, i);
    }
  }
  private resolveKeeperSaves(before: { x: number; y: number; z: number }) {
    if (this.owner !== null) return;
    const after = this.ball.translation(),
      velocity = this.ball.linvel();
    for (const p of this.players.filter((q) => q.role === "goalkeeper")) {
      if (p.action || this.tick < (this.keeperSaveAfter.get(p.id) ?? 0))
        continue;
      const dx = after.x - before.x,
        dz = after.z - before.z;
      const length2 = dx * dx + dz * dz;
      const t =
        length2 > 0
          ? Math.max(
              0,
              Math.min(
                1,
                ((p.x - before.x) * dx + (p.z - before.z) * dz) / length2,
              ),
            )
          : 0;
      const contact = {
        x: before.x + dx * t,
        y: before.y + (after.y - before.y) * t,
        z: before.z + dz * t,
      };
      const distance = Math.hypot(contact.x - p.x, contact.z - p.z);
      const direction = p.team === 0 ? 1 : -1;
      if (
        distance > 0.7 ||
        contact.y > 1.6 ||
        contact.y < BALL_RADIUS - 0.03 ||
        direction * (contact.x - p.x) < -0.2 ||
        direction * velocity.x >= -0.2
      )
        continue;
      // Swept contact prevents a fast ball tunnelling through the keeper's save volume.
      this.ball.setTranslation(contact, true);
      p.receiveUntil = this.tick + 24;
      this.keeperSaveAfter.set(p.id, this.tick + 24);
      if (Math.hypot(velocity.x, velocity.z) < 11 && contact.y < 0.5) {
        this.ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
        this.owner = p.id;
        p.facing = (direction * Math.PI) / 2;
        this.keeperPossession.set(p.id, this.tick);
        this.touchTick = this.tick - 15;
        this.emit("keeper-control", p.id);
      } else {
        this.ball.setLinvel(
          { x: direction * 5, y: 1.2, z: (contact.z >= p.z ? 1 : -1) * 7 },
          true,
        );
        this.freeUntil = this.tick + 10;
        this.lastKicker = p.id;
        this.emit("keeper-parry", p.id);
      }
      break;
    }
  }
  private cancelRequest(slot: Slot) {
    const request = slot.request;
    if (!request) return;
    const carrier = this.players[request.carrier];
    if (request.started && carrier.action && !carrier.action.done)
      carrier.action = null;
    if (!request.started || !carrier.action?.done)
      this.emit("pass-request-cancelled", request.receiver);
    slot.request = undefined;
  }
  private requestPass(slot: Slot, receiver: Footballer) {
    if (this.tick < slot.requestCooldown || slot.request) return;
    slot.requestCooldown = this.tick + 30;
    const carrier = this.owner === null ? undefined : this.players[this.owner];
    if (
      this.mode !== "team" ||
      !carrier ||
      carrier.team !== receiver.team ||
      carrier.id === receiver.id ||
      carrier.action ||
      [...this.slots.values()].some(
        (s) => s.controller.player === carrier.id,
      ) ||
      Math.hypot(carrier.x - receiver.x, carrier.z - receiver.z) > 22
    ) {
      this.emit("pass-request-unavailable", receiver.id);
      return;
    }
    slot.request = {
      carrier: carrier.id,
      receiver: receiver.id,
      expires: this.tick + 90,
      started: false,
    };
    this.emit("pass-request", receiver.id);
  }
  private updateRequests() {
    for (const slot of this.slots.values()) {
      const request = slot.request;
      if (!request) continue;
      const p = this.players[request.carrier],
        q = this.players[request.receiver];
      if (request.started && p.action?.done) {
        slot.request = undefined;
        continue;
      }
      const b = this.ball.translation();
      const distance = Math.hypot(q.x - p.x, q.z - p.z);
      if (
        slot.controller.player !== q.id ||
        this.owner !== p.id ||
        [...this.slots.values()].some((s) => s.controller.player === p.id) ||
        Math.hypot(b.x - p.x, b.z - p.z) > 1.3 ||
        b.y > 0.65 ||
        (!request.started && (this.tick >= request.expires || distance > 22))
      ) {
        this.cancelRequest(slot);
        continue;
      }
      if (request.started || p.action || distance < 1.2) continue;
      const desired = Math.atan2(q.x - p.x, q.z - p.z);
      const turn = Math.atan2(
        Math.sin(desired - p.facing),
        Math.cos(desired - p.facing),
      );
      p.facing += Math.max(-6 * DT, Math.min(6 * DT, turn));
      // Turn with ordinary assisted touches before committing to the kick.
      const front =
        (b.x - p.x) * Math.sin(desired) + (b.z - p.z) * Math.cos(desired);
      if (
        Math.abs(turn) < 0.12 &&
        front > 0.1 &&
        Math.hypot(b.x - p.x, b.z - p.z) < 1.05
      ) {
        this.startAction(p, "pass", 0, q.id);
        request.started = !!p.action;
      }
    }
  }
  private startAction(
    p: Footballer,
    name: ActionName,
    power = 0,
    requestedTarget?: number,
  ) {
    if (p.action) return;
    const ball = this.ball.translation();
    const reachable =
      Math.hypot(ball.x - p.x, ball.z - p.z) < 1.05 && ball.y < 0.65;
    if (name !== "tackle" && !reachable) return;
    let dx = Math.sin(p.facing),
      dz = Math.cos(p.facing),
      target: number | null = null;
    if (name === "pass" && requestedTarget !== undefined) {
      const q = this.players[requestedTarget],
        d = Math.hypot(q.x - p.x, q.z - p.z);
      target = q.id;
      dx = (q.x - p.x) / d;
      dz = (q.z - p.z) / d;
    } else if (name === "pass") {
      let best = Infinity;
      const aimX = dx,
        aimZ = dz;
      for (const q of this.players)
        if (q.team === p.team && q.id !== p.id) {
          const x = q.x - p.x,
            z = q.z - p.z,
            d = Math.hypot(x, z),
            alignment = (x * aimX + z * aimZ) / d;
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
    p.touch = null;
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
        this.cancelRequest(slot);
        p.charge = 0;
        i = { ...neutral(i.seq, i.assignment) };
      }
      if (i.switch && !p.action) {
        const teammates = this.outfield(p.team);
        const next =
          (teammates.findIndex((q) => q.id === p.id) + 1) % teammates.length;
        this.switchTo(slot, teammates[next].id);
        p = this.players[slot.controller.player];
        i = neutral(i.seq, slot.controller.assignment);
      }
      if (slot.silent > 15) p.charge = 0;
      if (!p.action) {
        if (i.charge) p.charge = Math.min(1, p.charge + DT / 0.85);
        if (i.release) {
          this.startAction(p, "shot", p.charge);
          p.charge = 0;
        } else if (i.pass) {
          if (this.owner !== p.id) this.requestPass(slot, p);
          else this.startAction(p, "pass");
        } else if (i.tackle) this.startAction(p, "tackle");
      }
      inputs.set(p.id, i);
    }
    const humanPlayers = new Set(inputs.keys());
    if (this.scenario === "squad") this.updateSquadAI(inputs);
    this.updateRequests();
    for (const p of this.players) {
      const i = inputs.get(p.id) ?? neutral();
      movePlayer(p, i);
      // The AI carrier holds its orientation and uses the same touch rules as a human.
      // Other target teammates wait; tactical match AI is a later milestone.
      if (
        !humanPlayers.has(p.id) &&
        !p.action &&
        this.owner !== p.id &&
        Math.hypot(i.x, i.z) < 0.1
      ) {
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
            this.passFlight = {
              receiver: action.target,
              until: this.tick + 150,
            };
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
            (p.role !== "goalkeeper" || speed < 4) &&
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
    for (const p of this.players) {
      if (
        p.touch &&
        (this.owner !== p.id || p.action || this.tick > p.touch.end)
      )
        p.touch = null;
    }
    if (this.owner !== null) {
      const p = this.players[this.owner],
        i = inputs.get(p.id) ?? neutral();
      const moving = Math.hypot(p.vx, p.vz);
      const reach = i.sprint ? 0.85 : 0.6;
      const interval = p.motion
        ? Math.max(
            14,
            Math.min(
              28,
              Math.round(strideLength(moving) / Math.max(1, moving) / DT / 2),
            ),
          )
        : i.sprint
          ? 14
          : 10;
      if (
        p.motion &&
        !p.action &&
        !p.touch &&
        this.tick - this.touchTick >= interval - 6
      ) {
        const error = Math.hypot(
          p.x + Math.sin(p.facing) * reach - b.x,
          p.z + Math.cos(p.facing) * reach - b.z,
        );
        if (moving > 0.15 || error > 0.08) {
          const v = this.ball.linvel();
          const localX =
            (b.x - p.x) * Math.cos(p.facing) - (b.z - p.z) * Math.sin(p.facing);
          p.touch = {
            start: this.tick,
            contact: this.tick + 6,
            end: this.tick + 13,
            x: b.x + v.x * 6 * DT,
            y: b.y,
            z: b.z + v.z * 6 * DT,
            foot: localX > 0 ? "L" : "R",
          };
        }
      }
      const due = p.motion
        ? p.touch?.contact === this.tick
        : this.tick - this.touchTick >= interval;
      if (
        !p.action &&
        due &&
        (!p.motion || Math.hypot(b.x - p.x, b.z - p.z) < 1.05)
      ) {
        if (p.touch) {
          p.touch.x = b.x;
          p.touch.y = b.y;
          p.touch.z = b.z;
        }
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
    if (this.scenario === "squad") this.resolveKeeperSaves(before);
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
        touch: p.touch ? { ...p.touch } : null,
      })),
      ball: {
        ...b,
        vx: v.x,
        vy: v.y,
        vz: v.z,
        rotation: { ...this.ball.rotation() },
      },
      owner: this.owner,
      controllers: Object.fromEntries(
        [...this.slots].map(([id, s]) => [id, { ...s.controller }]),
      ),
      events: this.events.map((e) => ({ ...e })),
      goals: [...this.goals],
      mode: this.mode,
      scenario: this.scenario,
    };
  }
  dispose() {
    this.world.free();
  }
}
