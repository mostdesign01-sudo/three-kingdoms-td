export const MAPS = [
  {
    id: "hulao",
    name: "虎牢道",
    subtitle: "山隘土路 · 一夫当关",
    swatch: "linear-gradient(135deg,#4a8a32 20%,#d2b06a 45%,#2c6a24 70%,#7a6a52)",
    startGold: 230,
    theme: {
      ground: 0x3f8a32,
      groundAlt: 0x2a4a20,
      path: 0xd2b06a,
      pathStyle: "dirt",
      grassA: "#3f8a32",
      grassB: "#2c6a24",
      grassC: "#6aaa40",
      accent: 0x8a5a2a,
      fog: 0x8fb86a,
      fogNear: 42,
      fogFar: 90,
      hemiSky: 0xfff0c8,
      hemiGround: 0x3d5a28,
      sun: 0xffe2a8,
      sunDir: [12, 28, 10],
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
    swatch: "linear-gradient(135deg,#1b6a78 15%,#8a6238 48%,#0e4a58 72%,#2f6b4f)",
    startGold: 250,
    theme: {
      ground: 0x2a6a48,
      groundAlt: 0x0e3038,
      path: 0x8a6238,
      pathStyle: "wood",
      grassA: "#2f7a48",
      grassB: "#1a5a38",
      grassC: "#4a9a58",
      accent: 0x2f6b4f,
      fog: 0x3a7a88,
      fogNear: 40,
      fogFar: 88,
      hemiSky: 0xcfe8ff,
      hemiGround: 0x123028,
      sun: 0xffe6c4,
      sunDir: [-10, 26, 12],
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
    swatch: "linear-gradient(135deg,#3d5a38 18%,#9a7a48 50%,#2a3a28 75%,#5a5848)",
    startGold: 240,
    theme: {
      ground: 0x3d5a38,
      groundAlt: 0x2a3a28,
      path: 0x9a7a48,
      pathStyle: "plank",
      grassA: "#3d5a38",
      grassB: "#2a4a2c",
      grassC: "#5a7a40",
      accent: 0x6a7a48,
      fog: 0x9aaa88,
      fogNear: 38,
      fogFar: 82,
      hemiSky: 0xffe6c4,
      hemiGround: 0x2c3818,
      sun: 0xffd29a,
      sunDir: [8, 26, -12],
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
