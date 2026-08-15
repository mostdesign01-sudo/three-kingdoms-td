import "./style.css";
import { Game } from "./Game.js";

const canvas = document.querySelector("#view");
const game = new Game(canvas);

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
  hint: document.querySelector("#spot-hint"),
  build: document.querySelector("#build-panel"),
  buildTitle: document.querySelector("#build-title"),
  buildActions: document.querySelector("#build-actions"),
  heroes: document.querySelector("#hero-bar"),
  waveBtn: document.querySelector("#btn-wave"),
  speedBtn: document.querySelector("#btn-speed"),
  pauseBtn: document.querySelector("#btn-pause"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayText: document.querySelector("#overlay-text"),
};

function renderMenu(view) {
  if (els.mapList.childElementCount) return;
  for (const map of view.maps) {
    const btn = document.createElement("button");
    btn.className = "map-card";
    btn.type = "button";
    btn.innerHTML = `<div class="map-swatch" style="background:${map.swatch}"></div><div><h3>${map.name}</h3><p>${map.subtitle}</p></div>`;
    btn.addEventListener("click", () => game.startMap(map.id));
    els.mapList.appendChild(btn);
  }
}

function setHidden(el, hidden) {
  el.classList.toggle("hidden", hidden);
}

function renderBuild(view) {
  els.buildActions.innerHTML = "";
  if (view.build) {
    els.buildTitle.textContent = "营建箭楼";
    setHidden(els.build, false);
    for (const t of Object.values(view.towers)) {
      const btn = document.createElement("button");
      btn.className = "tower-btn";
      btn.type = "button";
      btn.disabled = view.gold < t.cost;
      btn.innerHTML = `<b>${t.name}</b><small>${t.cost} 金</small><small>${t.desc}</small>`;
      btn.addEventListener("click", () => game.placeTower(view.build.spotId, t.id));
      els.buildActions.appendChild(btn);
    }
    return;
  }
  if (view.towerPanel) {
    const p = view.towerPanel;
    els.buildTitle.textContent = `${p.name} · ${["", "初成", "精锐", "神威"][p.level]}`;
    setHidden(els.build, false);
    if (p.canUpgrade) {
      const up = document.createElement("button");
      up.className = "tower-btn";
      up.type = "button";
      up.disabled = view.gold < p.upgradeCost;
      up.innerHTML = `<b>升级</b><small>${p.upgradeCost} 金</small>`;
      up.addEventListener("click", () => game.upgradeSelected());
      els.buildActions.appendChild(up);
    }
    const sell = document.createElement("button");
    sell.className = "tower-btn";
    sell.type = "button";
    sell.innerHTML = `<b>拆除</b><small>回 ${p.sell} 金</small>`;
    sell.addEventListener("click", () => game.sellSelected());
    els.buildActions.appendChild(sell);
    if (p.barracks) {
      const tip = document.createElement("button");
      tip.className = "tower-btn";
      tip.type = "button";
      tip.disabled = true;
      tip.innerHTML = `<b>集结</b><small>再点地面</small>`;
      els.buildActions.appendChild(tip);
    }
    return;
  }
  setHidden(els.build, true);
}

function renderHeroes(view) {
  if (!els.heroes.dataset.ready) {
    els.heroes.innerHTML = "";
    for (const h of view.heroes) {
      const btn = document.createElement("button");
      btn.className = "hero-btn";
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
    const ready = h.ready ? "可放" : h.dead ? "休整" : `冷却 ${Math.ceil(h.cd)}s`;
    btn.classList.toggle("aiming", view.aimHero === h.id);
    btn.classList.toggle("ready", h.ready);
    btn.disabled = !h.ready && view.aimHero !== h.id;
    const pct = h.maxCd ? Math.round((1 - h.cd / h.maxCd) * 100) : 100;
    btn.innerHTML = `<b>${h.name}</b><small>${h.skill}</small><small>${ready}</small><div class="cd"><i style="width:${pct}%"></i></div>`;
  }
}

let lastPanelKey = "";
game.on((view) => {
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

  els.gold.textContent = `金 ${view.gold}`;
  els.lives.textContent = `城 ${view.lives}`;
  els.wave.textContent = `波次 ${view.wave}/${view.waveTotal}`;
  els.speedBtn.textContent = `×${view.speed}`;
  els.pauseBtn.textContent = view.paused ? "继续" : "暂停";
  els.waveBtn.disabled = !view.pendingWave || view.won || view.lost;
  els.waveBtn.textContent = view.waveActive
    ? "交战中"
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
    renderBuild(view);
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
});

document.querySelector("#btn-wave").addEventListener("click", () => game.startWave());
document.querySelector("#btn-speed").addEventListener("click", () => game.cycleSpeed());
document.querySelector("#btn-pause").addEventListener("click", () => game.togglePause());
document.querySelector("#btn-menu").addEventListener("click", () => game.backToMenu());
document.querySelector("#btn-retry").addEventListener("click", () => {
  if (game.map) game.startMap(game.map.id);
});
document.querySelector("#btn-home").addEventListener("click", () => game.backToMenu());

game.emit();
