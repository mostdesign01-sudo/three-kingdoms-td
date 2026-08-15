import * as THREE from "three";
import { makeBillboard, makeDecal, makeGround, tex } from "./art.js";

export const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 8),
  sph: new THREE.SphereGeometry(1, 10, 8),
  oct: new THREE.OctahedronGeometry(1),
  torus: new THREE.TorusGeometry(1, 0.22, 8, 12),
};

export function mat(color, extras = {}) {
  if (extras.glow || (extras.emissiveIntensity ?? 0) > 0.35) {
    return new THREE.MeshBasicMaterial({
      color: extras.emissive ?? color,
      transparent: extras.transparent ?? Boolean(extras.opacity && extras.opacity < 1),
      opacity: extras.opacity ?? 1,
    });
  }
  return new THREE.MeshBasicMaterial({
    color,
    transparent: extras.transparent ?? false,
    opacity: extras.opacity ?? 1,
  });
}

export function mesh(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

const UNIT_SIZE = {
  guanyu: [2.15, 2.65],
  zhaoyun: [2.05, 2.45],
  zhuge: [2.0, 2.55],
  lubu: [2.7, 3.35],
  boss: [2.7, 3.35],
  scout: [1.55, 1.85],
  infantry: [1.6, 1.95],
  cavalry: [2.15, 2.35],
  armored: [1.85, 2.2],
  elite: [1.85, 2.35],
  soldier: [1.55, 1.95],
};

export function makeBlob(color = 0x111111, scale = 1) {
  const m = mesh(
    new THREE.CircleGeometry(0.42 * scale, 14),
    mat(color, { transparent: true, opacity: 0.32 }),
    0, 0.01, 0,
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function makeCharacter({ hero = null, kind = null, scale = 1 } = {}) {
  const id = hero === "lubu" ? "lubu" : hero || kind || "infantry";
  const key = id === "boss" ? "lubu" : id;
  const texture = tex(`units/${key}.png`);
  const [w, h] = UNIT_SIZE[key] || [1.6, 2];
  const sprite = makeBillboard(texture, w * scale, h * scale);
  sprite.userData.face = 1;
  return sprite;
}

export function makeTower(type, level = 1) {
  const lv = Math.max(1, Math.min(3, level));
  const texture = tex(`towers/${type}-${lv}.png`);
  const sizes = {
    ballista: [2.6, 3.3],
    thunder: [2.8, 2.6],
    barracks: [2.7, 2.7],
    sage: [2.5, 3.2],
  };
  const [w, h] = sizes[type] || [2.5, 2.8];
  return makeBillboard(texture, w, h);
}

export function makeSpot() {
  return makeDecal(tex("ui/pad.png"), 2.15);
}

export function makeHpBar() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 20;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.set(1.15, 0.18, 1);
  sprite.center.set(0.5, 0);
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.texture = texture;
  setHpBar(sprite, 1);
  return sprite;
}

export function setHpBar(bar, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  const ctx = bar.userData.ctx;
  const { width: w, height: h } = bar.userData.canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#1a1208";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = r > 0.45 ? "#3db84a" : r > 0.2 ? "#e0b84a" : "#c42828";
  ctx.fillRect(3, 3, (w - 6) * r, h - 6);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  bar.userData.texture.needsUpdate = true;
}

export function makeGate() {
  return new THREE.Group();
}

export function makePortal() {
  return new THREE.Group();
}

export function decorateMap(scene, map) {
  const group = new THREE.Group();
  const texture = tex(`maps/${map.id}.png`);
  group.add(makeGround(texture));
  scene.add(group);
  return group;
}

export function makePathRibbon() {
  return new THREE.Group();
}

export function faceSprite(sprite, dirX) {
  if (!sprite?.scale) return;
  const w = Math.abs(sprite.userData.width || sprite.scale.x);
  const h = sprite.userData.height || sprite.scale.y;
  sprite.scale.set(dirX < -0.05 ? -w : w, h, 1);
}
