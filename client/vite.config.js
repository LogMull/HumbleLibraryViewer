import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  base: process.env.NODE_ENV === "production" ? "./" : "/", // Fix paths for Electron
  build: {
    outDir: "dist",
  },
});
