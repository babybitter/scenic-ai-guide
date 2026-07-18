const supportedLocales = new Set(["zh", "en", "ko", "zh-TW", "ja"]);

export function normalizeLocale(value, question = "") {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();

  if (lower === "zh-tw" || lower === "zh_hant" || lower === "zh-hant") return "zh-TW";
  if (lower === "zh" || lower === "zh-cn" || lower === "zh_hans" || lower === "zh-hans") return "zh";
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (lower === "ko" || lower.startsWith("ko-")) return "ko";
  if (lower === "ja" || lower.startsWith("ja-")) return "ja";
  if (supportedLocales.has(raw)) return raw;

  return detectQuestionLocale(question);
}

export function detectQuestionLocale(question) {
  const text = String(question || "");
  if (/[\uac00-\ud7af]/u.test(text)) return "ko";
  if (/[\u3040-\u30ff]/u.test(text)) return "ja";
  if (/[靈灣宮點開間覽價線體與於臺龍門歷]/u.test(text)) return "zh-TW";
  if (/[a-z]/iu.test(text) && !/[\u3400-\u9fff]/u.test(text)) return "en";
  return "zh";
}

export function localeInstruction(locale) {
  const instructions = {
    zh: "请始终使用简体中文回答。",
    en: "Always answer in natural English.",
    ko: "항상 자연스러운 한국어로 답변하세요.",
    "zh-TW": "請始終使用繁體中文回答。",
    ja: "常に自然な日本語で回答してください。"
  };
  return instructions[normalizeLocale(locale)] || instructions.zh;
}
