import * as pc from "playcanvas";
import { Client, type Room } from "@colyseus/sdk";
import {
  DT,
  PROTOCOL,
  createRoster,
  analogStick,
  movePlayer,
  neutral,
  type Footballer,
  type Input,
  type Snapshot,
  type Scenario,
} from "@project-soccer/game-core";
import "./style.css";
import { ImportedMotion } from "./imported-motion.ts";
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = el<HTMLCanvasElement>("game");
const app = new pc.Application(canvas, {
  graphicsDeviceOptions: { antialias: true, alpha: false },
});
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.graphicsDevice.maxPixelRatio = Math.min(devicePixelRatio, 2);
window.addEventListener("resize", () => app.resizeCanvas());
app.scene.ambientLight = new pc.Color(0.55, 0.65, 0.68);
const camera = new pc.Entity("sideline camera");
camera.addComponent("camera", {
  clearColor: new pc.Color(0.055, 0.1, 0.135),
  fov: 48,
  nearClip: 0.1,
  farClip: 160,
});
camera.setPosition(4, 23, 27);
camera.lookAt(0, 0, 0);
app.root.addChild(camera);
const sun = new pc.Entity("sun");
sun.addComponent("light", {
  type: "directional",
  color: new pc.Color(1, 0.94, 0.82),
  intensity: 1.7,
  castShadows: true,
  shadowDistance: 60,
  shadowResolution: 2048,
  shadowBias: 0.2,
  normalOffsetBias: 0.03,
});
sun.setEulerAngles(48, -28, 0);
app.root.addChild(sun);
function material(color: string) {
  const m = new pc.StandardMaterial();
  m.diffuse = new pc.Color().fromString(color);
  m.gloss = 15;
  m.update();
  return m;
}
const grass = material("#317465"),
  line = material("#9fc8b0"),
  surround = material("#162d35"),
  white = material("#fff9e9");
function shape(
  name: string,
  type: string,
  pos: number[],
  scale: number[],
  mat: pc.StandardMaterial,
) {
  const e = new pc.Entity(name);
  e.addComponent("render", {
    type,
    material: mat,
    castShadows: type !== "plane",
    receiveShadows: true,
  });
  e.setPosition(...(pos as [number, number, number]));
  e.setLocalScale(...(scale as [number, number, number]));
  app.root.addChild(e);
  return e;
}
shape("stadium apron", "box", [0, -0.22, 0], [53, 0.4, 39], surround);
shape("pitch", "box", [0, -0.06, 0], [40, 0.1, 26], grass);
for (let i = 0; i < 10; i++)
  shape(
    "mowing stripe",
    "plane",
    [-18 + i * 4, 0.001, 0],
    [4, 1, 26],
    material(i % 2 ? "#347869" : "#317465"),
  );
const mark = (x: number, z: number, sx: number, sz: number) =>
  shape("pitch marking", "box", [x, 0.018, z], [sx, 0.018, sz], line);
mark(0, -13, 40, 0.06);
mark(0, 13, 40, 0.06);
mark(-20, 0, 0.06, 26);
mark(20, 0, 0.06, 26);
mark(0, 0, 0.05, 26);
function ring(
  name: string,
  x: number,
  z: number,
  radius: number,
  mat: pc.StandardMaterial,
) {
  const root = new pc.Entity(name);
  app.root.addChild(root);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const part = new pc.Entity("arc");
    part.addComponent("render", {
      type: "box",
      material: mat,
      castShadows: false,
    });
    part.setLocalPosition(Math.cos(a) * radius, 0.025, Math.sin(a) * radius);
    part.setLocalScale(0.045, 0.012, (radius * Math.PI * 2) / 48 + 0.02);
    part.setLocalEulerAngles(0, (-a * 180) / Math.PI, 0);
    root.addChild(part);
  }
  root.setPosition(x, 0, z);
  return root;
}
ring("center circle", 0, 0, 3, line);
for (const side of [-1, 1]) {
  mark(side * 14, 0, 0.06, 10);
  mark(side * 17, 5, 6, 0.06);
  mark(side * 17, -5, 6, 0.06);
  for (const z of [-2, 2])
    shape("goal post", "box", [side * 20, 1, z], [0.12, 2, 0.12], white);
  shape("crossbar", "box", [side * 20, 2, 0], [0.12, 0.12, 4.1], white);
  for (let z = -2; z <= 2; z += 0.4)
    shape("net", "box", [side * 21, 1, z], [0.025, 2, 0.025], line);
  for (let y = 0.3; y <= 2; y += 0.3)
    shape("net", "box", [side * 21, y, 0], [0.025, 0.025, 4], line);
}
const football = shape(
  "ball",
  "sphere",
  [-4.35, 0.13, 0],
  [0.22, 0.22, 0.22],
  white,
);
const ballMark = shape(
  "ball ground marker",
  "cylinder",
  [-4.35, 0.03, 0],
  [0.42, 0.008, 0.42],
  material("#b7e9cb"),
);
const indicator = ring(
  "controlled footballer",
  -5,
  0,
  0.48,
  material("#c3ffe2"),
);
const aiCarrierIndicator = ring(
  "AI ball carrier",
  0,
  0,
  0.62,
  material("#f2cf83"),
);
aiCarrierIndicator.enabled = false;
const avatars = new Map<
  number,
  { entity: pc.Entity; state: string; motion?: ImportedMotion }
