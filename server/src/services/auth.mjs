// P0-06: admin authentication (DB-backed accounts) and anonymous visitor
// sessions. Tokens are stateless HMAC-signed payloads.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.mjs";
import { getDb } from "../db/database.mjs";
import { verifyPassword } from "../db/password.mjs";

export function login(username, password) {
  const user = getDb()
    .prepare("SELECT * FROM admin_users WHERE username = ? AND status = 'active'")
    .get(String(username || ""));
  if (!user || !verifyPassword(String(password || ""), user.password_hash)) {
    return null;
  }

  const token = signToken({
    sub: user.username,
    uid: user.id,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 8
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role
    }
  };
}

export function verifyToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadEncoded, signature] = parts;
  const expected = sign(payloadEncoded);
  if (!safeEqual(signature, expected)) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf8"));
  if (payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export function createVisitorSession() {
  const id = `visitor_${Date.now()}_${randomBytes(6).toString("hex")}`;
  const startedAt = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO visitor_sessions (id, started_at, channel, message_count) VALUES (?, ?, 'web', 0)"
    )
    .run(id, startedAt);
  return { id, createdAt: startedAt, messageCount: 0 };
}

export function getVisitorSession(id) {
  const row = getDb().prepare("SELECT * FROM visitor_sessions WHERE id = ?").get(id);
  return row
    ? { id: row.id, createdAt: row.started_at, messageCount: row.message_count }
    : null;
}

function signToken(payload) {
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadEncoded}.${sign(payloadEncoded)}`;
}

function sign(payloadEncoded) {
  return createHmac("sha256", config.jwtSecret).update(payloadEncoded).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
