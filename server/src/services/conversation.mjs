// Lightweight in-memory conversation store. Supports multi-turn context
// (AI2-07) and records per-message metadata aligned with the `messages` schema
// (intent_label, emotion_label, latency_ms) for later session/feedback views.

import { randomBytes } from "node:crypto";

const conversations = new Map();
const MAX_TURNS_PER_SESSION = 100;

function ensure(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  return conversations.get(sessionId);
}

export function appendMessage(sessionId, message) {
  if (!sessionId) {
    return null;
  }
  const list = ensure(sessionId);
  const record = {
    id: `msg_${Date.now()}_${randomBytes(4).toString("hex")}`,
    sessionId,
    role: message.role,
    content: message.content,
    intentLabel: message.intentLabel || null,
    emotionLabel: message.emotionLabel || null,
    latencyMs: message.latencyMs ?? null,
    createdAt: new Date().toISOString()
  };
  list.push(record);
  if (list.length > MAX_TURNS_PER_SESSION) {
    list.splice(0, list.length - MAX_TURNS_PER_SESSION);
  }
  return record;
}

export function getHistory(sessionId, limit = 6) {
  if (!sessionId) {
    return [];
  }
  const list = conversations.get(sessionId) || [];
  return list.slice(-limit).map((item) => ({ role: item.role, content: item.content }));
}

// AI2-07: find the most recently discussed scenic spot so pronoun-style
// follow-ups ("它多高" / "适合拍照吗") can be re-anchored to that subject.
export function getLastSpotName(sessionId, spotNames = []) {
  if (!sessionId) {
    return null;
  }
  const list = conversations.get(sessionId) || [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const item = list[index];
    const hit = spotNames.find((name) => name && item.content.includes(name));
    if (hit) {
      return hit;
    }
  }
  return null;
}

export function getMessages(sessionId) {
  return conversations.get(sessionId) || [];
}

export function listAllMessages() {
  return [...conversations.values()].flat();
}
