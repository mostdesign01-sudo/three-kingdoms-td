import * as THREE from "three";

const BASE = import.meta.env.BASE_URL;
const cache = new Map();
const inflight = new Map();

export const MAP_SIZE = { w: 40, d: 22.5 };

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
};

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

export function makeBillboard(texture, width, height, { ground = true } = {}) {
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.12,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(width, height, 1);
  if (ground) sprite.center.set(0.5, 0);
  sprite.userData.height = height;
  sprite.userData.width = width;
  return sprite;
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
    ART.pad,
    ...UNIT_IDS.map((id) => ART.unit(id)),
    ...TOWER_IDS.flatMap((id) => [1, 2, 3].map((lv) => ART.tower(id, lv))),
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
