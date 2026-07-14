import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.mjs";

const sessions = new Map();

export function login(username, password) {
  if (username !== config.adminUsername || password !== config.adminPassword) {
    return null;
  }

  const token = signToken({
    sub: username,
    role: "admin",
    exp: Date.now() + 1000 * 60 * 60 * 8
  });

  return {
    token,
    user: {
      username,
      role: "admin"
    }
  };
}

export function verifyToken(token) {
  const parts = token.split(".");
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
  const session = {
    id,
    createdAt: new Date().toISOString(),
    messageCount: 0
  };

  sessions.set(id, session);
  return session;
}

export function getVisitorSession(id) {
  return sessions.get(id) || null;
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
