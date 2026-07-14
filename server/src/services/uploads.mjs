// SQLite-backed upload metadata store (P0-07 / A7-02). File bytes are written to
// the upload directory; document metadata and processing status live in the
// knowledge_documents table.
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { config } from "../config.mjs";
import { getDb } from "../db/database.mjs";

const allowedExtensions = new Set([".docx", ".xlsx", ".txt", ".md", ".pdf"]);

function toUpload(row) {
  return {
    id: row.id,
    fileName: row.file_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    size: row.size,
    fileType: row.file_type,
    status: row.status,
    chunkCount: row.chunk_count,
    createdAt: row.created_at
  };
}

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
    file_name: fileName,
    stored_name: storedName,
    mime_type: mimeType,
    size: buffer.length,
    file_type: extension.replace(".", ""),
    status: "uploaded",
    chunk_count: 0,
    created_at: new Date().toISOString()
  };
  getDb()
    .prepare(
      `INSERT INTO knowledge_documents
         (id, file_name, stored_name, mime_type, size, file_type, status, chunk_count, created_at)
       VALUES
         (@id, @file_name, @stored_name, @mime_type, @size, @file_type, @status, @chunk_count, @created_at)`
    )
    .run(record);
  return toUpload(record);
}

export function listUploads() {
  return getDb()
    .prepare("SELECT * FROM knowledge_documents ORDER BY created_at DESC, rowid DESC")
    .all()
    .map(toUpload);
}
