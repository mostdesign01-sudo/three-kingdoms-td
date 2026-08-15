import "./style.css";
import { asset, loadArt } from "./art.js";
import { Game } from "./Game.js";

const loading = document.querySelector("#loading");
const uiRoot = document.querySelector("#ui");
const canvas = document.querySelector("#view");

function bindIcons() {
  const pairs = [
    ["#ico-heart", "ui/heart.png"],
    ["#ico-coin", "ui/coin.png"],
    ["#ico-skull", "ui/skull.png"],
    ["#ico-horn", "ui/horn.png"],
  ];
  for (const [sel, path] of pairs) {
    const el = document.querySelector(sel);
    if (el) el.src = asset(path);
  }
}

bindIcons();

const els = {
  menu: document.querySelector("#menu"),
  hud: document.querySelector("#hud"),
  overlay: document.querySelector("#overlay"),
  mapList: document.querySelector("#map-list"),
  gold: document.querySelector("#stat-gold"),
  lives: document.querySelector("#stat-lives"),
  wave: document.querySelector("#stat-wave"),
  waveNum: document.querySelector("#wave-num"),
  toast: document.querySelector("#toast"),
  banner: document.querySelector("#banner"),
  hint: document.querySelector("#spot-hint"),
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

function renderMenu(view) {
  if (els.mapList.childElementCount) return;
  for (const map of view.maps) {
    const btn = document.createElement("button");
    btn.className = "map-card";
    btn.type = "button";
    btn.innerHTML = `<img src="${asset(map.art)}" alt=""><div><h3>${map.name}</h3><p>${map.subtitle}</p></div>`;
    btn.addEventListener("click", () => game.startMap(map.id));
    els.mapList.appendChild(btn);
  }
}

function setHidden(el, hidden) {
  el.classList.toggle("hidden", hidden);
}

function clampWheel(x, y) {
  const pad = 130;
  return {
    x: Math.max(pad, Math.min(window.innerWidth - pad, x)),
    y: Math.max(pad + 40, Math.min(window.innerHeight - 170, y)),
  };
}

function slotStyle(i, n) {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
  const r = 86;
  return `left:${120 + Math.cos(a) * r}px;top:${120 + Math.sin(a) * r}px`;
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
      btn.innerHTML = `<img src="${asset(`ui/icon-${t.id}.png`)}" alt=""><b>${t.name}</b><small>${t.cost}</small>`;
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
    const ready = h.ready ? "可放" : h.dead ? "休整" : `${Math.ceil(h.cd)}s`;
    btn.classList.toggle("aiming", view.aimHero === h.id);
    btn.classList.toggle("ready", h.ready);
    btn.disabled = !h.ready && view.aimHero !== h.id;
    const pct = h.maxCd ? Math.round((1 - h.cd / h.maxCd) * 100) : 100;
    btn.innerHTML = `<img src="${asset(`ui/portrait-${h.id}.png`)}" alt=""><b>${h.name}</b><small>${ready}</small><i class="cd-ring" style="--cd:${pct}"></i>`;
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
  els.wave.textContent = `波次 ${view.wave}/${view.waveTotal}`;
  els.waveNum.textContent = String(view.wave);
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
  setHidden(els.hint, !(view.selected == null && view.wave === 0));

  if (view.toast && performance.now() - view.toast.at < 2200) {
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

async function boot() {
  await loadArt();
  loading.classList.add("hidden");
  uiRoot.classList.remove("hidden");
  game = new Game(canvas);
  game.on(onView);
  document.querySelector("#btn-wave").addEventListener("click", () => game.startWave());
  document.querySelector("#btn-speed").addEventListener("click", () => game.cycleSpeed());
  document.querySelector("#btn-pause").addEventListener("click", () => game.togglePause());
  document.querySelector("#btn-menu").addEventListener("click", () => game.backToMenu());
  document.querySelector("#btn-retry").addEventListener("click", () => {
    if (game.map) game.startMap(game.map.id);
  });
  document.querySelector("#btn-home").addEventListener("click", () => game.backToMenu());
  game.emit();
}

boot();
