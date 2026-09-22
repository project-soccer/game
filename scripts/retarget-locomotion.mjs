import {
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
} from "./lib/motion-math.mjs";
// Offline conversion of CC0 authored motion to our existing MakeHuman-derived rig.
// Source poses are sampled unchanged; only bone mapping, bind-pose correction,
// scale, root travel removal and ground-height compensation are applied.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const folder = "assets/source/quaternius/";
const manifest = JSON.parse(readFileSync(folder + "sources.json"));
for (const f of manifest.files)
  if (
    createHash("sha256")
      .update(readFileSync(folder + f.file))
      .digest("hex") !== f.sha256
  )
    throw Error("Source checksum mismatch: " + f.file);
const source = read(folder + "UAL1_Standard_RM.glb"),
  target = read("client/public/assets/footballer-detail.glb");
function values(doc, index) {
  const a = doc.json.accessors[index],
    v = doc.json.bufferViews[a.bufferView],
    count = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
  if (a.componentType !== 5126 || v.byteStride || a.sparse)
    throw Error("Unsupported animation accessor");
  return Array.from({ length: a.count }, (_, i) =>
    Array.from({ length: count }, (_, k) =>
      doc.bin.readFloatLE(
        (v.byteOffset ?? 0) + (a.byteOffset ?? 0) + (i * count + k) * 4,
      ),
    ),
  );
}
const S = hierarchy(source),
  T = hierarchy(target);
const sr = globals(S),
  tr = globals(T);
const map = {
  root: "pelvis",
  spine05: "spine_01",
  spine03: "spine_02",
  spine01: "spine_03",
  neck01: "neck_01",
  head: "Head",
};
const ends = {};
for (const side of ["L", "R"]) {
  const s = side.toLowerCase();
  for (const [dest, src, end, send] of [
    ["clavicle", "clavicle", "upperarm01", "upperarm"],
    ["upperarm01", "upperarm", "lowerarm01", "lowerarm"],
    ["lowerarm01", "lowerarm", "wrist", "hand"],
    ["wrist", "hand", "finger3-1", "middle_01"],
    ["upperleg01", "thigh", "lowerleg01", "calf"],
    ["lowerleg01", "calf", "foot", "foot"],
    ["foot", "foot", null, null],
  ]) {
    map[`${dest}.${side}`] = `${src}_${s}`;
    if (end) ends[`${dest}.${side}`] = [`${end}.${side}`, `${send}_${s}`];
  }
  for (const [i, finger] of [
    "thumb",
    "index",
    "middle",
    "ring",
    "pinky",
  ].entries())
    for (let part = 1; part <= 3; part++) {
      const name = `finger${i + 1}-${part}.${side}`;
      map[name] = `${finger}_0${part}_${s}`;
      if (part < 3)
        ends[name] = [
          `finger${i + 1}-${part + 1}.${side}`,
          `${finger}_0${part + 1}_${s}`,
        ];
    }
}
const mapping = new Map();
for (const [to, from] of Object.entries(map)) {
  const ti = T.byName.get(to),
    si = S.byName.get(from);
  if (ti === undefined || si === undefined)
    throw Error("Missing joint " + to + " / " + from);
  const end = ends[to];
  const correction = end
    ? align(
        sub(tr[T.byName.get(end[0])].p, tr[ti].p),
        sub(sr[S.byName.get(end[1])].p, sr[si].p),
      )
    : identity;
  mapping.set(ti, { si, correction });
}
const targetRoot = T.byName.get("root"),
  sourceRoot = S.byName.get("root"),
  sourceHips = S.byName.get("pelvis");
const ratio =
  (tr[T.byName.get("upperleg01.L")].p[1] - tr[T.byName.get("foot.L")].p[1]) /
  (sr[S.byName.get("thigh_l")].p[1] - sr[S.byName.get("foot_l")].p[1]);
