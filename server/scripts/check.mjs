import { existsSync } from "node:fs";
import { join } from "node:path";

const requiredPaths = [
  "src/app.mjs",
  "src/config.mjs",
  "src/db/schema.mjs",
  "src/db/database.mjs",
  "src/contracts/openapi.json",
  "data/generated/knowledge.json",
  "data/generated/scenic-spots.json",
  "data/generated/knowledge-chunks.json"
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
