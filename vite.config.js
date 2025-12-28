import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ✅ GitHub Pages 子路径必须配置，否则 99% 白屏
  base: "/ORDER-DISH-NEW/",
});
