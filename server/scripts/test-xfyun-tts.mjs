import assert from "node:assert/strict";

process.env.DEMO_MODE = "false";

const { synthesizeSpeech, getAudioClip } = await import("../src/services/voice.mjs");

const result = await synthesizeSpeech({
  text: "您好，我是灵山胜境 AI 导游。",
  voice: process.env.XFYUN_TTS_VOICE || "xiaoyan"
});

assert.equal(result.provider, "xfyun");
assert.ok(result.segments.length > 0);

const clip = getAudioClip(result.segments[0].id);
assert.ok(clip);
assert.equal(clip.mimeType, "audio/mpeg");
assert.ok(clip.buffer.length > 1000);

console.log(`XFYUN TTS tests passed. bytes=${clip.buffer.length}`);
