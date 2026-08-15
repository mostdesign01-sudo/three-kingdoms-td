import * as THREE from "three";
import { geo, mat, mesh } from "./models.js";

export class VFX {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  spawn(node, life, update) {
    this.scene.add(node);
    this.items.push({ node, life, max: life, update });
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
    this.spawn(rock, 0.35, (it, t) => {
      const p = quadBezier(from, mid, to, 1 - it.life / it.max);
      it.node.position.copy(p);
      it.node.rotation.x += t * 8;
    });
  }

  orb(from, to) {
    const ball = mesh(geo.oct, mat(0x7cf0c4, { emissive: 0x2affaa, emissiveIntensity: 1 }), from.x, from.y, from.z, 0.12, 0.12, 0.12);
    this.spawn(ball, 0.28, (it) => {
      const k = 1 - it.life / it.max;
      it.node.position.lerpVectors(from, to, k);
      it.node.rotation.y += 0.2;
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

  slash(pos) {
    const ring = mesh(geo.torus, mat(0xff4a3a, { emissive: 0xff2a1a, emissiveIntensity: 1, transparent: true, opacity: 0.95 }), pos.x, pos.y + 0.8, pos.z, 1.2, 1.2, 1.2);
    ring.rotation.x = Math.PI / 2;
    this.spawn(ring, 0.45, (it) => {
      const k = 1 - it.life / it.max;
      it.node.scale.setScalar(1 + k * 2.2);
      it.node.material.opacity = 0.95 * (1 - k);
      it.node.rotation.z += 0.2;
    });
  }

  dash(from, to) {
    const dir = to.clone().sub(from);
    const ghost = mesh(geo.box, mat(0xd8deea, { emissive: 0x88a0ff, emissiveIntensity: 0.7, transparent: true, opacity: 0.7 }), from.x, 0.8, from.z, 0.3, 1.4, dir.length());
    ghost.lookAt(to.x, 0.8, to.z);
    this.spawn(ghost, 0.35, (it) => {
      it.node.material.opacity = 0.7 * (it.life / it.max);
    });
    this.bolt(from.clone().setY(1), to.clone().setY(1), 0xd8deea);
  }

  bagua(pos, duration) {
    const g = new THREE.Group();
    const ring = mesh(geo.torus, mat(0xc9a227, { emissive: 0x8a6a10, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 }), 0, 0.08, 0, 1.6, 1.6, 1.6);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bar = mesh(geo.box, mat(0x7cf0c4, { emissive: 0x2affaa, emissiveIntensity: 0.6 }), Math.cos(a) * 1.5, 0.12, Math.sin(a) * 1.5, 0.18, 0.08, 0.55);
      bar.rotation.y = -a;
      g.add(bar);
    }
    g.position.copy(pos);
    this.spawn(g, duration, (it, dt) => {
      it.node.rotation.y += dt * 1.2;
      const pulse = 0.85 + Math.sin(performance.now() * 0.01) * 0.1;
      it.node.children[0].material.opacity = pulse * Math.min(1, it.life);
    });
  }

  hit(pos, color = 0xffe08a) {
    const spark = mesh(geo.oct, mat(color, { emissive: color, emissiveIntensity: 1, transparent: true, opacity: 1 }), pos.x, pos.y, pos.z, 0.12, 0.12, 0.12);
    this.spawn(spark, 0.18, (it) => {
      const k = 1 - it.life / it.max;
      it.node.scale.setScalar(1 + k * 2);
      it.node.material.opacity = 1 - k;
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
    if (child.geometry && child.geometry !== geo.box && child.geometry !== geo.cyl && child.geometry !== geo.sph && child.geometry !== geo.oct && child.geometry !== geo.torus && child.geometry !== geo.cone) {
      child.geometry.dispose();
    }
  });
}
