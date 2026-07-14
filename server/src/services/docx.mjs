import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function extractDocxText(filePath) {
  const tempDir = mkdtempSync(join(tmpdir(), "lingshan-docx-"));

  try {
    execFileSync("tar.exe", ["-xf", filePath, "-C", tempDir], {
      windowsHide: true
    });

    const xmlPath = join(tempDir, "word", "document.xml");
    const xml = readFileSync(xmlPath, "utf8");
    return docxXmlToText(xml);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

export function docxXmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
