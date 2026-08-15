import { defineConfig } from "vite";

// Production builds use the GitHub Pages project path.
// Local `npm run dev` stays on `/` so the game opens immediately.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/three-kingdoms-td/" : "/",
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
}));