>();
const assetPromise = new Promise<pc.Asset>((resolve, reject) =>
  app.assets.loadFromUrl("/assets/footballer.glb", "container", (err, asset) =>
    err ? reject(err) : resolve(asset!),
  ),
);
async function avatar(p: Footballer) {
  if (avatars.has(p.id)) return;
  const holder = new pc.Entity(`footballer-${p.id}`);
  app.root.addChild(holder);
  avatars.set(p.id, { entity: holder, state: "" });
  const asset = await (p.motion ? loadDetailedAsset() : assetPromise);
  if (avatars.get(p.id)?.entity !== holder) return;
  const resource = asset.resource as pc.ContainerResource & {
    animations: pc.Asset[];
  };
  const model = resource.instantiateRenderEntity();
  holder.addChild(model);
  if (p.motion) {
    avatars.set(p.id, {
      entity: holder,
      state: "idle",
      motion: new ImportedMotion(model, resource.animations),
    });
    return;
  }
  for (const comp of model.findComponents("render") as pc.RenderComponent[])
    for (const mi of comp.meshInstances)
      if (mi.material.name === "kit" || mi.material.name === "socks")
        mi.material = material(
          p.role === "goalkeeper"
            ? p.team === 0
              ? "#f2cf83"
              : "#bba1ef"
            : p.team === 0
              ? "#6cd8d2"
              : "#f69c7f",
        );
  model.addComponent("anim", { activate: true });
  const names = ["idle", "run", "sprint", "pass", "shot", "tackle", "receive"];
  model.anim!.loadStateGraph({
    layers: [
      {
        name: "base",
        states: [
          { name: "START" },
          ...names.map((name) => ({
            name,
            speed: 1,
            loop: ["idle", "run", "sprint"].includes(name),
          })),
        ],
        transitions: [{ from: "START", to: "idle" }],
      },
    ],
    parameters: {},
  });
  for (const a of resource.animations) {
    const track = a.resource as pc.AnimTrack;
    model.anim!.assignAnimation(track.name, track);
  }
  avatars.set(p.id, { entity: holder, state: "idle" });
}
let detailAsset: Promise<pc.Asset> | undefined;
function loadDetailedAsset() {
  return (detailAsset ??= new Promise<pc.Asset>((resolve, reject) =>
    app.assets.loadFromUrl(
      "/assets/footballer-animated.glb",
      "container",
      (err, asset) => (err ? reject(err) : resolve(asset!)),
    ),
  ));
}
let room: Room | undefined,
  snapshot: Snapshot | undefined,
  predicted: Footballer | undefined;
let pending: Input[] = [],
  seq = 0,
  accumulator = 0,
  receivedAt = performance.now(),
  rtt = 0,
  correction = 0;
