import { spawn } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteArgs = process.argv.slice(2);
const command = viteArgs[0] ?? "";
const unsafePath = /[#?]/.test(projectRoot);
const viteBinName = path.join("node_modules", "vite", "bin", "vite.js");
const localViteBin = path.join(projectRoot, viteBinName);

function copyRecursive(from, to) {
  if (!existsSync(from)) return;

  if (lstatSync(from).isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const name of readdirSync(from)) {
      copyRecursive(path.join(from, name), path.join(to, name));
    }
    return;
  }

  mkdirSync(path.dirname(to), { recursive: true });
  writeFileSync(to, readFileSync(from));
}

function prepareSandbox() {
  const sandbox = path.join(os.tmpdir(), "planifi-vite-work");
  mkdirSync(sandbox, { recursive: true });

  for (const name of ["index.html", "vite.config.js", "package.json", "package-lock.json", "src"]) {
    copyRecursive(path.join(projectRoot, name), path.join(sandbox, name));
  }

  const modulesFrom = path.join(projectRoot, "node_modules");
  const modulesTo = path.join(sandbox, "node_modules");
  if (existsSync(modulesFrom) && !existsSync(path.join(modulesTo, "vite", "bin", "vite.js"))) {
    console.log("Copiando dependencias a una ruta temporal (solo la primera vez)...");
    copyRecursive(modulesFrom, modulesTo);
  }

  if (command === "preview") {
    copyRecursive(path.join(projectRoot, "dist"), path.join(sandbox, "dist"));
  }

  return sandbox;
}

function syncSources(sandbox) {
  copyRecursive(path.join(projectRoot, "index.html"), path.join(sandbox, "index.html"));
  copyRecursive(path.join(projectRoot, "src"), path.join(sandbox, "src"));
}

function copyDistBack(sandbox) {
  const from = path.join(sandbox, "dist");
  const to = path.join(projectRoot, "dist");
  if (!existsSync(from)) return;
  rmSync(to, { recursive: true, force: true });
  copyRecursive(from, to);
}

function runVite(cwd) {
  const bin = path.join(cwd, viteBinName);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [bin, ...viteArgs], {
      cwd,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

if (!existsSync(localViteBin)) {
  console.error("No se encontró Vite. Ejecuta npm install.");
  process.exit(1);
}

if (!unsafePath) {
  process.exit(await runVite(projectRoot));
}

console.log("La ruta del proyecto contiene # o ?. Vite se ejecuta desde una copia temporal.");
const sandbox = prepareSandbox();
let debounce;

if (command !== "build" && command !== "preview") {
  const reload = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => syncSources(sandbox), 120);
  };
  watch(path.join(projectRoot, "src"), { recursive: true }, reload);
  watch(path.join(projectRoot, "index.html"), reload);
}

const code = await runVite(sandbox);

if (command === "build" || existsSync(path.join(sandbox, "dist"))) {
  copyDistBack(sandbox);
}

process.exit(code);
