import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("firebase/firestore")) {
            return "firebase-firestore";
          }

          if (id.includes("firebase/auth")) {
            return "firebase-auth";
          }

          if (id.includes("firebase/storage")) {
            return "firebase-storage";
          }

          if (id.includes("firebase/app")) {
            return "firebase-core";
          }

          if (id.includes("firebase")) {
            return "firebase-shared";
          }

          if (id.includes("react-dom") || id.includes("react")) {
            return "react-vendor";
          }

          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});