const chunks = [target.bin];
let length = target.bin.length;
function accessor(array, type) {
  const bytes = Buffer.from(new Float32Array(array.flat()).buffer),
    view = target.json.bufferViews.length;
  target.json.bufferViews.push({
    buffer: 0,
    byteOffset: length,
    byteLength: bytes.length,
  });
  chunks.push(bytes);
  length += bytes.length;
  const index = target.json.accessors.length;
  target.json.accessors.push({
    bufferView: view,
    componentType: 5126,
    count: array.length,
    type,
    ...(type === "SCALAR"
      ? { min: [array[0][0]], max: [array.at(-1)[0]] }
      : {}),
  });
  return index;
}
const clips = {
  idle: "Idle_Loop",
  walk: "Walk_Loop",
  run: "Jog_Fwd_Loop",
  sprint: "Sprint_Loop",
};
const report = {
  source: manifest.page,
  version: manifest.version,
  license: manifest.license,
  scale: ratio,
  mappedBones: mapping.size,
  clips: {},
};
target.json.animations = [];
for (const [name, original] of Object.entries(clips)) {
  const anim = source.json.animations.find((a) => a.name === original);
  if (!anim) throw Error("Missing clip " + original);
  const channels = anim.channels.map((c) => {
    const s = anim.samplers[c.sampler];
    if (s.interpolation && s.interpolation !== "LINEAR")
      throw Error("Unsupported interpolation");
    return {
      ...c,
      t: values(source, s.input).map((v) => v[0]),
      v: values(source, s.output),
    };
  });
  const duration = Math.max(...channels.map((c) => c.t.at(-1))),
    frames = Math.round(duration * 30),
    times = Array.from(
      { length: frames + 1 },
      (_, i) => (i * duration) / frames,
    );
  const rotations = new Map([...mapping.keys()].map((i) => [i, []])),
    translations = [];
  for (const time of times) {
    const sp = [],
      sq = [];
    for (const c of channels) {
      if (c.target.path === "scale") continue;
      let i = 0;
      while (i < c.t.length - 2 && c.t[i + 1] < time) i++;
      const j = Math.min(i + 1, c.t.length - 1),
        f = c.t[j] === c.t[i] ? 0 : (time - c.t[i]) / (c.t[j] - c.t[i]);
      const v =
        c.target.path === "rotation"
          ? slerp(c.v[i], c.v[j], f)
          : c.v[i].map((a, k) => a + (c.v[j][k] - a) * f);
      (c.target.path === "rotation" ? sq : sp)[c.target.node] = v;
    }
    const sg = globals(S, sp, sq),
      world = [],
      local = [];
    function pose(i) {
      if (world[i]) return world[i];
      const parent = T.parents[i],
        pq = parent < 0 ? identity : pose(parent),
        m = mapping.get(i);
      if (!m) return (world[i] = pq);
      const q = norm(mul(mul(sg[m.si].q, inv(sr[m.si].q)), m.correction));
      local[i] = norm(mul(inv(pq), q));
      return (world[i] = q);
    }
    T.nodes.forEach((_, i) => pose(i));
    // Retain authored hip sway and bob; authoritative movement owns world travel.
    const hipOffset = sub(
      sub(sg[sourceHips].p, sg[sourceRoot].p),
      sub(sr[sourceHips].p, sr[sourceRoot].p),
    ).map((v) => v * ratio);
    const tp = [];
    tp[targetRoot] = add(T.nodes[targetRoot].translation, hipOffset);
    let tg = globals(T, tp, local);
    let floor = Infinity;
    for (const side of ["L", "R"]) {
      const fi = T.byName.get("foot." + side),
        restY = tr[fi].p[1];
      for (const z of [-0.045, 0.13])
        floor = Math.min(
          floor,
          add(tg[fi].p, rotate(tg[fi].q, [0, -restY + 0.018, z]))[1],
        );
    }
    tp[targetRoot][1] += 0.018 - floor;
    translations.push(tp[targetRoot]);
    for (const [i, list] of rotations) {
      let q = local[i];
      if (list.length && list.at(-1).reduce((s, v, k) => s + v * q[k], 0) < 0)
        q = q.map((v) => -v);
      list.push(q);
    }
  }
  const a = { name, channels: [], samplers: [] },
    input = accessor(
      times.map((t) => [t]),
      "SCALAR",
    );
  function channel(node, path, v, type) {
    a.channels.push({ sampler: a.samplers.length, target: { node, path } });
    a.samplers.push({
      input,
      output: accessor(v, type),
      interpolation: "LINEAR",
    });
  }
  for (const [i, list] of rotations) channel(i, "rotation", list, "VEC4");
  channel(targetRoot, "translation", translations, "VEC3");
  target.json.animations.push(a);
  report.clips[name] = { source: original, duration, frames: times.length };
}
target.json.asset.generator = "Project Soccer CC0 offline animation retarget";
target.json.asset.copyright +=
  " Authored motion: Quaternius / Gonzalo Furnier, CC0.";
target.json.buffers = [{ byteLength: length }];
const data = Buffer.from(JSON.stringify(target.json)),
  json = Buffer.alloc(Math.ceil(data.length / 4) * 4, 32);
data.copy(json);
const bin = Buffer.concat(chunks),
  header = Buffer.alloc(12),
  jh = Buffer.alloc(8),
  bh = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + bin.length, 8);
jh.writeUInt32LE(json.length);
jh.writeUInt32LE(0x4e4f534a, 4);
bh.writeUInt32LE(bin.length);
bh.writeUInt32LE(0x004e4942, 4);
writeFileSync(
  "client/public/assets/footballer-animated.glb",
  Buffer.concat([header, jh, json, bh, bin]),
);
writeFileSync(
  "client/public/assets/footballer-animated.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
