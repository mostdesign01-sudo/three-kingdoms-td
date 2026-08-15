import * as THREE from "three";
import { addOutline, mat, outlinedGroup, paintMap, sharedMat, texGrass, texRoof } from "./paint.js";

export const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 8),
  sph: new THREE.SphereGeometry(1, 10, 8),
  oct: new THREE.OctahedronGeometry(1),
  torus: new THREE.TorusGeometry(1, 0.22, 8, 12),
};

export { mat };

export function mesh(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

function p(geometry, color, x, y, z, sx, sy, sz, mapName = "cloth", inflate = 0.08) {
  const m = mesh(geometry, sharedMat(color, mapName), x, y, z, sx, sy, sz);
  addOutline(m, inflate);
  return m;
}

export function makeBlob(color = 0x1a140c, scale = 1) {
  return mesh(
    geo.cyl,
    mat(color, { transparent: true, opacity: 0.32 }),
    0, 0.015, 0,
    0.62 * scale, 0.03, 0.5 * scale,
  );
}

export function makeCharacter({
  body = 0x6b3a2a,
  cloth = 0x8b1e1e,
  helm = 0xc9a227,
  skin = 0xe6c2a0,
  scale = 1,
  weapon = "spear",
  hero = null,
  kind = null,
} = {}) {
  const g = new THREE.Group();
  const look = hero || kind;

  if (look === "guanyu") return styleGuanyu(scale);
  if (look === "zhaoyun") return styleZhaoyun(scale);
  if (look === "zhuge") return styleZhuge(scale);
  if (look === "lubu" || look === "boss") return styleLubu(scale);
  if (look === "cavalry") return styleCavalry(scale);
  if (look === "soldier") return styleSoldier(scale);

  const palette = enemyPalette(look, { body, cloth, helm, skin });
  g.add(p(geo.box, palette.boot, -0.16, 0.16, 0.04, 0.18, 0.32, 0.2, "cloth", 0.1));
  g.add(p(geo.box, palette.boot, 0.16, 0.16, 0.04, 0.18, 0.32, 0.2, "cloth", 0.1));
  g.add(p(geo.box, palette.cloth, 0, 0.58, 0.02, 0.58, 0.62, 0.36, "cloth", 0.07));
  g.add(p(geo.box, palette.body, 0, 0.92, 0.02, 0.64, 0.22, 0.4, "cloth", 0.07));
  g.add(p(geo.sph, palette.skin, 0, 1.22, 0.06, 0.22, 0.22, 0.22, "cloth", 0.1));
  g.add(p(geo.box, palette.helm, 0, 1.42, 0.04, 0.42, 0.16, 0.42, "cloth", 0.1));

  if (look === "scout" || look === "infantry") {
    g.add(p(geo.box, 0xe8c84a, 0, 1.5, 0.02, 0.5, 0.2, 0.5, "cloth", 0.1));
    g.add(p(geo.box, 0xe8c84a, 0, 1.62, -0.04, 0.18, 0.16, 0.28, "cloth", 0.1));
  } else if (look === "armored") {
    g.add(p(geo.box, 0x2f6b3a, 0, 0.7, 0.02, 0.72, 0.7, 0.48, "cloth", 0.06));
    g.add(p(geo.box, 0x3a7a40, -0.42, 0.72, 0.18, 0.12, 0.58, 0.46, "wood", 0.08));
  } else if (look === "elite") {
    g.add(p(geo.cone, 0x8b1e1e, 0, 1.62, 0, 0.2, 0.28, 0.2, "roof", 0.1));
    g.add(p(geo.box, 0xc9a227, 0, 1.78, 0, 0.06, 0.22, 0.06, "cloth", 0.12));
  }

  if (weapon === "shield") {
    g.add(p(geo.cyl, 0x7a5a32, 0.36, 0.7, 0.12, 0.035, 1.05, 0.035, "wood", 0.15));
    g.add(p(geo.cone, 0xd8d0b8, 0.36, 1.28, 0.12, 0.07, 0.2, 0.07, "stone", 0.12));
  } else {
    g.add(p(geo.cyl, 0x7a5a32, 0.38, 0.72, 0.12, 0.035, 1.2, 0.035, "wood", 0.15));
    g.add(p(geo.cone, 0xd8d0b8, 0.38, 1.38, 0.12, 0.07, 0.2, 0.07, "stone", 0.12));
  }

  g.scale.setScalar(scale * 1.15);
  return g;
}

function enemyPalette(look, fallback) {
  if (look === "scout" || look === "infantry") {
    return { boot: 0x3a2414, cloth: 0x8a5a32, body: 0x6a4228, helm: 0xe8c84a, skin: 0xe0b090 };
  }
  if (look === "armored") {
    return { boot: 0x2a2010, cloth: 0x35553a, body: 0x2a4a30, helm: 0x4a6a40, skin: 0xd4a888 };
  }
  if (look === "elite") {
    return { boot: 0x1a1010, cloth: 0x5a1a1a, body: 0x3a1010, helm: 0xc9a227, skin: 0xe0b090 };
  }
  return { boot: 0x2a1c14, cloth: fallback.cloth, body: fallback.body, helm: fallback.helm, skin: fallback.skin };
}

function styleGuanyu(scale) {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x2a1c10, -0.17, 0.16, 0.04, 0.2, 0.32, 0.22, "cloth", 0.1));
  g.add(p(geo.box, 0x2a1c10, 0.17, 0.16, 0.04, 0.2, 0.32, 0.22, "cloth", 0.1));
  g.add(p(geo.box, 0x1f6a38, 0, 0.62, 0.02, 0.72, 0.78, 0.42, "cloth", 0.06));
  g.add(p(geo.box, 0x145028, 0, 0.7, -0.24, 0.78, 0.85, 0.1, "cloth", 0.07));
  g.add(p(geo.box, 0xc9a227, 0, 0.95, 0.08, 0.5, 0.12, 0.36, "cloth", 0.08));
  g.add(p(geo.sph, 0xd47858, 0, 1.28, 0.08, 0.24, 0.24, 0.24, "cloth", 0.1));
  g.add(p(geo.box, 0x1a0a08, 0, 1.1, 0.22, 0.14, 0.32, 0.1, "cloth", 0.12));
  g.add(p(geo.box, 0x1a0a08, -0.08, 1.08, 0.2, 0.08, 0.22, 0.08, "cloth", 0.12));
  g.add(p(geo.box, 0x1a0a08, 0.08, 1.08, 0.2, 0.08, 0.22, 0.08, "cloth", 0.12));
  g.add(p(geo.box, 0x1f6a38, 0, 1.5, 0.04, 0.46, 0.16, 0.46, "cloth", 0.1));
  g.add(p(geo.sph, 0x1a0a08, 0, 1.6, 0, 0.12, 0.1, 0.12, "cloth", 0.12));
  const blade = new THREE.Group();
  blade.add(p(geo.cyl, 0x5a3a1a, 0, 0.55, 0, 0.045, 1.15, 0.045, "wood", 0.12));
  for (let i = 0; i < 7; i++) {
    const a = -0.7 + i * 0.22;
    const seg = p(geo.box, 0xe8d48a, Math.sin(a) * 0.12, 1.05 + i * 0.1, 0, 0.1, 0.2, 0.32, "stone", 0.1);
    seg.rotation.z = a * 0.6;
    blade.add(seg);
  }
  blade.position.set(0.48, 0.2, 0.12);
  g.add(blade);
  g.scale.setScalar(scale * 1.2);
  return g;
}

