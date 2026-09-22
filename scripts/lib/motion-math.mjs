import { readFileSync, writeFileSync } from "node:fs";
const identity = [0, 0, 0, 1];
const add = (a, b) => a.map((v, k) => v + b[k]),
  sub = (a, b) => a.map((v, k) => v - b[k]);
const norm = (v) => {
  const n = Math.hypot(...v);
  return v.map((x) => x / (n || 1));
};
const inv = (q) => [-q[0], -q[1], -q[2], q[3]];
const mul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const rotate = (q, v) => mul(mul(q, [...v, 0]), inv(q)).slice(0, 3);
function align(a, b) {
  a = norm(a);
  b = norm(b);
  const d = a.reduce((s, x, i) => s + x * b[i], 0);
  if (d < -0.9999) throw Error("Antiparallel bind direction");
  return norm([
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
    1 + d,
  ]);
}
function slerp(a, b, t) {
  let dot = a.reduce((s, v, i) => s + v * b[i], 0);
  if (dot < 0) {
    b = b.map((x) => -x);
    dot = -dot;
  }
  if (dot > 0.9995) return norm(a.map((v, i) => v + (b[i] - v) * t));
  const theta = Math.acos(Math.min(1, dot)),
    d = Math.sin(theta);
  return a.map(
    (v, i) => (v * Math.sin((1 - t) * theta) + b[i] * Math.sin(t * theta)) / d,
  );
}
function read(path) {
  const bytes = readFileSync(path),
    len = bytes.readUInt32LE(12),
    json = JSON.parse(bytes.subarray(20, 20 + len));
  return { json, bin: bytes.subarray(28 + len) };
}
function hierarchy(doc) {
  const nodes = doc.json.nodes,
    parents = nodes.map(() => -1);
  nodes.forEach((n, i) => n.children?.forEach((c) => (parents[c] = i)));
  return { nodes, parents, byName: new Map(nodes.map((n, i) => [n.name, i])) };
}
function globals(h, translations, rotations) {
  const out = [];
  function visit(i) {
    if (out[i]) return out[i];
    const parent = h.parents[i],
      q = rotations?.[i] ?? h.nodes[i].rotation ?? identity,
      p = translations?.[i] ?? h.nodes[i].translation ?? [0, 0, 0];
    if (parent < 0) return (out[i] = { p, q });
    const a = visit(parent);
    return (out[i] = { p: add(a.p, rotate(a.q, p)), q: mul(a.q, q) });
  }
  h.nodes.forEach((_, i) => visit(i));
  return out;
}

export {
  identity,
  add,
  sub,
  norm,
  inv,
  mul,
  rotate,
  align,
  slerp,
  read,
  hierarchy,
  globals,
};

export function appendClip(doc, name, times, tracks) {
  const chunks = [doc.bin];
  let length = doc.bin.length;
  function accessor(values, type) {
    const bytes = Buffer.from(new Float32Array(values.flat()).buffer);
    const bufferView = doc.json.bufferViews.length;
    doc.json.bufferViews.push({
      buffer: 0,
      byteOffset: length,
      byteLength: bytes.length,
    });
    chunks.push(bytes);
    length += bytes.length;
    doc.json.accessors.push({
      bufferView,
      componentType: 5126,
      count: values.length,
      type,
      ...(type === "SCALAR" ? { min: [values[0]], max: [values.at(-1)] } : {}),
    });
    return doc.json.accessors.length - 1;
  }
  const input = accessor(times, "SCALAR"),
    animation = { name, channels: [], samplers: [] };
  for (const { node, path, values } of tracks) {
    animation.channels.push({
      sampler: animation.samplers.length,
      target: { node, path },
    });
    animation.samplers.push({
      input,
      output: accessor(values, path === "rotation" ? "VEC4" : "VEC3"),
      interpolation: "LINEAR",
    });
  }
  doc.json.animations.push(animation);
  doc.bin = Buffer.concat(chunks);
  doc.json.buffers = [{ byteLength: length }];
}
export function writeGLB(path, doc) {
  const data = Buffer.from(JSON.stringify(doc.json));
  const json = Buffer.alloc(Math.ceil(data.length / 4) * 4, 32);
  data.copy(json);
  const header = Buffer.alloc(12),
    jh = Buffer.alloc(8),
    bh = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + json.length + doc.bin.length, 8);
  jh.writeUInt32LE(json.length);
  jh.writeUInt32LE(0x4e4f534a, 4);
  bh.writeUInt32LE(doc.bin.length);
  bh.writeUInt32LE(0x004e4942, 4);
  writeFileSync(path, Buffer.concat([header, jh, json, bh, doc.bin]));
}
