import * as THREE from "three";

const geo = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 10),
  sph: new THREE.SphereGeometry(1, 12, 10),
  oct: new THREE.OctahedronGeometry(1),
  torus: new THREE.TorusGeometry(1, 0.22, 8, 14),
};

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: extras.roughness ?? 0.72,
    metalness: extras.metalness ?? 0.08,
    emissive: extras.emissive ?? 0x000000,
    emissiveIntensity: extras.emissiveIntensity ?? 0,
    transparent: extras.transparent ?? false,
    opacity: extras.opacity ?? 1,
    flatShading: extras.flat !== false,
  });
}

function mesh(geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

export function makeBlob(color = 0x111111, scale = 1) {
  const m = mesh(geo.cyl, mat(color, { transparent: true, opacity: 0.28, flat: false }), 0, 0.02, 0, 0.55 * scale, 0.04, 0.55 * scale);
  return m;
}

export function makeCharacter({
  body = 0x6b3a2a,
  cloth = 0x8b1e1e,
  helm = 0xc9a227,
  skin = 0xe6c2a0,
  scale = 1,
  weapon = "spear",
  hero = null,
} = {}) {
  const g = new THREE.Group();
  g.add(mesh(geo.box, mat(0x2a1c14), -0.16, 0.22, 0.04, 0.16, 0.42, 0.16));
  g.add(mesh(geo.box, mat(0x2a1c14), 0.16, 0.22, 0.04, 0.16, 0.42, 0.16));
  g.add(mesh(geo.box, mat(cloth), 0, 0.62, 0, 0.52, 0.55, 0.32));
  g.add(mesh(geo.box, mat(body), 0, 0.92, 0, 0.58, 0.22, 0.36));
  g.add(mesh(geo.sph, mat(skin, { flat: false }), 0, 1.22, 0.04, 0.2, 0.2, 0.2));
  g.add(mesh(geo.cone, mat(helm), 0, 1.46, 0, 0.22, 0.22, 0.22));

  if (hero === "guanyu") {
    g.add(mesh(geo.box, mat(0x3a120e), 0, 0.7, -0.22, 0.62, 0.7, 0.08));
    const beard = mesh(geo.box, mat(0x1a0a08), 0, 1.08, 0.18, 0.16, 0.22, 0.08);
    g.add(beard);
    const blade = new THREE.Group();
    blade.add(mesh(geo.cyl, mat(0x5a3a1a), 0, 0.5, 0, 0.04, 1.1, 0.04));
    blade.add(mesh(geo.box, mat(0xc9a227, { metalness: 0.45 }), 0, 1.18, 0, 0.08, 0.7, 0.22));
    blade.add(mesh(geo.cone, mat(0xe8d48a, { metalness: 0.5 }), 0, 1.62, 0, 0.1, 0.22, 0.1));
    blade.position.set(0.42, 0.35, 0.1);
    blade.rotation.z = -0.35;
    g.add(blade);
  } else if (hero === "zhaoyun") {
    g.add(mesh(geo.box, mat(0xe8eef6), 0, 0.72, -0.2, 0.5, 0.62, 0.06));
    const spear = new THREE.Group();
    spear.add(mesh(geo.cyl, mat(0x7a5a32), 0, 0.7, 0, 0.035, 1.5, 0.035));
    spear.add(mesh(geo.cone, mat(0xd8deea, { metalness: 0.5 }), 0, 1.52, 0, 0.08, 0.28, 0.08));
    spear.position.set(0.38, 0.2, 0.12);
    spear.rotation.z = -0.25;
    g.add(spear);
  } else if (hero === "zhuge") {
    g.children.pop();
    g.add(mesh(geo.box, mat(0x3f7a4e), 0, 0.58, 0, 0.7, 0.85, 0.42));
    g.add(mesh(geo.sph, mat(skin, { flat: false }), 0, 1.18, 0.04, 0.2, 0.2, 0.2));
    g.add(mesh(geo.box, mat(0xf0e2b0), 0, 1.42, 0, 0.42, 0.08, 0.42));
    const fan = mesh(geo.box, mat(0xc9a227), 0.42, 0.95, 0.18, 0.08, 0.28, 0.36);
    g.add(fan);
  } else if (hero === "lubu") {
    g.add(mesh(geo.box, mat(0x2a1040), 0, 0.75, -0.24, 0.7, 0.8, 0.1));
    g.add(mesh(geo.cone, mat(0xc9a227), 0, 1.62, 0, 0.28, 0.36, 0.28));
    const ji = new THREE.Group();
    ji.add(mesh(geo.cyl, mat(0x4a2a12), 0, 0.8, 0, 0.045, 1.7, 0.045));
    ji.add(mesh(geo.box, mat(0xe8d48a, { metalness: 0.5 }), 0, 1.7, 0, 0.12, 0.34, 0.34));
    ji.add(mesh(geo.cone, mat(0xc9a227), 0.22, 1.62, 0, 0.1, 0.28, 0.08));
    ji.position.set(0.5, 0.25, 0.1);
    g.add(ji);
  } else if (weapon === "spear") {
    const spear = mesh(geo.cyl, mat(0x7a5a32), 0.34, 0.7, 0.1, 0.03, 1.15, 0.03);
    g.add(spear);
    g.add(mesh(geo.cone, mat(0xc9c4b0, { metalness: 0.4 }), 0.34, 1.32, 0.1, 0.06, 0.18, 0.06));
  } else if (weapon === "shield") {
    g.add(mesh(geo.box, mat(0x35553a), -0.38, 0.7, 0.16, 0.1, 0.5, 0.42));
    g.add(mesh(geo.cyl, mat(0x7a5a32), 0.34, 0.62, 0.08, 0.03, 0.9, 0.03));
  } else if (weapon === "horse") {
    g.add(mesh(geo.cyl, mat(0x7a5a32), 0.34, 0.7, 0.1, 0.03, 1.05, 0.03));
    const horse = new THREE.Group();
    horse.add(mesh(geo.box, mat(0x3a2a20), 0, 0.42, -0.1, 0.42, 0.38, 0.9));
    horse.add(mesh(geo.box, mat(0x3a2a20), 0, 0.62, 0.46, 0.28, 0.28, 0.28));
    horse.add(mesh(geo.cyl, mat(0x2a1c14), -0.14, 0.18, 0.28, 0.07, 0.36, 0.07));
    horse.add(mesh(geo.cyl, mat(0x2a1c14), 0.14, 0.18, 0.28, 0.07, 0.36, 0.07));
    horse.add(mesh(geo.cyl, mat(0x2a1c14), -0.14, 0.18, -0.36, 0.07, 0.36, 0.07));
    horse.add(mesh(geo.cyl, mat(0x2a1c14), 0.14, 0.18, -0.36, 0.07, 0.36, 0.07));
    g.position.y = 0.28;
    horse.add(g.clone());
    horse.scale.setScalar(scale);
    horse.userData.bob = 0.08;
    return horse;
  }

  g.scale.setScalar(scale);
  return g;
}

export function makeTower(type, level = 1) {
  const g = new THREE.Group();
  const wood = mat(0x6b4423);
  const dark = mat(0x3a2414);
  const stone = mat(0x6a6460);
  const gold = mat(0xc9a227, { metalness: 0.35, emissive: 0x3a2a00, emissiveIntensity: 0.15 });

  if (type === "ballista") {
    g.add(mesh(geo.cyl, stone, 0, 0.28, 0, 0.7, 0.55, 0.7));
    g.add(mesh(geo.box, wood, 0, 0.85, 0, 1.15, 0.18, 1.15));
    g.add(mesh(geo.box, dark, -0.46, 1.25, -0.46, 0.14, 0.7, 0.14));
    g.add(mesh(geo.box, dark, 0.46, 1.25, -0.46, 0.14, 0.7, 0.14));
    g.add(mesh(geo.box, dark, -0.46, 1.25, 0.46, 0.14, 0.7, 0.14));
    g.add(mesh(geo.box, dark, 0.46, 1.25, 0.46, 0.14, 0.7, 0.14));
    g.add(mesh(geo.cone, mat(0x8b1e1e), 0, 1.85, 0, 0.95, 0.55, 0.95));
    const bow = new THREE.Group();
    bow.add(mesh(geo.box, wood, 0, 0, 0, 1.15, 0.1, 0.12));
    bow.add(mesh(geo.box, gold, 0, 0.08, 0.2, 0.12, 0.12, 0.7));
    bow.position.set(0, 1.42, 0.15);
    g.add(bow);
    const banner = mesh(geo.box, mat(0x8b1e1e), 0.62, 1.7, -0.1, 0.08, 0.7, 0.28);
    g.add(banner);
  } else if (type === "thunder") {
    g.add(mesh(geo.box, wood, 0, 0.22, 0, 1.3, 0.2, 0.9));
    g.add(mesh(geo.cyl, dark, -0.5, 0.22, 0.38, 0.18, 0.18, 0.18));
    g.add(mesh(geo.cyl, dark, 0.5, 0.22, 0.38, 0.18, 0.18, 0.18));
    g.add(mesh(geo.cyl, dark, -0.5, 0.22, -0.38, 0.18, 0.18, 0.18));
    g.add(mesh(geo.cyl, dark, 0.5, 0.22, -0.38, 0.18, 0.18, 0.18));
    const arm = new THREE.Group();
    arm.add(mesh(geo.box, wood, 0, 0.55, 0, 0.14, 1.15, 0.14));
    arm.add(mesh(geo.sph, mat(0x4a4038), 0, 1.15, 0, 0.22, 0.22, 0.22));
    arm.position.set(0, 0.4, 0);
    arm.rotation.z = 0.7;
    g.add(arm);
    g.add(mesh(geo.box, stone, 0, 0.55, -0.15, 0.55, 0.45, 0.55));
    if (level > 1) g.add(mesh(geo.box, mat(0xb85c38, { emissive: 0x401000, emissiveIntensity: 0.3 }), 0.45, 0.7, 0.2, 0.18, 0.4, 0.18));
  } else if (type === "barracks") {
    g.add(mesh(geo.cone, mat(0x8b1e1e), 0, 0.95, 0, 1.15, 1.5, 1.15));
    g.add(mesh(geo.cyl, wood, 0, 0.18, 0, 1.05, 0.22, 1.05));
    g.add(mesh(geo.box, gold, 0, 1.72, 0, 0.08, 0.45, 0.08));
    g.add(mesh(geo.box, mat(0xc9a227), 0.12, 1.72, 0, 0.28, 0.22, 0.04));
    g.add(mesh(geo.box, dark, -0.9, 0.35, -0.6, 0.1, 0.55, 0.1));
    g.add(mesh(geo.box, dark, 0.9, 0.35, -0.6, 0.1, 0.55, 0.1));
    g.add(mesh(geo.box, dark, -0.9, 0.35, 0.6, 0.1, 0.55, 0.1));
    g.add(mesh(geo.box, dark, 0.9, 0.35, 0.6, 0.1, 0.55, 0.1));
    const glow = mesh(geo.sph, mat(0xff7a2a, { emissive: 0xff5510, emissiveIntensity: 0.7 }), 0.7, 0.22, 0.55, 0.12, 0.12, 0.12);
    g.add(glow);
  } else {
    g.add(mesh(geo.cyl, stone, 0, 0.22, 0, 0.85, 0.42, 0.85));
    g.add(mesh(geo.cyl, wood, 0, 0.72, 0, 0.62, 0.55, 0.62));
    g.add(mesh(geo.cone, mat(0x2f6b4f), 0, 1.28, 0, 0.95, 0.5, 0.95));
    g.add(mesh(geo.cone, mat(0x24563e), 0, 1.62, 0, 0.62, 0.34, 0.62));
    const orb = mesh(geo.oct, mat(0x7cf0c4, { emissive: 0x2affaa, emissiveIntensity: 0.8, metalness: 0.2 }), 0, 1.12, 0, 0.22, 0.22, 0.22);
    orb.name = "orb";
    g.add(orb);
  }

  if (level >= 2) {
    g.add(mesh(geo.box, gold, -0.15, 0.08, 0.7, 0.08, 0.35, 0.08));
    g.add(mesh(geo.box, gold, 0.15, 0.08, 0.7, 0.08, 0.35, 0.08));
  }
  if (level >= 3) {
    g.add(mesh(geo.torus, gold, 0, 0.06, 0, 0.85, 0.85, 0.85));
  }
  return g;
}

export function makeSpot(open = true) {
  const g = new THREE.Group();
  g.add(mesh(geo.cyl, mat(open ? 0x8a7350 : 0x4a4034), 0, 0.04, 0, 0.95, 0.08, 0.95));
  const ring = mesh(geo.torus, mat(0xc9a227, { emissive: 0x6a4a00, emissiveIntensity: open ? 0.35 : 0.05 }), 0, 0.08, 0, 0.82, 0.82, 0.82);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

export function makeHpBar() {
  const g = new THREE.Group();
  const bg = mesh(geo.box, mat(0x1a0f0a), 0, 0, 0, 0.9, 0.08, 0.08);
  const fg = mesh(geo.box, mat(0x3f7a4e, { emissive: 0x14532a, emissiveIntensity: 0.3 }), 0, 0.01, 0, 0.88, 0.06, 0.06);
  fg.name = "hp";
  g.add(bg, fg);
  g.userData.fg = fg;
  return g;
}

export function setHpBar(bar, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  bar.userData.fg.scale.x = r;
  bar.userData.fg.position.x = (r - 1) * 0.44;
  bar.userData.fg.material.color.setHex(r > 0.45 ? 0x3f7a4e : r > 0.2 ? 0xc9a227 : 0x8b1e1e);
}

export function makeGate() {
  const g = new THREE.Group();
  const stone = mat(0x6a6460);
  g.add(mesh(geo.box, stone, -1.1, 1.1, 0, 0.55, 2.2, 0.7));
  g.add(mesh(geo.box, stone, 1.1, 1.1, 0, 0.55, 2.2, 0.7));
  g.add(mesh(geo.box, stone, 0, 2.25, 0, 2.8, 0.45, 0.8));
  g.add(mesh(geo.box, mat(0x8b1e1e), 0, 2.7, 0.1, 1.1, 0.55, 0.08));
  g.add(mesh(geo.box, mat(0xc9a227), 0, 2.7, 0.16, 0.28, 0.28, 0.06));
  return g;
}

export function makePortal() {
  const g = new THREE.Group();
  g.add(mesh(geo.torus, mat(0x8b1e1e, { emissive: 0x5a1010, emissiveIntensity: 0.45 }), 0, 1.1, 0, 0.9, 0.9, 0.9));
  g.children[0].rotation.y = Math.PI / 2;
  g.add(mesh(geo.cyl, mat(0x2a1010, { transparent: true, opacity: 0.35 }), 0, 1.1, 0, 0.55, 1.8, 0.08));
  return g;
}

function tree(kind = "pine") {
  const g = new THREE.Group();
  g.add(mesh(geo.cyl, mat(0x4a3018), 0, 0.35, 0, 0.12, 0.7, 0.12));
  if (kind === "pine") {
    g.add(mesh(geo.cone, mat(0x2f4a32), 0, 1.15, 0, 0.7, 1.1, 0.7));
    g.add(mesh(geo.cone, mat(0x3a5a3a), 0, 1.7, 0, 0.45, 0.7, 0.45));
  } else {
    g.add(mesh(geo.sph, mat(0x3f6b48), 0, 1.15, 0, 0.55, 0.45, 0.55));
  }
  return g;
}

function rock(color = 0x6a6460, s = 1) {
  const g = mesh(geo.oct, mat(color), 0, 0.28 * s, 0, 0.55 * s, 0.4 * s, 0.45 * s);
  g.rotation.y = Math.random() * 4;
  return g;
}

function banner(color = 0x8b1e1e) {
  const g = new THREE.Group();
  g.add(mesh(geo.cyl, mat(0x5a3a1a), 0, 0.9, 0, 0.05, 1.8, 0.05));
  g.add(mesh(geo.box, mat(color), 0.28, 1.45, 0, 0.5, 0.45, 0.04));
  return g;
}

export function decorateMap(scene, map) {
  const group = new THREE.Group();
  const theme = map.theme;

  const ground = mesh(geo.box, mat(theme.ground), 0, -0.12, 0, 44, 0.24, 28);
  group.add(ground);
  const rim = mesh(geo.box, mat(theme.groundAlt), 0, -0.4, 0, 48, 0.4, 32);
  group.add(rim);

  if (map.decor === "pass") {
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const cliff = mesh(geo.box, mat(0x5a4a3a), -16 + i * 1.9, 1.4 + (i % 3) * 0.4, side * (9.2 + (i % 4) * 0.4), 2.2, 3.2 + (i % 3), 2.4);
      cliff.rotation.y = side * 0.15;
      group.add(cliff);
    }
    for (const p of [[-15, 7.2], [-8, 8], [2, 8.4], [11, 7.6], [-14, -7.6], [6, -8], [16, -7]]) {
      const t = tree("pine");
      t.position.set(p[0], 0, p[1]);
      t.scale.setScalar(1.1 + Math.abs(p[0]) * 0.02);
      group.add(t);
    }
    for (const p of [[-10, -6.4], [4, 7.2], [14, -6.8], [-3, 7.8]]) {
      const r = rock(0x6a5a48, 1.4);
      r.position.set(p[0], 0, p[1]);
      group.add(r);
    }
    const gatehouse = makeGate();
    gatehouse.position.set(-17.2, 0, 4.6);
    gatehouse.rotation.y = 0.4;
    group.add(gatehouse);
  }

  if (map.decor === "river") {
    const water = mesh(geo.box, mat(0x1a4a58, { roughness: 0.28, metalness: 0.25, transparent: true, opacity: 0.88, flat: false }), 0, -0.02, 0, 44, 0.08, 28);
    water.name = "water";
    group.add(water);
    const islands = [
      [-12, -1, 5.5],
      [-4, 3.2, 5],
      [3, 1.5, 4.6],
      [10, -2.4, 5.2],
      [16, 2.2, 4.4],
    ];
    for (const [x, z, s] of islands) {
      group.add(mesh(geo.cyl, mat(0x3a5a38), x, 0.08, z, s * 0.55, 0.2, s * 0.45));
      group.add(mesh(geo.cyl, mat(0x8a6238), x, 0.18, z, s * 0.42, 0.08, s * 0.34));
    }
    for (const p of [[-16, 6], [-6, -6.5], [2, 7.2], [12, 6.6], [17, -6]]) {
      const reed = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        reed.add(mesh(geo.cone, mat(0x4a7a48), (i - 2) * 0.18, 0.45, (i % 2) * 0.12, 0.06, 0.9, 0.06));
      }
      reed.position.set(p[0], 0, p[1]);
      group.add(reed);
    }
    for (const p of [[-15, 2.4], [1, -2.2], [13, 4.8]]) {
      const boat = new THREE.Group();
      boat.add(mesh(geo.box, mat(0x5a3a1a), 0, 0.12, 0, 1.6, 0.16, 0.55));
      boat.add(mesh(geo.cyl, mat(0x4a3018), 0, 0.7, 0, 0.04, 1.1, 0.04));
      boat.add(mesh(geo.box, mat(0xc9a227), 0.16, 0.95, 0, 0.4, 0.28, 0.04));
      boat.position.set(p[0], 0.02, p[1]);
      group.add(boat);
    }
    const lantern = mesh(geo.sph, mat(0xffb24a, { emissive: 0xff7a1a, emissiveIntensity: 0.8 }), -8.6, 1.4, 5.2, 0.16, 0.16, 0.16);
    group.add(lantern);
    group.add(banner(0x2f6b4f));
    group.children[group.children.length - 1].position.set(4.2, 0, 5.6);
  }

  if (map.decor === "plank") {
    for (let i = 0; i < 12; i++) {
      const h = 2.2 + (i % 4) * 0.7;
      group.add(mesh(geo.box, mat(0x4a4638), -18 + i * 3.2, h * 0.5, 9.4, 3.1, h, 2.2));
      group.add(mesh(geo.box, mat(0x3a362c), -16 + i * 3.0, h * 0.45, -9.6, 2.8, h * 0.9, 2.0));
    }
    for (const p of [[-16, 8.6], [-4, 8.8], [8, 8.4], [16, 8.2], [-12, -8.4], [4, -8.6], [14, -8.2]]) {
      const t = tree(p[1] > 0 ? "pine" : "leaf");
      t.position.set(p[0], 1.4, p[1]);
      group.add(t);
    }
    const mist = mesh(geo.box, mat(0xc5d0c4, { transparent: true, opacity: 0.16, flat: false }), 0, 0.6, 0, 40, 0.4, 20);
    group.add(mist);
    group.add(banner(0x6a7a48));
    group.children[group.children.length - 1].position.set(12.6, 0, 5.8);
  }

  scene.add(group);
  return group;
}

export function makePathRibbon(points, color) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0.06, p[1])));
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.62, 6, false),
    mat(color, { roughness: 0.85 }),
  );
  return tube;
}

export { mat, mesh, geo, tree, rock, banner };
