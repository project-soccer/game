// CMU's recorded soccer kicks, trimmed and adapted to the detailed footballer.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseASF, parseAMC, cmuPose, eulerXYZ } from "./lib/cmu-asf.mjs";
import {
  identity,
  add,
  sub,
  norm,
  inv,
  mul,
  rotate,
  align,
  read,
  hierarchy,
  globals,
  appendClip,
  writeGLB,
} from "./lib/motion-math.mjs";
const folder = "assets/source/cmu/",
  manifest = JSON.parse(readFileSync(folder + "sources.json"));
for (const f of manifest.files)
  if (
    createHash("sha256")
      .update(readFileSync(folder + f.file))
      .digest("hex") !== f.sha256
  )
    throw Error("CMU checksum mismatch: " + f.file);
const skeleton = parseASF(readFileSync(folder + "10.asf", "utf8"));
const rest = cmuPose(skeleton);
const target = read("client/public/assets/footballer-animated.glb"),
  T = hierarchy(target),
  tr = globals(T);
if (target.json.animations.some((a) => a.name.startsWith("soccer-")))
  throw Error("Rebuild locomotion before appending soccer clips");
const mapping = new Map();
function map(to, from, targetEnd, sourceEnd) {
  const ti = T.byName.get(to);
  if (ti === undefined || !rest[from])
    throw Error("Missing mapped bone: " + to + "/" + from);
  const correction = targetEnd
    ? align(
        sub(tr[T.byName.get(targetEnd)].p, tr[ti].p),
        sub(rest[sourceEnd].p, rest[from].p),
      )
    : identity;
  mapping.set(ti, { from, correction });
}
for (const [to, from] of [
  ["root", "root"],
  ["spine05", "lowerback"],
  ["spine03", "upperback"],
  ["spine01", "thorax"],
  ["neck01", "lowerneck"],
  ["head", "head"],
])
  map(to, from);
for (const side of ["L", "R"]) {
  const s = side.toLowerCase();
  for (const [to, from, te, se] of [
    ["clavicle", "clavicle", "upperarm01", "humerus"],
    ["upperarm01", "humerus", "lowerarm01", "radius"],
    ["lowerarm01", "radius", "wrist", "wrist"],
    ["wrist", "hand", "finger3-1", "fingers"],
    ["upperleg01", "femur", "lowerleg01", "tibia"],
    ["lowerleg01", "tibia", "foot", "foot"],
    ["foot", "foot", "toe2-1", "toes"],
  ])
    map(`${to}.${side}`, s + from, `${te}.${side}`, s + se);
}
const root = T.byName.get("root"),
  toe = T.byName.get("toe2-1.R");
const ratio =
  (tr[T.byName.get("upperleg01.L")].p[1] - tr[T.byName.get("foot.L")].p[1]) /
  (rest.lfemur.p[1] - rest.lfoot.p[1]);
const report = {
  source: "https://mocap.cs.cmu.edu/",
  sampleRate: 120,
  outputRate: 60,
  mappedBones: mapping.size,
  clips: {},
};
// Contact is a working annotation from foot trajectory, not recorded ball collision data.
for (const [name, file, contact] of [
  ["soccer-kick-a", "10_01.amc", 599],
  ["soccer-kick-b", "10_02.amc", 353],
]) {
  const frames = parseAMC(readFileSync(folder + file, "utf8"));
  const start = contact - 36,
    end = contact + 66;
  const impact = cmuPose(skeleton, frames[contact - 1]);
  const forward = sub(impact.rtoes.p, impact.root.p);
  const heading = eulerXYZ([
    0,
    (-Math.atan2(forward[0], forward[2]) * 180) / Math.PI,
    0,
  ]);
  const rotations = new Map([...mapping.keys()].map((i) => [i, []]));
  const translations = [],
    times = [],
    contacts = [],
    support = [];
  for (let frame = start; frame <= end; frame += 2) {
    const sg = cmuPose(skeleton, frames[frame - 1]);
    const world = [],
      local = [];
    function pose(i) {
      if (world[i]) return world[i];
      const parent = T.parents[i],
        pq = parent < 0 ? identity : pose(parent),
        m = mapping.get(i);
      if (!m) return (world[i] = pq);
      const q = norm(mul(mul(heading, sg[m.from].q), m.correction));
      local[i] = norm(mul(inv(pq), q));
      return (world[i] = q);
    }
    T.nodes.forEach((_, i) => pose(i));
    const tp = [];
    tp[root] = [
      0,
      T.nodes[root].translation[1] + (sg.root.p[1] - impact.root.p[1]) * ratio,
      T.nodes[root].translation[2],
    ];
    let tg = globals(T, tp, local),
      floor = Infinity;
    for (const side of ["L", "R"]) {
      const fi = T.byName.get("foot." + side);
      for (const z of [-0.045, 0.13])
        floor = Math.min(
          floor,
          add(tg[fi].p, rotate(tg[fi].q, [0, -tr[fi].p[1] + 0.018, z]))[1],
        );
    }
    tp[root][1] += 0.018 - floor;
    tg = globals(T, tp, local);
    contacts.push(tg[toe].p);
    support.push(tg[T.byName.get("foot.L")].p);
    translations.push(tp[root]);
    times.push((frame - start) / 120);
    for (const [i, list] of rotations) {
      let q = local[i];
      if (
        list.length &&
        list.at(-1).reduce((sum, v, k) => sum + v * q[k], 0) < 0
      )
        q = q.map((v) => -v);
      list.push(q);
    }
  }
  appendClip(target, name, times, [
    ...[...rotations].map(([node, values]) => ({
      node,
      path: "rotation",
      values,
    })),
    { node: root, path: "translation", values: translations },
  ]);
  report.clips[name] = {
    file,
    startFrame: start,
    contactFrame: contact,
    endFrame: end,
    contactTime: 0.3,
    duration: times.at(-1),
    foot: "R",
    contactToe: contacts[18],
    contactSupportFoot: support[18],
  };
}
target.json.asset.copyright +=
  " Soccer motion: CMU Graphics Lab, NSF EIA-0196217; no resale of motion data.";
target.json.asset.generator =
  "Project Soccer authored locomotion and CMU mocap retarget";
writeGLB("client/public/assets/footballer-animated.glb", target);
const combined = JSON.parse(
  readFileSync("client/public/assets/footballer-animated.json"),
);
combined.license = "Multiple asset terms; see THIRD_PARTY_ASSETS.md";
combined.sources = {
  locomotion: { url: combined.source, license: "CC0-1.0" },
  soccer: {
    url: report.source,
    terms:
      "Copying, modification and redistribution permitted; direct resale of motion data prohibited",
  },
};
Object.assign(combined.clips, report.clips);
writeFileSync(
  "client/public/assets/footballer-animated.json",
  JSON.stringify(combined, null, 2) + "\n",
);
writeFileSync(
  "client/public/assets/footballer-soccer.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