function styleZhaoyun(scale) {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x2a2a32, -0.16, 0.16, 0.04, 0.18, 0.32, 0.2, "cloth", 0.1));
  g.add(p(geo.box, 0x2a2a32, 0.16, 0.16, 0.04, 0.18, 0.32, 0.2, "cloth", 0.1));
  g.add(p(geo.box, 0xe8eef6, 0, 0.62, 0.02, 0.62, 0.7, 0.38, "cloth", 0.06));
  g.add(p(geo.box, 0x3a6aaa, 0, 0.78, 0.08, 0.5, 0.16, 0.34, "cloth", 0.08));
  g.add(p(geo.box, 0xd0d8e8, 0, 0.68, -0.22, 0.58, 0.7, 0.08, "cloth", 0.08));
  g.add(p(geo.sph, 0xe6c2a0, 0, 1.24, 0.06, 0.22, 0.22, 0.22, "cloth", 0.1));
  g.add(p(geo.cone, 0xd8deea, 0, 1.5, 0, 0.22, 0.26, 0.22, "stone", 0.1));
  g.add(p(geo.box, 0x8b1e1e, 0, 1.68, -0.02, 0.06, 0.22, 0.06, "cloth", 0.14));
  const spear = new THREE.Group();
  spear.add(p(geo.cyl, 0x7a5a32, 0, 0.8, 0, 0.04, 1.7, 0.04, "wood", 0.12));
  spear.add(p(geo.cone, 0xe8eef6, 0, 1.72, 0, 0.09, 0.32, 0.09, "stone", 0.1));
  spear.position.set(0.42, 0.15, 0.14);
  g.add(spear);
  g.scale.setScalar(scale * 1.18);
  return g;
}

function styleZhuge(scale) {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x2a2418, -0.16, 0.14, 0.02, 0.2, 0.28, 0.22, "cloth", 0.1));
  g.add(p(geo.box, 0x2a2418, 0.16, 0.14, 0.02, 0.2, 0.28, 0.22, "cloth", 0.1));
  g.add(p(geo.box, 0x2f7a58, 0, 0.58, 0.02, 0.82, 0.88, 0.48, "cloth", 0.05));
  g.add(p(geo.box, 0x246448, 0.42, 0.55, 0.06, 0.22, 0.7, 0.22, "cloth", 0.07));
  g.add(p(geo.sph, 0xe6c2a0, 0, 1.2, 0.08, 0.22, 0.22, 0.22, "cloth", 0.1));
  g.add(p(geo.box, 0x1a1a14, 0, 1.08, 0.2, 0.08, 0.16, 0.08, "cloth", 0.14));
  g.add(p(geo.box, 0xf0e2b0, 0, 1.4, 0.02, 0.5, 0.1, 0.5, "cloth", 0.1));
  g.add(p(geo.box, 0xf0e2b0, 0, 1.5, -0.04, 0.18, 0.16, 0.28, "cloth", 0.1));
  g.add(p(geo.box, 0xc9a227, 0.5, 0.88, 0.22, 0.08, 0.32, 0.42, "cloth", 0.1));
  g.scale.setScalar(scale * 1.16);
  return g;
}

