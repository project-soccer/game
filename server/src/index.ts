import { Server, Room, type Client } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { DT, PROTOCOL } from "@project-soccer/game-core";
import { Simulation, initPhysics } from "@project-soccer/game-core/simulation";
await initPhysics();
class Laboratory extends Room {
  maxClients = 2;
  private sim!: Simulation;
  private limits = new Map<
    string,
    { count: number; start: number; reset: number }
  >();
  async onCreate(options: {
    protocol?: string;
    mode?: string;
    scenario?: string;
  }) {
    if (options.protocol !== PROTOCOL)
      throw new Error("Client/server versions differ. Refresh both clients.");
    this.sim = new Simulation(
      options.mode === "individual" ? "individual" : "team",
      options.scenario === "motion"
        ? "motion"
        : options.scenario === "squad"
          ? "squad"
          : "technical",
    );
    if (options.scenario === "motion") this.maxClients = 1;
    await this.setPrivate(true);
    this.onMessage("input", (client, value: unknown) => {
      const limit = this.limits.get(client.sessionId);
      if (!limit) return;
      const now = Date.now();
      if (now - limit.start >= 1000) {
        limit.count = 0;
        limit.start = now;
      }
      if (++limit.count > 100) return;
      this.sim.enqueue(client.sessionId, value);
    });
    this.onMessage("reset", (client) => {
      const limit = this.limits.get(client.sessionId);
      if (!limit || Date.now() - limit.reset < 1000) return;
      limit.reset = Date.now();
      this.sim.reset();
    });
    this.onMessage("ping", (client, value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value))
        client.send("pong", value);
    });
    this.setSimulationInterval(() => {
      this.sim.step();
      if (this.sim.tick % 3 === 0)
        this.broadcast("snapshot", this.sim.snapshot());
    }, DT * 1000);
  }
  onJoin(client: Client, options: { protocol?: string }) {
    if (options.protocol !== PROTOCOL) throw new Error("Incompatible protocol");
    this.sim.addController(client.sessionId);
    this.limits.set(client.sessionId, {
      count: 0,
      start: Date.now(),
      reset: 0,
    });
  }
  onLeave(client: Client) {
    this.sim.removeController(client.sessionId);
    this.limits.delete(client.sessionId);
  }
  onDispose() {
    this.sim.dispose();
  }
}
const server = new Server({
  transport: new WebSocketTransport({ maxPayload: 4096 }),
  greet: false,
});
server.define("laboratory", Laboratory);
await server.listen(
  Number(process.env.PORT ?? 2567),
  process.env.HOST ?? "127.0.0.1",
);
console.log(
  `Project Soccer action laboratory listening on ${process.env.HOST ?? "127.0.0.1"}:${process.env.PORT ?? 2567}`,
);
