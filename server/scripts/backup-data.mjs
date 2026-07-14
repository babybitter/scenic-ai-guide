import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { config } from "../src/config.mjs";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = resolve(process.env.BACKUP_DIR || "./backups");
const target = join(backupRoot, `backup-${stamp}`);

mkdirSync(backupRoot, { recursive: true });
mkdirSync(target, { recursive: true });

if (!existsSync(config.dataDir)) {
  console.error(`Data directory does not exist: ${config.dataDir}`);
  process.exit(1);
}

for (const entry of readdirSync(config.dataDir, { withFileTypes: true })) {
  if (entry.name === "backups") continue;
  copyRecursive(join(config.dataDir, entry.name), join(target, entry.name));
}

console.log(`Data backup created: ${target}`);

function copyRecursive(source, destination) {
  const stat = statSync(source);
  if (!stat.isDirectory()) {
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
    return;
  }
  const entries = readdirSync(source, { withFileTypes: true });
  mkdirSync(destination, { recursive: true });
  for (const entry of entries) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}
