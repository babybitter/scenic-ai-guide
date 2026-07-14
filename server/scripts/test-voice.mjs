import assert from "node:assert";
import { transcribeAudio, synthesizeSpeech, voiceAsk, splitForTts, getAudioClip } from "../src/services/voice.mjs";

const asr = await transcribeAudio({ transcript: "灵山大佛有多高？", mimeType: "audio/webm" });
assert.equal(asr.text, "灵山大佛有多高？");
assert.equal(asr.provider, "mock");

const parts = splitForTts("第一句很短。第二句也很短。");
assert.equal(parts.length, 2);

const tts = await synthesizeSpeech({ text: "灵山大佛高88米。欢迎继续提问。" });
assert.ok(tts.segments.length >= 1);
assert.ok(tts.audioUrl);
assert.ok(getAudioClip(tts.segments[0].id)?.buffer.length > 44);

const result = await voiceAsk({ transcript: "九龙灌浴有什么看点？", sessionId: "voice_test" });
assert.equal(result.transcript, "九龙灌浴有什么看点？");
assert.ok(result.answer.answer.includes("九龙灌浴"));
assert.ok(result.tts.segments.length >= 1);
assert.ok(result.latency.totalMs >= 0);

console.log("Voice tests passed.");
