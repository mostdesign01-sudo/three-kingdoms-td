import "./style.css";
import { ART, asset } from "./art.js";
import { Game } from "./Game.js";

const loading = document.querySelector("#loading");
const loadingText = document.querySelector("#loading-text");
const loadFill = document.querySelector("#load-fill");
const uiRoot = document.querySelector("#ui");
const canvas = document.querySelector("#view");

function bindIcons() {
  const pairs = [
    ["#ico-heart", ART.heart],
    ["#ico-coin", ART.coin],
    ["#ico-horn", ART.horn],
    ["#ico-back", ART.chrome.back],
    ["#ico-pause", ART.chrome.pause],
    ["#ico-call", ART.skull],
    ["#ico-skull", ART.skull],
    ["#campaign-board", ART.chrome.board],
    ["#title-plaque", ART.chrome.title],
  ];
  for (const [sel, path] of pairs) {
    const el = document.querySelector(sel);
    if (el) el.src = asset(path);
  }
  document.documentElement.style.setProperty("--plaque", `url("${asset(ART.chrome.plaque)}")`);
}

bindIcons();

const rotate = document.querySelector("#rotate");

const els = {
  menu: document.querySelector("#menu"),
  hud: document.querySelector("#hud"),
  overlay: document.querySelector("#overlay"),
  pause: document.querySelector("#pause"),
  mapList: document.querySelector("#map-list"),
  gold: document.querySelector("#stat-gold"),
  lives: document.querySelector("#stat-lives"),
  wave: document.querySelector("#stat-wave"),
  waveName: document.querySelector("#stat-wave-name"),
  toast: document.querySelector("#toast"),
  banner: document.querySelector("#banner"),
  wheel: document.querySelector("#wheel"),
  heroes: document.querySelector("#hero-bar"),
  waveBtn: document.querySelector("#btn-wave"),
  waveLabel: document.querySelector("#btn-wave-label"),
  speedBtn: document.querySelector("#btn-speed"),
  speedIco: document.querySelector("#ico-speed"),
  pauseBtn: document.querySelector("#btn-pause"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayText: document.querySelector("#overlay-text"),
  starRow: document.querySelector("#star-row"),
  endStats: document.querySelector("#end-stats"),
  callFlag: document.querySelector("#call-flag"),
  callPreview: document.querySelector("#call-preview"),
  floaters: document.querySelector("#floaters"),
};

let game;
let lastPanelKey = "";
let lastEndKey = "";
let entering = false;
let sellArmed = false;
let buildArmed = null;
let rotateDismissed = false;
const seenPops = new Set();

function setLoading(hidden, text, ratio) {
  if (text && loadingText) loadingText.textContent = text;
  if (loadFill && ratio != null) loadFill.style.width = `${Math.round(ratio * 100)}%`;
  loading.classList.toggle("hidden", hidden);
}

const FLAG_POS = [
  { left: "22%", top: "54%" },
  { left: "50%", top: "34%" },
  { left: "76%", top: "52%" },
];

function renderMenu(view) {
  if (els.mapList.childElementCount) return;
  view.maps.forEach((map, i) => {
    const pos = FLAG_POS[i] || FLAG_POS[0];
    const btn = document.createElement("button");
    btn.className = "flag-pin";
    btn.type = "button";
    btn.style.left = pos.left;
    btn.style.top = pos.top;
    btn.innerHTML = `<img src="${asset(ART.chrome.flag)}" alt=""><b>${map.name}</b><small>出征</small>`;
    btn.addEventListener("click", () => enterMap(map.id));
    els.mapList.appendChild(btn);
  });
}

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle("hidden", hidden);
}

function viewportSize() {
  const vv = window.visualViewport;
  if (vv && vv.width && vv.height) return { w: vv.width, h: vv.height };
  return { w: window.innerWidth, h: window.innerHeight };
}

function isWide() {
  const { w, h } = viewportSize();
  return w > h;
}

function hideRotate() {
  rotate.classList.add("hidden");
  game?.setOrientHold(false);
}

function syncOrientation() {
  if (rotateDismissed || isWide()) {
    hideRotate();
    return;
  }
  rotate.classList.remove("hidden");
}

function enterAnyway() {
  rotateDismissed = true;
  hideRotate();
}

