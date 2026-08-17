import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    nitro(),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
  ],
});