function styleLubu(scale) {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x1a1020, -0.2, 0.2, 0.04, 0.22, 0.4, 0.24, "cloth", 0.08));
  g.add(p(geo.box, 0x1a1020, 0.2, 0.2, 0.04, 0.22, 0.4, 0.24, "cloth", 0.08));
  g.add(p(geo.box, 0x4b2a78, 0, 0.78, 0.02, 0.82, 0.9, 0.48, "cloth", 0.05));
  g.add(p(geo.box, 0xc9a227, 0, 0.95, 0.12, 0.6, 0.14, 0.4, "cloth", 0.08));
  g.add(p(geo.box, 0x2a1040, 0, 0.8, -0.28, 0.86, 0.95, 0.12, "cloth", 0.06));
  g.add(p(geo.sph, 0xd4a070, 0, 1.4, 0.08, 0.26, 0.26, 0.26, "cloth", 0.1));
  g.add(p(geo.cone, 0xc9a227, 0, 1.78, 0, 0.3, 0.42, 0.3, "stone", 0.08));
  g.add(p(geo.box, 0x8b1e1e, -0.16, 1.95, 0, 0.06, 0.36, 0.06, "cloth", 0.14));
  g.add(p(geo.box, 0x8b1e1e, 0.16, 1.95, 0, 0.06, 0.36, 0.06, "cloth", 0.14));
  const ji = new THREE.Group();
  ji.add(p(geo.cyl, 0x4a2a12, 0, 0.9, 0, 0.05, 1.9, 0.05, "wood", 0.1));
  ji.add(p(geo.box, 0xe8d48a, 0, 1.88, 0, 0.14, 0.36, 0.36, "stone", 0.08));
  ji.add(p(geo.cone, 0xc9a227, 0.24, 1.78, 0, 0.1, 0.3, 0.08, "stone", 0.1));
  ji.position.set(0.55, 0.2, 0.12);
  g.add(ji);
  g.scale.setScalar(scale * 1.15);
  return g;
}

function styleSoldier(scale) {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x2a1c14, -0.15, 0.15, 0.03, 0.17, 0.3, 0.18, "cloth", 0.1));
  g.add(p(geo.box, 0x2a1c14, 0.15, 0.15, 0.03, 0.17, 0.3, 0.18, "cloth", 0.1));
  g.add(p(geo.box, 0x8b1e1e, 0, 0.56, 0.02, 0.56, 0.6, 0.34, "cloth", 0.07));
  g.add(p(geo.box, 0xc9a227, 0, 0.78, 0.08, 0.4, 0.1, 0.28, "cloth", 0.1));
  g.add(p(geo.sph, 0xe6c2a0, 0, 1.14, 0.06, 0.2, 0.2, 0.2, "cloth", 0.1));
  g.add(p(geo.cone, 0xc9a227, 0, 1.38, 0, 0.2, 0.22, 0.2, "stone", 0.1));
  g.add(p(geo.cyl, 0x7a5a32, 0.34, 0.68, 0.1, 0.03, 1.1, 0.03, "wood", 0.14));
  g.add(p(geo.cone, 0xd8d0b8, 0.34, 1.28, 0.1, 0.06, 0.18, 0.06, "stone", 0.12));
  g.scale.setScalar(scale * 1.12);
  return g;
}

function styleCavalry(scale) {
  const horse = new THREE.Group();
  horse.add(p(geo.box, 0x3a2a20, 0, 0.48, -0.08, 0.5, 0.42, 1.05, "cloth", 0.06));
  horse.add(p(geo.box, 0x3a2a20, 0, 0.68, 0.52, 0.32, 0.3, 0.32, "cloth", 0.08));
  horse.add(p(geo.box, 0x2a1c14, 0, 0.62, 0.7, 0.12, 0.16, 0.16, "cloth", 0.12));
  horse.add(p(geo.cyl, 0x2a1c14, -0.16, 0.2, 0.32, 0.08, 0.4, 0.08, "cloth", 0.1));
  horse.add(p(geo.cyl, 0x2a1c14, 0.16, 0.2, 0.32, 0.08, 0.4, 0.08, "cloth", 0.1));
  horse.add(p(geo.cyl, 0x2a1c14, -0.16, 0.2, -0.38, 0.08, 0.4, 0.08, "cloth", 0.1));
  horse.add(p(geo.cyl, 0x2a1c14, 0.16, 0.2, -0.38, 0.08, 0.4, 0.08, "cloth", 0.1));
  const rider = new THREE.Group();
  rider.add(p(geo.box, 0x2a3a58, 0, 0.95, -0.05, 0.42, 0.42, 0.3, "cloth", 0.08));
  rider.add(p(geo.sph, 0xe6c2a0, 0, 1.28, 0, 0.16, 0.16, 0.16, "cloth", 0.12));
  rider.add(p(geo.cone, 0x3a4a68, 0, 1.46, 0, 0.16, 0.18, 0.16, "stone", 0.12));
  rider.add(p(geo.cyl, 0x7a5a32, 0.28, 1.05, 0.1, 0.03, 0.9, 0.03, "wood", 0.14));
  horse.add(rider);
  horse.scale.setScalar(scale * 1.05);
  return horse;
}

export function makeTower(type, level = 1) {
  const built = type === "ballista"
    ? towerBallista(level)
    : type === "thunder"
      ? towerThunder(level)
      : type === "barracks"
        ? towerBarracks(level)
        : towerSage(level);
  built.scale.setScalar(1.42);
  return built;
}