function tryLockLandscape() {
  const lock = screen.orientation?.lock;
  if (typeof lock !== "function") return;
  Promise.resolve(lock.call(screen.orientation, "landscape")).catch(() => {});
}

function clampWheel(x, y) {
  const pad = 110;
  return {
    x: Math.max(pad, Math.min(window.innerWidth - pad, x)),
    y: Math.max(pad, Math.min(window.innerHeight - pad, y)),
  };
}

function slotStyle(i, n) {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
  const r = 86;
  return `left:${120 + Math.cos(a) * r}px;top:${120 + Math.sin(a) * r}px;--medal:url("${asset(ART.chrome.medallion)}")`;
}

function addHub() {
  const hub = document.createElement("button");
  hub.className = "wheel-hub";
  hub.type = "button";
  hub.title = "取消";
  hub.innerHTML = `<img src="${asset(ART.chrome.cancel)}" alt="X">`;
  hub.addEventListener("click", () => {
    sellArmed = false;
    buildArmed = null;
    game.clearBuildPreview();
    game.clearSelected();
  });
  els.wheel.appendChild(hub);
}

function renderWheel(view) {
  els.wheel.innerHTML = "";
  if (view.build) {
    const p = clampWheel(view.build.x, view.build.y);
    els.wheel.style.left = `${p.x}px`;
    els.wheel.style.top = `${p.y}px`;
    setHidden(els.wheel, false);
    addHub();
    const tip = document.createElement("div");
    tip.className = `wheel-tip hidden${p.x > window.innerWidth * 0.62 ? " flip" : ""}`;
    els.wheel.appendChild(tip);
    Object.values(view.towers).forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = `wheel-slot ${t.id}${buildArmed === t.id ? " armed" : ""}`;
      btn.type = "button";
      btn.style.cssText = slotStyle(i, 4);
      btn.disabled = view.gold < t.cost;
      btn.innerHTML = `<img src="${asset(ART.icon(t.id))}" alt="${t.name}"><span class="cost-badge">${t.cost}</span>`;
      const showTip = () => {
        game.previewBuild(t.id);
        tip.classList.remove("hidden");
        tip.innerHTML = `<b>${t.name}</b><p>${t.desc}</p>`;
      };
      btn.addEventListener("pointerenter", showTip);
      btn.addEventListener("pointerdown", showTip);
      btn.addEventListener("pointerleave", () => {
        if (buildArmed !== t.id) game.clearBuildPreview();
      });
      btn.addEventListener("click", () => {
        if (buildArmed !== t.id) {
          buildArmed = t.id;
          showTip();
          renderWheel(view);
          return;
        }
        buildArmed = null;
        game.placeTower(view.build.spotId, t.id);
      });
      els.wheel.appendChild(btn);
    });
    if (buildArmed && view.towers[buildArmed]) {
      const t = view.towers[buildArmed];
      tip.classList.remove("hidden");
      tip.innerHTML = `<b>${t.name}</b><p>${t.desc}</p>`;
    }
    return;
  }
  if (view.towerPanel) {
    const p = clampWheel(view.towerPanel.x, view.towerPanel.y);
    els.wheel.style.left = `${p.x}px`;
    els.wheel.style.top = `${p.y}px`;
    setHidden(els.wheel, false);
    addHub();
    const chip = document.createElement("div");
    chip.className = "tower-chip";
    chip.innerHTML = `<b>${view.towerPanel.name}</b><small>${view.towerPanel.levelName}</small>`;
    els.wheel.appendChild(chip);
    const up = view.towerPanel.canUpgrade
      ? {
          cls: "up",
          html: `<img src="${asset(ART.chrome.upgrade)}" alt=""><span class="cost-badge">${view.towerPanel.upgradeCost}</span>`,
          disabled: view.gold < view.towerPanel.upgradeCost,
          on: () => {
            sellArmed = false;
            game.upgradeSelected();
          },
        }
      : { cls: "ghost max", html: `<small>满级</small>`, disabled: true, on: () => {} };
    const sell = {
      cls: sellArmed ? "sell confirm" : "sell",
      html: sellArmed
        ? `<img src="${asset(ART.chrome.sell)}" alt=""><span class="cost-badge">拆</span>`
        : `<img src="${asset(ART.chrome.sell)}" alt=""><span class="cost-badge">${view.towerPanel.sell}</span>`,
      disabled: false,
      on: () => {
        if (!sellArmed) {
          sellArmed = true;
          renderWheel(view);
          return;
        }
        sellArmed = false;
        game.sellSelected();
      },
    };
    const ghost = { cls: "ghost", html: "", disabled: true, on: () => {} };
    [up, ghost, sell, ghost].forEach((it, i) => {
      const btn = document.createElement("button");
      btn.className = `wheel-slot ${it.cls}`;
      btn.type = "button";
      btn.style.cssText = slotStyle(i, 4);
      btn.disabled = it.disabled;
      btn.innerHTML = it.html;
      btn.addEventListener("click", it.on);
      els.wheel.appendChild(btn);
    });
    return;
  }
  setHidden(els.wheel, true);
}

