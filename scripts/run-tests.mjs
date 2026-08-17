import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["app", "components", "lib"];

function collectTests(directory) {
  const tests = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) tests.push(...collectTests(path));
    else if (/\.test\.tsx?$/.test(entry.name)) tests.push(path);
  }
  return tests;
}

const tests = roots.flatMap((root) => collectTests(resolve(root))).sort();
const tsx = resolve("node_modules", ".bin", "tsx");
const nodeOptions = [process.env.NODE_OPTIONS, "--conditions=react-server"]
  .filter(Boolean)
  .join(" ");
let failures = 0;

for (const test of tests) {
  const result = spawnSync(tsx, [test], {
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    stdio: "inherit",
  });
  if (result.status !== 0) failures += 1;
}

console.log(`\nTest files: ${tests.length}; failures: ${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
