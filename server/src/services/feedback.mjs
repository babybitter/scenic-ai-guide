import { randomBytes } from "node:crypto";

const feedbackRecords = [];

export function createFeedback(input = {}) {
  const rating = Number(input.rating);
  const normalizedRating = Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : null;
  const record = {
    id: `fb_${Date.now()}_${randomBytes(4).toString("hex")}`,
    sessionId: String(input.sessionId || ""),
    messageId: String(input.messageId || ""),
    rating: normalizedRating,
    vote: input.vote === "down" ? "down" : input.vote === "up" ? "up" : "",
    emotion: String(input.emotion || ""),
    comment: String(input.comment || "").trim(),
    createdAt: new Date().toISOString()
  };
  feedbackRecords.push(record);
  return record;
}

export function listFeedback({ sessionId = "" } = {}) {
  if (sessionId) {
    return feedbackRecords.filter((item) => item.sessionId === sessionId);
  }
  return [...feedbackRecords];
}