function renderHeroes(view) {
  if (!els.heroes.dataset.ready) {
    els.heroes.innerHTML = "";
    for (const h of view.heroes) {
      const card = document.createElement("div");
      card.className = `hero-card ${h.id}`;
      card.dataset.id = h.id;
      card.innerHTML = `<button class="hero-btn" type="button"><img src="${asset(ART.portrait(h.id))}" alt="${h.name}"><i class="cd-ring"></i><i class="hero-hp"><i></i></i><b class="hero-respawn hidden">0</b></button><button class="skill-pip" type="button">技</button>`;
      card.querySelector(".hero-btn").addEventListener("click", () => game.selectHero(h.id));
      card.querySelector(".skill-pip").addEventListener("click", () => game.beginHeroSkill(h.id));
      els.heroes.appendChild(card);
    }
    els.heroes.dataset.ready = "1";
  }
  for (const h of view.heroes) {
    const card = els.heroes.querySelector(`.hero-card[data-id="${h.id}"]`);
    if (!card) continue;
    const btn = card.querySelector(".hero-btn");
    const pip = card.querySelector(".skill-pip");
    btn.classList.toggle("aiming", view.aimHero === h.id);
    btn.classList.toggle("ready", h.ready);
    btn.classList.toggle("dead", h.dead);
    btn.classList.toggle("selected", view.selected?.kind === "hero" && view.selected.id === h.id);
    pip.disabled = !h.ready && view.aimHero !== h.id;
    pip.title = h.skill;
    const pct = h.maxCd ? Math.round((1 - h.cd / h.maxCd) * 100) : 100;
    const ring = btn.querySelector(".cd-ring");
    if (ring) ring.style.setProperty("--cd", String(pct));
    const hp = btn.querySelector(".hero-hp i");
    if (hp) hp.style.width = `${Math.max(0, Math.round((h.hp / (h.maxHp || 1)) * 100))}%`;
    const timer = btn.querySelector(".hero-respawn");
    if (timer) {
      const show = h.dead && h.respawn > 0;
      timer.classList.toggle("hidden", !show);
      if (show) timer.textContent = `${Math.ceil(h.respawn)}`;
    }
  }
}

function renderCallFlag(view) {
  if (!view.callFlag) {
    setHidden(els.callFlag, true);
    return;
  }
  els.callFlag.style.left = `${view.callFlag.x}px`;
  els.callFlag.style.top = `${view.callFlag.y}px`;
  els.callFlag.classList.toggle("early", Boolean(view.callFlag.early));
  els.callFlag.classList.toggle("armed", Boolean(view.callArmed || view.callFlag.armed));
  if (els.callPreview) {
    const info = view.nextWave;
    const show = Boolean(view.callArmed && info);
    setHidden(els.callPreview, !show);
    if (show) {
      const types = info.types.map((t) => `${t.name}×${t.count}`).join(" ");
      els.callPreview.textContent = `${info.label} ${types}`;
    }
  }
  setHidden(els.callFlag, false);
}

function renderFloaters(view) {
  const now = performance.now();
  for (const p of view.goldPops || []) {
    if (seenPops.has(p.id) || now - p.at > 900) continue;
    seenPops.add(p.id);
    const el = document.createElement("b");
    el.className = "gold-pop";
    el.textContent = `+${p.n}`;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    els.floaters.appendChild(el);
    setTimeout(() => el.remove(), 920);
  }
}

