const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const pkgDist = path.join(root, "dist-pkg");
const exeDist = path.join(root, "dist-exe");

const copyIfExists = (from, to) => {
  if (!fs.existsSync(from)) return;
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};

const collectTsFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
};

const buildDatabaseScripts = () => {
  const sourceDatabase = path.join(root, "src", "database");
  const targetDatabase = path.join(pkgDist, "database");
  const entryPoints = [
    ...collectTsFiles(path.join(sourceDatabase, "migrations")),
    ...collectTsFiles(path.join(sourceDatabase, "seeders")),
  ];

  fs.rmSync(targetDatabase, { recursive: true, force: true });
  fs.mkdirSync(targetDatabase, { recursive: true });
  fs.writeFileSync(
    path.join(targetDatabase, "package.json"),
    `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
  );

  if (entryPoints.length === 0) return;

  esbuild.buildSync({
    entryPoints,
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    outdir: targetDatabase,
    outbase: sourceDatabase,
    minify: true,
    keepNames: false,
    treeShaking: true,
    sourcemap: false,
    legalComments: "none",
    drop: ["debugger"],
    logLevel: "silent",
  });
};

copyIfExists(path.join(dist, "frontend"), path.join(pkgDist, "frontend"));
copyIfExists(path.join(dist, "swagger"), path.join(pkgDist, "swagger"));

buildDatabaseScripts();

const envTemplate = path.join(root, ".env.exe.example");
const exeEnvExample = path.join(exeDist, ".env.example");
const exeEnv = path.join(exeDist, ".env");

if (fs.existsSync(envTemplate)) {
  fs.mkdirSync(exeDist, { recursive: true });
  fs.copyFileSync(envTemplate, exeEnvExample);

  if (!fs.existsSync(exeEnv)) {
    fs.copyFileSync(envTemplate, exeEnv);
  }
}
