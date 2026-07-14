import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { config } from "../config.mjs";

const allowedExtensions = new Set([".docx", ".xlsx", ".txt", ".md", ".pdf"]);
const uploads = [];

export function createUpload({ fileName, mimeType = "application/octet-stream", contentBase64 = "" }) {
  if (!fileName || typeof fileName !== "string") {
    const error = new Error("fileName is required.");
    error.statusCode = 400;
    error.code = "UPLOAD_FILE_NAME_REQUIRED";
    throw error;
  }

  const extension = extname(fileName).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    const error = new Error("Unsupported file type.");
    error.statusCode = 400;
    error.code = "UNSUPPORTED_UPLOAD_TYPE";
    throw error;
  }

  const id = `upload_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const storedName = `${id}${extension}`;
  const storedPath = join(config.uploadDir, storedName);
  const buffer = contentBase64 ? Buffer.from(contentBase64, "base64") : Buffer.alloc(0);
  writeFileSync(storedPath, buffer);

  const record = {
    id,
    fileName,
    storedName,
    mimeType,
    size: buffer.length,
    status: "uploaded",
    createdAt: new Date().toISOString()
  };

  uploads.push(record);
  return record;
}

export function listUploads() {
  return uploads;
}