function renderEnd(view) {
  const key = JSON.stringify(view.endStats);
  if (key === lastEndKey) return;
  lastEndKey = key;
  const stats = view.endStats || { stars: 0, lives: view.lives, gold: view.gold, wave: view.wave };
  els.overlayTitle.textContent = view.won ? "大捷" : "城破";
  els.overlayText.textContent = view.won
    ? `${view.map?.name || ""} 八波尽灭，吕布幻影亦已溃散。`
    : `${view.map?.name || ""} 失守。重整旗鼓，再守此关。`;
  els.starRow.innerHTML = [0, 1, 2]
    .map((i) => `<img src="${asset(i < stats.stars ? ART.chrome.starOn : ART.chrome.starOff)}" alt="">`)
    .join("");
  els.endStats.innerHTML = `<li>剩城 ${stats.lives}</li><li>余金 ${stats.gold}</li><li>波次 ${stats.wave}/8</li>`;
}

function onView(view) {
  if (view.mode === "menu") {
    setHidden(els.menu, false);
    setHidden(els.hud, true);
    setHidden(els.overlay, true);
    setHidden(els.pause, true);
    renderMenu(view);
    return;
  }

  setHidden(els.menu, true);
  setHidden(els.hud, false);
  setHidden(els.overlay, !(view.won || view.lost));
  setHidden(els.pause, !(view.paused && !view.silentPause && !view.won && !view.lost));

  els.gold.textContent = view.gold;
  els.lives.textContent = view.lives;
  const waveShown = view.waveActive ? view.wave : Math.min(view.waveTotal, view.wave + 1);
  els.wave.textContent = `WAVE ${waveShown}/${view.waveTotal}`;
  els.waveName.textContent = view.waveName;
  if (els.speedIco) els.speedIco.src = asset(view.speed === 1 ? ART.chrome.play : ART.chrome.speed);
  els.speedBtn.title = `×${view.speed}`;
  const canCall = view.canCall && !view.won && !view.lost;
  els.waveBtn.disabled = !canCall;
  setHidden(els.waveBtn, !canCall);
  els.waveLabel.textContent = view.earlyCall ? "提前" : view.wave === 0 ? "出兵" : "下一波";

  const panelKey = JSON.stringify({
    s: view.selected,
    g: view.gold,
    lv: view.towerPanel?.level,
    up: view.towerPanel?.canUpgrade,
    cost: view.towerPanel?.upgradeCost,
    sell: view.towerPanel?.sell,
    spot: view.build?.spotId,
    a: buildArmed,
  });
  if (panelKey !== lastPanelKey) {
    lastPanelKey = panelKey;
    if (!view.build) buildArmed = null;
    if (!view.towerPanel) sellArmed = false;
    renderWheel(view);
  } else if (view.build || view.towerPanel) {
    const src = view.build || view.towerPanel;
    const p = clampWheel(src.x, src.y);
    els.wheel.style.left = `${p.x}px`;
    els.wheel.style.top = `${p.y}px`;
  }

  renderHeroes(view);
  renderCallFlag(view);
  renderFloaters(view);

  if (view.toast && performance.now() - view.toast.at < 1800) {
    els.toast.textContent = view.toast.text;
    setHidden(els.toast, false);
  } else {
    setHidden(els.toast, true);
  }

  if (view.banner && performance.now() - view.banner.at < 1600) {
    els.banner.textContent = view.banner.text;
    setHidden(els.banner, false);
  } else {
    setHidden(els.banner, true);
  }

  if (view.won || view.lost) renderEnd(view);
}

async function enterMap(id) {
  if (!game || entering) return;
  entering = true;
  tryLockLandscape();
  setLoading(false, "点兵 0/8", 0);
  try {
    await game.startMap(id, (done, total) => {
      setLoading(false, `点兵 ${done}/${total}`, total ? done / total : 0);
    });
  } catch (err) {
    console.warn("[boot] map load failed", err);
  } finally {
    entering = false;
    setLoading(true);
  }
}

