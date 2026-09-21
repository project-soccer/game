import * as pc from "playcanvas";
import type { Footballer, Snapshot } from "@project-soccer/game-core";
import { CharacterMotion } from "./character-motion.ts";

/** Authored locomotion played by the engine; football actions remain a labelled fallback. */
export class ImportedMotion {
  private legacy: CharacterMotion;
  private model: pc.Entity;
  private rest: { node: pc.GraphNode; position: pc.Vec3; rotation: pc.Quat }[];
  private procedural = false;
  private moving = false;
  state = "idle";
  source = "imported";
  contactError = 0;
  constructor(model: pc.Entity, animations: pc.Asset[]) {
    this.model = model;
    this.legacy = new CharacterMotion(model);
    this.rest = model
      .find(() => true)
      .map((node) => ({
        node,
        position: node.getLocalPosition().clone(),
        rotation: node.getLocalRotation().clone(),
      }));
    model.addComponent("anim", { activate: true });
    model.anim!.loadStateGraph({
      layers: [
        {
          name: "locomotion",
          states: [
            { name: "START" },
            { name: "idle", loop: true, speed: 1 },
            {
              name: "move",
              loop: true,
              speed: 1,
              blendTree: {
                type: "1D",
                parameter: "pace",
                syncAnimations: true,
                children: [
                  { name: "walk", point: 1.4 },
                  { name: "run", point: 4.8 },
                  { name: "sprint", point: 7 },
                ],
              },
            },
          ],
          transitions: [{ from: "START", to: "idle" }],
        },
      ],
      parameters: { pace: { name: "pace", type: "FLOAT", value: 1.4 } },
    });
    for (const asset of animations) {
      const track = asset.resource as pc.AnimTrack;
      model.anim!.assignAnimation(
        track.name === "idle" ? "idle" : `move.${track.name}`,
        track,
      );
    }
  }
  update(
    p: Footballer,
    tick: number,
    dt: number,
    ball: Snapshot["ball"],
    owner: number | null,
    useImported = true,
  ) {
    const fallback = !useImported || !!p.action;
    if (fallback !== this.procedural) {
      for (const r of this.rest) {
        r.node.setLocalPosition(r.position);
        r.node.setLocalRotation(r.rotation);
      }
      this.model.anim!.enabled = !fallback;
      this.procedural = fallback;
      if (!fallback) {
        this.moving = false;
        this.model.anim!.baseLayer!.play("idle");
      }
    }
    if (fallback) {
      this.legacy.update(p, tick, dt, ball, owner);
      this.state = this.legacy.state;
      this.contactError = this.legacy.contactError;
      this.source = useImported
        ? "legacy football action"
        : "procedural comparison";
      return;
    }
    const speed = Math.hypot(p.vx, p.vz),
      moving = speed > 0.12;
    if (moving !== this.moving) {
      this.model.anim!.baseLayer!.transition(moving ? "move" : "idle", 0.18);
      this.moving = moving;
    }
    this.model.anim!.setFloat("pace", Math.max(1.4, Math.min(7, speed)));
    this.model.anim!.speed = moving
      ? Math.max(0.15, Math.min(1, speed / 1.4))
      : 1;
    this.state =
      speed > 5.2 ? "sprint" : speed > 2.3 ? "run" : moving ? "walk" : "idle";
    this.source = "imported";
  }
}