let previous: Snapshot | undefined;
const keys = new Set<string>();
let tapped = new Set<string>();
let wasShoot = false;
let gamepadPrevious: boolean[] = [];
let cancelRequested = false;
let closeCamera = true;
let previousCloseView: boolean | undefined;
el("view").onclick = () => {
  closeCamera = !closeCamera;
};
window.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).tagName === "INPUT") return;
  if (
    ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown"].includes(
      e.code,
    )
  )
    e.preventDefault();
  if (!keys.has(e.code)) tapped.add(e.code);
  keys.add(e.code);
  if (e.code === "KeyR" && !e.repeat) room?.send("reset");
  if (e.code === "KeyV" && !e.repeat) closeCamera = !closeCamera;
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
function clearInput() {
  keys.clear();
  tapped.clear();
  wasShoot = false;
  gamepadPrevious = [];
  cancelRequested = true;
}
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInput();
});
window.addEventListener("gamepaddisconnected", clearInput);
function sample(assignment: number): Input {
  const i = neutral(++seq, assignment);
  i.x = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
  i.z = Number(keys.has("KeyS")) - Number(keys.has("KeyW"));
  i.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  i.pass = tapped.has("KeyJ");
  i.tackle = tapped.has("KeyL");
  i.switch = tapped.has("KeyQ");
  let shoot = keys.has("KeyK");
  const pad =
    !document.hidden && document.hasFocus()
      ? navigator
          .getGamepads?.()
          .find((p) => p?.connected && p.mapping === "standard")
      : undefined;
  if (pad) {
    const buttons = pad.buttons.map((b) => b.pressed);
    const stick = analogStick(
      pad.axes[0] ?? 0,
      pad.axes[1] ?? 0,
      Number(el<HTMLInputElement>("dead-zone").value),
    );
    i.x = stick.x;
    i.z = stick.z;
    i.sprint = buttons[7];
    i.pass ||= buttons[0] && !gamepadPrevious[0];
    i.tackle ||= buttons[2] && !gamepadPrevious[2];
    i.switch ||= buttons[4] && !gamepadPrevious[4];
    shoot ||= buttons[1];
    gamepadPrevious = buttons;
    el("device").textContent = `Gamepad connected · ${pad.id.split("(")[0]}`;
  } else
    el("device").textContent = "Keyboard ready · gamepad uses the same actions";
  i.charge = shoot;
  i.release = wasShoot && !shoot;
  wasShoot = shoot;
  i.cancel = cancelRequested;
  cancelRequested = false;
  tapped = new Set();
  const length = Math.max(1, Math.hypot(i.x, i.z));
  i.x /= length;
  i.z /= length;
  el("stick-value").textContent =
    `Stick ${Math.round(Math.hypot(i.x, i.z) * 100)}% · dead zone ${Math.round(Number(el<HTMLInputElement>("dead-zone").value) * 100)}%`;
  return i;
}
function receive(state: Snapshot) {
  if (state.protocol !== PROTOCOL) {
    void room?.leave();
    el("error").textContent = "Build mismatch. Refresh both clients.";
    return;
  }
  if ((snapshot?.scenario ?? "technical") !== state.scenario) {
    for (const avatar of avatars.values()) avatar.entity.destroy();
    avatars.clear();
  }
  el("invite").hidden = state.scenario === "motion";
  el("motion-tools").hidden = state.scenario !== "motion";
  previous = snapshot;
  snapshot = state;
  receivedAt = performance.now();
  const control = room ? state.controllers[room.sessionId] : undefined;
  if (control) {
    const actual = state.players[control.player];
    pending = pending.filter(
      (i) => i.seq > control.ack && i.assignment === control.assignment,
    );
    const next = {
      ...actual,
      action: actual.action ? { ...actual.action } : null,
    };
    for (const i of pending) movePlayer(next, i);
    correction =
      predicted?.id === next.id
        ? Math.hypot(predicted.x - next.x, predicted.z - next.z)
        : 0;
    predicted = next;
    el("team").textContent = control.team === 0 ? "Blue team" : "Coral team";
    el("power").setAttribute("value", String(actual.charge));
    const carrier =
      state.owner === null ? undefined : state.players[state.owner];
    const aiHasBall =
      carrier?.team === control.team &&
      carrier.id !== control.player &&
      !Object.values(state.controllers).some((c) => c.player === carrier.id);
    el("possession").textContent =
      state.scenario === "motion"
        ? carrier?.id === control.player
          ? "On the ball · A to pass, hold and release B to shoot."
          : "Chase the ball to recover it, or reset the exercise."
        : carrier?.id === control.player
          ? "On the ball · J / A to pass. Q / LB to make an off-ball run."
          : aiHasBall
            ? "Off the ball · move into space, then J / A to call. Gold ring: AI carrier."
            : "Win possession to pass. Q / LB switches your footballer.";
    const feedback = [...state.events]
      .reverse()
      .find(
        (e) =>
          e.actor === control.player &&
          e.type.startsWith("pass-request") &&
          state.tick - e.tick < 120,
      );
    el("pass-feedback").textContent =
      feedback?.type === "pass-request"
        ? carrier?.id === control.player
          ? "Pass received · you still control the receiver."
          : "Pass requested · stay ready to receive."
        : feedback?.type === "pass-request-cancelled"
          ? "Request cancelled · reposition and try again."
          : feedback?.type === "pass-request-unavailable"
            ? "No pass available from an AI teammate right now."
            : "";
    aiCarrierIndicator.enabled = aiHasBall;
    if (aiHasBall) aiCarrierIndicator.setPosition(carrier.x, 0, carrier.z);
  }
  el("score-value").textContent = `${state.goals[0]} : ${state.goals[1]}`;
  el("practice-mode").textContent =
    state.scenario === "motion"
      ? "CHARACTER & MOVEMENT STUDY"
      : state.scenario === "squad"
        ? "3 + KEEPER · TRAINING · NO MATCH CLOCK"
        : "SHOT PRACTICE · NO MATCH CLOCK";
  el("status").textContent =
    state.scenario === "motion"
      ? "Solo study · move, stop, turn and control the ball."
      : Object.keys(state.controllers).length === 2
        ? "Two participants on the pitch."
        : "Practice solo, or invite a second player.";
  el("network").textContent =
    `${Math.round(rtt)} ms round trip · correction ${correction.toFixed(2)} m`;
  for (const p of state.players) void avatar(p).catch(showError);
}
function showError(error: unknown) {
  el("error").textContent = String(
    error instanceof Error ? error.message : error,
  );
  el("connection").textContent = "Connection unavailable";
}
async function connect(id?: string, scenario: Scenario = "technical") {
  el<HTMLButtonElement>("create").disabled = true;
  el<HTMLButtonElement>("create-squad").disabled = true;
  el<HTMLButtonElement>("create-motion").disabled = true;
  el<HTMLButtonElement>("join").disabled = true;
  el("error").textContent = "";
  try {
    await (scenario === "motion" ? loadDetailedAsset() : assetPromise);
    const client = new Client(location.origin, {
      urlBuilder: (url) => {
        if (url.protocol === "ws:" || url.protocol === "wss:")
          url.pathname = "/socket" + url.pathname;
        return url.toString();
      },
    });
    room = id
      ? await client.joinById(id, { protocol: PROTOCOL })
      : await client.create("laboratory", {
          protocol: PROTOCOL,
          mode: "team",
          scenario,
        });
    seq = 0;
    pending = [];
    room.onMessage("snapshot", receive);
    room.onMessage("pong", (t: number) => (rtt = performance.now() - t));
    room.onError((_code, message) => showError(message));
    room.onLeave(() => {
      room = undefined;
      aiCarrierIndicator.enabled = false;
      clearInput();
      el("connection").textContent = "Disconnected — reload to reconnect";
      el("status").textContent = "Session ended. Reload to start again.";
    });
    el("lobby").hidden = true;
    el("session").hidden = false;
    el("score").hidden = false;
    el("connection").textContent = "Practice session";
    el("room-label").textContent = `ROOM ${room.roomId}`;
    history.replaceState(null, "", `?room=${encodeURIComponent(room.roomId)}`);
  } catch (error) {
    showError(error);
  } finally {
    el<HTMLButtonElement>("create").disabled = false;
    el<HTMLButtonElement>("create-squad").disabled = false;
    el<HTMLButtonElement>("create-motion").disabled = false;
    el<HTMLButtonElement>("join").disabled = false;
  }
}
el("create").onclick = () => void connect();
el("create-squad").onclick = () => void connect(undefined, "squad");
el("create-motion").onclick = () => void connect(undefined, "motion");
el("join").onclick = () =>
  void connect(el<HTMLInputElement>("room-id").value.trim());
