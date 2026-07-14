// C9 / DH5-10: digital-human configuration (SQLite-backed) and answer->state
// mapping. The active configuration tells the visitor client which iFlytek
// interactive-avatar id / voice (vcn) to load and how to greet visitors.

import { getDb } from "../db/database.mjs";

function toConfig(row) {
  const config = {
    id: row.id,
    name: row.name,
    avatarId: row.avatar_id || "",
    vcn: row.vcn || "",
    characterAsset: row.character_asset || "",
    appearance: row.appearance || "",
    outfit: row.outfit || "",
    theme: row.theme || "",
    voiceId: row.voice_id || row.vcn || "",
    speechRate: row.speech_rate ?? 1,
    welcomeText: row.welcome_text || "",
    emotionStyle: row.emotion_style || "warm",
    serviceStatus: row.service_status || "online",
    enabled: Boolean(row.enabled),
    updatedAt: row.updated_at
  };
  // The iFlytek avatar streams from the cloud, so there is no local asset file
  // to check; the client only needs a valid avatarId to render, and text-only
  // service mode disables the avatar on purpose.
  config.assetAvailable = Boolean(config.avatarId) && config.serviceStatus !== "text_only";
  config.fallback = config.assetAvailable
    ? { type: "xfyun-avatar", reason: "iFlytek interactive avatar is streamed from the cloud." }
    : { type: "text_only", reason: "Avatar disabled; visitor client should degrade to text + audio." };
  return config;
}

export function getActiveDigitalHumanConfig() {
  const db = getDb();
  const row =
    db.prepare("SELECT * FROM digital_human_configs WHERE enabled = 1 ORDER BY updated_at DESC LIMIT 1").get() ||
    db.prepare("SELECT * FROM digital_human_configs ORDER BY updated_at DESC LIMIT 1").get();
  return row ? toConfig(row) : null;
}

export function listDigitalHumanConfigs() {
  return getDb()
    .prepare("SELECT * FROM digital_human_configs ORDER BY enabled DESC, updated_at DESC")
    .all()
    .map(toConfig);
}

export function updateDigitalHumanConfig(input = {}) {
  const db = getDb();
  const active = input.id
    ? db.prepare("SELECT * FROM digital_human_configs WHERE id = ?").get(String(input.id))
    : null;
  const base = active ? toConfig(active) : getActiveDigitalHumanConfig() || {};
  const id = stringOr(input.id, base.id || `dh_${Date.now()}`);

  if (input.enabled === true) {
    db.prepare("UPDATE digital_human_configs SET enabled = 0").run();
  }

  const next = {
    id,
    name: stringOr(input.name, base.name),
    avatar_id: stringOr(input.avatarId, base.avatarId),
    vcn: stringOr(input.vcn, base.vcn),
    character_asset: stringOr(input.characterAsset, base.characterAsset),
    appearance: stringOr(input.appearance, base.appearance),
    outfit: stringOr(input.outfit, base.outfit),
    theme: stringOr(input.theme, base.theme),
    voice_id: stringOr(input.voiceId, base.voiceId),
    speech_rate: numberOr(input.speechRate, base.speechRate ?? 1),
    welcome_text: stringOr(input.welcomeText, base.welcomeText),
    emotion_style: stringOr(input.emotionStyle, base.emotionStyle),
    service_status: normalizeServiceStatus(input.serviceStatus || base.serviceStatus),
    enabled: (input.enabled ?? base.enabled) ? 1 : 0,
    updated_at: new Date().toISOString()
  };

  db.prepare(
    `INSERT INTO digital_human_configs
       (id, name, avatar_id, vcn, character_asset, appearance, outfit, theme, voice_id,
        speech_rate, welcome_text, emotion_style, service_status, enabled, updated_at)
     VALUES
       (@id, @name, @avatar_id, @vcn, @character_asset, @appearance, @outfit, @theme, @voice_id,
        @speech_rate, @welcome_text, @emotion_style, @service_status, @enabled, @updated_at)
     ON CONFLICT(id) DO UPDATE SET
       name = @name, avatar_id = @avatar_id, vcn = @vcn, character_asset = @character_asset,
       appearance = @appearance, outfit = @outfit, theme = @theme, voice_id = @voice_id,
       speech_rate = @speech_rate, welcome_text = @welcome_text, emotion_style = @emotion_style,
       service_status = @service_status, enabled = @enabled, updated_at = @updated_at`
  ).run(next);

  return toConfig(db.prepare("SELECT * FROM digital_human_configs WHERE id = ?").get(id));
}

const labelMap = {
  路线推荐: { expression: "smile", action: "point", state: "guiding", ttsEmotion: "happy" },
  拒答: { expression: "apology", action: "nod", state: "finished", ttsEmotion: "sorry" },
  情感安抚: { expression: "thanks", action: "nod", state: "speaking", ttsEmotion: "gentle" },
  闲聊: { expression: "smile", action: "wave", state: "speaking", ttsEmotion: "happy" },
  事实问答: { expression: "calm", action: "nod", state: "speaking", ttsEmotion: "neutral" }
};

const emotionMap = {
  微笑: { expression: "smile", action: "point", state: "guiding", ttsEmotion: "happy" },
  抱歉: { expression: "apology", action: "nod", state: "finished", ttsEmotion: "sorry" },
  安抚: { expression: "thanks", action: "nod", state: "speaking", ttsEmotion: "gentle" },
  平静: { expression: "calm", action: "nod", state: "speaking", ttsEmotion: "neutral" }
};

export function mapAnswerToDigitalHumanState({ label = "", emotion = "", scenario = "" } = {}) {
  if (scenario === "sensitive" || scenario === "no_data" || scenario === "out_of_scope") {
    return { expression: "apology", action: "nod", state: "finished", ttsEmotion: "sorry" };
  }
  return (
    emotionMap[emotion] ||
    labelMap[label] || { expression: "calm", action: "idle", state: "speaking", ttsEmotion: "neutral" }
  );
}

export function preloadDigitalHumanAssets() {
  const active = getActiveDigitalHumanConfig();
  return {
    ok: Boolean(active?.avatarId),
    avatarId: active?.avatarId || "",
    vcn: active?.vcn || "",
    fallback: active?.fallback,
    warmedAt: new Date().toISOString()
  };
}

function stringOr(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback || "";
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeServiceStatus(value) {
  return ["online", "maintenance", "text_only"].includes(value) ? value : "online";
}
