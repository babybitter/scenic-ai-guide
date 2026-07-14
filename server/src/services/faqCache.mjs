// AI2-12: common-question cache. High-frequency questions hit the cache and
// skip retrieval + LLM, cutting latency. Keyed by a normalized question form.
// In-memory with TTL; safe to run without a database.

const store = new Map();
const DEFAULT_TTL_MS = 1000 * 60 * 30;
const MAX_ENTRIES = 500;

function normalizeQuestion(question, mode) {
  const base = String(question || "")
    .toLowerCase()
    .replace(/[\s，。！？、,.!?;；:~～]+/g, "")
    .trim();
  return `${mode || "qa"}::${base}`;
}

export function getCachedAnswer(question, mode) {
  const key = normalizeQuestion(question, mode);
  const entry = store.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  entry.hits += 1;
  return entry.value;
}

export function setCachedAnswer(question, mode, value, ttlMs = DEFAULT_TTL_MS) {
  if (store.size >= MAX_ENTRIES) {
    // Evict the oldest entry to bound memory.
    const oldestKey = store.keys().next().value;
    if (oldestKey) {
      store.delete(oldestKey);
    }
  }
  const key = normalizeQuestion(question, mode);
  store.set(key, {
    value,
    hits: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  });
}

export function faqCacheStats() {
  return {
    size: store.size,
    entries: [...store.entries()].map(([key, entry]) => ({
      key,
      hits: entry.hits,
      createdAt: new Date(entry.createdAt).toISOString()
    }))
  };
}

export function clearFaqCache() {
  store.clear();
}
