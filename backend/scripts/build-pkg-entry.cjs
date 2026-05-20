const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist-pkg/index.cjs",
  external: ["pg-native", "express", "umzug"],
  minify: true,
  keepNames: false,
  treeShaking: true,
  sourcemap: false,
  legalComments: "none",
  drop: ["debugger"],
  logOverride: {
    "empty-import-meta": "silent",
  },
});
