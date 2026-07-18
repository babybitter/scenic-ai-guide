// SQLite-backed conversation store. Supports multi-turn context (AI2-07) and
// records per-message metadata (intent_label, emotion_label, latency_ms) for
// later session / feedback views (F10). Public signatures are unchanged so the
// rest of the app keeps working as before.

import { randomBytes } from "node:crypto";
import { getDb } from "../db/database.mjs";

function ensureSession(sessionId) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO visitor_sessions (id, started_at, channel, message_count)
     VALUES (?, ?, 'web', 0)
     ON CONFLICT(id) DO NOTHING`
  ).run(sessionId, now);
}

function toMessage(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    intentLabel: row.intent_label,
    emotionLabel: row.emotion_label,
    latencyMs: row.latency_ms,
    createdAt: row.created_at
  };
}

export function appendMessage(sessionId, message) {
  if (!sessionId) {
    return null;
  }
  const db = getDb();
  ensureSession(sessionId);
  const record = {
    id: `msg_${Date.now()}_${randomBytes(4).toString("hex")}`,
    session_id: sessionId,
    role: message.role,
    content: message.content,
    intent_label: message.intentLabel || null,
    emotion_label: message.emotionLabel || null,
    latency_ms: message.latencyMs ?? null,
    created_at: new Date().toISOString()
  };
  db.prepare(
    `INSERT INTO messages
       (id, session_id, role, content, intent_label, emotion_label, latency_ms, created_at)
     VALUES
       (@id, @session_id, @role, @content, @intent_label, @emotion_label, @latency_ms, @created_at)`
  ).run(record);
  db.prepare(
    "UPDATE visitor_sessions SET message_count = message_count + 1 WHERE id = ?"
  ).run(sessionId);
  return toMessage({ ...record });
}

export function getHistory(sessionId, limit = 6) {
  if (!sessionId) {
    return [];
  }
  const rows = getDb()
    .prepare(
      "SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?"
    )
    .all(sessionId, limit);
  return rows.reverse().map((row) => ({ role: row.role, content: row.content }));
}

// AI2-07: find the most recently discussed scenic spot so pronoun-style
// follow-ups ("它多高" / "适合拍照吗") can be re-anchored to that subject.
export function getLastSpotName(sessionId, spotNames = []) {
  if (!sessionId) {
    return null;
  }
  const rows = getDb()
    .prepare("SELECT content FROM messages WHERE session_id = ? ORDER BY created_at DESC, rowid DESC")
    .all(sessionId);
  for (const row of rows) {
    const content = String(row.content || "").normalize("NFKC").toLowerCase();
    const hit = spotNames.find((name) =>
      name && content.includes(String(name).normalize("NFKC").toLowerCase())
    );
    if (hit) {
      return hit;
    }
  }
  return null;
}

export function getMessages(sessionId) {
  return getDb()
    .prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC, rowid ASC")
    .all(sessionId)
    .map(toMessage);
}

export function clearMessages(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) {
    return { sessionId: "", deleted: 0 };
  }

  const db = getDb();
  return db.transaction(() => {
    db.prepare(
      `DELETE FROM message_annotations
       WHERE message_id IN (SELECT id FROM messages WHERE session_id = ?)`
    ).run(id);
    db.prepare(
      `DELETE FROM feedback
       WHERE message_id IN (SELECT id FROM messages WHERE session_id = ?)`
    ).run(id);
    const result = db.prepare("DELETE FROM messages WHERE session_id = ?").run(id);
    db.prepare("UPDATE visitor_sessions SET message_count = 0 WHERE id = ?").run(id);
    return { sessionId: id, deleted: result.changes };
  })();
}

export function listAllMessages() {
  return getDb()
    .prepare("SELECT * FROM messages ORDER BY created_at ASC, rowid ASC")
    .all()
    .map(toMessage);
}
