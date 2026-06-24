import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: replace "kwacha-credits" below with your exact GitHub repo name.
// If your repo is github.com/yourname/my-repo, base must be "/my-repo/"
export default defineConfig({
  plugins: [react()],
  base: "/vyeta-credits/",
});
