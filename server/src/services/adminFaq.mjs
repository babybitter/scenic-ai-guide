// SQLite-backed admin FAQ store (A7-08). Enabled FAQs are preferred by the
// chat service before RAG, and can be prioritized for high-frequency questions.
import { randomBytes } from "node:crypto";
import { getDb } from "../db/database.mjs";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\s，。！？、,.!?;；:~～]+/g, "")
    .trim();
}

function toFaq(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    keywords: parseKeywords(row.keywords),
    priority: row.priority,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseKeywords(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listAdminFaqs() {
  return getDb()
    .prepare("SELECT * FROM admin_faqs ORDER BY priority DESC, created_at ASC")
    .all()
    .map(toFaq);
}

export function createAdminFaq(input = {}) {
  const question = String(input.question || "").trim();
  const answer = String(input.answer || "").trim();
  if (!question || !answer) {
    const error = new Error("question and answer are required.");
    error.statusCode = 400;
    error.code = "FAQ_REQUIRED";
    throw error;
  }

  const now = new Date().toISOString();
  const record = {
    id: `faq_${Date.now()}_${randomBytes(4).toString("hex")}`,
    question,
    answer,
    keywords: JSON.stringify(
      Array.isArray(input.keywords) ? input.keywords.map((item) => String(item).trim()).filter(Boolean) : []
    ),
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 50,
    enabled: input.enabled === false ? 0 : 1,
    created_at: now,
    updated_at: now
  };
  getDb()
    .prepare(
      `INSERT INTO admin_faqs (id, question, answer, keywords, priority, enabled, created_at, updated_at)
       VALUES (@id, @question, @answer, @keywords, @priority, @enabled, @created_at, @updated_at)`
    )
    .run(record);
  return toFaq(record);
}

export function updateAdminFaq(id, input = {}) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM admin_faqs WHERE id = ?").get(id);
  if (!row) {
    const error = new Error("FAQ not found.");
    error.statusCode = 404;
    error.code = "FAQ_NOT_FOUND";
    throw error;
  }

  const current = toFaq(row);
  const next = {
    id,
    question: input.question !== undefined ? String(input.question || "").trim() : current.question,
    answer: input.answer !== undefined ? String(input.answer || "").trim() : current.answer,
    keywords: JSON.stringify(
      Array.isArray(input.keywords)
        ? input.keywords.map((item) => String(item).trim()).filter(Boolean)
        : current.keywords
    ),
    priority:
      input.priority !== undefined && Number.isFinite(Number(input.priority))
        ? Number(input.priority)
        : current.priority,
    enabled: input.enabled !== undefined ? (input.enabled ? 1 : 0) : current.enabled ? 1 : 0,
    updated_at: new Date().toISOString()
  };
  db.prepare(
    `UPDATE admin_faqs
       SET question = @question, answer = @answer, keywords = @keywords,
           priority = @priority, enabled = @enabled, updated_at = @updated_at
     WHERE id = @id`
  ).run(next);
  return toFaq(db.prepare("SELECT * FROM admin_faqs WHERE id = ?").get(id));
}

export function findAdminFaqAnswer(question) {
  const normalizedQuestion = normalize(question);
  if (!normalizedQuestion) {
    return null;
  }

  return (
    listAdminFaqs().find((faq) => {
      if (!faq.enabled) return false;
      if (normalizedQuestion.includes(normalize(faq.question)) || normalize(faq.question).includes(normalizedQuestion)) {
        return true;
      }
      return faq.keywords.some((keyword) => normalizedQuestion.includes(normalize(keyword)));
    }) || null
  );
}
