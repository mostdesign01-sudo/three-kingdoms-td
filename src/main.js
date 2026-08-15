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

function isPortrait() {
  return window.innerHeight > window.innerWidth + 8;
}

function syncOrientation() {
  const portrait = isPortrait();
  rotate.classList.toggle("hidden", !portrait);
  game?.setOrientHold(portrait);
  try {
    screen.orientation?.lock?.("landscape");
  } catch {
    /* browsers only allow this in fullscreen / installed PWA */
  }
}

function clampWheel(x, y) {
  const pad = 140;
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

function renderWheel(view) {
  els.wheel.innerHTML = "";
  if (view.build) {
    const p = clampWheel(view.build.x, view.build.y);
    els.wheel.style.left = `${p.x}px`;
    els.wheel.style.top = `${p.y}px`;
    setHidden(els.wheel, false);
    els.wheel.innerHTML = `<div class="wheel-hub"></div>`;
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
    els.wheel.innerHTML = `<div class="wheel-hub"></div>`;
    const items = [];
    if (view.towerPanel.canUpgrade) {
      items.push({
        html: `<b>升级</b><small>${view.towerPanel.upgradeCost}</small>`,
        disabled: view.gold < view.towerPanel.upgradeCost,
        on: () => game.upgradeSelected(),
      });
    }
    items.push({
      html: `<b>拆除</b><small>${view.towerPanel.sell}</small>`,
      disabled: false,
      on: () => game.sellSelected(),
    });
    if (view.towerPanel.barracks) {
      items.push({ html: `<b>集结</b><small>点地</small>`, disabled: true, on: () => {} });
    }
    items.forEach((it, i) => {
      const btn = document.createElement("button");
      btn.className = "wheel-slot";
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
  els.waveBtn.disabled = !view.pendingWave || view.won || view.lost;
  els.waveLabel.textContent = view.waveActive
    ? "交战"
    : view.wave >= view.waveTotal
      ? "已尽"
      : view.wave === 0
        ? "出兵"
        : "下一波";

  const panelKey = JSON.stringify({
    s: view.selected,
    g: view.gold,
    tp: view.towerPanel,
    b: view.build,
  });
  if (panelKey !== lastPanelKey) {
    lastPanelKey = panelKey;
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
    syncOrientation();
    window.addEventListener("resize", syncOrientation);
    window.addEventListener("orientationchange", syncOrientation);
  } catch (err) {
    console.warn("[boot] failed", err);
    if (loadingText) loadingText.textContent = "点兵受阻，请刷新再试";
  } finally {
    uiRoot.classList.remove("hidden");
    setLoading(true);
  }
}

boot();
