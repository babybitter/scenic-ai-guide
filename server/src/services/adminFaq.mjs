import { randomBytes } from "node:crypto";

const faqs = [];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\s，。！？、,.!?;；:~～]+/g, "")
    .trim();
}

export function listAdminFaqs() {
  return [...faqs].sort((left, right) => right.priority - left.priority || left.createdAt.localeCompare(right.createdAt));
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

  const record = {
    id: `faq_${Date.now()}_${randomBytes(4).toString("hex")}`,
    question,
    answer,
    keywords: Array.isArray(input.keywords) ? input.keywords.map((item) => String(item).trim()).filter(Boolean) : [],
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 50,
    enabled: input.enabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  faqs.push(record);
  return record;
}

export function updateAdminFaq(id, input = {}) {
  const record = faqs.find((item) => item.id === id);
  if (!record) {
    const error = new Error("FAQ not found.");
    error.statusCode = 404;
    error.code = "FAQ_NOT_FOUND";
    throw error;
  }

  if (input.question !== undefined) record.question = String(input.question || "").trim();
  if (input.answer !== undefined) record.answer = String(input.answer || "").trim();
  if (Array.isArray(input.keywords)) record.keywords = input.keywords.map((item) => String(item).trim()).filter(Boolean);
  if (input.priority !== undefined && Number.isFinite(Number(input.priority))) record.priority = Number(input.priority);
  if (input.enabled !== undefined) record.enabled = Boolean(input.enabled);
  record.updatedAt = new Date().toISOString();
  return record;
}

export function findAdminFaqAnswer(question) {
  const normalizedQuestion = normalize(question);
  if (!normalizedQuestion) {
    return null;
  }

  return listAdminFaqs().find((faq) => {
    if (!faq.enabled) return false;
    if (normalizedQuestion.includes(normalize(faq.question)) || normalize(faq.question).includes(normalizedQuestion)) {
      return true;
    }
    return faq.keywords.some((keyword) => normalizedQuestion.includes(normalize(keyword)));
  }) || null;
}
