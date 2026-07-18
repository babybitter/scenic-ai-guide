import assert from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const tempDir = mkdtempSync(join(tmpdir(), "scenic-upload-test-"));

try {
  const generatedDir = join(tempDir, "generated");
  mkdirSync(generatedDir, { recursive: true });
  for (const fileName of ["knowledge.json", "knowledge-chunks.json", "scenic-spots.json"]) {
    cpSync(resolve("data", "generated", fileName), join(generatedDir, fileName));
  }

  process.env.DATA_DIR = tempDir;
  process.env.UPLOAD_DIR = join(tempDir, "uploads");
  process.env.SQLITE_PATH = ":memory:";

  const { createUpload } = await import("../src/services/uploads.mjs");
  const { buildKnowledge } = await import("../src/services/knowledgeBuild.mjs");
  const { hybridSearch } = await import("../src/services/retrieval.mjs");

  const markdown = [
    "# Custom English guide",
    "",
    "## Quiet garden",
    "The Moonlight Garden has a silent reflection pool and evening lantern walk."
  ].join("\n");
  const upload = createUpload({
    fileName: "custom-guide.en.md",
    mimeType: "text/markdown",
    contentBase64: Buffer.from(markdown).toString("base64")
  });

  assert.equal(upload.status, "processed");
  assert.ok(upload.chunkCount > 0, "the uploaded Markdown should produce chunks");
  assert.equal(
    hybridSearch("Where is the Moonlight Garden reflection pool?", { locale: "en" }).results[0]?.source,
    "custom-guide.en.md"
  );

  buildKnowledge({ sourceDir: resolve("..", "docs", "scenic-materials") });
  assert.equal(
    hybridSearch("Where is the Moonlight Garden reflection pool?", { locale: "en" }).results[0]?.source,
    "custom-guide.en.md",
    "uploaded chunks should survive a base knowledge rebuild"
  );

  console.log("PASS  uploaded Markdown is indexed and survives a rebuild");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
