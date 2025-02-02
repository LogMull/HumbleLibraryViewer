import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/ag-grid-community")) {
            return "ag-grid"; // Separate ag-grid into its own chunk
          }
          if (id.includes("node_modules")) {
            return "vendor"; // Other vendor dependencies
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit if necessary
  }
});