function boot() {
  try {
    game = new Game(canvas);
    game.on(onView);
    document.querySelector("#btn-wave").addEventListener("click", () => game.startWave());
    document.querySelector("#btn-speed").addEventListener("click", () => game.cycleSpeed());
    document.querySelector("#btn-pause").addEventListener("click", () => game.togglePause());
    document.querySelector("#btn-resume").addEventListener("click", () => {
      if (game.paused) game.togglePause();
    });
    document.querySelector("#btn-restart").addEventListener("click", () => {
      if (game.paused) game.togglePause();
      if (game.map) enterMap(game.map.id);
    });
    document.querySelector("#btn-quit").addEventListener("click", () => game.backToMenu());
    document.querySelector("#btn-menu").addEventListener("click", () => game.backToMenu());
    document.querySelector("#btn-retry").addEventListener("click", () => {
      if (game.map) enterMap(game.map.id);
    });
    document.querySelector("#btn-home").addEventListener("click", () => game.backToMenu());
    els.callFlag.addEventListener("click", () => {
      if (game.callArmed) game.startWave();
      else game.previewCallWave();
    });
    if (els.speedIco) els.speedIco.src = asset(ART.chrome.play);
    game.emit();
    document.querySelector("#btn-enter").addEventListener("click", enterAnyway);
    syncOrientation();
    window.addEventListener("resize", syncOrientation);
    window.addEventListener("orientationchange", syncOrientation);
    window.visualViewport?.addEventListener("resize", syncOrientation);
    const shot = new URLSearchParams(location.search).get("shot");
    if (shot) {
      rotateDismissed = true;
      hideRotate();
      window.__td = game;
      const uiShots = new Set(["menu", "build", "upgrade", "pause", "wave", "win", "skull", "heroes", "lose"]);
      document.body.classList.add(uiShots.has(shot) ? "shot-ui" : "shot");
      if (shot === "menu") {
        game.emit();
      } else {
        enterMap("hulao").then(() => setupShot(game, shot));
      }
    }
  } catch (err) {
    console.warn("[boot] failed", err);
    if (loadingText) loadingText.textContent = "点兵受阻，请刷新再试";
  } finally {
    uiRoot.classList.remove("hidden");
    setLoading(true);
  }
}

function setupShot(game, shot) {
  const gy = game.heroes.find((h) => h.id === "guanyu");
  const zy = game.heroes.find((h) => h.id === "zhaoyun");
  const zg = game.heroes.find((h) => h.id === "zhuge");
  if (shot === "1" || shot === "walk") {
    if (gy) game.moveHero("guanyu", gy.x + 5.2, gy.z + 0.9);
    game.poseForShot(0.37);
    const h = game.heroes.find((n) => n.id === "guanyu") || gy;
    game.zoomShot(h.x, h.z + 0.2, 3.2);
  } else if (shot === "guanyu" && gy) {
    game.castHero("guanyu", gy.x + 2.6, gy.z + 1.15);
    game.poseForShot(0.16);
    game.zoomShot(gy.x + 1.1, gy.z + 0.4, 5.1);
  } else if (shot === "zhaoyun" && zy) {
    game.castHero("zhaoyun", zy.x + 6.8, zy.z + 0.3);
    game.poseForShot(0.14);
    game.zoomShot(zy.x + 3.2, zy.z, 5.0);
  } else if (shot === "zhuge" && zg) {
    game.castHero("zhuge", zg.x + 1.3, zg.z + 0.7);
    game.poseForShot(0.35);
    game.zoomShot(zg.x + 0.7, zg.z + 0.3, 5.4);
  } else if (shot === "build") {
    game.selected = { kind: "spot", id: 3 };
    buildArmed = "ballista";
    game.previewBuild("ballista");
    game.emit();
  } else if (shot === "skull") {
    game.previewCallWave();
  } else if (shot === "heroes") {
    game.selectHero("guanyu");
  } else if (shot === "lose") {
    game.mockEnd(false);
  } else if (shot === "upgrade") {
    game.placeTower(3, "ballista");
    const t = game.towers[0];
    if (t) {
      game.selected = { kind: "tower", id: t.id };
      game.emit();
    }
  } else if (shot === "pause") {
    game.togglePause();
  } else if (shot === "wave") {
    game.placeTower(3, "ballista");
    game.startWave();
    game.poseForShot(2.4);
  } else if (shot === "win") {
    game.mockEnd(true);
  } else {
    game.placeTower(3, "ballista");
    game.placeTower(4, "thunder");
  }
}

boot();