el("reset").onclick = () => room?.send("reset");
el("invite").onclick = () => {
  void navigator.clipboard
    .writeText(location.href)
    .then(() => {
      el("invite").textContent = "Copied ✓";
    })
    .catch(() => {
      el("room-label").textContent = location.href;
    });
};
const requestedRoom = new URLSearchParams(location.search).get("room");
if (requestedRoom) {
  el<HTMLInputElement>("room-id").value = requestedRoom;
  el("join").textContent = "Join pitch";
}
setInterval(() => room?.send("ping", performance.now()), 1000);
const preview = createRoster("technical");
for (const p of preview) void avatar(p).catch(showError);
let renderedTick = 0;
app.on("update", (delta: number) => {
  const dt = Math.min(delta, 0.1);
  accumulator += dt;
  const control =
    room && snapshot ? snapshot.controllers[room.sessionId] : undefined;
  while (accumulator >= DT) {
    accumulator -= DT;
    if (room && control && predicted) {
      const input = sample(control.assignment);
      room.send("input", input);
      pending.push(input);
      if (pending.length > 120) pending.shift();
      movePlayer(predicted, input);
    }
  }
  const alpha = Math.min(1, (performance.now() - receivedAt) / 50);
  renderedTick = snapshot
    ? (previous?.tick ?? snapshot.tick) +
      alpha * (snapshot.tick - (previous?.tick ?? snapshot.tick))
    : 0;
  const currentBall = snapshot?.ball;
  const pastBall = previous?.ball ?? currentBall;
  const visualBall =
    currentBall && pastBall
      ? {
          ...currentBall,
          x: pastBall.x + (currentBall.x - pastBall.x) * alpha,
          y: pastBall.y + (currentBall.y - pastBall.y) * alpha,
          z: pastBall.z + (currentBall.z - pastBall.z) * alpha,
        }
      : undefined;
  for (const p of snapshot?.players ?? preview) {
    const av = avatars.get(p.id);
    if (!av) continue;
    const old = previous?.players[p.id] ?? p;
    const local = control?.player === p.id && predicted ? predicted : undefined;
    const x = local?.x ?? old.x + (p.x - old.x) * alpha,
      z = local?.z ?? old.z + (p.z - old.z) * alpha;
    av.entity.setPosition(x, 0, z);
    av.entity.setEulerAngles(
      0,
      ((local?.facing ?? p.facing) * 180) / Math.PI,
      0,
    );
    if (av.motion && visualBall) {
      av.motion.update(
        local ?? p,
        renderedTick,
        dt,
        visualBall,
        snapshot?.owner ?? null,
        el<HTMLSelectElement>("animation-source").value === "imported",
      );
      av.state = av.motion.state;
      el("motion-state").textContent =
        `${av.state} · ${Math.hypot(p.vx, p.vz).toFixed(1)} m/s · ${av.motion.source}`;
      continue;
    }
    const model = av.entity.children[0] as pc.Entity | undefined;
    const anim = model?.anim?.baseLayer;
    if (anim) {
      const speed = Math.hypot(local?.vx ?? p.vx, local?.vz ?? p.vz);
      const state =
        p.action?.name ??
        (p.receiveUntil > renderedTick
          ? "receive"
          : speed > 5.2
            ? "sprint"
            : speed > 0.2
              ? "run"
              : "idle");
      if (av.state !== state) {
        anim.transition(state, 0.08);
        av.state = state;
      }
      if (p.action)
        anim.activeStateCurrentTime = Math.max(
          0,
          (renderedTick - p.action.start) * DT,
        );
    }
  }
  if (snapshot) {
    const b = snapshot.ball,
      old = previous?.ball ?? b;
    football.setPosition(
      old.x + (b.x - old.x) * alpha,
      old.y + (b.y - old.y) * alpha,
      old.z + (b.z - old.z) * alpha,
    );
    ballMark.setPosition(
      football.getPosition().x,
      0.028,
      football.getPosition().z,
    );
  }
  if (predicted) {
    indicator.setPosition(predicted.x, 0, predicted.z);
    const ball = football.getPosition();
    const tx = predicted.x * 0.4 + ball.x * 0.6,
      tz = predicted.z * 0.4 + ball.z * 0.6;
    const target = new pc.Vec3(
      Math.max(-9, Math.min(9, tx)),
      20,
      Math.max(17, Math.min(29, tz + 24)),
    );
    const close = snapshot?.scenario === "motion" && closeCamera;
    if (close) target.set(predicted.x + 3.2, 3.0, predicted.z + 4.5);
    if (previousCloseView !== close) camera.setPosition(target);
    previousCloseView = close;
    camera.setPosition(
      camera
        .getPosition()
        .clone()
        .lerp(camera.getPosition(), target, 1 - Math.exp(-dt * 2)),
    );
    if (close) camera.lookAt(predicted.x, 0.95, predicted.z);
    else camera.lookAt(camera.getPosition().x, 0, camera.getPosition().z - 24);
  }
});
// Read-only diagnostics for reproducible browser tests and manual inspection.
Object.defineProperty(window, "soccerLab", {
  get: () => ({
    snapshot,
    predicted,
    roomId: room?.roomId,
    sessionId: room?.sessionId,
    rtt,
    renderedTick,
    correction,
    avatars: avatars.size,
    rigsReady: [...avatars.values()].filter(
      (a) =>
        a.motion ||
        (a.entity.children[0] as pc.Entity | undefined)?.anim?.baseLayer,
    ).length,
    poses: [...avatars.values()].map((a) => ({
      state: a.state,
      leg:
        (
          a.entity.findByName("thigh_R") ?? a.entity.findByName("upperleg01.R")
        )?.getLocalEulerAngles().x ?? 0,
      contactError: a.motion?.contactError,
      source: a.motion?.source,
    })),
  }),
});
app.start();
