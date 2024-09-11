import { defineConfig } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from "path";

const resolvePath = str => path.resolve(__dirname, str);

// https://vitejs.dev/config/
export default defineConfig({
//   base: "/pixi-bitmap-text-input/",
  base: "/",
  root: "examples",
  build: {
    outDir: resolvePath("gh-pages-staging"),
  },
  plugins: []
});
