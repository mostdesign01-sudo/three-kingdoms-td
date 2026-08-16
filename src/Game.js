import * as THREE from "three";
import {
  ENEMIES,
  HEROES,
  HERO_RESPAWN,
  SELL_RATIO,
  START_LIVES,
  TOWERS,
  WAVES,
} from "./content.js";
import { MAP_SIZE, aimBillboard, loadPlayPack, prefetchRest } from "./art.js";
import { MAPS, buildPath, getMap } from "./maps.js";
import {
  decorateMap,
  faceSprite,
  makeBlob,
  makeCharacter,
  makeHpBar,
  makeRangeRing,
  makeSpot,
  makeTower,
  setHpBar,
} from "./models.js";
import { VFX } from "./vfx.js";

let nid = 1;
const nextId = () => nid++;

const CAM_H = 22;
const CAM_BACK = 18;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.mode = "menu";
    this.speed = 1;
    this.paused = false;
    this.aimHero = null;
    this.selected = null;
    this.listeners = new Set();
    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.scene = new THREE.Scene();
    this.viewSize = 14;
    this.camera = new THREE.OrthographicCamera(-14, 14, 14, -14, 0.1, 220);
    this.camera.up.set(0, 1, 0);
    this.camera.position.set(0, CAM_H, CAM_BACK);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x120c08, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.hemi = new THREE.HemisphereLight(0xfff0c8, 0x3d5a28, 0.95);
    this.sun = new THREE.DirectionalLight(0xffe2a8, 0.8);
    this.sun.position.set(12, 28, 10);
    this.scene.add(this.hemi, this.sun, new THREE.AmbientLight(0xfff6e0, 0.32));

    this.vfx = new VFX(this.scene);
    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.panX = 0;
    this.panZ = 0;
    this.playBounds = null;
    this.drag = null;
    this.orientHold = false;
    this.resetPlayState();
    this.resize();
    this.showMenuPreview();

    window.addEventListener("resize", () => this.resize());
    canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    window.addEventListener("pointermove", (e) => this.onPointerMove(e));
    window.addEventListener("pointerup", (e) => this.onPointerUp(e));
    window.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    requestAnimationFrame(() => this.loop());
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.syncSelectionFx();
    const view = this.view();
    for (const fn of this.listeners) fn(view);
  }

  clearSelected() {
    this.selected = null;
    this.aimHero = null;
    this.emit();
  }

  syncSelectionFx() {
    if (!this.rangeRing) return;
    const t = this.selectedTower();
    if (t) {
      const stats = towerStats(t);
      this.rangeRing.visible = true;
      this.rangeRing.position.set(t.x, 0.05, t.z);
      this.rangeRing.scale.setScalar(stats.range);
    } else {
      this.rangeRing.visible = false;
    }
    this.spotMeshes?.forEach((m, i) => {
      const on = this.selected?.kind === "spot" && this.selected.id === i;
      m.visible = on;
      m.scale.setScalar(on ? 1.08 : 1);
    });
  }

  resetPlayState() {
    this.map = null;
    this.path = null;
    this.gold = 0;
    this.lives = START_LIVES;
    this.waveIndex = 0;
    this.waveActive = false;
    this.spawns = [];
    this.enemies = [];
    this.towers = [];
    this.soldiers = [];
    this.heroes = [];
    this.zones = [];
    this.pendingWave = true;
    this.won = false;
    this.lost = false;
    this.selected = null;
    this.aimHero = null;
  }

  showMenuPreview() {
    this.clearWorld();
    this.applyTheme(MAPS[0].theme);
    this.frameMap();
  }

  async startMap(id, onProgress) {
    const map = getMap(id);
    if (!map) return;
    await loadPlayPack(map.id, onProgress);
    prefetchRest(map.id);
    this.mode = "playing";
    this.resetPlayState();
    this.map = map;
    this.path = buildPath(map.path);
    this.gold = map.startGold;
    this.lives = START_LIVES;
    this.paused = false;
    this.speed = 1;
    this.world.rotation.y = 0;
    this.clearWorld();
    this.applyTheme(map.theme);
    decorateMap(this.world, map);

    this.spotMeshes = map.spots.map((p, i) => {
      const m = makeSpot();
      m.position.set(p[0], 0.04, p[1]);
      m.userData.spotId = i;
      this.world.add(m);
      return m;
    });

    this.heroes = map.heroStarts.map((p, i) => {
      const id = ["guanyu", "zhaoyun", "zhuge"][i];
      const def = HEROES[id];
      const mesh = makeCharacter({
        hero: id,
        scale: 1,
      });
      mesh.position.set(p[0], 0, p[1]);
      this.world.add(mesh);
      const hp = makeHpBar();
      hp.position.set(p[0], mesh.userData.height + 0.12, p[1]);
      this.world.add(hp);
      const blob = makeBlob(0x111111, 1.1);
      blob.position.set(p[0], 0, p[1]);
      this.world.add(blob);
      return {
        id,
        def,
        x: p[0],
        z: p[1],
        homeX: p[0],
        homeZ: p[1],
        hp: def.hp,
        cd: 0,
        atk: 0,
        respawn: 0,
        move: null,
        mesh,
        hpBar: hp,
        blob,
      };
    });

    this.rangeRing = makeRangeRing();
    this.world.add(this.rangeRing);
    this.framePlayable();
    this.banner(map.name);
    this.emit();
  }

  applyTheme(theme) {
    this.scene.background = new THREE.Color(0x120c08);
    this.scene.fog = null;
    this.hemi.color.setHex(theme.hemiSky);
    this.hemi.groundColor.setHex(theme.hemiGround);
    this.sun.color.setHex(theme.sun);
    this.sun.position.set(...theme.sunDir);
    this.renderer.setClearColor(0x120c08, 1);
  }

  clearWorld() {
    this.vfx.clear();
    while (this.world.children.length) {
      const child = this.world.children[0];
      this.world.remove(child);
    }
    this.spotMeshes = [];
    this.rangeRing = null;
  }

  frameMap() {
    this.playBounds = null;
    this.panX = 0;
    this.panZ = 0;
    this.resize();
  }

  framePlayable() {
    if (!this.map) {
      this.frameMap();
      return;
    }
    const pts = [...this.map.spots, ...this.map.path, ...this.map.heroStarts];
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [x, z] of pts) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    const pad = 2.6;
    this.playBounds = {
      minX: minX - pad,
      maxX: maxX + pad,
      minZ: minZ - pad,
      maxZ: maxZ + pad,
      cx: (minX + maxX) / 2,
      cz: (minZ + maxZ) / 2,
    };
    this.panX = this.playBounds.cx;
    this.panZ = this.playBounds.cz;
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const aspect = w / Math.max(1, h);
    if (this.mode === "playing" && this.playBounds) {
      const bw = this.playBounds.maxX - this.playBounds.minX;
      const bd = this.playBounds.maxZ - this.playBounds.minZ;
      this.viewSize = Math.max(bd / 2, bw / (2 * aspect)) * 1.04;
    } else {
      const coverS = MAP_SIZE.w / 2 / aspect;
      const fillS = MAP_SIZE.d / 2;
      this.viewSize = Math.min(coverS, fillS) * 0.94;
    }
    this.applyView(w, h, aspect);
    this.renderer.setSize(w, h, false);
  }

  applyView(w, h, aspect) {
    const width = w ?? (this.canvas.clientWidth || window.innerWidth);
    const height = h ?? (this.canvas.clientHeight || window.innerHeight);
    const a = aspect ?? width / Math.max(1, height);
    const s = this.viewSize;
    const viewW = 2 * s * a;
    const viewH = 2 * s;
    if (this.playBounds) {
      const halfW = viewW / 2;
      const halfH = viewH / 2;
      const minPanX = this.playBounds.minX + halfW;
      const maxPanX = this.playBounds.maxX - halfW;
      const minPanZ = this.playBounds.minZ + halfH;
      const maxPanZ = this.playBounds.maxZ - halfH;
      this.panX = maxPanX < minPanX ? this.playBounds.cx : Math.max(minPanX, Math.min(maxPanX, this.panX));
      this.panZ = maxPanZ < minPanZ ? this.playBounds.cz : Math.max(minPanZ, Math.min(maxPanZ, this.panZ));
    } else {
      const maxX = Math.max(0, (MAP_SIZE.w - viewW) / 2 + 0.8);
      const maxZ = Math.max(0, (MAP_SIZE.d - viewH) / 2 + 0.8);
      this.panX = Math.max(-maxX, Math.min(maxX, this.panX));
      this.panZ = Math.max(-maxZ, Math.min(maxZ, this.panZ));
    }
    this.camera.left = -s * a;
    this.camera.right = s * a;
    this.camera.top = s;
    this.camera.bottom = -s;
    this.camera.updateProjectionMatrix();
    this.camera.up.set(0, 1, 0);
    this.camera.position.set(this.panX, CAM_H, this.panZ + CAM_BACK);
    this.camera.lookAt(this.panX, 0, this.panZ);
  }

  setOrientHold(hold) {
    this.orientHold = hold;
  }

  project(x, z, y = 0.35) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    if (this.mode === "playing" && !this.paused && !this.orientHold && !this.won && !this.lost) {
      this.tick(dt * this.speed);
    } else if (this.mode === "menu") {
      this.world.rotation.y = 0;
    }
    this.vfx.update(dt);
    this.bobDecor(dt);
    this.aimBillboards();
    this.renderer.render(this.scene, this.camera);
  };

  aimBillboards() {
    for (const h of this.heroes) aimBillboard(h.mesh, this.camera);
    for (const e of this.enemies) aimBillboard(e.mesh, this.camera);
    for (const s of this.soldiers) aimBillboard(s.mesh, this.camera);
  }

  bobDecor(dt) {
    const t = performance.now() * 0.001;
    this.world.traverse((obj) => {
      if (obj.name === "orb") obj.position.y = 1.12 + Math.sin(t * 3) * 0.08;
      if (obj.name === "water") obj.position.y = -0.02 + Math.sin(t) * 0.02;
    });
    for (const h of this.heroes) {
      if (h.mesh?.userData.bob && h.hp > 0) {
        h.mesh.userData.bob.position.y = Math.sin(t * 6 + h.x) * 0.04;
      }
    }
    for (const e of this.enemies) {
      if (e.mesh?.userData.bob) {
        e.mesh.userData.bob.position.y = Math.sin(t * 10 + e.dist) * 0.05;
      }
    }
    void dt;
  }

  tick(dt) {
    this.updateSpawns(dt);
    this.updateEnemies(dt);
    this.updateSoldiers(dt);
    this.updateTowers(dt);
    this.updateHeroes(dt);
    this.updateZones(dt);
    this.checkEnd();
    this.uiTimer = (this.uiTimer || 0) + dt;
    if (this.uiTimer > 0.12) {
      this.uiTimer = 0;
      this.emit();
    }
  }

  updateSpawns(dt) {
    if (!this.waveActive) return;
    for (const s of this.spawns) {
      s.wait -= dt;
      if (s.wait <= 0 && s.left > 0) {
        this.spawnEnemy(s.type);
        s.left -= 1;
        s.wait = s.interval;
      }
    }
    const spawning = this.spawns.some((s) => s.left > 0);
    if (!spawning && this.enemies.length === 0) {
      this.waveActive = false;
      if (this.waveIndex >= WAVES.length) {
        this.win();
      } else {
        this.pendingWave = true;
        this.toast(`${WAVES[this.waveIndex].name} 已击退，整军再战`);
      }
    }
  }

  spawnEnemy(type) {
    const def = ENEMIES[type];
    const pos = this.path.at(0);
    const hero = type === "boss" ? "lubu" : null;
    const weapon = type === "armored" ? "shield" : type === "cavalry" ? "horse" : "spear";
    const mesh = makeCharacter({
      kind: type,
      scale: 1,
      hero,
    });
    mesh.position.set(pos.x, 0, pos.z);
    this.world.add(mesh);
    const hp = makeHpBar();
    this.world.add(hp);
    const blob = makeBlob(0x111111, type === "boss" ? 1.6 : 1);
    this.world.add(blob);
    this.enemies.push({
      id: nextId(),
      type,
      def,
      dist: 0,
      x: pos.x,
      z: pos.z,
      hp: def.hp,
      maxHp: def.hp,
      slow: 1,
      slowT: 0,
      blocked: null,
      atk: 0.4,
      mesh,
      hpBar: hp,
      blob,
    });
    if (type === "boss") this.banner("吕布幻影");
  }

  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.slowT > 0) e.slowT -= dt;
      else e.slow = 1;
      if (!e.blocked) {
        e.dist += e.def.speed * e.slow * dt;
        if (e.dist >= this.path.length) {
          this.leak(e);
          this.removeEnemy(e, false);
          this.enemies.splice(i, 1);
          continue;
        }
      } else {
        const blocker = this.soldiers.find((s) => s.id === e.blocked && s.respawn <= 0);
        if (!blocker) e.blocked = null;
      }
      e.atk -= dt;
      if (e.atk <= 0) {
        const victim =
          this.soldiers.find((s) => s.respawn <= 0 && dist2(s, e) < 0.9) ||
          this.heroes.find((h) => h.hp > 0 && h.respawn <= 0 && dist2(h, e) < 1.15);
        if (victim) {
          e.atk = e.type === "boss" ? 0.6 : 0.9;
          this.hurtHeroOrSoldier(victim, e.type === "boss" ? 22 : e.type === "elite" ? 12 : 7);
          this.vfx.hit(new THREE.Vector3(victim.x, 1, victim.z), 0xff8866);
        }
      }
      const p = this.path.at(e.dist);
      e.x = p.x;
      e.z = p.z;
      e.mesh.position.set(p.x, 0, p.z);
      faceSprite(e.mesh, p.nx);
      e.hpBar.position.set(p.x, (e.mesh.userData.height || 2) + 0.1, p.z);
      e.blob.position.set(p.x, 0, p.z);
      setHpBar(e.hpBar, e.hp / e.maxHp);
    }
  }

  leak(e) {
    this.lives -= e.def.lives;
    this.toast(`${e.def.name} 破关，失城 ${e.def.lives}`);
    if (this.lives <= 0) {
      this.lives = 0;
      this.lose();
    }
  }

  removeEnemy(e, killed) {
    this.world.remove(e.mesh, e.hpBar, e.blob);
    if (killed) {
      this.gold += e.def.bounty;
      this.vfx.death(new THREE.Vector3(e.x, 0.6, e.z));
    }
    for (const s of this.soldiers) if (s.target === e.id) s.target = null;
    for (const t of this.towers) if (t.target === e.id) t.target = null;
    for (const h of this.heroes) if (h.target === e.id) h.target = null;
  }

  updateTowers(dt) {
    for (const t of this.towers) {
      const stats = towerStats(t);
      t.cd -= dt;
      if (t.type === "barracks") {
        this.ensureSoldiers(t, stats);
        continue;
      }
      const target = this.acquire(t, stats.range);
      t.target = target?.id ?? null;
      if (!target || t.cd > 0) continue;
      t.cd = stats.fireRate;
      this.fireTower(t, target, stats);
    }
  }

  fireTower(t, target, stats) {
      const from = new THREE.Vector3(t.x, 2.2, t.z);
    const to = new THREE.Vector3(target.x, 0.9, target.z);
    if (t.type === "ballista") {
      this.vfx.bolt(from, to, 0xffe08a);
      this.hurt(target, stats.damage, from);
    } else if (t.type === "thunder") {
      this.vfx.boulder(from, to);
      this.vfx.explosion(to, 0xff7a2a, 1.3);
      this.aoe(target.x, target.z, stats.aoe, stats.damage);
    } else if (t.type === "sage") {
      this.vfx.orb(from, to);
      this.hurt(target, stats.damage, from);
      target.slow = Math.min(target.slow, 1 - stats.slow);
      target.slowT = Math.max(target.slowT, stats.slowTime);
      this.vfx.hit(to, 0x7cf0c4);
    }
  }

  ensureSoldiers(tower, stats) {
    const live = this.soldiers.filter((s) => s.towerId === tower.id);
    while (live.length < (TOWERS.barracks.soldiers)) {
      const s = this.spawnSoldier(tower, stats);
      live.push(s);
    }
    for (const s of live) {
      s.maxHp = stats.soldierHp;
      s.damage = stats.damage;
    }
  }

  spawnSoldier(tower, stats) {
    const mesh = makeCharacter({
      kind: "soldier",
      scale: 0.95,
      weapon: "spear",
    });
    mesh.position.set(tower.x, 0, tower.z);
    this.world.add(mesh);
    const hp = makeHpBar();
    this.world.add(hp);
    const blob = makeBlob(0x3a1010, 0.85);
    this.world.add(blob);
    const s = {
      id: nextId(),
      towerId: tower.id,
      x: tower.x,
      z: tower.z,
      hp: stats.soldierHp,
      maxHp: stats.soldierHp,
      damage: stats.damage,
      atk: 0,
      target: null,
      respawn: 0,
      mesh,
      hpBar: hp,
      blob,
    };
    this.soldiers.push(s);
    return s;
  }

  updateSoldiers(dt) {
    for (let i = this.soldiers.length - 1; i >= 0; i--) {
      const s = this.soldiers[i];
      const tower = this.towers.find((t) => t.id === s.towerId);
      if (!tower) {
        this.world.remove(s.mesh, s.hpBar, s.blob);
        this.soldiers.splice(i, 1);
        continue;
      }
      if (s.respawn > 0) {
        s.respawn -= dt;
        s.mesh.visible = false;
        s.hpBar.visible = false;
        s.blob.visible = false;
        if (s.respawn <= 0) {
          s.hp = s.maxHp;
          s.x = tower.x;
          s.z = tower.z;
          s.mesh.visible = true;
          s.hpBar.visible = true;
          s.blob.visible = true;
        }
        continue;
      }
      const stats = towerStats(tower);
      const rally = { x: tower.rallyX, z: tower.rallyZ };
      let target = this.enemies.find((e) => e.id === s.target);
      if (!target || dist2(rally, target) > stats.range) {
        target = this.nearest(rally.x, rally.z, stats.range, (e) => !e.blocked || e.blocked === s.id);
        s.target = target?.id ?? null;
      }
      if (target) {
        this.steer(s, target, 2.6, dt);
        if (dist2(s, target) < 0.85) {
          target.blocked = s.id;
          s.atk -= dt;
          if (s.atk <= 0) {
            s.atk = 0.7;
            this.hurt(target, s.damage, new THREE.Vector3(s.x, 1, s.z));
            this.vfx.hit(new THREE.Vector3(target.x, 0.8, target.z), 0xffe08a);
          }
        }
      } else {
        this.steer(s, rally, 2.8, dt);
        for (const e of this.enemies) if (e.blocked === s.id) e.blocked = null;
      }
      s.mesh.position.set(s.x, 0, s.z);
      if (target) faceSprite(s.mesh, target.x - s.x);
      s.hpBar.position.set(s.x, (s.mesh.userData.height || 1.9) + 0.1, s.z);
      s.blob.position.set(s.x, 0, s.z);
      setHpBar(s.hpBar, s.hp / s.maxHp);
    }
  }

  updateHeroes(dt) {
    for (const h of this.heroes) {
      h.cd = Math.max(0, h.cd - dt);
      if (h.respawn > 0) {
        h.respawn -= dt;
        h.mesh.visible = false;
        h.hpBar.visible = false;
        h.blob.visible = false;
        if (h.respawn <= 0) {
          h.hp = h.def.hp;
          h.mesh.visible = true;
          h.hpBar.visible = true;
          h.blob.visible = true;
          this.toast(`${h.def.name} 归阵`);
        }
        continue;
      }
      if (h.move) {
        this.steer(h, h.move, h.def.speed, dt);
        if (dist2(h, h.move) < 0.25) {
          h.homeX = h.move.x;
          h.homeZ = h.move.z;
          h.move = null;
        }
      } else {
        const target = this.nearest(h.x, h.z, h.def.range + 1.3);
        if (target) this.steer(h, target, h.def.speed * 0.7, dt);
        else if (dist2(h, { x: h.homeX, z: h.homeZ }) > 0.2) {
          this.steer(h, { x: h.homeX, z: h.homeZ }, h.def.speed * 0.55, dt);
        }
      }
      const foe = this.nearest(h.x, h.z, h.def.range);
      h.atk -= dt;
      if (foe && h.atk <= 0) {
        h.atk = h.def.fireRate;
        const from = new THREE.Vector3(h.x, 1.2, h.z);
        const to = new THREE.Vector3(foe.x, 0.9, foe.z);
        if (h.id === "zhuge") this.vfx.orb(from, to);
        else this.vfx.bolt(from, to, h.id === "guanyu" ? 0xff4a3a : 0xd8deea);
        this.hurt(foe, h.def.damage, from);
      }
      h.mesh.position.set(h.x, 0, h.z);
      if (foe) faceSprite(h.mesh, foe.x - h.x);
      else if (h.move) faceSprite(h.mesh, h.move.x - h.x);
      h.hpBar.position.set(h.x, (h.mesh.userData.height || 2.5) + 0.1, h.z);
      h.blob.position.set(h.x, 0, h.z);
      setHpBar(h.hpBar, h.hp / h.def.hp);
    }
  }

  updateZones(dt) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.life -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.45;
        this.aoe(z.x, z.z, z.r, z.damage, { slow: 0.35, slowTime: 0.6 });
      }
      if (z.life <= 0) this.zones.splice(i, 1);
    }
  }

  hurt(enemy, amount, from) {
    if (!enemy || enemy.hp <= 0) return;
    enemy.hp -= amount;
    if (from) faceSprite(enemy.mesh, from.x - enemy.x);
    if (enemy.hp <= 0) {
      const idx = this.enemies.indexOf(enemy);
      if (idx >= 0) {
        this.removeEnemy(enemy, true);
        this.enemies.splice(idx, 1);
      }
    }
  }

  aoe(x, z, r, damage, extra) {
    for (const e of [...this.enemies]) {
      if (Math.hypot(e.x - x, e.z - z) <= r) {
        this.hurt(e, damage);
        if (extra?.slow) {
          e.slow = Math.min(e.slow, extra.slow);
          e.slowT = Math.max(e.slowT, extra.slowTime);
        }
      }
    }
  }

  acquire(tower, range) {
    let best = null;
    let bestD = -1;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - tower.x, e.z - tower.z);
      if (d <= range && e.dist > bestD) {
        best = e;
        bestD = e.dist;
      }
    }
    return best;
  }

  nearest(x, z, range, pred) {
    let best = null;
    let bestD = range;
    for (const e of this.enemies) {
      if (pred && !pred(e)) continue;
      const d = Math.hypot(e.x - x, e.z - z);
      if (d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  steer(unit, dest, speed, dt) {
    const dx = dest.x - unit.x;
    const dz = dest.z - unit.z;
    const d = Math.hypot(dx, dz) || 1;
    const step = Math.min(d, speed * dt);
    unit.x += (dx / d) * step;
    unit.z += (dz / d) * step;
  }

  startWave() {
    if (this.mode !== "playing" || this.waveActive || this.won || this.lost) return;
    if (this.waveIndex >= WAVES.length) return;
    const wave = WAVES[this.waveIndex];
    this.waveIndex += 1;
    this.waveActive = true;
    this.pendingWave = false;
    this.spawns = wave.groups.map((g) => ({
      type: g.type,
      left: g.count,
      interval: g.interval,
      wait: g.delay,
    }));
    this.banner(`第 ${this.waveIndex} 波 · ${wave.name}`);
    this.emit();
  }

  placeTower(spotId, type) {
    const def = TOWERS[type];
    if (!def || this.gold < def.cost) {
      this.toast("金银不足");
      return;
    }
    if (this.towers.some((t) => t.spotId === spotId)) return;
    const p = this.map.spots[spotId];
    this.gold -= def.cost;
    const mesh = makeTower(type, 1);
    mesh.position.set(p[0], 0, p[1]);
    this.world.add(mesh);
    const toward = this.path.at(closestPathDist(this.path, p[0], p[1]));
    const tower = {
      id: nextId(),
      type,
      level: 1,
      spotId,
      x: p[0],
      z: p[1],
      cd: 0.2,
      target: null,
      mesh,
      rallyX: (p[0] + toward.x) / 2,
      rallyZ: (p[1] + toward.z) / 2,
    };
    this.towers.push(tower);
    if (this.spotMeshes[spotId]) this.spotMeshes[spotId].visible = false;
    this.selected = null;
    this.emit();
  }

  upgradeSelected() {
    const t = this.selectedTower();
    if (!t) return;
    const def = TOWERS[t.type];
    const next = def.upgrades[t.level - 1];
    if (!next) return;
    if (this.gold < next.cost) {
      this.toast("金银不足");
      return;
    }
    this.gold -= next.cost;
    t.level += 1;
    this.world.remove(t.mesh);
    t.mesh = makeTower(t.type, t.level);
    t.mesh.position.set(t.x, 0, t.z);
    this.world.add(t.mesh);
    this.toast(`${def.name} 升至 ${["", "初成", "精锐", "神威"][t.level]}`);
    this.emit();
  }

  sellSelected() {
    const t = this.selectedTower();
    if (!t) return;
    this.gold += Math.floor(invested(t) * SELL_RATIO);
    this.world.remove(t.mesh);
    this.towers = this.towers.filter((x) => x.id !== t.id);
    for (const s of this.soldiers.filter((s) => s.towerId === t.id)) {
      this.world.remove(s.mesh, s.hpBar, s.blob);
    }
    this.soldiers = this.soldiers.filter((s) => s.towerId !== t.id);
    if (this.spotMeshes[t.spotId]) this.spotMeshes[t.spotId].visible = false;
    this.selected = null;
    this.emit();
  }

  selectedTower() {
    if (this.selected?.kind !== "tower") return null;
    return this.towers.find((t) => t.id === this.selected.id) ?? null;
  }

  beginHeroSkill(id) {
    const h = this.heroes.find((x) => x.id === id);
    if (!h || h.hp <= 0 || h.cd > 0 || h.respawn > 0) return;
    this.aimHero = id;
    this.toast(`点地面施放 ${h.def.skill}`);
    this.emit();
  }

  moveHero(id, x, z) {
    const h = this.heroes.find((n) => n.id === id);
    if (!h || h.hp <= 0) return;
    h.move = { x, z };
  }

  castHero(id, x, z) {
    const h = this.heroes.find((n) => n.id === id);
    if (!h || h.hp <= 0 || h.cd > 0) return;
    h.cd = h.def.skillCd;
    this.aimHero = null;
    if (h.id === "guanyu") {
      h.move = { x, z };
      this.vfx.slash(new THREE.Vector3(x, 0, z));
      this.aoe(x, z, h.def.skillRadius, h.def.skillDamage);
    } else if (h.id === "zhaoyun") {
      const from = new THREE.Vector3(h.x, 0.8, h.z);
      const to = new THREE.Vector3(x, 0.8, z);
      this.vfx.dash(from, to);
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        this.aoe(h.x + (x - h.x) * k, h.z + (z - h.z) * k, h.def.skillRadius, h.def.skillDamage / 3);
      }
      h.x = x;
      h.z = z;
    } else if (h.id === "zhuge") {
      this.vfx.bagua(new THREE.Vector3(x, 0, z), h.def.zoneTime);
      this.zones.push({
        x,
        z,
        r: h.def.skillRadius,
        damage: h.def.skillDamage,
        life: h.def.zoneTime,
        tick: 0,
      });
    }
    this.toast(`${h.def.name} 施展 ${h.def.skill}`);
    this.emit();
  }

  hurtHeroOrSoldier(unit, amount) {
    unit.hp -= amount;
    if (unit.hp <= 0) {
      unit.hp = 0;
      if (unit.def) {
        unit.respawn = HERO_RESPAWN;
        this.toast(`${unit.def.name} 重伤退场`);
      } else {
        unit.respawn = 4.5;
        for (const e of this.enemies) if (e.blocked === unit.id) e.blocked = null;
      }
    }
  }

  checkEnd() {
    if (this.lost || this.won) return;
    if (this.lives <= 0) this.lose();
  }

  win() {
    this.won = true;
    this.mode = "over";
    this.banner("大捷");
    this.emit();
  }

  lose() {
    this.lost = true;
    this.mode = "over";
    this.banner("城破");
    this.emit();
  }

  backToMenu() {
    this.mode = "menu";
    this.resetPlayState();
    this.world.rotation.y = 0;
    this.showMenuPreview();
    this.emit();
  }

  togglePause() {
    this.paused = !this.paused;
    this.emit();
  }

  cycleSpeed() {
    this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1;
    this.emit();
  }

  groundHit(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, hit);
  }

  onPointerDown(event) {
    if (this.mode !== "playing" || this.won || this.lost || this.orientHold) return;
    if (event.target !== this.canvas) return;
    const hit = this.groundHit(event);
    if (!hit) return;
    this.drag = {
      id: event.pointerId,
      sx: event.clientX,
      sy: event.clientY,
      px: this.panX,
      pz: this.panZ,
      hit,
      hitX: hit.x,
      hitZ: hit.z,
      moved: false,
    };
  }

  onPointerMove(event) {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    const dx = event.clientX - this.drag.sx;
    const dy = event.clientY - this.drag.sy;
    if (!this.drag.moved && Math.hypot(dx, dy) < 12) return;
    this.drag.moved = true;
    this.panX = this.drag.px;
    this.panZ = this.drag.pz;
    this.applyView();
    const now = this.groundHit(event);
    if (now) {
      this.panX = this.drag.px - (now.x - this.drag.hitX);
      this.panZ = this.drag.pz - (now.z - this.drag.hitZ);
      this.applyView();
    }
  }

  onPointerUp(event) {
    if (!this.drag || event.pointerId !== this.drag.id) return;
    const drag = this.drag;
    this.drag = null;
    if (drag.moved) return;
    this.handleTap(drag.hit);
  }

  handleTap(hit) {
    if (this.aimHero) {
      this.castHero(this.aimHero, hit.x, hit.z);
      return;
    }

    const tower = this.towers.find((t) => Math.hypot(t.x - hit.x, t.z - hit.z) < 1.7);
    if (tower) {
      this.selected = { kind: "tower", id: tower.id };
      this.emit();
      return;
    }

    let spotId = -1;
    let spotD = 2.7;
    this.map.spots.forEach((p, i) => {
      if (this.towers.some((t) => t.spotId === i)) return;
      const d = Math.hypot(p[0] - hit.x, p[1] - hit.z);
      if (d < spotD) {
        spotD = d;
        spotId = i;
      }
    });
    if (spotId >= 0) {
      this.selected = { kind: "spot", id: spotId };
      this.emit();
      return;
    }

    const hero = this.heroes.find((h) => h.hp > 0 && Math.hypot(h.x - hit.x, h.z - hit.z) < 1.35);
    if (hero) {
      this.selected = { kind: "hero", id: hero.id };
      this.emit();
      return;
    }

    if (this.selected?.kind === "hero") {
      this.moveHero(this.selected.id, hit.x, hit.z);
      return;
    }

    if (this.selected?.kind === "tower") {
      const t = this.selectedTower();
      if (t?.type === "barracks") {
        t.rallyX = hit.x;
        t.rallyZ = hit.z;
        this.toast("虎贲已改集结点");
        return;
      }
    }

    this.selected = null;
    this.emit();
  }

  toast(text) {
    this.lastToast = { text, at: performance.now() };
  }

  banner(text) {
    this.lastBanner = { text, at: performance.now() };
  }

  view() {
    const t = this.selectedTower();
    const def = t ? TOWERS[t.type] : null;
    const next = def?.upgrades[t.level - 1];
    return {
      mode: this.mode,
      maps: MAPS,
      map: this.map,
      gold: this.gold,
      lives: this.lives,
      wave: this.waveIndex,
      waveTotal: WAVES.length,
      waveName: this.waveIndex ? WAVES[this.waveIndex - 1].name : "待发",
      pendingWave: this.pendingWave,
      waveActive: this.waveActive,
      speed: this.speed,
      paused: this.paused,
      won: this.won,
      lost: this.lost,
      aimHero: this.aimHero,
      selected: this.selected,
      toast: this.lastToast,
      banner: this.lastBanner,
      towers: TOWERS,
      heroes: this.heroes.map((h) => ({
        id: h.id,
        name: h.def.name,
        skill: h.def.skill,
        desc: h.def.desc,
        cd: h.cd,
        maxCd: h.def.skillCd,
        ready: h.cd <= 0 && h.hp > 0 && h.respawn <= 0,
        dead: h.hp <= 0 || h.respawn > 0,
      })),
      build: this.selected?.kind === "spot"
        ? {
            spotId: this.selected.id,
            ...this.project(this.map.spots[this.selected.id][0], this.map.spots[this.selected.id][1]),
          }
        : null,
      towerPanel: t
        ? {
            name: def.name,
            level: t.level,
            canUpgrade: Boolean(next),
            upgradeCost: next?.cost ?? 0,
            sell: Math.floor(invested(t) * SELL_RATIO),
            barracks: t.type === "barracks",
            ...this.project(t.x, t.z),
          }
        : null,
    };
  }
}

function towerStats(t) {
  const base = TOWERS[t.type];
  const extra = base.upgrades[t.level - 2] ?? {};
  return {
    range: extra.range ?? base.range,
    fireRate: extra.fireRate ?? base.fireRate,
    damage: extra.damage ?? base.damage,
    aoe: extra.aoe ?? base.aoe ?? 0,
    slow: extra.slow ?? base.slow ?? 0,
    slowTime: extra.slowTime ?? base.slowTime ?? 0,
    soldierHp: extra.soldierHp ?? base.soldierHp ?? 40,
  };
}

function invested(t) {
  const def = TOWERS[t.type];
  let sum = def.cost;
  for (let i = 0; i < t.level - 1; i++) sum += def.upgrades[i].cost;
  return sum;
}

function dist2(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function closestPathDist(path, x, z) {
  let best = 0;
  let bestD = Infinity;
  for (let d = 0; d <= path.length; d += 0.5) {
    const p = path.at(d);
    const dist = Math.hypot(p.x - x, p.z - z);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best;
}
