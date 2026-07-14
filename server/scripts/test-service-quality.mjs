import assert from "node:assert/strict";
import { appendMessage } from "../src/services/conversation.mjs";
import { createFeedback } from "../src/services/feedback.mjs";
import {
  annotateMessage,
  buildServiceQualityReport,
  createKnowledgeDraftFromMessage,
  getConversationDetail,
  listConversationSummaries,
  listFeedbackClusters
} from "../src/services/serviceQuality.mjs";

const sessionId = "quality_test_session";
appendMessage(sessionId, { role: "user", content: "九龙灌浴演出几点开始？" });
const answer = appendMessage(sessionId, {
  role: "assistant",
  content: "九龙灌浴建议以景区当日公告为准。",
  intentLabel: "事实问答",
  latencyMs: 320
});
createFeedback({
  sessionId,
  rating: 2,
  vote: "down",
  emotion: "失望",
  comment: "演出时间不清楚"
});

const conversations = listConversationSummaries();
assert.ok(conversations.some((item) => item.sessionId === sessionId && item.lowSatisfaction));

const detail = getConversationDetail(sessionId);
assert.equal(detail.messages.length, 2);
assert.equal(detail.feedback.length, 1);

const annotation = annotateMessage(answer.id, { label: "needs_knowledge", note: "补充九龙灌浴每日演出时间来源。" });
assert.equal(annotation.label, "needs_knowledge");

const draft = createKnowledgeDraftFromMessage(answer.id);
assert.equal(draft.sourceMessageId, answer.id);
assert.ok(draft.suggestedAnswer.includes("九龙灌浴"));

const clusters = listFeedbackClusters();
assert.ok(clusters.some((item) => item.label === "演出时间不清楚"));

const report = buildServiceQualityReport();
assert.ok(report.lowSatisfactionCount >= 1);
assert.ok(report.optimizationSuggestions.length > 0);

console.log("Service quality tests passed.");
