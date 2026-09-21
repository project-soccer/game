// MakeHuman CC0 graphical data + original Project Soccer kit/export logic.
// No MakeHuman application code is imported. See assets/source/makehuman/sources.json.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const source = "assets/source/makehuman/";
const manifest = JSON.parse(readFileSync(source + "sources.json"));
for (const file of manifest.files) {
  const bytes = readFileSync(source + file.path.split("/").at(-1));
  if (createHash("sha256").update(bytes).digest("hex") !== file.sha256)
    throw new Error("Source checksum mismatch");
}
const vertices = [],
  faces = [];
let group = "";
for (const line of readFileSync(source + "base.obj", "utf8").split("\n")) {
  const [kind, ...values] = line.trim().split(/\s+/);
  if (kind === "v") vertices.push(values.map(Number));
  if (kind === "g") group = values.join(" ");
  if (kind === "f")
    faces.push({ group, ids: values.map((v) => Number(v.split("/")[0]) - 1) });
}
for (const [file, factor] of [
  ["caucasian-male-young.target", 1],
  ["universal-male-young-maxmuscle-averageweight.target", 0.65],
]) {
  for (const line of readFileSync(source + file, "utf8").split("\n")) {
    if (!/^\d+\s/.test(line)) continue;
    const [id, ...delta] = line.trim().split(/\s+/).map(Number);
    delta.forEach((d, k) => (vertices[id][k] += d * factor));
  }
}
const bodyIds = new Set(
  faces.filter((f) => f.group === "body").flatMap((f) => f.ids),
);
const ground = Math.min(...[...bodyIds].map((i) => vertices[i][1]));
const top = Math.max(...[...bodyIds].map((i) => vertices[i][1]));
const scale = 1.83 / (top - ground);
for (const p of vertices) {
  p[0] *= scale;
  p[1] = (p[1] - ground) * scale + 0.018;
  p[2] *= scale;
}
const rig = JSON.parse(readFileSync(source + "default.mhskel"));
const weights = JSON.parse(
  readFileSync(source + "default_weights.mhw"),
).weights;
const chunks = [];
let length = 0;
const gltf = {
  asset: {
    version: "2.0",
    generator: "Project Soccer CC0 character proof",
    copyright:
      "MakeHuman contributors: CC0 graphical base. See THIRD_PARTY_ASSETS.md.",
  },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "DetailedFootballer", children: [] }],
  meshes: [],
  skins: [],
  materials: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};
function accessor(values, type, componentType = 5126, extra = {}) {
  const arr =
    componentType === 5123
      ? new Uint16Array(values)
      : componentType === 5125
        ? new Uint32Array(values)
        : new Float32Array(values);
  const bytes = Buffer.from(arr.buffer),
    padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4);
  bytes.copy(padded);
  const bufferView = gltf.bufferViews.length;
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: length,
    byteLength: bytes.length,
  });
  chunks.push(padded);
  length += padded.length;
  gltf.accessors.push({
    bufferView,
    componentType,
    count: values.length / { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type],
    type,
    ...extra,
  });
  return gltf.accessors.length - 1;
}
const names = [],
  positions = [],
  nodes = new Map();
function bone(name) {
  if (nodes.has(name)) return nodes.get(name);
  const b = rig.bones[name],
    parent = b.parent ? bone(b.parent) : 0;
  const ids = rig.joints[b.head];
  const pos = [0, 1, 2].map(
    (k) => ids.reduce((sum, id) => sum + vertices[id][k], 0) / ids.length,
  );
  const pp = b.parent ? positions[names.indexOf(b.parent)] : [0, 0, 0];
  const node = gltf.nodes.length;
  gltf.nodes.push({
    name,
    translation: pos.map((v, k) => v - pp[k]),
    children: [],
  });
  gltf.nodes[parent].children.push(node);
  nodes.set(name, node);
  names.push(name);
  positions.push(pos);
  return node;
}
for (const name of Object.keys(rig.bones)) bone(name);
const inv = positions.flatMap(([x, y, z]) => [
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  -x,
  -y,
  -z,
  1,
]);
gltf.skins.push({
  skeleton: nodes.get("root"),
  joints: names.map((n) => nodes.get(n)),
  inverseBindMatrices: accessor(inv, "MAT4"),
});
const skinWeights = vertices.map(() => []);
for (const [name, list] of Object.entries(weights))
  for (const [id, weight] of list)
    skinWeights[id].push([names.indexOf(name), weight]);
for (const [i, w] of skinWeights.entries()) {
  w.sort((a, b) => b[1] - a[1]);
  w.length = Math.min(w.length, 4);
  if (!w.length) w.push([names.indexOf("head"), 1]);
  const total = w.reduce((sum, p) => sum + p[1], 0);
  w.forEach((p) => (p[1] /= total));
  while (w.length < 4) w.push([0, 0]);
}
const materials = {
  skin: [0.56, 0.3, 0.19, 1],
  kit: [0.13, 0.57, 0.54, 1],
  shorts: [0.018, 0.045, 0.075, 1],
  socks: [0.83, 0.9, 0.85, 1],
  boots: [0.02, 0.025, 0.033, 1],
  hair: [0.026, 0.018, 0.014, 1],
  trim: [0.86, 0.92, 0.85, 1],
  eyes: [0.9, 0.89, 0.83, 1],
  iris: [0.06, 0.09, 0.08, 1],
};
for (const [name, color] of Object.entries(materials))
  gltf.materials.push({
    name,
    doubleSided: false,
    pbrMetallicRoughness: {
      baseColorFactor: color,
      metallicFactor: 0,
      roughnessFactor: name === "skin" ? 0.62 : name === "boots" ? 0.38 : 0.86,
    },
  });