function towerBallista(level) {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x8a8478, 0, 0.22, 0, 0.85, 0.42, 0.85, "stone", 0.05));
  g.add(p(geo.box, 0x7a4a28, 0, 0.72, 0, 1.25, 0.22, 1.25, "wood", 0.05));
  g.add(p(geo.box, 0x5a3218, -0.5, 1.2, -0.5, 0.16, 0.8, 0.16, "wood", 0.08));
  g.add(p(geo.box, 0x5a3218, 0.5, 1.2, -0.5, 0.16, 0.8, 0.16, "wood", 0.08));
  g.add(p(geo.box, 0x5a3218, -0.5, 1.2, 0.5, 0.16, 0.8, 0.16, "wood", 0.08));
  g.add(p(geo.box, 0x5a3218, 0.5, 1.2, 0.5, 0.16, 0.8, 0.16, "wood", 0.08));
  const roof = mesh(geo.cone, new THREE.MeshToonMaterial({ color: 0x8b1e1e, map: texRoof("#8b1e1e"), gradientMap: sharedMat(0x8b1e1e, "roof").gradientMap }), 0, 1.85, 0, 1.15, 0.62, 1.15);
  addOutline(roof, 0.05);
  g.add(roof);
  g.add(p(geo.box, 0x6b4423, 0, 1.35, 0.2, 1.05, 0.12, 0.14, "wood", 0.1));
  g.add(p(geo.box, 0xc9a227, 0, 1.42, 0.42, 0.12, 0.12, 0.55, "stone", 0.12));
  g.add(p(geo.box, 0x8b1e1e, 0.7, 1.55, -0.15, 0.08, 0.7, 0.32, "cloth", 0.1));
  if (level >= 2) {
    g.add(p(geo.cone, 0x6d1612, 0, 2.22, 0, 0.72, 0.4, 0.72, "roof", 0.06));
    g.add(p(geo.box, 0xc9a227, -0.7, 1.2, 0.2, 0.08, 0.55, 0.28, "cloth", 0.1));
  }
  if (level >= 3) {
    g.add(p(geo.cone, 0xc9a227, 0, 2.52, 0, 0.42, 0.28, 0.42, "stone", 0.08));
    g.add(p(geo.box, 0xc9a227, 0, 1.48, 0.55, 0.1, 0.1, 0.7, "stone", 0.12));
  }
  return g;
}

function towerThunder(level) {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x6b4423, 0, 0.2, 0, 1.45, 0.22, 1.05, "wood", 0.05));
  for (const [x, z] of [[-0.52, 0.4], [0.52, 0.4], [-0.52, -0.4], [0.52, -0.4]]) {
    g.add(p(geo.cyl, 0x3a2414, x, 0.22, z, 0.16, 0.2, 0.16, "wood", 0.1));
  }
  g.add(p(geo.box, 0x8a8478, 0, 0.58, -0.12, 0.62, 0.5, 0.62, "stone", 0.06));
  const arm = new THREE.Group();
  arm.add(p(geo.box, 0x6b4423, 0, 0.6, 0, 0.16, 1.25, 0.16, "wood", 0.08));
  arm.add(p(geo.sph, 0x4a4038, 0, 1.28, 0, 0.24, 0.24, 0.24, "stone", 0.1));
  arm.position.set(0, 0.42, 0.05);
  arm.rotation.z = 0.65;
  g.add(arm);
  if (level >= 2) {
    g.add(p(geo.box, 0xb85c38, 0.55, 0.72, 0.22, 0.22, 0.45, 0.22, "roof", 0.08));
    g.add(p(geo.box, 0x8b1e1e, -0.7, 0.85, 0, 0.08, 0.55, 0.28, "cloth", 0.1));
  }
  if (level >= 3) {
    g.add(p(geo.box, 0x5a3218, 0, 0.95, -0.35, 1.15, 0.18, 0.7, "wood", 0.06));
    g.add(p(geo.sph, 0x3a3018, 0.35, 1.15, -0.2, 0.18, 0.18, 0.18, "stone", 0.1));
  }
  return g;
}

function towerBarracks(level) {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x6b4423, 0, 0.16, 0, 1.15, 0.2, 1.15, "wood", 0.05));
  const tent = mesh(geo.cone, new THREE.MeshToonMaterial({ color: 0x8b1e1e, map: texRoof("#8b1e1e"), gradientMap: sharedMat(0x8b1e1e, "roof").gradientMap }), 0, 1.05, 0, 1.25, 1.65, 1.25);
  addOutline(tent, 0.04);
  g.add(tent);
  g.add(p(geo.box, 0xc9a227, 0, 1.95, 0, 0.08, 0.5, 0.08, "wood", 0.12));
  g.add(p(geo.box, 0xc9a227, 0.16, 1.95, 0, 0.34, 0.26, 0.05, "cloth", 0.1));
  for (const [x, z] of [[-1.0, -0.7], [1.0, -0.7], [-1.0, 0.7], [1.0, 0.7]]) {
    g.add(p(geo.box, 0x5a3a1a, x, 0.32, z, 0.1, 0.5, 0.1, "wood", 0.1));
  }
  const fire = mesh(geo.sph, mat(0xff7a2a, { glow: true }), 0.75, 0.22, 0.6, 0.12, 0.12, 0.12);
  fire.name = "campfire";
  g.add(fire);
  if (level >= 2) {
    g.add(p(geo.box, 0x6b4423, -0.95, 0.35, 0.15, 0.35, 0.55, 0.18, "wood", 0.08));
    g.add(p(geo.cone, 0x6d1612, -0.7, 0.85, -0.55, 0.45, 0.7, 0.45, "roof", 0.07));
  }
  if (level >= 3) {
    g.add(p(geo.box, 0x8b1e1e, 0.9, 0.7, -0.2, 0.12, 1.1, 0.12, "wood", 0.08));
    g.add(p(geo.box, 0xc9a227, 1.05, 1.15, -0.2, 0.28, 0.22, 0.05, "cloth", 0.1));
    g.add(p(geo.box, 0x8a8478, 0.85, 0.28, 0.55, 0.35, 0.2, 0.35, "stone", 0.1));
  }
  return g;
}

