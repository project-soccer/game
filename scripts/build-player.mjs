/** Original Project Soccer articulated test rig. No third-party models or motion data. */
import { mkdirSync, writeFileSync } from "node:fs";
const chunks = [];
let length = 0;
const gltf = {
  asset: { version: "2.0", generator: "Project Soccer procedural rig builder" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "Footballer", children: [] }],
  meshes: [],
  skins: [],
  materials: [],
  animations: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};
function accessor(values, type, componentType = 5126, extra = {}) {
  const arr =
    componentType === 5123 ? new Uint16Array(values) : new Float32Array(values);
  const b = Buffer.from(arr.buffer);
  const aligned = Buffer.alloc(Math.ceil(b.length / 4) * 4);
  b.copy(aligned);
  const view = gltf.bufferViews.length;
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: length,
    byteLength: b.length,
  });
  chunks.push(aligned);
  length += aligned.length;
  const size = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type];
  gltf.accessors.push({
    bufferView: view,
    componentType,
    count: values.length / size,
    type,
    ...extra,
  });
  return gltf.accessors.length - 1;
}
const joints = [],
  positions = [];
function joint(name, parent, xyz) {
  const id = gltf.nodes.length;
  gltf.nodes.push({ name, translation: xyz, children: [] });
  gltf.nodes[parent].children.push(id);
  joints.push(id);
  const base = positions[joints.indexOf(parent)] ?? [0, 0, 0];
  positions.push(xyz.map((x, i) => x + base[i]));
  return id;
}
const hip = joint("hips", 0, [0, 0.94, 0]),
  spine = joint("spine", hip, [0, 0.26, 0]),
  head = joint("head", spine, [0, 0.47, 0]);
const armL = joint("arm_L", spine, [0.29, 0.15, 0]),
  armR = joint("arm_R", spine, [-0.29, 0.15, 0]);
const thighL = joint("thigh_L", hip, [0.13, -0.02, 0]),
  kneeL = joint("knee_L", thighL, [0, -0.4, 0]);
const thighR = joint("thigh_R", hip, [-0.13, -0.02, 0]),
  kneeR = joint("knee_R", thighR, [0, -0.4, 0]);
const inv = [];
for (const [x, y, z] of positions)
  inv.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -x, -y, -z, 1);
