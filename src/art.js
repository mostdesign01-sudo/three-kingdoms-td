import * as THREE from "three";

const BASE = import.meta.env.BASE_URL;
const cache = new Map();
const inflight = new Map();

export const MAP_SIZE = { w: 40, d: (40 * 1024) / 1536 };

export const UNIT_IDS = ["guanyu", "zhaoyun", "zhuge", "lubu", "scout", "infantry", "cavalry", "armored", "elite", "soldier"];
export const TOWER_IDS = ["ballista", "thunder", "barracks", "sage"];

export const ART = {
  map: (id) => `maps/${id}.jpg`,
  thumb: (id) => `maps/${id}-thumb.jpg`,
  unit: (id) => `units/${id}.webp`,
  tower: (id, lv) => `towers/${id}-${lv}.webp`,
  pad: "ui/pad.webp",
  icon: (id) => `ui/icon-${id}.webp`,
  portrait: (id) => `ui/portrait-${id}.webp`,
  heart: "ui/heart.webp",
  coin: "ui/coin.webp",
  skull: "ui/skull.webp",
  horn: "ui/horn.webp",
  chrome: {
    back: "ui/btn-back.webp",
    pause: "ui/icon-pause.webp",
    cancel: "ui/icon-cancel.webp",
    play: "ui/icon-play.webp",
    speed: "ui/icon-speed.webp",
    speedN: (n) => `ui/btn-speed-${n}.webp`,
    upgrade: "ui/icon-upgrade.webp",
    sell: "ui/icon-sell.webp",
    star: "ui/icon-star.webp",
    starOn: "ui/star-on.webp",
    starOff: "ui/star-off.webp",
    medallion: "ui/medallion.webp",
    call: "ui/call-flag.webp",
    flag: "ui/flag-pin.webp",
    title: "ui/title-plaque.webp",
    board: "ui/campaign-board.webp",
    wood: "ui/wood-bar.webp",
    plaque: "ui/plaque-wood.webp",
  },
  vfx: {
    slash: "vfx/slash.webp",
    slashMark: "vfx/slash-mark.webp",
    bagua: "vfx/bagua.webp",
    dust: "vfx/dust.webp",
    rune: "vfx/rune.webp",
    talisman: "vfx/talisman.webp",
    spear: "vfx/spear.webp",
    glow: "vfx/glow.webp",
  },
};

export const VFX_PATHS = Object.values(ART.vfx);

export const CHROME_PATHS = [
  ART.heart,
  ART.coin,
  ART.horn,
  ART.skull,
  ART.pad,
  ART.chrome.back,
  ART.chrome.pause,
  ART.chrome.play,
  ART.chrome.speed,
  ART.chrome.cancel,
  ART.chrome.speedN(1),
  ART.chrome.speedN(2),
  ART.chrome.speedN(3),
  ART.chrome.upgrade,
  ART.chrome.sell,
  ART.chrome.star,
  ART.chrome.starOn,
  ART.chrome.starOff,
  ART.chrome.medallion,
  ART.chrome.call,
  ART.chrome.flag,
  ART.chrome.title,
  ART.chrome.board,
  ART.chrome.wood,
  ART.chrome.plaque,
  ...["guanyu", "zhaoyun", "zhuge"].map((id) => ART.portrait(id)),
  ...TOWER_IDS.map((id) => ART.icon(id)),
];

export function asset(path) {
  return `${BASE}${path.replace(/^\//, "")}`;
}

function fallbackTexture(color = 0x3a5a28) {
  const key = `fallback:${color}`;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext("2d");
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, 8, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export async function loadTexture(path, { colorSpace = THREE.SRGBColorSpace, flipY = true } = {}) {
  if (cache.has(path)) return cache.get(path);
  if (inflight.has(path)) return inflight.get(path);

  const job = (async () => {
    try {
      const img = await loadImage(asset(path));
      const tex = new THREE.Texture(img);
      tex.colorSpace = colorSpace;
      tex.flipY = flipY;
      tex.needsUpdate = true;
      cache.set(path, tex);
      return tex;
    } catch (err) {
      console.warn("[art] texture failed, using fallback", path, err);
      const fb = fallbackTexture(path.includes("maps/") ? 0x4a6a32 : 0x2a2218);
      cache.set(path, fb);
      return fb;
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, job);
  return job;
}

export function tex(path) {
  const hit = cache.get(path);
  return hit instanceof THREE.Texture ? hit : fallbackTexture();
}

export function makeBillboard(texture, width, height, { ground = true, lockYaw = false } = {}) {
  const geo = new THREE.PlaneGeometry(width, height);
  if (ground) geo.translate(0, height / 2 + 0.03, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    alphaTest: 0.18,
    side: THREE.DoubleSide,
  });
  const visual = new THREE.Mesh(geo, mat);
  const bob = new THREE.Group();
  bob.add(visual);
  const pivot = new THREE.Group();
  pivot.add(bob);
  pivot.userData.height = height;
  pivot.userData.width = width;
  pivot.userData.visual = visual;
  pivot.userData.bob = bob;
  pivot.userData.billboard = true;
  pivot.userData.lockYaw = lockYaw;
  pivot.userData.face = 1;
  return pivot;
}

export function aimBillboard(obj, camera) {
  if (!obj?.userData?.billboard || obj.userData.lockYaw) return;
  const dx = camera.position.x - obj.position.x;
  const dz = camera.position.z - obj.position.z;
  if (dx * dx + dz * dz < 1e-6) return;
  obj.rotation.y = Math.atan2(dx, dz);
}

export function makeGround(texture) {
  const geo = new THREE.PlaneGeometry(MAP_SIZE.w, MAP_SIZE.d);
  const mat = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  return mesh;
}

export function makeDecal(texture, size = 2.1) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.08,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

async function loadAll(paths, onProgress) {
  let done = 0;
  const total = paths.length;
  onProgress?.(done, total);
  await Promise.all(
    paths.map(async (path) => {
      await loadTexture(path);
      done += 1;
      onProgress?.(done, total);
    }),
  );
}

export function playPack(mapId) {
  return [
    ART.map(mapId),
    ...UNIT_IDS.map((id) => ART.unit(id)),
    ...TOWER_IDS.flatMap((id) => [1, 2, 3].map((lv) => ART.tower(id, lv))),
    ...VFX_PATHS,
    ...CHROME_PATHS,
  ];
}

export async function loadPlayPack(mapId, onProgress) {
  await loadAll(playPack(mapId), onProgress);
}

export function prefetchRest(exceptId) {
  for (const id of ["hulao", "chibi", "qishan"]) {
    if (id === exceptId) continue;
    loadTexture(ART.map(id)).catch(() => {});
  }
}
