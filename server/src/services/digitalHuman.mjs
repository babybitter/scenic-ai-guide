// DH5/C9: Live2D digital-human configuration and state mapping.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const configs = new Map();
const publicDir = resolve(process.cwd(), "web", "public");

const defaultConfig = {
  id: "dh_default_lingshan",
  name: "灵灵",
  characterAsset: "/sentio/characters/free/Kei/Kei.model3.json",
  appearance: "live2d-kei-guide",
  outfit: "awesome-digital-human-live2d",
  theme: "lingshan-teal-gold",
  voiceId: "guide_female",
  speechRate: 1,
  welcomeText: "您好，我是灵山胜境 AI 导游，可以为您讲解景点、规划路线并回答游览问题。",
  emotionStyle: "warm",
  serviceStatus: "online",
  enabled: true,
  fallback: {
    type: "live2d-kei",
    reason: "Loaded from awesome-digital-human-live2d local assets."
  },
  preloaded: true,
  updatedAt: new Date().toISOString()
};

configs.set(defaultConfig.id, defaultConfig);

const labelMap = {
  "路线推荐": { expression: "smile", action: "point", state: "guiding" },
  "拒答": { expression: "apology", action: "nod", state: "finished" },
  "情感安抚": { expression: "thanks", action: "nod", state: "speaking" },
  "闲聊": { expression: "smile", action: "wave", state: "speaking" },
  "事实问答": { expression: "calm", action: "nod", state: "speaking" }
};

const emotionMap = {
  "微笑": { expression: "smile", action: "point", state: "guiding" },
  "抱歉": { expression: "apology", action: "nod", state: "finished" },
  "安抚": { expression: "thanks", action: "nod", state: "speaking" },
  "平静": { expression: "calm", action: "nod", state: "speaking" }
};

export function getActiveDigitalHumanConfig() {
  return [...configs.values()].find((item) => item.enabled) || defaultConfig;
}

export function listDigitalHumanConfigs() {
  return [...configs.values()];
}

export function updateDigitalHumanConfig(input = {}) {
  const active = input.id ? configs.get(String(input.id)) || getActiveDigitalHumanConfig() : getActiveDigitalHumanConfig();
  const id = stringOr(input.id, active.id || `dh_${Date.now()}`);
  if (input.enabled === true) {
    for (const item of configs.values()) {
      configs.set(item.id, { ...item, enabled: false });
    }
  }
  const next = {
    ...active,
    id,
    name: stringOr(input.name, active.name),
    characterAsset: stringOr(input.characterAsset, active.characterAsset),
    appearance: stringOr(input.appearance, active.appearance),
    outfit: stringOr(input.outfit, active.outfit),
    theme: stringOr(input.theme, active.theme),
    voiceId: stringOr(input.voiceId, active.voiceId),
    speechRate: numberOr(input.speechRate, active.speechRate),
    welcomeText: stringOr(input.welcomeText, active.welcomeText),
    emotionStyle: stringOr(input.emotionStyle, active.emotionStyle),
    serviceStatus: normalizeServiceStatus(input.serviceStatus || active.serviceStatus),
    enabled: input.enabled ?? active.enabled,
    updatedAt: new Date().toISOString()
  };
  next.assetAvailable = assetAvailable(next.characterAsset);
  next.fallback = next.assetAvailable
    ? next.fallback
    : { type: "static", reason: "Character asset is missing; visitor client should keep text and audio fallback." };
  configs.set(next.id, next);
  return next;
}

export function mapAnswerToDigitalHumanState({ label = "", emotion = "", scenario = "" } = {}) {
  if (scenario === "sensitive" || scenario === "no_data" || scenario === "out_of_scope") {
    return { expression: "apology", action: "nod", state: "finished" };
  }
  return emotionMap[emotion] || labelMap[label] || { expression: "calm", action: "idle", state: "speaking" };
}

export function preloadDigitalHumanAssets() {
  const active = getActiveDigitalHumanConfig();
  return {
    ok: true,
    asset: active.characterAsset,
    fallback: active.fallback,
    warmedAt: new Date().toISOString()
  };
}

function stringOr(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeServiceStatus(value) {
  return ["online", "maintenance", "text_only"].includes(value) ? value : "online";
}

function assetAvailable(asset = "") {
  if (!asset || /^https?:\/\//.test(asset)) {
    return true;
  }
  const relative = String(asset).replace(/^\/+/, "");
  return existsSync(join(publicDir, relative));
}
