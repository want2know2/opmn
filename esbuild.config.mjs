import esbuild from "esbuild";

// `npm run build`  -> production (one-off bundle, minified-ish, no watch)
// `npm run dev`    -> watch mode (rebuilds on save, inline sourcemap)
const production = process.argv[2] === "production";

// Anything Obsidian provides at runtime must NOT be bundled.
const external = [
  "obsidian",
  "electron",
  "@codemirror/autocomplete",
  "@codemirror/collab",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/lint",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "@lezer/common",
  "@lezer/highlight",
  "@lezer/lr",
];

const context = await esbuild.context({
  entryPoints: ["bootstrap/entry.js"],
  bundle: true,
  format: "cjs",
  target: "es2018",
  platform: "browser",
  external,
  outfile: "main.js",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  logLevel: "info",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