const surfaces = new Map(Object.keys(materials).map((n) => [n, []]));
const normal = vertices.map(() => [0, 0, 0]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
for (const f of faces) {
  const [a, b, c] = f.ids.map((i) => vertices[i]);
  const n = cross(
    b.map((v, k) => v - a[k]),
    c.map((v, k) => v - a[k]),
  );
  for (const i of f.ids) for (let k = 0; k < 3; k++) normal[i][k] += n[k];
}
for (const n of normal) {
  const d = Math.hypot(...n) || 1;
  n.forEach((_, k) => (n[k] /= d));
}
const centroid = (ids) =>
  [0, 1, 2].map(
    (k) => ids.reduce((s, i) => s + vertices[i][k], 0) / ids.length,
  );
function clothing([x, y, z]) {
  if (y > 1.03 && y < 1.57 && (Math.abs(x) < 0.265 || y > 1.37)) return "kit";
  if (y >= 0.7 && y <= 1.055 && Math.abs(x) < 0.3) return "shorts";
  if (y < 0.5 && y > 0.14) return "socks";
  if (y <= 0.14) return "boots";
  return null;
}
for (const f of faces) {
  const c = centroid(f.ids),
    cloth = clothing(c);
  if (f.group === "body" && !cloth) {
    const scalp = c[1] > 1.715 + Math.max(0, c[2]) * 0.65;
    surfaces
      .get(scalp ? "hair" : "skin")
      .push({ ids: f.ids, inflate: scalp ? 0.002 : 0 });
  }
  if (f.group === "helper-tights" && cloth) {
    surfaces.get(cloth).push({
      ids: f.ids,
      inflate: cloth === "kit" ? 0.009 : cloth === "shorts" ? 0.015 : 0.004,
    });
  }
}
// Eyeballs and irises have actual rounded geometry, skinned to the head.
function ellipsoid(mat, center, radii) {
  const rows = 12,
    cols = 24,
    start = vertices.length;
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= cols; x++) {
      const a = (x / cols) * Math.PI * 2,
        b = (y / rows) * Math.PI;
      const n = [
        Math.sin(b) * Math.cos(a),
        Math.cos(b),
        Math.sin(b) * Math.sin(a),
      ];
      vertices.push(n.map((v, k) => center[k] + v * radii[k]));
      normal.push(n);
      skinWeights.push([
        [names.indexOf("head"), 1],
        [0, 0],
        [0, 0],
        [0, 0],
      ]);
    }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = start + y * (cols + 1) + x,
        b = a + cols + 1;
      surfaces.get(mat).push({ ids: [a, a + 1, b + 1, b], inflate: 0 });
    }
}
for (const side of ["L", "R"]) {
  const center = positions[names.indexOf("eye." + side)];
  ellipsoid("eyes", center, [0.014, 0.012, 0.013]);
  ellipsoid(
    "iris",
    [center[0], center[1], center[2] + 0.012],
    [0.006, 0.006, 0.002],
  );
}
let triangles = 0;
for (const [material, polygons] of surfaces) {
  if (!polygons.length) continue;
  const pos = [],
    norm = [],
    ji = [],
    sw = [],
    indices = [],
    mapped = new Map();
  for (const f of polygons) {
    const ids = f.ids.map((i) => {
      const key = `${i}:${f.inflate}`;
      if (mapped.has(key)) return mapped.get(key);
      const id = pos.length / 3;
      mapped.set(key, id);
      pos.push(...vertices[i].map((v, k) => v + normal[i][k] * f.inflate));
      norm.push(...normal[i]);
      ji.push(...skinWeights[i].map((w) => w[0]));
      sw.push(...skinWeights[i].map((w) => w[1]));
      return id;
    });
    for (let j = 1; j < ids.length - 1; j++) {
      indices.push(ids[0], ids[j], ids[j + 1]);
      triangles++;
    }
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
          WEIGHTS_0: accessor(sw, "VEC4"),
        },
        indices: accessor(indices, "SCALAR", 5125),
        material: Object.keys(materials).indexOf(material),
      },
    ],
  });
  const node = gltf.nodes.length;
  gltf.nodes.push({ name: material, mesh, skin: 0 });
  gltf.nodes[0].children.push(node);
}
gltf.buffers.push({ byteLength: length });
const json = Buffer.from(JSON.stringify(gltf)),
  jp = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
json.copy(jp);
const bin = Buffer.concat(chunks),
  header = Buffer.alloc(12),
  jh = Buffer.alloc(8),
  bh = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + jp.length + bin.length, 8);
jh.writeUInt32LE(jp.length);
jh.writeUInt32LE(0x4e4f534a, 4);
bh.writeUInt32LE(bin.length);
bh.writeUInt32LE(0x004e4942, 4);
writeFileSync(
  "client/public/assets/footballer-detail.glb",
  Buffer.concat([header, jh, jp, bh, bin]),
);
writeFileSync(
  "client/public/assets/footballer-detail.json",
  JSON.stringify(
    {
      height: 1.83,
      bones: Object.fromEntries(names.map((n, i) => [n, positions[i]])),
      triangles,
      license: "CC0-1.0 graphical base",
      sourceCommit: manifest.commit,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Detailed footballer: ${triangles} triangles, ${names.length} bones, ${(bin.length / 1024).toFixed(0)} KiB geometry.`,
);
