import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change "/vyeta-credits/" to match your exact GitHub repo name if different.
export default defineConfig({
  plugins: [react()],
  base: "/vyeta-credits/",
});
