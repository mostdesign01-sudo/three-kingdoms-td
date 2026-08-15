import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

function nojekyll() {
  return {
    name: "nojekyll",
    closeBundle() {
      writeFileSync(resolve(process.cwd(), "dist/.nojekyll"), "");
    },
  };
}

// Production builds use the GitHub Pages project path.
// Local `npm run dev` stays on `/` so the game opens immediately.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/three-kingdoms-td/" : "/",
  plugins: command === "build" ? [nojekyll()] : [],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
}));
