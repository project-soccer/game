// Narrow ASF/AMC reader for the pinned CMU subject 10 files (XYZ, degrees).
// Column-vector equivalent of the Acclaim Cinv M C B row-vector convention.
import { identity, add, inv, mul, rotate } from "./motion-math.mjs";
export function eulerXYZ(degrees) {
  return degrees.reduce((q, degrees, i) => {
    const radians = (degrees * Math.PI) / 360;
    const a = [0, 0, 0, Math.cos(radians)];
    a[i] = Math.sin(radians);
    return mul(a, q);
  }, identity);
}
export function parseASF(text) {
  if (!text.includes("order TX TY TZ RX RY RZ") || !text.includes("angle deg"))
    throw Error("Unsupported ASF root convention");
  const units = Number(text.match(/:units[\s\S]*?length\s+([\d.]+)/)[1]);
  const scale = 0.0254 / units;
  const bones = {
    root: {
      name: "root",
      parent: null,
      offset: [0, 0, 0],
      axis: identity,
      dof: [],
    },
  };
  for (const block of text
    .split(":bonedata")[1]
    .split(":hierarchy")[0]
    .matchAll(/begin([\s\S]*?)end/g)) {
    const fields = Object.fromEntries(
      block[1]
        .trim()
        .split(/\r?\n/)
        .map((l) => l.trim().split(/\s+/))
        .map(([k, ...v]) => [k, v]),
    );
    if (fields.axis[3] !== "XYZ") throw Error("Unsupported ASF axis order");
    const name = fields.name[0];
    bones[name] = {
      name,
      parent: null,
      offset: fields.direction.map(
        (v) => Number(v) * Number(fields.length[0]) * scale,
      ),
      axis: eulerXYZ(fields.axis.slice(0, 3).map(Number)),
      dof: fields.dof ?? [],
    };
    if (bones[name].dof.some((d) => !["rx", "ry", "rz"].includes(d)))
      throw Error("Unsupported ASF channel");
  }
  for (const line of text.split(":hierarchy")[1].trim().split(/\r?\n/)) {
    const [parent, ...children] = line.trim().split(/\s+/);
    if (parent === "begin" || parent === "end") continue;
    for (const child of children) bones[child].parent = parent;
  }
  return { bones, scale };
}
export function parseAMC(text) {
  if (!text.includes(":DEGREES") || !text.includes(":FULLY-SPECIFIED"))
    throw Error("Unsupported AMC convention");
  const frames = [];
  let frame;
  for (const line of text.split(/\r?\n/)) {
    const [name, ...v] = line.trim().split(/\s+/);
    if (/^\d+$/.test(name)) {
      frame = {};
      frames.push(frame);
    } else if (frame && v.length) {
      frame[name] = v.map(Number);
      if (!frame[name].every(Number.isFinite)) throw Error("Invalid AMC data");
    }
  }
  return frames;
}
export function cmuPose(skeleton, frame = {}) {
  const world = {};
  function visit(name) {
    if (world[name]) return world[name];
    const bone = skeleton.bones[name];
    if (name === "root")
      return (world[name] = {
        p: (frame.root?.slice(0, 3) ?? [0, 0, 0]).map(
          (v) => v * skeleton.scale,
        ),
        q: eulerXYZ(frame.root?.slice(3) ?? [0, 0, 0]),
      });
    const parent = visit(bone.parent),
      values = frame[name] ?? bone.dof.map(() => 0);
    if (values.length !== bone.dof.length)
      throw Error("AMC/ASF channel mismatch: " + name);
    const angles = [0, 0, 0];
    bone.dof.forEach(
      (d, i) => (angles[{ rx: 0, ry: 1, rz: 2 }[d]] = values[i]),
    );
    const local = mul(mul(bone.axis, eulerXYZ(angles)), inv(bone.axis));
    return (world[name] = {
      p: add(parent.p, rotate(parent.q, skeleton.bones[bone.parent].offset)),
      q: mul(parent.q, local),
    });
  }
  Object.keys(skeleton.bones).forEach(visit);
  return world;
}
