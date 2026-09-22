import * as pc from "playcanvas";
import { BALL_RADIUS } from "@project-soccer/game-core";

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (v: V3) => scale(v, 1 / Math.hypot(...v));

/** Original spherical truncated-icosahedron panels, in metres. */
export function footballPanels() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const ico: V3[] = [];
  for (const a of [-1, 1])
    for (const b of [-phi, phi]) {
      ico.push([0, a, b], [a, b, 0], [b, 0, a]);
    }
  const neighbours = ico.map((a, i) =>
    ico.flatMap((b, j) =>
      i !== j && Math.abs(Math.hypot(...add(a, scale(b, -1))) - 2) < 1e-6
        ? [j]
        : [],
    ),
  );
  const cut = (i: number, j: number) => unit(add(scale(ico[i], 2), ico[j]));
  const faces: { dark: boolean; corners: V3[] }[] = neighbours.map((ns, i) => ({
    dark: true,
    corners: ns.map((j) => cut(i, j)),
  }));
  for (let i = 0; i < ico.length; i++)
    for (const j of neighbours[i])
      for (const k of neighbours[j]) {
        if (i < j && j < k && neighbours[k].includes(i))
          faces.push({
            dark: false,
            corners: [
              cut(i, j),
              cut(j, i),
              cut(j, k),
              cut(k, j),
              cut(k, i),
              cut(i, k),
            ],
          });
      }
  return faces.map(({ dark, corners }) => {
    const center = unit(corners.reduce(add, [0, 0, 0] as V3));
    const u = unit(add(corners[0], scale(center, -dot(corners[0], center))));
    const v = cross(center, u);
    corners.sort(
      (a, b) =>
        Math.atan2(dot(a, v), dot(a, u)) - Math.atan2(dot(b, v), dot(b, u)),
    );
    const perimeter: V3[] = [];
    for (let i = 0; i < corners.length; i++)
      for (let step = 0; step < 6; step++) {
        const edge = add(
          scale(corners[i], 1 - step / 6),
          scale(corners[(i + 1) % corners.length], step / 6),
        );
        // An inset leaves a narrow recessed seam, without texture pole/stretch artifacts.
        perimeter.push(unit(add(scale(edge, 0.983), scale(center, 0.017))));
      }
    const positions = [...scale(center, BALL_RADIUS)];
    const normals = [...center];
    const indices: number[] = [];
    const count = perimeter.length,
      rings = 4;
    for (let ring = 1; ring <= rings; ring++)
      for (const edge of perimeter) {
        const t = ring / rings;
        const normal = unit(add(scale(center, 1 - t), scale(edge, t)));
        positions.push(...scale(normal, BALL_RADIUS - 0.00045 * t ** 6));
        normals.push(...normal);
      }
    for (let i = 0; i < count; i++)
      indices.push(0, 1 + i, 1 + ((i + 1) % count));
    for (let ring = 1; ring < rings; ring++)
      for (let i = 0; i < count; i++) {
        const a = 1 + (ring - 1) * count + i,
          b = 1 + (ring - 1) * count + ((i + 1) % count);
        indices.push(a, a + count, b + count, a, b + count, b);
      }
    return { dark, positions, normals, indices };
  });
}

export function createFootball(app: pc.Application) {
  const root = new pc.Entity("ball");
  const surface = (name: string, color: string, gloss: number) => {
    const m = new pc.StandardMaterial();
    m.name = name;
    m.diffuse = new pc.Color().fromString(color);
    m.useMetalness = true;
    m.metalness = 0;
    m.gloss = gloss;
    m.update();
    return m;
  };
  const seams = new pc.Entity("recessed seams");
  seams.addComponent("render", {
    type: "sphere",
    material: surface("seams", "#333d40", 0.1),
    castShadows: true,
  });
  seams.setLocalScale(
    2 * (BALL_RADIUS - 0.0009),
    2 * (BALL_RADIUS - 0.0009),
    2 * (BALL_RADIUS - 0.0009),
  );
  root.addChild(seams);
  const panels = footballPanels();
  const instances: pc.MeshInstance[] = [];
  for (const dark of [false, true]) {
    const positions: number[] = [],
      normals: number[] = [],
      indices: number[] = [];
    for (const p of panels.filter((p) => p.dark === dark)) {
      const offset = positions.length / 3;
      positions.push(...p.positions);
      normals.push(...p.normals);
      indices.push(...p.indices.map((i) => i + offset));
    }
    const mesh = new pc.Mesh(app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setIndices(indices);
    mesh.update();
    instances.push(
      new pc.MeshInstance(
        mesh,
        surface(
          dark ? "black pentagons" : "ivory hexagons",
          dark ? "#162027" : "#e6e5df",
          0.32,
        ),
      ),
    );
  }
  root.addComponent("render", {
    meshInstances: instances,
    castShadows: true,
    receiveShadows: true,
  });
  root.setPosition(-4.35, BALL_RADIUS + 0.01, 0);
  app.root.addChild(root);
  return root;
}

/** Soft local contact cue; avoids the old bright solid disc beneath the ball. */
export function createBallShadow(app: pc.Application) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 4, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new pc.Texture(app.graphicsDevice, { mipmaps: false });
  texture.setSource(canvas);
  const material = new pc.StandardMaterial();
  material.diffuse = new pc.Color(0.01, 0.025, 0.02);
  material.opacityMap = texture;
  material.opacityMapChannel = "a";
  material.blendType = pc.BLEND_NORMAL;
  material.depthWrite = false;
  material.update();
  const shadow = new pc.Entity("ball contact shadow");
  shadow.addComponent("render", {
    type: "plane",
    material,
    castShadows: false,
  });
  shadow.setLocalScale(0.36, 1, 0.36);
  app.root.addChild(shadow);
  return shadow;
}
