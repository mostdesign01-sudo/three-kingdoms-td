import * as THREE from "three";

const texCache = new Map();
const matCache = new Map();

function canvasTex(key, size, draw, repeat = 2) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

function blot(ctx, x, y, r, color, a = 0.35) {
  ctx.fillStyle = color;
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.ellipse(x, y, r * (0.7 + Math.random() * 0.6), r * (0.6 + Math.random() * 0.7), Math.random() * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function texGrass(a = "#3f8a32", b = "#2c6a24", c = "#5aa33c") {
  return canvasTex(`grass:${a}${b}${c}`, 256, (ctx, s) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) blot(ctx, Math.random() * s, Math.random() * s, 8 + Math.random() * 22, b, 0.28);
    for (let i = 0; i < 70; i++) blot(ctx, Math.random() * s, Math.random() * s, 4 + Math.random() * 12, c, 0.22);
    ctx.strokeStyle = "rgba(20,40,12,0.18)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 2, y - 6, x - 1, y - 11);
      ctx.stroke();
    }
  }, 6);
}

export function texDirt() {
  return canvasTex("dirt", 256, (ctx, s) => {
    ctx.fillStyle = "#d2b06a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 120; i++) blot(ctx, Math.random() * s, Math.random() * s, 6 + Math.random() * 16, "#b89048", 0.3);
    for (let i = 0; i < 80; i++) blot(ctx, Math.random() * s, Math.random() * s, 3 + Math.random() * 8, "#e8d08a", 0.2);
    ctx.fillStyle = "rgba(70,48,20,0.35)";
    for (let i = 0; i < 200; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 1.2, 1.2);
  }, 3);
}

export function texWood() {
  return canvasTex("wood", 256, (ctx, s) => {
    ctx.fillStyle = "#8a5a32";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 7) {
      ctx.strokeStyle = `rgba(50,28,10,${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * 2);
      ctx.bezierCurveTo(s * 0.3, y + 3, s * 0.6, y - 3, s, y + 2);
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) blot(ctx, Math.random() * s, Math.random() * s, 4, "#5a3818", 0.2);
  }, 2);
}

export function texStone() {
  return canvasTex("stone", 256, (ctx, s) => {
    ctx.fillStyle = "#8a8478";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 50; i++) blot(ctx, Math.random() * s, Math.random() * s, 10 + Math.random() * 24, "#6a655c", 0.3);
    for (let i = 0; i < 40; i++) blot(ctx, Math.random() * s, Math.random() * s, 6, "#b0aaa0", 0.18);
    ctx.strokeStyle = "rgba(30,28,24,0.25)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, Math.random() * s);
      ctx.lineTo(Math.random() * s, Math.random() * s);
      ctx.stroke();
    }
  }, 2);
}

export function texWater() {
  return canvasTex("water", 256, (ctx, s) => {
    ctx.fillStyle = "#1b6a78";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) blot(ctx, Math.random() * s, Math.random() * s, 16, "#0e4a58", 0.28);
    ctx.strokeStyle = "rgba(180,230,240,0.22)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const y = 10 + i * 16;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(60, y - 6, 140, y + 8, 256, y);
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) blot(ctx, Math.random() * s, Math.random() * s, 8, "#3a9aaa", 0.16);
  }, 3);
}

export function texRoof(color = "#8b1e1e") {
  return canvasTex(`roof:${color}`, 128, (ctx, s) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(20,8,8,0.35)";
    ctx.lineWidth = 3;
    for (let y = 6; y < s; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s, y + 2);
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) blot(ctx, Math.random() * s, Math.random() * s, 5, "#000", 0.08);
  }, 2);
}

export function texCloth() {
  return canvasTex("cloth", 128, (ctx, s) => {
    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) blot(ctx, Math.random() * s, Math.random() * s, 8, "#666", 0.2);
    for (let i = 0; i < 30; i++) blot(ctx, Math.random() * s, Math.random() * s, 5, "#aaa", 0.15);
  }, 1);
}

function toonRamp() {
  if (texCache.has("ramp")) return texCache.get("ramp");
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 1;
  const ctx = c.getContext("2d");
  const shades = ["#5a5348", "#8a8070", "#c4b8a0", "#fff4dc"];
  shades.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i, 0, 1, 1);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  texCache.set("ramp", tex);
  return tex;
}

const MAPS = {
  grass: () => texGrass(),
  dirt: texDirt,
  wood: texWood,
  stone: texStone,
  water: texWater,
  cloth: texCloth,
  roof: () => texRoof(),
};

export function paintMap(name) {
  return (MAPS[name] || MAPS.cloth)();
}

export function mat(color, extras = {}) {
  if (extras.glow || (extras.emissiveIntensity ?? 0) > 0.4) {
    return new THREE.MeshBasicMaterial({
      color: extras.emissive ?? color,
      transparent: extras.transparent ?? Boolean(extras.opacity && extras.opacity < 1),
      opacity: extras.opacity ?? 1,
      side: extras.side ?? THREE.FrontSide,
    });
  }
  const map = extras.map || null;
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: toonRamp(),
    map,
    transparent: extras.transparent ?? false,
    opacity: extras.opacity ?? 1,
    side: extras.side ?? THREE.FrontSide,
  });
}

export function sharedMat(color, mapName = "cloth") {
  const key = `${color}|${mapName}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonRamp(),
    map: paintMap(mapName),
  });
  matCache.set(key, m);
  return m;
}

const outlineMat = new THREE.MeshBasicMaterial({
  color: 0x1a120c,
  side: THREE.BackSide,
});

export function addOutline(mesh, inflate = 0.075) {
  const ol = new THREE.Mesh(mesh.geometry, outlineMat);
  ol.scale.setScalar(1 + inflate);
  ol.raycast = () => {};
  mesh.add(ol);
  return mesh;
}

export function outlinedGroup(group, inflate = 0.07) {
  group.traverse((child) => {
    if (child.isMesh && !child.userData.skipOutline && child.material !== outlineMat) {
      addOutline(child, inflate);
    }
  });
  return group;
}
