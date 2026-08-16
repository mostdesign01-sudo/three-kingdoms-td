import { MAP_SIZE } from "./art.js";

/** Image UV: (0,0) top-left of the jpg, (1,1) bottom-right.
 *  Ground plane is XZ, texture flipY=true, so +Z is image-down. */
function uv(u, v) {
  return [(u - 0.5) * MAP_SIZE.w, (v - 0.5) * MAP_SIZE.d];
}

function onPath(points, t) {
  const path = buildPath(points);
  const p = path.at(path.length * t);
  return [p.x, p.z];
}

const HULAO_PATH = [
  uv(0.145, 0.255),
  uv(0.205, 0.28),
  uv(0.27, 0.325),
  uv(0.325, 0.4),
  uv(0.36, 0.49),
  uv(0.375, 0.58),
  uv(0.42, 0.66),
  uv(0.495, 0.73),
  uv(0.57, 0.715),
  uv(0.62, 0.64),
  uv(0.615, 0.54),
  uv(0.56, 0.45),
  uv(0.525, 0.36),
  uv(0.545, 0.285),
  uv(0.63, 0.265),
  uv(0.71, 0.32),
  uv(0.77, 0.42),
  uv(0.81, 0.52),
  uv(0.86, 0.57),
  uv(0.915, 0.555),
];

const CHIBI_PATH = [
  uv(0.055, 0.905),
  uv(0.120, 0.800),
  uv(0.185, 0.700),
  uv(0.250, 0.620),
  uv(0.330, 0.560),
  uv(0.420, 0.530),
  uv(0.520, 0.545),
  uv(0.620, 0.500),
  uv(0.720, 0.420),
  uv(0.820, 0.300),
  uv(0.910, 0.160),
  uv(0.960, 0.080),
];

const QISHAN_PATH = [
  uv(0.040, 0.085),
  uv(0.140, 0.155),
  uv(0.240, 0.175),
  uv(0.380, 0.200),
  uv(0.520, 0.230),
  uv(0.545, 0.340),
  uv(0.510, 0.460),
  uv(0.550, 0.545),
  uv(0.660, 0.620),
  uv(0.760, 0.700),
  uv(0.860, 0.800),
  uv(0.950, 0.880),
];

export const MAPS = [
  {
    id: "hulao",
    name: "虎牢道",
    subtitle: "山隘土路 · 一夫当关",
    art: "maps/hulao-thumb.jpg",
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
    path: HULAO_PATH,
    spots: [
      uv(0.387, 0.21),
      uv(0.653, 0.235),
      uv(0.286, 0.338),
      uv(0.46, 0.398),
      uv(0.685, 0.414),
      uv(0.628, 0.554),
      uv(0.766, 0.587),
      uv(0.358, 0.648),
      uv(0.563, 0.624),
      uv(0.451, 0.791),
    ],
    heroStarts: [onPath(HULAO_PATH, 0.28), onPath(HULAO_PATH, 0.52), onPath(HULAO_PATH, 0.74)],
  },
  {
    id: "chibi",
    name: "赤壁水寨",
    subtitle: "江上木寨 · 火攻待发",
    art: "maps/chibi-thumb.jpg",
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
    path: CHIBI_PATH,
    spots: [
      uv(0.216, 0.535),
      uv(0.25, 0.514),
      uv(0.303, 0.404),
      uv(0.48, 0.74),
      uv(0.55, 0.22),
      uv(0.9, 0.28),
    ],
    heroStarts: [onPath(CHIBI_PATH, 0.28), onPath(CHIBI_PATH, 0.5), onPath(CHIBI_PATH, 0.74)],
  },
  {
    id: "qishan",
    name: "祁山栈道",
    subtitle: "绝壁木栈 · 一线天通",
    art: "maps/qishan-thumb.jpg",
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
    path: QISHAN_PATH,
    spots: [
      uv(0.24, 0.17),
      uv(0.17, 0.22),
      uv(0.54, 0.23),
      uv(0.5, 0.16),
      uv(0.78, 0.25),
      uv(0.72, 0.18),
      uv(0.55, 0.54),
      uv(0.78, 0.72),
      uv(0.92, 0.86),
    ],
    heroStarts: [onPath(QISHAN_PATH, 0.26), onPath(QISHAN_PATH, 0.5), onPath(QISHAN_PATH, 0.74)],
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
