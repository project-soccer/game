import * as pc from "playcanvas";
import type { Footballer, Snapshot } from "@project-soccer/game-core";
import { CharacterMotion } from "./character-motion.ts";

/** Authored locomotion and experimental recorded shots; other actions use the labelled fallback. */
export class ImportedMotion {
  private legacy: CharacterMotion;
  private model: pc.Entity;
  private rest: { node: pc.GraphNode; position: pc.Vec3; rotation: pc.Quat }[];
  private procedural = false;
  private moving = false;
  private shotStart = -1;
  private shotClip = "soccer-kick-a";
  private shooting = false;
  private entryPose: { position: pc.Vec3; rotation: pc.Quat }[] = [];
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
            { name: "soccer-kick-a", loop: false, speed: 1 },
            { name: "soccer-kick-b", loop: false, speed: 1 },
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
        track.name === "idle" || track.name.startsWith("soccer-")
          ? track.name
          : `move.${track.name}`,
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
    shotChoice = "soccer-kick-a",
  ) {
    const recordedShot =
      useImported && p.action?.name === "shot" && shotChoice !== "procedural";
    const fallback = !useImported || (!!p.action && !recordedShot);
    if (fallback !== this.procedural) {
      for (const r of this.rest) {
        r.node.setLocalPosition(r.position);
        r.node.setLocalRotation(r.rotation);
      }
      this.model.anim!.enabled = !fallback;
      this.procedural = fallback;
      this.shooting = false;
      this.shotStart = -1;
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
    const layer = this.model.anim!.baseLayer!;
    if (recordedShot && p.action) {
      if (this.shotStart !== p.action.start || !this.shooting) {
        this.entryPose = this.rest.map(({ node }) => ({
          position: node.getLocalPosition().clone(),
          rotation: node.getLocalRotation().clone(),
        }));
        this.shotClip = shotChoice;
        this.shotStart = p.action.start;
        layer.play(this.shotClip);
      }
      this.shooting = true;
      // Both trimmed takes have a provisional contact annotation at 0.30 s.
      // Synchronize preparation/contact/recovery to authoritative action ticks.
      const a = p.action;
      const clipTime =
        tick <= a.contact
          ? Math.max(0, (tick - a.start) / (a.contact - a.start)) * 0.3
          : 0.3 + Math.min(1, (tick - a.contact) / (a.end - a.contact)) * 0.55;
      this.model.anim!.speed = 0;
      layer.activeStateCurrentTime = clipTime;
      this.model.anim!.update(0);
      const blend = Math.min(1, Math.max(0, (tick - a.start) / 4));
      if (blend < 1)
        for (const [i, { node }] of this.rest.entries()) {
          node.setLocalPosition(
            new pc.Vec3().lerp(
              this.entryPose[i].position,
              node.getLocalPosition(),
              blend,
            ),
          );
          node.setLocalRotation(
            new pc.Quat().slerp(
              this.entryPose[i].rotation,
              node.getLocalRotation(),
              blend,
            ),
          );
        }
      const toe = this.model.findByName("toe2-1.R")!.getPosition();
      this.contactError = Math.hypot(
        toe.x - ball.x,
        toe.y - ball.y,
        toe.z - ball.z,
      );
      this.state = "shot";
      this.source =
        this.shotClip === "soccer-kick-a" ? "CMU kick A" : "CMU kick B";
      return;
    }
    const speed = Math.hypot(p.vx, p.vz),
      moving = speed > 0.12;
    if (this.shooting || moving !== this.moving) {
      this.model.anim!.baseLayer!.transition(moving ? "move" : "idle", 0.18);
      this.moving = moving;
    }
    this.shooting = false;
    this.shotStart = -1;
    this.model.anim!.setFloat("pace", Math.max(1.4, Math.min(7, speed)));
    this.model.anim!.speed = moving
      ? Math.max(0.15, Math.min(1, speed / 1.4))
      : 1;
    this.state =
      speed > 5.2 ? "sprint" : speed > 2.3 ? "run" : moving ? "walk" : "idle";
    this.source = "imported";
    this.contactError = 0;
  }
}
