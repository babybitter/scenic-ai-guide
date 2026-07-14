import assert from "node:assert/strict";

process.env.DEMO_MODE = "true";
process.env.LLM_PROVIDER = "openai";
process.env.LLM_API_KEY = "";
process.env.ASR_PROVIDER = "cloud";
process.env.ASR_API_KEY = "";
process.env.TTS_PROVIDER = "cloud";
process.env.TTS_API_KEY = "";

const { answerQuestion } = await import("../src/services/chat.mjs");
const { voiceAsk } = await import("../src/services/voice.mjs");

const answer = await answerQuestion({
  question: "灵山大佛有多高？",
  sessionId: "demo_mode_text"
});
assert.ok(answer.answer);
assert.equal(answer.provider, "mock");

const voice = await voiceAsk({
  transcript: "九龙灌浴有什么看点？",
  sessionId: "demo_mode_voice"
});
assert.ok(voice.answer.answer);
assert.equal(voice.tts.provider, "mock");
assert.ok(voice.tts.segments.length > 0);

console.log("Demo mode tests passed.");