function towerSage(level) {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x8a8478, 0, 0.2, 0, 0.95, 0.38, 0.95, "stone", 0.05));
  g.add(p(geo.cyl, 0x6b4423, 0, 0.7, 0, 0.68, 0.55, 0.68, "wood", 0.06));
  const roof = mesh(geo.cone, new THREE.MeshToonMaterial({ color: 0x2f6b4f, map: texRoof("#2f6b4f"), gradientMap: sharedMat(0x2f6b4f, "roof").gradientMap }), 0, 1.28, 0, 1.05, 0.52, 1.05);
  addOutline(roof, 0.05);
  g.add(roof);
  const orb = mesh(geo.oct, mat(0x7cf0c4, { glow: true }), 0, 1.05, 0, 0.22, 0.22, 0.22);
  orb.name = "orb";
  g.add(orb);
  if (level >= 2) {
    g.add(p(geo.cone, 0x24563e, 0, 1.62, 0, 0.68, 0.36, 0.68, "roof", 0.06));
    g.add(p(geo.box, 0xc9a227, 0.55, 0.55, 0.4, 0.12, 0.45, 0.08, "cloth", 0.1));
  }
  if (level >= 3) {
    g.add(p(geo.torus, 0xc9a227, 0, 0.08, 0, 0.95, 0.95, 0.95, "stone", 0.08));
    g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    g.add(p(geo.cone, 0xc9a227, 0, 1.92, 0, 0.36, 0.22, 0.36, "stone", 0.08));
  }
  return g;
}

export function makeSpot() {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x8a8478, 0, 0.06, 0, 1.2, 0.12, 1.2, "stone", 0.04));
  g.add(p(geo.cyl, 0x8a6238, 0, 0.14, 0, 0.92, 0.1, 0.92, "wood", 0.05));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    g.add(p(geo.box, 0x5a3a1a, Math.cos(a) * 0.78, 0.22, Math.sin(a) * 0.78, 0.1, 0.28, 0.1, "wood", 0.1));
  }
  return g;
}

export function makeHpBar() {
  const g = new THREE.Group();
  const bg = mesh(geo.box, mat(0x1a120c), 0, 0, 0, 0.95, 0.1, 0.1);
  addOutline(bg, 0.12);
  const fg = mesh(geo.box, mat(0x3f8a32), 0, 0.02, 0.02, 0.88, 0.06, 0.06);
  fg.name = "hp";
  g.add(bg, fg);
  g.userData.fg = fg;
  return g;
}

export function setHpBar(bar, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  bar.userData.fg.scale.x = r;
  bar.userData.fg.position.x = (r - 1) * 0.44;
  bar.userData.fg.material.color.setHex(r > 0.45 ? 0x3f8a32 : r > 0.2 ? 0xc9a227 : 0x8b1e1e);
}

export function makeGate() {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x8a8478, -1.25, 1.15, 0, 0.7, 2.3, 0.85, "stone", 0.04));
  g.add(p(geo.box, 0x8a8478, 1.25, 1.15, 0, 0.7, 2.3, 0.85, "stone", 0.04));
  g.add(p(geo.box, 0x8a8478, 0, 2.4, 0, 3.2, 0.5, 0.95, "stone", 0.04));
  g.add(p(geo.cone, 0x8b1e1e, -1.25, 2.55, 0, 0.85, 0.45, 0.85, "roof", 0.06));
  g.add(p(geo.cone, 0x8b1e1e, 1.25, 2.55, 0, 0.85, 0.45, 0.85, "roof", 0.06));
  g.add(p(geo.box, 0x8b1e1e, 0, 2.85, 0.12, 1.2, 0.55, 0.08, "cloth", 0.08));
  g.add(p(geo.box, 0xc9a227, 0, 2.85, 0.18, 0.32, 0.32, 0.06, "cloth", 0.1));
  g.add(p(geo.box, 0x5a3a1a, 0, 0.9, 0.1, 1.6, 1.6, 0.12, "wood", 0.05));
  return g;
}

export function makePortal() {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x6b4423, -0.7, 0.9, 0, 0.18, 1.8, 0.18, "wood", 0.08));
  g.add(p(geo.box, 0x6b4423, 0.7, 0.9, 0, 0.18, 1.8, 0.18, "wood", 0.08));
  g.add(p(geo.box, 0x6b4423, 0, 1.8, 0, 1.6, 0.16, 0.16, "wood", 0.08));
  g.add(p(geo.box, 0x8b1e1e, 0.15, 1.35, 0.08, 0.55, 0.7, 0.05, "cloth", 0.1));
  return g;
}

