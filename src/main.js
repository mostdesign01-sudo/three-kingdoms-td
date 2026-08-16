import "./style.css";
import { ART, asset } from "./art.js";
import { Game } from "./Game.js";

const loading = document.querySelector("#loading");
const loadingText = document.querySelector("#loading-text");
const uiRoot = document.querySelector("#ui");
const canvas = document.querySelector("#view");

function bindIcons() {
  const pairs = [
    ["#ico-heart", ART.heart],
    ["#ico-coin", ART.coin],
    ["#ico-horn", ART.horn],
  ];
  for (const [sel, path] of pairs) {
    const el = document.querySelector(sel);
    if (el) el.src = asset(path);
  }
}

bindIcons();

const rotate = document.querySelector("#rotate");

const els = {
  menu: document.querySelector("#menu"),
  hud: document.querySelector("#hud"),
  overlay: document.querySelector("#overlay"),
  mapList: document.querySelector("#map-list"),
  gold: document.querySelector("#stat-gold"),
  lives: document.querySelector("#stat-lives"),
  wave: document.querySelector("#stat-wave"),
  toast: document.querySelector("#toast"),
  banner: document.querySelector("#banner"),
  wheel: document.querySelector("#wheel"),
  heroes: document.querySelector("#hero-bar"),
  waveBtn: document.querySelector("#btn-wave"),
  waveLabel: document.querySelector("#btn-wave-label"),
  speedBtn: document.querySelector("#btn-speed"),
  pauseBtn: document.querySelector("#btn-pause"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayText: document.querySelector("#overlay-text"),
};

let game;
let lastPanelKey = "";
let entering = false;
let sellArmed = false;
let rotateDismissed = false;

function setLoading(hidden, text) {
  if (text && loadingText) loadingText.textContent = text;
  loading.classList.toggle("hidden", hidden);
}

function renderMenu(view) {
  if (els.mapList.childElementCount) return;
  for (const map of view.maps) {
    const btn = document.createElement("button");
    btn.className = "map-card";
    btn.type = "button";
    btn.innerHTML = `<img src="${asset(map.art)}" alt=""><div><h3>${map.name}</h3><p>${map.subtitle}</p></div>`;
    btn.addEventListener("click", () => enterMap(map.id));
    els.mapList.appendChild(btn);
  }
}

function setHidden(el, hidden) {
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
  const pad = 108;
  return {
    x: Math.max(pad, Math.min(window.innerWidth - pad, x)),
    y: Math.max(pad, Math.min(window.innerHeight - pad, y)),
  };
}

function slotStyle(i, n) {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
  const r = 92;
  return `left:${130 + Math.cos(a) * r}px;top:${130 + Math.sin(a) * r}px`;
}

function addHub() {
  const hub = document.createElement("button");
  hub.className = "wheel-hub";
  hub.type = "button";
  hub.addEventListener("click", () => game.clearSelected());
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
    Object.values(view.towers).forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = `wheel-slot ${t.id}`;
      btn.type = "button";
      btn.style.cssText = slotStyle(i, 4);
      btn.disabled = view.gold < t.cost;
      btn.innerHTML = `<img src="${asset(ART.icon(t.id))}" alt=""><b>${t.name}</b><small>${t.cost}</small>`;
      btn.addEventListener("click", () => game.placeTower(view.build.spotId, t.id));
      els.wheel.appendChild(btn);
    });
    return;
  }
  if (view.towerPanel) {
    const p = clampWheel(view.towerPanel.x, view.towerPanel.y);
    els.wheel.style.left = `${p.x}px`;
    els.wheel.style.top = `${p.y}px`;
    setHidden(els.wheel, false);
    addHub();
    const items = [];
    if (view.towerPanel.canUpgrade) {
      items.push({
        cls: "up",
        html: `<b>升级</b><small>${view.towerPanel.upgradeCost}</small>`,
        disabled: view.gold < view.towerPanel.upgradeCost,
        on: () => {
          sellArmed = false;
          game.upgradeSelected();
        },
      });
    }
    items.push({
      cls: sellArmed ? "sell confirm" : "sell",
      html: sellArmed ? `<b>确认</b><small>拆除</small>` : `<b>拆除</b><small>${view.towerPanel.sell}</small>`,
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
    });
    items.forEach((it, i) => {
      const btn = document.createElement("button");
      btn.className = `wheel-slot ${it.cls}`;
      btn.type = "button";
      btn.style.cssText = slotStyle(i, items.length);
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
      const btn = document.createElement("button");
      btn.className = `hero-btn ${h.id}`;
      btn.type = "button";
      btn.dataset.id = h.id;
      btn.addEventListener("click", () => game.beginHeroSkill(h.id));
      els.heroes.appendChild(btn);
    }
    els.heroes.dataset.ready = "1";
  }
  for (const h of view.heroes) {
    const btn = els.heroes.querySelector(`[data-id="${h.id}"]`);
    if (!btn) continue;
    btn.classList.toggle("aiming", view.aimHero === h.id);
    btn.classList.toggle("ready", h.ready);
    btn.disabled = !h.ready && view.aimHero !== h.id;
    const pct = h.maxCd ? Math.round((1 - h.cd / h.maxCd) * 100) : 100;
    btn.title = h.ready ? h.skill : h.name;
    btn.innerHTML = `<img src="${asset(ART.portrait(h.id))}" alt="${h.name}"><i class="cd-ring" style="--cd:${pct}"></i>`;
  }
}

