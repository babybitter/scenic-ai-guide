// SQLite-backed visitor feedback store (U6-10 / U6-11).
import { randomBytes } from "node:crypto";
import { getDb } from "../db/database.mjs";

function toFeedback(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    messageId: row.message_id,
    rating: row.rating,
    vote: row.vote || "",
    emotion: row.emotion || "",
    comment: row.comment || "",
    createdAt: row.created_at
  };
}

export function createFeedback(input = {}) {
  const rating = Number(input.rating);
  const normalizedRating = Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : null;
  const record = {
    id: `fb_${Date.now()}_${randomBytes(4).toString("hex")}`,
    session_id: String(input.sessionId || ""),
    message_id: String(input.messageId || ""),
    rating: normalizedRating,
    vote: input.vote === "down" ? "down" : input.vote === "up" ? "up" : "",
    emotion: String(input.emotion || ""),
    comment: String(input.comment || "").trim(),
    created_at: new Date().toISOString()
  };
  getDb()
    .prepare(
      `INSERT INTO feedback (id, session_id, message_id, rating, vote, emotion, comment, created_at)
       VALUES (@id, @session_id, @message_id, @rating, @vote, @emotion, @comment, @created_at)`
    )
    .run(record);
  return toFeedback(record);
}

export function listFeedback({ sessionId = "" } = {}) {
  const db = getDb();
  const rows = sessionId
    ? db.prepare("SELECT * FROM feedback WHERE session_id = ? ORDER BY created_at ASC, rowid ASC").all(sessionId)
    : db.prepare("SELECT * FROM feedback ORDER BY created_at ASC, rowid ASC").all();
  return rows.map(toFeedback);
}