export function tree(kind = "puff") {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x5a3a1a, 0, 0.4, 0, 0.14, 0.8, 0.14, "wood", 0.1));
  if (kind === "pine") {
    g.add(p(geo.cone, 0x1f7a32, 0, 1.15, 0, 0.78, 1.1, 0.78, "flat", 0.08));
    g.add(p(geo.cone, 0x2f9a40, 0, 1.75, 0, 0.55, 0.75, 0.55, "flat", 0.08));
    g.add(p(geo.cone, 0x5aca48, 0, 2.18, 0, 0.32, 0.46, 0.32, "flat", 0.1));
  } else {
    g.add(p(geo.sph, 0x1f7a32, 0, 1.2, 0, 0.7, 0.55, 0.7, "flat", 0.07));
    g.add(p(geo.sph, 0x2f9a3a, 0.3, 1.32, 0.12, 0.48, 0.42, 0.48, "flat", 0.08));
    g.add(p(geo.sph, 0x3aaa40, -0.26, 1.38, -0.14, 0.44, 0.38, 0.44, "flat", 0.08));
    g.add(p(geo.sph, 0x6ada50, 0.06, 1.62, 0.06, 0.36, 0.32, 0.36, "flat", 0.09));
  }
  return g;
}

export function rock(color = 0x8a8478, s = 1) {
  const g = new THREE.Group();
  g.add(p(geo.oct, color, 0, 0.22 * s, 0, 0.5 * s, 0.36 * s, 0.42 * s, "stone", 0.08));
  g.add(p(geo.oct, color, 0.18 * s, 0.14 * s, 0.1 * s, 0.28 * s, 0.2 * s, 0.24 * s, "stone", 0.1));
  return g;
}

export function banner(color = 0x8b1e1e) {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x5a3a1a, 0, 0.95, 0, 0.055, 1.9, 0.055, "wood", 0.12));
  g.add(p(geo.box, color, 0.32, 1.5, 0, 0.58, 0.5, 0.05, "cloth", 0.08));
  return g;
}

function tuft() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    g.add(mesh(geo.cone, sharedMat(0x3f8a32, "grass"), (i - 1) * 0.08, 0.16, (i % 2) * 0.05, 0.05, 0.32, 0.05));
  }
  return g;
}

function crate() {
  return p(geo.box, 0x8a5a32, 0, 0.18, 0, 0.36, 0.36, 0.36, "wood", 0.08);
}

function barrel() {
  return p(geo.cyl, 0x6b4423, 0, 0.22, 0, 0.18, 0.42, 0.18, "wood", 0.08);
}

function cart() {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x6b4423, 0, 0.32, 0, 0.9, 0.28, 0.5, "wood", 0.06));
  g.add(p(geo.cyl, 0x3a2414, -0.28, 0.16, 0.28, 0.14, 0.08, 0.14, "wood", 0.1));
  g.add(p(geo.cyl, 0x3a2414, 0.28, 0.16, 0.28, 0.14, 0.08, 0.14, "wood", 0.1));
  return g;
}

function hut() {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x6b4423, 0, 0.45, 0, 1.3, 0.9, 1.0, "wood", 0.04));
  g.add(p(geo.cone, 0xc9a227, 0, 1.2, 0, 1.15, 0.7, 1.15, "roof", 0.05));
  return g;
}

function well() {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x8a8478, 0, 0.22, 0, 0.38, 0.4, 0.38, "stone", 0.07));
  g.add(p(geo.box, 0x6b4423, 0, 0.7, 0, 0.08, 0.55, 0.08, "wood", 0.12));
  return g;
}

function lantern() {
  const g = new THREE.Group();
  g.add(p(geo.cyl, 0x5a3a1a, 0, 0.7, 0, 0.04, 1.4, 0.04, "wood", 0.14));
  const glow = mesh(geo.sph, mat(0xffb24a, { glow: true }), 0.22, 1.15, 0, 0.12, 0.14, 0.12);
  glow.name = "lantern";
  g.add(glow);
  g.add(p(geo.box, 0x8b1e1e, 0.22, 1.15, 0, 0.16, 0.2, 0.16, "cloth", 0.1));
  return g;
}

function boat() {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x6b4423, 0, 0.14, 0, 1.9, 0.18, 0.62, "wood", 0.05));
  g.add(p(geo.box, 0x5a3218, 0, 0.28, 0, 1.5, 0.12, 0.42, "wood", 0.06));
  g.add(p(geo.cyl, 0x4a3018, 0, 0.75, 0, 0.045, 1.15, 0.045, "wood", 0.12));
  g.add(p(geo.box, 0xc9a227, 0.2, 1.05, 0, 0.45, 0.32, 0.05, "cloth", 0.1));
  return g;
}

function reeds() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    g.add(p(geo.cone, 0x4a7a40, (i - 2.5) * 0.16, 0.42, (i % 3) * 0.1, 0.055, 0.85, 0.055, "grass", 0.12));
  }
  return g;
}

function watchtower() {
  const g = new THREE.Group();
  g.add(p(geo.box, 0x6b4423, -0.35, 0.9, -0.35, 0.14, 1.8, 0.14, "wood", 0.08));
  g.add(p(geo.box, 0x6b4423, 0.35, 0.9, -0.35, 0.14, 1.8, 0.14, "wood", 0.08));
  g.add(p(geo.box, 0x6b4423, -0.35, 0.9, 0.35, 0.14, 1.8, 0.14, "wood", 0.08));
  g.add(p(geo.box, 0x6b4423, 0.35, 0.9, 0.35, 0.14, 1.8, 0.14, "wood", 0.08));
  g.add(p(geo.box, 0x8a5a32, 0, 1.85, 0, 1.05, 0.16, 1.05, "wood", 0.05));
  g.add(p(geo.cone, 0x8b1e1e, 0, 2.25, 0, 0.85, 0.45, 0.85, "roof", 0.06));
  return g;
}

