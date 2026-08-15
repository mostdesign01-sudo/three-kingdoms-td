import * as THREE from "three";

const BASE = import.meta.env.BASE_URL;
const cache = new Map();

export const MAP_SIZE = { w: 40, d: 22.5 };

export function asset(path) {
  return `${BASE}${path.replace(/^\//, "")}`;
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
  const img = await loadImage(asset(path));
  const tex = new THREE.Texture(img);
  tex.colorSpace = colorSpace;
  tex.flipY = flipY;
  tex.needsUpdate = true;
  cache.set(path, tex);
  return tex;
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

export async function loadArt() {
  const unitIds = ["guanyu", "zhaoyun", "zhuge", "lubu", "scout", "infantry", "cavalry", "armored", "elite", "soldier"];
  const towerIds = ["ballista", "thunder", "barracks", "sage"];
  const jobs = [
    loadTexture("maps/hulao.png"),
    loadTexture("maps/chibi.png"),
    loadTexture("maps/qishan.png"),
    loadTexture("ui/pad.png"),
    ...unitIds.map((id) => loadTexture(`units/${id}.png`)),
    ...towerIds.flatMap((id) => [1, 2, 3].map((lv) => loadTexture(`towers/${id}-${lv}.png`))),
  ];
  await Promise.all(jobs);
}

export function tex(path) {
  return cache.get(path);
}
