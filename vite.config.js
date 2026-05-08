import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function staticPagesPlugin() {
  const virtualId = "virtual:static-pages";
  const resolvedId = "\0" + virtualId;

  function scanPages() {
    const dir = path.resolve("public/static_pages");
    if (!fs.existsSync(dir)) return [];
    const pages = [];
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && fs.existsSync(path.join(full, "index.html"))) {
        pages.push({ name: entry, type: "folder", path: `/static_pages/${entry}/index.html` });
      } else if (entry.endsWith(".html")) {
        pages.push({ name: entry.replace(".html", ""), type: "file", path: `/static_pages/${entry}` });
      }
    }
    return pages;
  }

  return {
    name: "static-pages",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) return `export default ${JSON.stringify(scanPages())};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), staticPagesPlugin()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
});