function palisade(len = 3) {
  const g = new THREE.Group();
  for (let i = 0; i < len; i++) {
    g.add(p(geo.box, 0x5a3a1a, (i - len / 2) * 0.28, 0.45, 0, 0.12, 0.9, 0.12, "wood", 0.1));
  }
  return g;
}

function cliffChunk(w, h, d, color = 0x7a6a58) {
  const g = new THREE.Group();
  g.add(p(geo.box, color, 0, h * 0.45, 0, w, h, d, "stone", 0.03));
  g.add(p(geo.oct, color, w * 0.25, h * 0.7, d * 0.1, w * 0.45, h * 0.35, d * 0.4, "stone", 0.04));
  g.add(p(geo.oct, color, -w * 0.2, h * 0.35, -d * 0.15, w * 0.35, h * 0.28, d * 0.3, "stone", 0.05));
  return g;
}

function occupied(map, x, z, extra = []) {
  if (map.spots.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.3)) return true;
  if (map.heroStarts.some((p) => Math.hypot(p[0] - x, p[1] - z) < 1.7)) return true;
  if (map.path.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.4)) return true;
  if (extra.some((p) => Math.hypot(p[0] - x, p[1] - z) < 1.6)) return true;
  return false;
}

function place(group, factory, x, z, rot = 0, s = 1) {
  const n = factory();
  n.position.set(x, 0, z);
  n.rotation.y = rot;
  n.scale.multiplyScalar(s);
  group.add(n);
  return n;
}

export function decorateMap(scene, map) {
  const group = new THREE.Group();
  const theme = map.theme;
  const grass = texGrass(theme.grassA || "#3f8a32", theme.grassB || "#2c6a24", theme.grassC || "#5aa33c");
  const ground = mesh(geo.box, new THREE.MeshToonMaterial({ color: theme.ground, map: grass, gradientMap: sharedMat(theme.ground, "grass").gradientMap }), 0, -0.1, 0, 46, 0.22, 30);
  ground.userData.skipOutline = true;
  group.add(ground);
  const rim = mesh(geo.box, sharedMat(theme.groundAlt, "stone"), 0, -0.45, 0, 50, 0.5, 34);
  group.add(rim);

  if (map.decor === "pass") dressPass(group, map);
  if (map.decor === "river") dressRiver(group, map);
  if (map.decor === "plank") dressPlank(group, map);

  scatterDressing(group, map);
  scene.add(group);
  return group;
}

function dressPass(group, map) {
  for (let i = 0; i < 10; i++) {
    const c = cliffChunk(2.6 + (i % 3) * 0.4, 2.4 + (i % 4) * 0.55, 2.0, 0x7a6a52);
    c.position.set(-17 + i * 3.6, 0, 9.6 + (i % 2) * 0.4);
    c.rotation.y = 0.12 * ((i % 3) - 1);
    group.add(c);
    const c2 = cliffChunk(2.4, 2.1 + (i % 3) * 0.5, 1.9, 0x6a5a44);
    c2.position.set(-16 + i * 3.5, 0, -9.8);
    group.add(c2);
  }
  const pines = [[-16, 7.4], [-10, 8.2], [-3, 8.6], [5, 8.3], [12, 7.8], [17, 7.2], [-15, -7.8], [-6, -8.2], [4, -8.4], [13, -7.6], [17.5, -6.8]];
  for (const [x, z] of pines) {
    if (!occupied(map, x, z)) place(group, () => tree("pine"), x, z, 0, 1.15 + Math.abs(x) * 0.01);
  }
  place(group, hut, -15.4, -5.6, 0.3, 1);
  place(group, hut, -13.2, -6.4, -0.2, 0.85);
  place(group, well, -14.2, -4.4);
  place(group, cart, 6.8, -6.2, 0.6);
  place(group, () => banner(0x8b1e1e), -11.2, 3.4);
  place(group, () => banner(0xc9a227), 10.6, 4.2);
  place(group, watchtower, 16.4, 5.8, -0.4, 0.9);
  place(group, makeGate, -17.6, 4.8, 0.45, 0.85);
}

function dressRiver(group, map) {
  const water = mesh(geo.box, new THREE.MeshToonMaterial({
    color: 0x1a6a78,
    map: paintMap("water"),
    gradientMap: sharedMat(0x1a6a78, "water").gradientMap,
    transparent: true,
    opacity: 0.92,
  }), 0, -0.02, 0, 46, 0.08, 30);
  water.name = "water";
  water.userData.skipOutline = true;
  group.add(water);
  const islands = [[-12, -1, 5.6], [-4, 3.2, 5.1], [3, 1.4, 4.8], [10, -2.4, 5.3], [16, 2.2, 4.5]];
  for (const [x, z, s] of islands) {
    group.add(p(geo.cyl, 0x3f8a32, x, 0.08, z, s * 0.55, 0.18, s * 0.46, "grass", 0.03));
    group.add(p(geo.cyl, 0x8a6238, x, 0.16, z, s * 0.4, 0.07, s * 0.32, "wood", 0.04));
  }
  for (const pos of [[-16, 6.2], [-7, -6.6], [2, 7.4], [12, 6.8], [17, -6.2], [-12, 5.5]]) {
    place(group, reeds, pos[0], pos[1], 0, 1.1);
  }
  place(group, boat, -15.2, 2.2, 0.4);
  place(group, boat, 1.2, -2.4, -0.5);
  place(group, boat, 13.4, 4.6, 0.2);
  place(group, lantern, -8.4, 5.0);
  place(group, lantern, 8.6, -5.2);
  place(group, () => palisade(8), 4.4, 5.8, 0.2);
  place(group, () => banner(0x2f6b4f), 5.2, 5.2);
  place(group, watchtower, -16.6, -1.2, 0.3, 0.85);
}

