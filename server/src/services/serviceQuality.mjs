import { listAllMessages, getMessages } from "./conversation.mjs";
import { listFeedback } from "./feedback.mjs";
import { getDashboardAnalytics } from "./behaviorAnalytics.mjs";

const annotations = new Map();

export function listConversationSummaries({ lowSatisfactionOnly = false } = {}) {
  const messages = listAllMessages();
  const feedback = listFeedback();
  const grouped = groupBy(messages, (item) => item.sessionId);
  const summaries = [...grouped.entries()].map(([sessionId, items]) => {
    const sessionFeedback = feedback.filter((item) => item.sessionId === sessionId);
    const ratingValues = sessionFeedback.map((item) => Number(item.rating)).filter(Number.isFinite);
    const averageRating = ratingValues.length
      ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
      : null;
    return {
      sessionId,
      startedAt: items[0]?.createdAt || "",
      updatedAt: items.at(-1)?.createdAt || "",
      messageCount: items.length,
      userQuestionCount: items.filter((item) => item.role === "user").length,
      averageRating,
      lowSatisfaction: sessionFeedback.some((item) => item.vote === "down" || Number(item.rating) <= 2),
      mainFocus: topFocus(items.map((item) => item.content).join(" ")),
      feedbackCount: sessionFeedback.length
    };
  }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return lowSatisfactionOnly ? summaries.filter((item) => item.lowSatisfaction) : summaries;
}

export function getConversationDetail(sessionId) {
  const messages = getMessages(sessionId);
  const feedback = listFeedback({ sessionId });
  return {
    sessionId,
    messages: messages.map((item) => ({
      ...item,
      annotation: annotations.get(item.id) || null
    })),
    feedback,
    summary: listConversationSummaries().find((item) => item.sessionId === sessionId) || null
  };
}

export function annotateMessage(messageId, input = {}) {
  const label = ["correct", "wrong", "needs_knowledge"].includes(input.label) ? input.label : "needs_knowledge";
  const note = String(input.note || "").trim();
  const annotation = {
    messageId,
    label,
    note,
    createdAt: new Date().toISOString()
  };
  annotations.set(messageId, annotation);
  return annotation;
}

export function createKnowledgeDraftFromMessage(messageId) {
  const message = listAllMessages().find((item) => item.id === messageId);
  const annotation = annotations.get(messageId) || null;
  const draft = {
    id: `draft_${messageId}`,
    title: `待补充知识：${String(message?.content || "游客问题").slice(0, 24)}`,
    question: message?.content || "",
    suggestedAnswer: annotation?.note || "请补充标准答案、适用景点和引用来源。",
    sourceMessageId: messageId,
    createdAt: new Date().toISOString()
  };
  return draft;
}

export function listFeedbackClusters() {
  const feedback = listFeedback();
  const buckets = new Map();
  for (const item of feedback) {
    const label = clusterFeedback(item);
    if (!buckets.has(label)) {
      buckets.set(label, []);
    }
    buckets.get(label).push(item);
  }
  return [...buckets.entries()]
    .map(([label, items]) => ({
      label,
      count: items.length,
      averageRating: average(items.map((item) => item.rating)),
      samples: items.slice(-3)
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}

export function buildServiceQualityReport() {
  const conversations = listConversationSummaries();
  const feedback = listFeedback();
  const clusters = listFeedbackClusters();
  const dashboard = getDashboardAnalytics();
  const wrongAnnotations = [...annotations.values()].filter((item) => item.label !== "correct");
  return {
    generatedAt: new Date().toISOString(),
    conversationCount: conversations.length,
    lowSatisfactionCount: conversations.filter((item) => item.lowSatisfaction).length,
    averageSatisfaction: average(feedback.map((item) => item.rating)),
    commonIssues: clusters.slice(0, 5),
    wrongAnswerCount: wrongAnnotations.length,
    optimizationSuggestions: [
      ...dashboard.suggestions,
      ...clusters.slice(0, 3).map((item) => `反馈集中在“${item.label}”，建议补充对应 FAQ 和景点讲解话术。`)
    ].slice(0, 6)
  };
}

function groupBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function topFocus(text) {
  const rules = ["灵山大佛", "九龙灌浴", "梵宫", "五印坛城", "祥符禅寺", "路线", "门票", "开放时间"];
  return rules.find((rule) => text.includes(rule)) || "综合咨询";
}

function clusterFeedback(item) {
  const text = `${item.comment || ""} ${item.emotion || ""}`;
  if (/演出|九龙|时间|几点/.test(text)) return "演出时间不清楚";
  if (/路线|太长|走不动|累/.test(text)) return "路线长度与体力不匹配";
  if (/门票|价格|收费|消费/.test(text)) return "票务与消费信息";
  if (/讲解|回答|不准|错误|听不懂/.test(text)) return "回答准确性与表达";
  if (item.vote === "down" || Number(item.rating) <= 2) return "低满意度体验";
  return item.emotion || "正向反馈";
}

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? Number((nums.reduce((sum, value) => sum + value, 0) / nums.length).toFixed(1)) : 0;
}
