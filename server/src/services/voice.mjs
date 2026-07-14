import { createHmac, randomBytes } from "node:crypto";
import { config } from "../config.mjs";
import { answerQuestion } from "./chat.mjs";
import { getCachedAnswer, setCachedAnswer } from "./faqCache.mjs";

const audioStore = new Map();
const AUDIO_TTL_MS = 1000 * 60 * 30;
const MAX_TTS_CHARS = 90;

function nowMs() {
  return Date.now();
}

export async function transcribeAudio({ audioBase64 = "", mimeType = "", transcript = "", signal } = {}) {
  const started = nowMs();
  const useMockAsr = config.providers.asr === "mock" || (config.demoMode && !process.env.ASR_API_KEY);
  if (!useMockAsr) {
    assertProviderKey("ASR_API_KEY", config.providers.asr);
    // Placeholder contract for later cloud ASR integration. The mock path keeps
    // the demo deterministic until an actual provider is configured.
    throw providerNotImplemented("ASR", config.providers.asr);
  }

  if (signal?.aborted) {
    throw abortedError("ASR");
  }

  const text = String(transcript || "").trim() || inferMockTranscript(audioBase64, mimeType);
  return {
    text,
    provider: "mock",
    confidence: transcript ? 0.98 : 0.55,
    mimeType,
    latencyMs: nowMs() - started
  };
}

export async function synthesizeSpeech({ text = "", voice = "guide_female", speed = 1, signal } = {}) {
  const started = nowMs();
  const cleanText = String(text || "").trim();
  if (!cleanText) {
    const error = new Error("Text is required.");
    error.statusCode = 400;
    error.code = "TTS_TEXT_REQUIRED";
    throw error;
  }

  const useMockTts = config.providers.tts === "mock" || (config.demoMode && !process.env.TTS_API_KEY);
  if (!useMockTts && config.providers.tts !== "xfyun") {
    assertProviderKey("TTS_API_KEY", config.providers.tts);
    throw providerNotImplemented("TTS", config.providers.tts);
  }

  if (signal?.aborted) {
    throw abortedError("TTS");
  }

  const segments = splitForTts(cleanText);
  if (config.providers.tts === "xfyun" && hasXfyunTtsConfig()) {
    try {
      const audioSegments = [];
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const buffer = await synthesizeXfyunSegment({
          text: segment,
          voice,
          speed,
          signal
        });
        const id = `tts_${Date.now()}_${randomBytes(4).toString("hex")}_${index}`;
        audioStore.set(id, {
          buffer,
          mimeType: "audio/mpeg",
          text: segment,
          expiresAt: Date.now() + AUDIO_TTL_MS
        });
        audioSegments.push({
          id,
          text: segment,
          audioUrl: `/api/voice/tts/audio/${id}`,
          mimeType: "audio/mpeg",
          durationMs: Math.min(30000, Math.max(900, segment.length * 180))
        });
      }
      cleanupAudioStore();
      return {
        provider: "xfyun",
        voice: resolveXfyunVoice(voice),
        speed,
        segments: audioSegments,
        audioUrl: audioSegments[0]?.audioUrl || null,
        latencyMs: nowMs() - started
      };
    } catch (error) {
      if (!config.demoMode) {
        throw error;
      }
      console.warn(`XFYUN TTS failed, falling back to mock: ${error.message}`);
    }
  }

  const audioSegments = segments.map((segment, index) => {
    const durationMs = Math.min(1200, Math.max(420, segment.length * 24));
    const buffer = createMockWav({ durationMs, frequency: 520 + index * 28 });
    const id = `tts_${Date.now()}_${randomBytes(4).toString("hex")}_${index}`;
    audioStore.set(id, {
      buffer,
      mimeType: "audio/wav",
      text: segment,
      expiresAt: Date.now() + AUDIO_TTL_MS
    });
    return {
      id,
      text: segment,
      audioUrl: `/api/voice/tts/audio/${id}`,
      mimeType: "audio/wav",
      durationMs
    };
  });

  cleanupAudioStore();
  return {
    provider: "mock",
    voice,
    speed,
    segments: audioSegments,
    audioUrl: audioSegments[0]?.audioUrl || null,
    latencyMs: nowMs() - started
  };
}

function hasXfyunTtsConfig() {
  return Boolean(config.xfyun.appId && config.xfyun.apiKey && config.xfyun.apiSecret);
}

function resolveXfyunVoice(voice) {
  const value = String(voice || "").trim();
  if (value && !["guide_female", "guide_soft", "guide_test"].includes(value)) {
    return value;
  }
  return config.xfyun.ttsVoice || "xiaoyan";
}

function xfyunSignedUrl() {
  const host = config.xfyun.ttsHost;
  const path = config.xfyun.ttsPath;
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const signature = createHmac("sha256", config.xfyun.apiSecret)
    .update(signatureOrigin)
    .digest("base64");
  const authorizationOrigin = `api_key="${config.xfyun.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString("base64");
  return `wss://${host}${path}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
}