function dressPlank(group, map) {
  for (let i = 0; i < 9; i++) {
    const c = cliffChunk(3.0, 2.6 + (i % 4) * 0.45, 2.2, 0x5a5848);
    c.position.set(-17 + i * 4.0, 0.2, 9.6);
    group.add(c);
    const c2 = cliffChunk(2.8, 2.2 + (i % 3) * 0.4, 2.0, 0x4a483c);
    c2.position.set(-15 + i * 3.8, 0.15, -9.7);
    group.add(c2);
  }
  for (const pos of [[-16, 8.4], [-5, 8.6], [7, 8.2], [16, 8.0], [-12, -8.2], [3, -8.4], [14, -8.0]]) {
    place(group, () => tree(pos[1] > 0 ? "pine" : "puff"), pos[0], pos[1], 0, 1.2);
  }
  const mist = mesh(geo.box, mat(0xc5d0c4, { transparent: true, opacity: 0.14 }), 0, 0.55, 0, 42, 0.35, 22);
  mist.userData.skipOutline = true;
  group.add(mist);
  place(group, () => banner(0x6a7a48), 12.4, 5.6);
  place(group, lantern, -8.8, 4.6);
  place(group, watchtower, 16.2, 5.2, -0.3, 0.8);
  for (let i = 0; i < map.path.length - 1; i += 2) {
    const a = map.path[i];
    const b = map.path[i + 1];
    const mx = (a[0] + b[0]) / 2;
    const mz = (a[1] + b[1]) / 2;
    const ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
    if (!occupied(map, mx + 1.1, mz)) {
      const post = p(geo.cyl, 0x6b4423, 0, 0.45, 0, 0.05, 0.9, 0.05, "wood", 0.12);
      post.position.set(mx + Math.cos(ang) * 1.15, 0, mz + Math.sin(ang) * 1.15);
      group.add(post);
    }
  }
}

function scatterDressing(group, map) {
  const rnd = seed(map.id.length * 97);
  const extras = [];
  for (let i = 0; i < 28; i++) {
    const x = (rnd() - 0.5) * 36;
    const z = (rnd() - 0.5) * 22;
    if (occupied(map, x, z, extras)) continue;
    extras.push([x, z]);
    const roll = rnd();
    if (roll < 0.35) place(group, tuft, x, z, rnd() * 4, 0.8 + rnd() * 0.5);
    else if (roll < 0.55) place(group, () => rock(0x8a8478, 0.7 + rnd() * 0.6), x, z, rnd() * 4);
    else if (roll < 0.7) place(group, crate, x, z, rnd() * 2);
    else if (roll < 0.82) place(group, barrel, x, z);
    else if (roll < 0.9) place(group, () => tree("puff"), x, z, 0, 0.7 + rnd() * 0.3);
    else place(group, () => banner(0x8b1e1e), x, z);
  }
}

function seed(n) {
  let s = n % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function makePathRibbon(points, color, style = "dirt") {
  const width = style === "plank" ? 1.85 : 2.2;
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0.05, p[1])));
  const segs = 90;
  const pts = curve.getSpacedPoints(segs);
  const positions = [];
  const uvs = [];
  const indices = [];
  const edgePos = [];
  const edgeIdx = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dir = next.clone().sub(prev).setY(0).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const jag = 1 + Math.sin(i * 1.7) * 0.07 + Math.sin(i * 4.3) * 0.045;
    const w = width * 0.5 * jag;
    const l = pts[i].clone().addScaledVector(perp, w);
    const r = pts[i].clone().addScaledVector(perp, -w);
    l.y = r.y = 0.055;
    positions.push(l.x, l.y, l.z, r.x, r.y, r.z);
    uvs.push(0, i * 0.12, 1, i * 0.12);
    const el = pts[i].clone().addScaledVector(perp, w + 0.18);
    const er = pts[i].clone().addScaledVector(perp, -(w + 0.18));
    el.y = er.y = 0.03;
    edgePos.push(el.x, el.y, el.z, er.x, er.y, er.z);
    if (i < pts.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      edgeIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geoPath = new THREE.BufferGeometry();
  geoPath.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geoPath.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geoPath.setIndex(indices);
  geoPath.computeVertexNormals();
  const mapTex = style === "dirt" ? paintMap("dirt") : paintMap("wood");
  const path = new THREE.Mesh(geoPath, new THREE.MeshToonMaterial({
    color,
    map: mapTex,
    gradientMap: sharedMat(color, style === "dirt" ? "dirt" : "wood").gradientMap,
  }));

  const geoEdge = new THREE.BufferGeometry();
  geoEdge.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
  geoEdge.setIndex(edgeIdx);
  geoEdge.computeVertexNormals();
  const edge = new THREE.Mesh(geoEdge, mat(0x1a2010));
  const g = new THREE.Group();
  g.add(edge, path);
  return g;
}

void outlinedGroup;