gltf.skins.push({
  joints,
  skeleton: hip,
  inverseBindMatrices: accessor(inv, "MAT4"),
});
const colors = {
  kit: [0.91, 0.94, 0.96, 1],
  skin: [0.6, 0.36, 0.23, 1],
  shorts: [0.07, 0.1, 0.16, 1],
  socks: [0.83, 0.91, 0.96, 1],
  boots: [0.04, 0.055, 0.07, 1],
  hair: [0.045, 0.027, 0.02, 1],
};
const parts = {};
for (const [name, color] of Object.entries(colors)) {
  parts[name] = [];
  gltf.materials.push({
    name,
    pbrMetallicRoughness: {
      baseColorFactor: color,
      metallicFactor: 0,
      roughnessFactor: 0.85,
    },
  });
}
function box(mat, j, center, size) {
  parts[mat].push({ j, center, size });
}
box("kit", spine, [0, 1.26, 0], [0.48, 0.55, 0.26]);
box("shorts", hip, [0, 0.92, 0], [0.4, 0.22, 0.28]);
box("skin", head, [0, 1.7, 0], [0.25, 0.28, 0.25]);
box("hair", head, [0, 1.845, -0.015], [0.26, 0.055, 0.26]);
for (const [arm, thigh, knee, x] of [
  [armL, thighL, kneeL, 0.13],
  [armR, thighR, kneeR, -0.13],
]) {
  box("kit", arm, [x > 0 ? 0.31 : -0.31, 1.35, 0], [0.17, 0.24, 0.22]);
  box("skin", arm, [x > 0 ? 0.32 : -0.32, 1.12, 0], [0.13, 0.3, 0.16]);
  box("skin", thigh, [x, 0.73, 0], [0.17, 0.3, 0.2]);
  box("socks", knee, [x, 0.31, 0], [0.15, 0.38, 0.18]);
  box("boots", knee, [x, 0.09, 0.09], [0.19, 0.13, 0.34]);
}
const faces = [
  [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
    [1, 0, 1],
  ],
  [
    [-1, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
    [0, 0, 0],
  ],
  [
    [0, 1, 0],
    [0, 1, 1],
    [1, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ],
  [
    [0, -1, 0],
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
  ],
  [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
    [0, 0, 1],
  ],
  [
    [0, 0, -1],
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [1, 0, 0],
  ],
];
for (const [mat, boxes] of Object.entries(parts)) {
  const pos = [],
    norm = [],
    weights = [],
    ji = [],
    indices = [];
  for (const { j, center, size } of boxes)
    for (const [normal, ...verts] of faces) {
      const start = pos.length / 3;
      for (const v of verts) {
        pos.push(...v.map((n, k) => center[k] + (n - 0.5) * size[k]));
        norm.push(...normal);
        weights.push(1, 0, 0, 0);
        ji.push(joints.indexOf(j), 0, 0, 0);
      }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
  const min = [0, 1, 2].map((k) =>
      Math.min(...pos.filter((_, i) => i % 3 === k)),
    ),
    max = [0, 1, 2].map((k) => Math.max(...pos.filter((_, i) => i % 3 === k)));
  const mesh = gltf.meshes.length;
  gltf.meshes.push({
    primitives: [
      {
        attributes: {
          POSITION: accessor(pos, "VEC3", 5126, { min, max }),
          NORMAL: accessor(norm, "VEC3"),
          JOINTS_0: accessor(ji, "VEC4", 5123),
          WEIGHTS_0: accessor(weights, "VEC4"),
        },
        indices: accessor(indices, "SCALAR", 5123),
        material: Object.keys(parts).indexOf(mat),
      },
    ],
  });
  const node = gltf.nodes.length;
  gltf.nodes.push({ name: mat, mesh, skin: 0 });
  gltf.nodes[0].children.push(node);
}
function clip(name, duration, fn) {
  const anim = { name, samplers: [], channels: [] };
  const times = Array.from({ length: 25 }, (_, i) => (i * duration) / 24);
  const ti = accessor(times, "SCALAR", 5126, { min: [0], max: [duration] });
  for (const j of [armL, armR, thighL, thighR, kneeL, kneeR, spine]) {
    const values = [];
    for (let n = 0; n < 25; n++) {
      const a = fn(j, n / 24);
      values.push(Math.sin(a / 2), 0, 0, Math.cos(a / 2));
    }
    const sampler = anim.samplers.length;
    anim.samplers.push({
      input: ti,
      output: accessor(values, "VEC4"),
      interpolation: "LINEAR",
    });
    anim.channels.push({ sampler, target: { node: j, path: "rotation" } });
  }
  gltf.animations.push(anim);
}
clip("idle", 2, (j, t) => (j === spine ? 0.02 * Math.sin(t * Math.PI * 2) : 0));
for (const [name, dur, amp] of [
  ["run", 0.7, 0.65],
  ["sprint", 0.5, 0.9],
])
  clip(name, dur, (j, t) => {
    const wave = Math.sin(t * Math.PI * 2);
    if (j === thighL || j === armR) return wave * amp;
    if (j === thighR || j === armL) return -wave * amp;
    if (j === kneeL) return Math.max(0, -wave) * 0.9;
    if (j === kneeR) return Math.max(0, wave) * 0.9;
    return 0.08;
  });
// The forward leg crosses the ball at the server's contact phase.
for (const [name, dur, contact] of [
  ["pass", 32 / 60, 10 / 60],
  ["shot", 43 / 60, 14 / 60],
  ["tackle", 32 / 60, 8 / 60],
])
  clip(name, dur, (j, t) => {
    const time = t * dur;
    const kick =
      time < contact
        ? 0.5 * Math.sin((time / contact) * Math.PI) -
          0.85 * (time / contact) ** 4
        : -0.85 * Math.max(0, 1 - (time - contact) / (dur - contact));
    if (j === thighR) return kick;
    if (j === kneeR) return Math.max(0, kick) * 0.8;
    if (j === armL) return -0.3 * Math.sin(t * Math.PI);
    if (j === armR) return 0.35 * Math.sin(t * Math.PI);
    if (j === spine) return -0.12 * Math.sin(t * Math.PI);
    return 0;
  });
clip("receive", 0.3, (j, t) =>
  j === thighR ? -0.25 * Math.sin(t * Math.PI) : 0,
);
gltf.buffers.push({ byteLength: length });
const json = Buffer.from(JSON.stringify(gltf));
const jp = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
json.copy(jp);
const bin = Buffer.concat(chunks);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jp.length + 8 + bin.length, 8);
const jh = Buffer.alloc(8);
jh.writeUInt32LE(jp.length);
jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8);
bh.writeUInt32LE(bin.length);
bh.writeUInt32LE(0x004e4942, 4);
mkdirSync("client/public/assets", { recursive: true });
writeFileSync(
  "client/public/assets/footballer.glb",
  Buffer.concat([header, jh, jp, bh, bin]),
);
console.log(
  `Wrote original footballer: ${joints.length} joints, ${gltf.animations.length} clips.`,
);
