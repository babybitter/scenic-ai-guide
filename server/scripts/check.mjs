import { existsSync } from "node:fs";
import { join } from "node:path";

const requiredPaths = [
  "src/app.mjs",
  "src/config.mjs",
  "src/db/schema.mjs",
  "src/contracts/openapi.json",
  "web/public/index.html",
  "web/public/app.js",
  "web/public/styles.css"
];

const missing = requiredPaths.filter((item) => !existsSync(join(process.cwd(), item)));

if (missing.length > 0) {
  console.error("Project check failed. Missing files:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Project check passed.");
