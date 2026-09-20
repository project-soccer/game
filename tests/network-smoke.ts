import assert from "node:assert/strict";
import { Client, type Room } from "@colyseus/sdk";
import {
  PROTOCOL,
  neutral,
  type Snapshot,
} from "../packages/game-core/src/index.ts";
const endpoint = process.env.SERVER_URL ?? "ws://127.0.0.1:2567";
const client = new Client(endpoint);
const a = await client.create("laboratory", { protocol: PROTOCOL });
let b: Room | undefined;
const latest = new Map<string, Snapshot>();
function watch(r: Room) {
  r.onMessage("snapshot", (s: Snapshot) => latest.set(r.sessionId, s));
}
async function until(predicate: () => boolean, label: string) {
  const deadline = Date.now() + 6000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${label}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}
try {
  watch(a);
  b = await new Client(endpoint).joinById(a.roomId, { protocol: PROTOCOL });
  watch(b);
  await until(
    () =>
      latest.get(a.sessionId)?.controllers[b!.sessionId] !== undefined &&
      latest.has(b!.sessionId),
    "two controllers",
  );
  const initial = latest.get(a.sessionId)!;
  assert.notEqual(
    initial.controllers[a.sessionId].player,
    initial.controllers[b.sessionId].player,
  );
  await assert.rejects(() =>
    new Client(endpoint).joinById(a.roomId, { protocol: PROTOCOL }),
  );
  const control = initial.controllers[a.sessionId],
    start = initial.players[control.player].x;
  for (let seq = 1; seq <= 30; seq++) {
    a.send("input", { ...neutral(seq, control.assignment), x: 1 });
    await new Promise((r) => setTimeout(r, 17));
  }
  await until(
    () => latest.get(b!.sessionId)!.players[control.player].x > start + 0.3,
    "shared movement",
  );
  a.send("input", { ...neutral(31, control.assignment), x: NaN });
  a.send("input", { ...neutral(32, control.assignment), switch: true });
  await until(
    () =>
      latest.get(a.sessionId)!.controllers[a.sessionId].assignment >
      control.assignment,
    "switch",
  );
  const after = latest.get(a.sessionId)!;
  assert.notEqual(after.controllers[a.sessionId].player, control.player);
  a.send("reset");
  await until(
    () =>
      latest
        .get(a.sessionId)!
        .events.some((e) => e.type === "reset" && e.tick > initial.tick),
    "reset event",
  );
  await until(
    () =>
      latest
        .get(b!.sessionId)!
        .events.some((e) => e.type === "reset" && e.tick > initial.tick),
    "same reset on second client",
  );
  assert.ok(
    latest.get(a.sessionId)!.players.every((p) => Number.isFinite(p.x)),
  );
  console.log(
    "PASS: two independent clients, distinct control, shared movement/events, room capacity, malformed input, handoff, reset.",
  );
} finally {
  await b?.leave();
  await a.leave();
}