function onView(view) {
  if (view.mode === "menu") {
    setHidden(els.menu, false);
    setHidden(els.hud, true);
    setHidden(els.overlay, true);
    renderMenu(view);
    return;
  }

  setHidden(els.menu, true);
  setHidden(els.hud, false);
  setHidden(els.overlay, !(view.won || view.lost));

  els.gold.textContent = view.gold;
  els.lives.textContent = `${view.lives}/20`;
  els.wave.textContent = `${view.wave}/${view.waveTotal}`;
  els.speedBtn.textContent = `×${view.speed}`;
  els.pauseBtn.textContent = view.paused ? "续" : "停";
  const canCall = view.pendingWave && !view.won && !view.lost;
  els.waveBtn.disabled = !canCall;
  setHidden(els.waveBtn, !canCall);
  els.waveLabel.textContent = view.wave === 0 ? "出兵" : "下一波";

  const panelKey = JSON.stringify({
    s: view.selected,
    g: view.gold,
    tp: view.towerPanel,
    b: view.build,
  });
  if (panelKey !== lastPanelKey) {
    lastPanelKey = panelKey;
    sellArmed = false;
    renderWheel(view);
  }

  renderHeroes(view);

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

  if (view.won || view.lost) {
    els.overlayTitle.textContent = view.won ? "大捷" : "城破";
    els.overlayText.textContent = view.won
      ? `${view.map.name} 八波尽灭，吕布幻影亦已溃散。`
      : `${view.map.name} 失守。重整旗鼓，再守此关。`;
  }
}

async function enterMap(id) {
  if (!game || entering) return;
  entering = true;
  tryLockLandscape();
  setLoading(false, "点兵 0/8");
  try {
    await game.startMap(id, (done, total) => {
      setLoading(false, `点兵 ${done}/${total}`);
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
    document.querySelector("#btn-menu").addEventListener("click", () => game.backToMenu());
    document.querySelector("#btn-retry").addEventListener("click", () => {
      if (game.map) enterMap(game.map.id);
    });
    document.querySelector("#btn-home").addEventListener("click", () => game.backToMenu());
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
      document.body.classList.add("shot");
      window.__td = game;
      enterMap("hulao").then(() => setupShot(game, shot));
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
  } else {
    game.placeTower(3, "ballista");
    game.placeTower(4, "thunder");
  }
}

boot();
