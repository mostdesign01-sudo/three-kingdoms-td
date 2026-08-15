# 三国保卫战 · 烽火三国塔防

Kingdom Rush–style Three Kingdoms tower defense, rebuilt in **Vite + vanilla Three.js**. Play in a desktop or phone browser: pick a pass, place four tower types, command three heroes, and hold eight waves through 吕布幻影.

## Play

| 关卡 | 地貌 |
| --- | --- |
| **虎牢道** | 山隘土路，两侧峭壁 |
| **赤壁水寨** | 江上木寨与舟楫 |
| **祁山栈道** | 绝壁木栈，一线曲折 |

| 塔 | 作用 |
| --- | --- |
| **连弩楼** | 疾射单目标 |
| **霹雳车** | 火石溅射 |
| **虎贲营** | 甲士拦路肉搏，点塔后再点地面改集结 |
| **谋士台** | 术法伤害并减速 |

| 英雄 | 主动技（先点技能，再点地面） |
| --- | --- |
| **关羽** | 青龙斩 · 范围重创 |
| **赵云** | 七进七出 · 沿线突进 |
| **诸葛亮** | 八阵图 · 困敌持续伤害 |

漏敌扣城防。八波尽灭即胜；城防归零或被吕布幻影破关则败。界面为中文，按钮按触控尺寸设计，不依赖悬停。

## Run locally

Need Node 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173/`). On a phone on the same network, use the LAN address Vite lists.

```bash
npm run build
npm run preview
```

`preview` serves the production bundle. Local preview still uses `/` so you can open it directly.

## Publish on GitHub Pages (`/three-kingdoms-td/`)

Production builds set Vite `base` to `/three-kingdoms-td/` so a project site works at:

`https://<user>.github.io/three-kingdoms-td/`

This repository is named `three-kingdoms-td`, which matches that path.

### Option A — Actions workflow (included)

`.github/workflows/pages.yml` builds with `npm ci && npm run build` and deploys `dist` on every push to `main`.

1. Repo **Settings → Pages**
2. **Source**: GitHub Actions
3. Push `main` (or run the workflow manually)
4. Open `https://<user>.github.io/three-kingdoms-td/` on a phone

### Option B — Manual upload

```bash
npm install
npm run build
```

Upload the `dist/` folder to a `gh-pages` branch, or use any static host. Keep the site published under `/three-kingdoms-td/` (or change `base` in `vite.config.js` to match your path).

`public/.nojekyll` is copied into `dist` so GitHub Pages does not skip Vite’s hashed assets.

## Controls

- Tap an empty stone platform to build
- Tap a tower to upgrade or sell
- Tap a hero skill, then tap the ground to cast
- Tap a selected hero, then tap the ground to move
- **出兵 / 下一波** starts the next wave
- **×1 / ×2 / ×3** changes speed; **暂停** freezes combat
