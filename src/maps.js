export const MAPS = [
  {
    id: "hulao",
    name: "虎牢道",
    subtitle: "山隘土路 · 一夫当关",
    swatch: "linear-gradient(135deg,#7a5a32,#3d2a18 55%,#8a6a3a)",
    startGold: 230,
    theme: {
      ground: 0x6d5330,
      groundAlt: 0x4a3820,
      path: 0xc4a35a,
      accent: 0x8a5a2a,
      fog: 0xc9a06a,
      fogNear: 28,
      fogFar: 78,
      hemiSky: 0xffd8a8,
      hemiGround: 0x4a3018,
      sun: 0xffc078,
      sunDir: [14, 20, 8],
    },
    path: [
      [-18.5, 3.2],
      [-13.2, 4.6],
      [-8.4, 2.1],
      [-4.6, -2.8],
      [0.2, -3.6],
      [4.8, -0.6],
      [8.6, 3.4],
      [13.4, 2.2],
      [18.2, -1.4],
    ],
    spots: [
      [-12.4, 1.6],
      [-9.8, 5.6],
      [-6.2, -0.8],
      [-2.6, -5.6],
      [1.8, -1.2],
      [5.6, 2.6],
      [9.8, 5.8],
      [12.2, -0.6],
      [15.6, 3.4],
    ],
    heroStarts: [
      [-6.8, 0.8],
      [1.2, 1.4],
      [8.4, 0.4],
    ],
    decor: "pass",
  },
  {
    id: "chibi",
    name: "赤壁水寨",
    subtitle: "江上木寨 · 火攻待发",
    swatch: "linear-gradient(135deg,#1b4a55,#0d2430 50%,#3a6a4a)",
    startGold: 250,
    theme: {
      ground: 0x16343c,
      groundAlt: 0x0e242c,
      path: 0x8a6238,
      accent: 0x2f6b4f,
      fog: 0x1c3a48,
      fogNear: 24,
      fogFar: 70,
      hemiSky: 0x9ad4e8,
      hemiGround: 0x123028,
      sun: 0xcfe8ff,
      sunDir: [-10, 18, 12],
    },
    path: [
      [-18.2, -4.4],
      [-13.6, -3.2],
      [-9.4, 1.8],
      [-4.2, 4.6],
      [1.6, 3.8],
      [6.4, -0.8],
      [11.2, -3.6],
      [15.4, 0.8],
      [18.4, 3.6],
    ],
    spots: [
      [-14.8, -0.6],
      [-10.8, 4.6],
      [-6.8, 1.4],
      [-1.6, 6.4],
      [2.8, 1.2],
      [7.6, 2.2],
      [10.4, -6.0],
      [14.8, 3.8],
      [16.6, -1.8],
    ],
    heroStarts: [
      [-8.2, -0.6],
      [0.4, 1.6],
      [9.2, -1.2],
    ],
    decor: "river",
  },
  {
    id: "qishan",
    name: "祁山栈道",
    subtitle: "绝壁木栈 · 一线天通",
    swatch: "linear-gradient(135deg,#4d5a3a,#2a2418 48%,#7a6844)",
    startGold: 240,
    theme: {
      ground: 0x3d3a2c,
      groundAlt: 0x2a261c,
      path: 0x8d6b3e,
      accent: 0x6a7a48,
      fog: 0x8a9a88,
      fogNear: 20,
      fogFar: 64,
      hemiSky: 0xffe6c4,
      hemiGround: 0x2c2818,
      sun: 0xffd29a,
      sunDir: [8, 16, -12],
    },
    path: [
      [-18.4, 6.2],
      [-11.2, 6.0],
      [-10.6, 1.2],
      [-3.4, 0.8],
      [-2.8, -4.6],
      [5.2, -5.0],
      [6.0, 2.6],
      [13.4, 3.2],
      [18.2, -2.2],
    ],
    spots: [
      [-14.6, 3.6],
      [-8.2, 3.8],
      [-7.4, -1.4],
      [-0.6, 3.2],
      [0.4, -7.2],
      [8.4, -2.6],
      [8.8, 5.4],
      [15.6, 5.6],
      [15.2, -0.4],
    ],
    heroStarts: [
      [-9.4, 3.2],
      [-0.8, -1.8],
      [8.8, 0.6],
    ],
    decor: "plank",
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
