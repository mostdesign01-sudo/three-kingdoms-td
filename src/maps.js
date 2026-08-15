import { MAP_SIZE } from "./art.js";

function uv(u, v) {
  return [(u - 0.5) * MAP_SIZE.w, (v - 0.5) * MAP_SIZE.d];
}

export const MAPS = [
  {
    id: "hulao",
    name: "虎牢道",
    subtitle: "山隘土路 · 一夫当关",
    art: "maps/hulao.png",
    startGold: 230,
    theme: {
      fog: 0x8fb86a,
      fogNear: 48,
      fogFar: 110,
      hemiSky: 0xfff0c8,
      hemiGround: 0x3d5a28,
      sun: 0xffe2a8,
      sunDir: [8, 30, 12],
    },
    path: [
      uv(0.12, 0.20),
      uv(0.18, 0.26),
      uv(0.28, 0.33),
      uv(0.36, 0.42),
      uv(0.40, 0.54),
      uv(0.48, 0.62),
      uv(0.58, 0.60),
      uv(0.66, 0.50),
      uv(0.76, 0.48),
      uv(0.84, 0.50),
      uv(0.90, 0.52),
    ],
    spots: [
      uv(0.30, 0.24),
      uv(0.38, 0.16),
      uv(0.62, 0.18),
      uv(0.32, 0.40),
      uv(0.42, 0.48),
      uv(0.38, 0.62),
      uv(0.54, 0.42),
      uv(0.64, 0.52),
      uv(0.68, 0.62),
    ],
    heroStarts: [uv(0.34, 0.50), uv(0.56, 0.38), uv(0.72, 0.56)],
  },
  {
    id: "chibi",
    name: "赤壁水寨",
    subtitle: "江上木寨 · 火攻待发",
    art: "maps/chibi.png",
    startGold: 250,
    theme: {
      fog: 0x3a7a88,
      fogNear: 48,
      fogFar: 110,
      hemiSky: 0xcfe8ff,
      hemiGround: 0x123028,
      sun: 0xffe6c4,
      sunDir: [-8, 30, 10],
    },
    path: [
      uv(0.08, 0.84),
      uv(0.14, 0.74),
      uv(0.20, 0.60),
      uv(0.30, 0.46),
      uv(0.42, 0.36),
      uv(0.54, 0.40),
      uv(0.64, 0.54),
      uv(0.74, 0.46),
      uv(0.84, 0.30),
      uv(0.93, 0.16),
    ],
    spots: [
      uv(0.18, 0.58),
      uv(0.28, 0.32),
      uv(0.38, 0.50),
      uv(0.50, 0.26),
      uv(0.54, 0.52),
      uv(0.66, 0.40),
      uv(0.72, 0.62),
      uv(0.84, 0.36),
      uv(0.88, 0.22),
    ],
    heroStarts: [uv(0.30, 0.52), uv(0.52, 0.38), uv(0.76, 0.40)],
  },
  {
    id: "qishan",
    name: "祁山栈道",
    subtitle: "绝壁木栈 · 一线天通",
    art: "maps/qishan.png",
    startGold: 240,
    theme: {
      fog: 0x9aaa88,
      fogNear: 46,
      fogFar: 105,
      hemiSky: 0xffe6c4,
      hemiGround: 0x2c3818,
      sun: 0xffd29a,
      sunDir: [6, 30, -8],
    },
    path: [
      uv(0.06, 0.16),
      uv(0.16, 0.18),
      uv(0.26, 0.20),
      uv(0.34, 0.32),
      uv(0.40, 0.46),
      uv(0.50, 0.52),
      uv(0.56, 0.64),
      uv(0.68, 0.66),
      uv(0.76, 0.52),
      uv(0.86, 0.46),
      uv(0.94, 0.48),
    ],
    spots: [
      uv(0.22, 0.22),
      uv(0.34, 0.16),
      uv(0.28, 0.48),
      uv(0.48, 0.38),
      uv(0.52, 0.58),
      uv(0.66, 0.56),
      uv(0.74, 0.32),
      uv(0.88, 0.48),
      uv(0.86, 0.28),
    ],
    heroStarts: [uv(0.30, 0.34), uv(0.52, 0.46), uv(0.74, 0.44)],
  },
];

export function getMap(id) {
  return MAPS.find((m) => m.id === id);
}

export function buildPath(points) {
  const segs = [];
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    segs.push({ a, b, dx, dz, len, start: length });
    length += len;
  }
  return {
    points,
    segs,
    length,
    at(dist) {
      const d = Math.max(0, Math.min(length, dist));
      const seg = segs.find((s) => d <= s.start + s.len) ?? segs[segs.length - 1];
      const t = seg.len === 0 ? 0 : (d - seg.start) / seg.len;
      return {
        x: seg.a[0] + seg.dx * t,
        z: seg.a[1] + seg.dz * t,
        nx: seg.dx / seg.len,
        nz: seg.dz / seg.len,
      };
    },
  };
}