function synthesizeXfyunSegment({ text, voice, speed, signal }) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(xfyunSignedUrl());
    const chunks = [];
    let settled = false;
    const timer = setTimeout(() => finish(new Error(`XFYUN TTS timed out after ${config.xfyun.ttsTimeoutMs}ms.`)), config.xfyun.ttsTimeoutMs);
    const onAbort = () => finish(abortedError("TTS"));

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    function finish(error, buffer) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      try {
        ws.close();
      } catch {
        // ignore close failures
      }
      if (error) {
        reject(error);
      } else {
        resolve(buffer);
      }
    }

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        common: {
          app_id: config.xfyun.appId
        },
        business: {
          aue: "lame",
          sfl: 1,
          vcn: resolveXfyunVoice(voice),
          speed: Math.max(0, Math.min(100, Math.round(Number(speed || 1) * 50))),
          volume: 60,
          pitch: 50,
          bgs: 0,
          tte: "UTF8"
        },
        data: {
          status: 2,
          text: Buffer.from(text, "utf8").toString("base64")
        }
      }));
    });

    ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data));
        if (payload.code !== 0) {
          const error = new Error(`XFYUN TTS error ${payload.code}: ${payload.message || "unknown error"}`);
          error.statusCode = 502;
          error.code = "XFYUN_TTS_ERROR";
          finish(error);
          return;
        }
        if (payload.data?.audio) {
          chunks.push(Buffer.from(payload.data.audio, "base64"));
        }
        if (payload.data?.status === 2) {
          finish(null, Buffer.concat(chunks));
        }
      } catch (error) {
        finish(error);
      }
    });

    ws.addEventListener("error", () => {
      const error = new Error("XFYUN TTS websocket connection failed.");
      error.statusCode = 502;
      error.code = "XFYUN_TTS_NETWORK_ERROR";
      finish(error);
    });
  });
}

export async function voiceAsk({ audioBase64 = "", mimeType = "", transcript = "", question = "", sessionId = "", mode = "", signal } = {}) {
  const started = nowMs();
  const asrStart = nowMs();
  const asr = question
    ? { text: String(question).trim(), provider: "direct", confidence: 1, latencyMs: 0 }
    : await transcribeAudio({ audioBase64, mimeType, transcript, signal });
  const asrMs = nowMs() - asrStart;

  const cacheKey = `voice::${asr.text}::${mode || "auto"}`;
  const cached = getCachedAnswer(cacheKey, "voice");
  let answer;
  let ragMs = 0;
  let llmMs = 0;
  if (cached) {
    answer = cached.answerPayload;
  } else {
    const answerStart = nowMs();
    answer = await answerQuestion({ question: asr.text, sessionId, mode, signal });
    ragMs = answer.latency?.retrievalMs || 0;
    llmMs = answer.latency?.llmMs || 0;
    setCachedAnswer(cacheKey, "voice", { answerPayload: answer }, 1000 * 60 * 10);
  }

  const ttsStart = nowMs();
  const tts = await synthesizeSpeech({ text: answer.answer, signal });
  const ttsMs = nowMs() - ttsStart;

  return {
    transcript: asr.text,
    asr,
    answer,
    tts,
    latency: {
      asrMs,
      ragMs,
      llmMs,
      ttsMs,
      totalMs: nowMs() - started,
      targetMs: 5000,
      withinTarget: nowMs() - started <= 5000
    }
  };
}

export function getAudioClip(id) {
  cleanupAudioStore();
  const clip = audioStore.get(id);
  if (!clip) {
    return null;
  }
  return clip;
}

export function splitForTts(text) {
  const sentences = String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？；.!?;])\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  const parts = [];
  for (const sentence of sentences.length ? sentences : [String(text || "").trim()]) {
    if (sentence.length <= MAX_TTS_CHARS) {
      parts.push(sentence);
      continue;
    }
    for (let index = 0; index < sentence.length; index += MAX_TTS_CHARS) {
      parts.push(sentence.slice(index, index + MAX_TTS_CHARS));
    }
  }
  return parts;
}

function inferMockTranscript(audioBase64, mimeType) {
  if (audioBase64) {
    return "灵山大佛有多高？";
  }
  if (mimeType) {
    return "九龙灌浴有什么看点？";
  }
  return "灵山大佛有多高？";
}

function createMockWav({ durationMs, frequency }) {
  const sampleRate = 8000;
  const samples = Math.floor(sampleRate * durationMs / 1000);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples; i += 1) {
    const fade = Math.min(1, i / 400, (samples - i) / 400);
    const sample = Math.round(Math.sin(2 * Math.PI * frequency * i / sampleRate) * 1800 * fade);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  return buffer;
}

function cleanupAudioStore() {
  const now = Date.now();
  for (const [id, clip] of audioStore.entries()) {
    if (clip.expiresAt < now) {
      audioStore.delete(id);
    }
  }
}

function assertProviderKey(envName, provider) {
  const key = envName === "ASR_API_KEY" ? process.env.ASR_API_KEY : process.env.TTS_API_KEY;
  if (!key) {
    const error = new Error(`${envName} is missing for ${provider}. Set provider to mock for offline demo or configure a cloud key.`);
    error.statusCode = 500;
    error.code = `${envName}_MISSING`;
    throw error;
  }
}

function providerNotImplemented(kind, provider) {
  const error = new Error(`${kind} provider "${provider}" is not implemented in this demo adapter yet.`);
  error.statusCode = 501;
  error.code = `${kind}_PROVIDER_NOT_IMPLEMENTED`;
  return error;
}

function abortedError(kind) {
  const error = new Error(`${kind} request was aborted.`);
  error.statusCode = 499;
  error.code = `${kind}_ABORTED`;
  return error;
}
