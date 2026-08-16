import * as THREE from "three";
import { ART, tex } from "./art.js";
import { geo, mat, mesh } from "./models.js";

const SHARED_GEO = new Set(Object.values(geo));

export class VFX {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.items = [];
  }

  spawn(node, life, update) {
    this.scene.add(node);
    this.items.push({ node, life, max: life, update });
  }

  card(texture, w, h, { additive = false, opacity = 1, color = 0xffffff } = {}) {
    const geo = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    return new THREE.Mesh(geo, material);
  }

  spriteCard(texture, w, h, face = 1, opacity = 0.55) {
    const card = this.card(texture, w, h, { opacity });
    card.geometry.translate(0, h / 2 + 0.03, 0);
    card.scale.x = face;
    return card;
  }

  aimYaw(x, z) {
    if (!this.camera) return 0;
    return Math.atan2(this.camera.position.x - x, this.camera.position.z - z);
  }

  bolt(from, to, color = 0xffe08a) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    const streak = mesh(geo.cyl, mat(color, { emissive: color, emissiveIntensity: 0.9 }), 0, 0, 0, 0.09, len, 0.09);
    streak.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    streak.position.copy(from).add(dir.multiplyScalar(0.5));
    this.spawn(streak, 0.2);
  }

  boulder(from, to) {
    const rock = mesh(geo.sph, mat(0x4a4038), from.x, from.y, from.z, 0.18, 0.18, 0.18);
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 2.2, 0));
    this.spawn(rock, 0.35, (it) => {
      const p = quadBezier(from, mid, to, 1 - it.life / it.max);
      it.node.position.copy(p);
      it.node.rotation.x += 0.4;
    });
  }

  orb(from, to) {
    this.talisman(from, to);
  }

  talisman(from, to) {
    const g = new THREE.Group();
    const plate = this.card(tex(ART.vfx.talisman), 0.52, 0.7, { opacity: 1 });
    const glow = this.card(tex(ART.vfx.glow), 0.85, 0.85, { additive: true, opacity: 0.55 });
    g.add(glow, plate);
    g.position.copy(from);
    this.spawn(g, 0.3, (it) => {
      const k = 1 - it.life / it.max;
      it.node.position.lerpVectors(from, to, k);
      it.node.position.y = from.y + (to.y - from.y) * k + Math.sin(k * Math.PI) * 0.4;
      it.node.rotation.y = this.aimYaw(it.node.position.x, it.node.position.z);
      plate.material.opacity = 1 - k * 0.15;
      glow.material.opacity = 0.55 * (1 - k * 0.4);
    });
  }

  meleeSlash(from, to) {
    const mid = from.clone().lerp(to, 0.55);
    const yaw = Math.atan2(to.x - from.x, to.z - from.z);
    const blade = this.card(tex(ART.vfx.slash), 2.5, 1.2, { additive: true, opacity: 0.95 });
    blade.position.set(mid.x, 1.05, mid.z);
    blade.rotation.y = yaw + Math.PI / 2;
    blade.rotation.x = -0.35;
    this.spawn(blade, 0.18, (it) => {
      const k = 1 - it.life / it.max;
      it.node.rotation.y = yaw + Math.PI / 2 + k * 0.7;
      it.node.material.opacity = 0.95 * (1 - k);
      it.node.scale.setScalar(1 + k * 0.2);
    });
  }

  spearThrust(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.max(1.4, Math.hypot(dx, dz) + 0.5);
    const streak = this.card(tex(ART.vfx.spear), len, 0.46, { additive: true, opacity: 0.95 });
    streak.position.set((from.x + to.x) * 0.5, 1.05, (from.z + to.z) * 0.5);
    streak.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    this.spawn(streak, 0.16, (it) => {
      const k = 1 - it.life / it.max;
      it.node.material.opacity = 0.95 * (1 - k);
      it.node.scale.x = 1 + k * 0.28;
    });
  }

  explosion(pos, color = 0xff7a2a, size = 1) {
    const burst = mesh(geo.sph, mat(color, { emissive: color, emissiveIntensity: 1, transparent: true, opacity: 0.85, flat: false }), pos.x, pos.y, pos.z, 0.2, 0.2, 0.2);
    this.spawn(burst, 0.42, (it) => {
      const k = 1 - it.life / it.max;
      const s = size * (0.3 + k * 1.6);
      it.node.scale.setScalar(s);
      it.node.material.opacity = 0.85 * (1 - k);
    });
    for (let i = 0; i < 6; i++) {
      const p = mesh(geo.box, mat(color, { emissive: color, emissiveIntensity: 0.8 }), pos.x, pos.y, pos.z, 0.08, 0.08, 0.08);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 3, (Math.random() - 0.5) * 6);
      this.spawn(p, 0.4, (it, dt) => {
        it.node.position.addScaledVector(vel, dt);
        vel.y -= 10 * dt;
        it.node.material.opacity = it.life / it.max;
        it.node.material.transparent = true;
      });
    }
  }

  slash(origin, target, radius = 4.2) {
    const ox = origin.x;
    const oz = origin.z;
    const tx = target.x;
    const tz = target.z;
    const yaw = Math.atan2(tx - ox, tz - oz);

    const mark = this.card(tex(ART.vfx.slashMark), radius * 1.7, radius * 0.72, { opacity: 0.92 });
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(tx, 0.035, tz);
    mark.rotation.z = -yaw;
    this.spawn(mark, 0.75, (it) => {
      it.node.material.opacity = 0.92 * (it.life / it.max);
    });

    const ground = this.card(tex(ART.vfx.slash), radius * 2.35, radius * 1.15, { additive: true, opacity: 0.8 });
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(ox, 0.06, oz);
    ground.rotation.z = -yaw + 0.95;
    this.spawn(ground, 0.4, (it) => {
      const k = 1 - it.life / it.max;
      it.node.rotation.z = -yaw + 0.95 - k * 2.15;
      it.node.material.opacity = 0.8 * (1 - k);
      it.node.scale.setScalar(1 + k * 0.2);
    });

    const pivot = new THREE.Group();
    pivot.position.set(ox, 0.12, oz);
    const blade = this.card(tex(ART.vfx.slash), radius * 2.2, radius * 1.05, { additive: true, opacity: 0.98 });
    blade.position.set(0, 1.2, radius * 0.12);
    blade.rotation.x = -0.48;
    pivot.add(blade);
    pivot.rotation.y = yaw - 1.05;
    for (let i = 0; i < 5; i++) {
      const a = yaw + (i - 2) * 0.38;
      this.dust(ox + Math.sin(a) * radius * 0.55, oz + Math.cos(a) * radius * 0.55);
    }
    this.spawn(pivot, 0.42, (it) => {
      const k = 1 - it.life / it.max;
      it.node.rotation.y = yaw - 1.05 + k * 2.25;
      blade.material.opacity = 0.98 * (1 - k * k);
      it.node.scale.setScalar(1 + k * 0.22);
    });
  }

  dash(from, to, heroMesh) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.max(1.6, Math.hypot(dx, dz));
    const spear = this.card(tex(ART.vfx.spear), len, 0.58, { additive: true, opacity: 0.95 });
    spear.position.set((from.x + to.x) * 0.5, 1.05, (from.z + to.z) * 0.5);
    spear.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    this.spawn(spear, 0.34, (it) => {
      it.node.material.opacity = 0.95 * (it.life / it.max);
    });

    const visual = heroMesh?.userData?.visual;
    const texMap = visual?.material?.map || tex(ART.unit("zhaoyun"));
    const w = heroMesh?.userData?.width || 1.7;
    const h = heroMesh?.userData?.height || 2.5;
    const face = heroMesh?.userData?.face || (dx < 0 ? -1 : 1);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / (n + 1);
      const ghost = this.spriteCard(texMap, w, h, face, 0.52);
      ghost.position.set(from.x + dx * k, 0, from.z + dz * k);
      ghost.rotation.y = this.aimYaw(ghost.position.x, ghost.position.z);
      this.spawn(ghost, 0.36 + i * 0.04, (it) => {
        it.node.rotation.y = this.aimYaw(it.node.position.x, it.node.position.z);
        it.node.material.opacity = 0.5 * (it.life / it.max);
      });
    }
  }

  bagua(pos, duration, radius = 3.6) {
    const g = new THREE.Group();
    g.position.copy(pos);
    const disk = this.card(tex(ART.vfx.bagua), radius * 2.2, radius * 2.2, { opacity: 0.94 });
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.04;
    const glow = this.card(tex(ART.vfx.glow), radius * 1.55, radius * 1.55, { additive: true, opacity: 0.42 });
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.03;
    g.add(disk, glow);
    const runes = [];
    for (let i = 0; i < 6; i++) {
      const rune = this.card(tex(ART.vfx.rune), 0.58, 0.58, { additive: true, opacity: 0.82 });
      rune.rotation.x = -Math.PI / 2;
      rune.userData.a = (i / 6) * Math.PI * 2;
      g.add(rune);
      runes.push(rune);
    }
    this.spawn(g, duration, (it, dt) => {
      disk.rotation.z += dt * 0.75;
      const pulse = 0.72 + Math.sin(performance.now() * 0.006) * 0.22;
      const fade = Math.min(1, it.life);
      glow.material.opacity = 0.32 * pulse * fade;
      glow.scale.setScalar(0.88 + pulse * 0.22);
      disk.material.opacity = 0.94 * fade;
      for (const rune of runes) {
        rune.userData.a += dt * 1.05;
        const r = radius * 0.74;
        rune.position.set(Math.cos(rune.userData.a) * r, 0.08, Math.sin(rune.userData.a) * r);
        rune.material.opacity = (0.5 + pulse * 0.3) * fade;
      }
    });
  }

  dust(x, z) {
    const puff = this.card(tex(ART.vfx.dust), 0.72, 0.44, { opacity: 0.5 });
    puff.rotation.x = -Math.PI / 2;
    puff.position.set(x + (Math.random() - 0.5) * 0.16, 0.04, z + (Math.random() - 0.5) * 0.16);
    this.spawn(puff, 0.28, (it) => {
      const k = 1 - it.life / it.max;
      it.node.scale.setScalar(1 + k * 0.85);
      it.node.material.opacity = 0.48 * (1 - k);
      it.node.position.y = 0.04 + k * 0.1;
    });
  }

  hit(pos, color = 0xffe08a) {
    const spark = this.card(tex(ART.vfx.glow), 0.55, 0.55, { additive: true, color, opacity: 0.9 });
    spark.position.copy(pos);
    this.spawn(spark, 0.18, (it) => {
      const k = 1 - it.life / it.max;
      it.node.scale.setScalar(1 + k * 1.6);
      it.node.material.opacity = 0.9 * (1 - k);
      it.node.rotation.y = this.aimYaw(it.node.position.x, it.node.position.z);
    });
  }

  death(pos) {
    this.explosion(pos, 0x9aa0a6, 0.7);
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      it.update?.(it, dt);
      if (it.life <= 0) {
        this.scene.remove(it.node);
        disposeNode(it.node);
        this.items.splice(i, 1);
      }
    }
  }

  clear() {
    for (const it of this.items) {
      this.scene.remove(it.node);
      disposeNode(it.node);
    }
    this.items.length = 0;
  }
}

function quadBezier(a, b, c, t) {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
}

function disposeNode(node) {
  node.traverse((child) => {
    if (child.geometry && !SHARED_GEO.has(child.geometry)) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose?.());
      else child.material.dispose?.();
    }
  });
}
