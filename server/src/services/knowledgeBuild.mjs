import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { config } from "../config.mjs";
import { extractDocxText } from "./docx.mjs";

const STRUCTURED_DOC = "灵山胜境 景点结构化数据集.docx";
const GUIDE_DOC = "灵山胜境：历史、文化、景点特色与个性化游览指南.docx";

const structuredFields = [
  "景区名称",
  "景点ID",
  "景点名称",
  "具体位置",
  "建筑/景观参数",
  "核心功能",
  "文化内涵",
  "详细介绍",
  "游玩亮点",
  "演艺/开放信息",
  "备注"
];

const guideHeadings = [
  "景区概况与千年历史渊源",
  "小灵山的佛教缘起",
  "祥符禅寺的千年兴衰",
  "现代灵山胜境的崛起",
  "核心文化内涵",
  "佛教文化的深度传承",
  "传统艺术与现代科技的完美融合",
  "祈福文化的特色体验",
  "世界佛教文化的交流平台",
  "核心景点特色详解",
  "灵山大佛",
  "灵山梵宫",
  "九龙灌浴",
  "五印坛城",
  "祥符禅寺",
  "个性化游览路线推荐",
  "历史文化爱好者路线",
  "自然风光爱好者路线",
  "亲子家庭路线",
  "实用游览贴士",
  "最佳游览时间"
];

export function buildKnowledge({ sourceDir = resolve(process.cwd(), "..", "测试数据-示范景区公开资料包") } = {}) {
  const structuredPath = join(sourceDir, STRUCTURED_DOC);
  const guidePath = join(sourceDir, GUIDE_DOC);

  assertFile(structuredPath);
  assertFile(guidePath);

  const generatedDir = join(config.dataDir, "generated");
  mkdirSync(generatedDir, { recursive: true });

  const structuredText = extractDocxText(structuredPath);
  const guideText = extractDocxText(guidePath);
  const spots = parseStructuredSpots(structuredText);
  const guideSections = parseGuideSections(guideText);
  const chunks = buildChunks(spots, guideSections);

  const documents = [
    {
      id: "doc_structured_lingshan_spots",
      fileName: STRUCTURED_DOC,
      fileType: "docx",
      status: "processed",
      chunkCount: chunks.filter((chunk) => chunk.documentId === "doc_structured_lingshan_spots").length,
      createdAt: new Date().toISOString()
    },
    {
      id: "doc_lingshan_guide",
      fileName: GUIDE_DOC,
      fileType: "docx",
      status: "processed",
      chunkCount: chunks.filter((chunk) => chunk.documentId === "doc_lingshan_guide").length,
      createdAt: new Date().toISOString()
    }
  ];

  const result = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    scope: "灵山胜境，不纳入拈花湾",
    documents,
    spots,
    guideSections,
    chunks
  };

  writeJson(join(generatedDir, "knowledge.json"), result);
  writeJson(join(generatedDir, "scenic-spots.json"), spots);
  writeJson(join(generatedDir, "knowledge-chunks.json"), chunks);
  writeFileSync(join(generatedDir, "structured-source.txt"), structuredText, "utf8");
  writeFileSync(join(generatedDir, "guide-source.txt"), guideText, "utf8");

  return result;
}

export function loadKnowledge() {
  const filePath = join(config.dataDir, "generated", "knowledge.json");
  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function parseStructuredSpots(text) {
  const tableText = text.split("表2：")[0];
  const lineSpots = parseStructuredSpotsByLines(tableText);
  if (lineSpots.length > 0) {
    return lineSpots;
  }

  const normalized = normalizeText(tableText);
  const matches = [...normalized.matchAll(/灵山胜境\s+(LS-\d{3})/g)];
  const spots = [];

  for (let index = 0; index < matches.length; index += 1) {
    const id = matches[index][1];
    const start = matches[index].index;
    const next = matches[index + 1]?.index ?? normalized.indexOf("子表2：", start);
    const end = next === -1 ? normalized.length : next;
    const recordText = normalized.slice(start, end).trim();
    const parsed = parseSpotRecord(id, recordText);
    if (parsed) {
      spots.push(parsed);
    }
  }

  return spots;
}

function parseStructuredSpotsByLines(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const recordStarts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] === "灵山胜境" && /^LS-\d{3}$/.test(lines[index + 1] || "")) {
      recordStarts.push(index);
    }
  }

  const spots = [];

  for (let startIndex = 0; startIndex < recordStarts.length; startIndex += 1) {
    const start = recordStarts[startIndex];
    const end = recordStarts[startIndex + 1] ?? lines.length;
    const recordLines = lines.slice(start, end);
    const [
      scenicArea,
      id,
      name,
      locationText,
      parameters,
      coreFunction,
      culture,
      detail,
      highlights,
      openInfo,
      notes
    ] = recordLines;

    if (!id || !name || scenicArea !== "灵山胜境") {
      continue;
    }

    spots.push({
      id,
      scenicArea,
      name,
      aliases: buildAliases(name),
      locationText: locationText || "",
      parameters: parameters || "",
      coreFunction: coreFunction || "",
      culture: culture || "",
      detail: detail || "",
      highlights: highlights || "",
      openInfo: openInfo || "",
      notes: recordLines.slice(10).join("\n") || notes || ""
    });
  }

  return spots;
}

export function parseGuideSections(text) {
  const normalized = normalizeText(text).replace(/\n+/g, "\n");
  const positions = [];

  for (const heading of guideHeadings) {
    const index = normalized.indexOf(heading);
    if (index !== -1) {
      positions.push({ heading, index });
    }
  }

  positions.sort((left, right) => left.index - right.index);

  const sections = [];
  for (let index = 0; index < positions.length; index += 1) {
    const current = positions[index];
    const next = positions[index + 1];
    const content = normalized
      .slice(current.index + current.heading.length, next ? next.index : normalized.length)
      .trim();

    if (content && !containsNianhuaBay(current.heading, content)) {
      sections.push({
        id: `guide_${String(sections.length + 1).padStart(2, "0")}`,
        title: current.heading,
        content,
        keywords: extractKeywords(`${current.heading} ${content}`)
      });
    }
  }

  if (sections.length === 0 && normalized) {
    sections.push({
      id: "guide_01",
      title: "灵山胜境导览指南",
      content: removeNianhuaBayBlocks(normalized),
      keywords: extractKeywords(normalized)
    });
  }

  return sections;
}

export function buildChunks(spots, guideSections) {
  const chunks = [];

  for (const spot of spots) {
    chunks.push({
      id: `chunk_spot_${spot.id}`,
      documentId: "doc_structured_lingshan_spots",
      scenicSpotId: spot.id,
      title: spot.name,
      content: [
        `${spot.name}位于${spot.locationText}`,
        spot.parameters ? `建筑/景观参数：${spot.parameters}` : "",
        spot.coreFunction ? `核心功能：${spot.coreFunction}` : "",
        spot.culture ? `文化内涵：${spot.culture}` : "",
        spot.detail ? `详细介绍：${spot.detail}` : "",
        spot.highlights ? `游玩亮点：${spot.highlights}` : "",
        spot.openInfo ? `演艺/开放信息：${spot.openInfo}` : "",
        spot.notes ? `备注：${spot.notes}` : ""
      ]
        .filter(Boolean)
        .join("\n"),
      keywords: extractKeywords(`${spot.name} ${spot.aliases.join(" ")} ${spot.detail} ${spot.highlights}`),
      source: STRUCTURED_DOC
    });
  }

  for (const section of guideSections) {
    for (const part of splitLongText(section.content, 700)) {
      chunks.push({
        id: `chunk_${section.id}_${String(chunks.length + 1).padStart(3, "0")}`,
        documentId: "doc_lingshan_guide",
        scenicSpotId: matchSpotId(section.title, part, spots),
        title: section.title,
        content: part,
        keywords: section.keywords,
        source: GUIDE_DOC
      });
    }
  }

  return chunks;
}

function parseSpotRecord(id, recordText) {
  const afterId = recordText.slice(recordText.indexOf(id) + id.length).trim();
  const nextIdIndex = afterId.search(/LS-\d{3}|NH-\d{3}/);
  const safeText = nextIdIndex === -1 ? afterId : afterId.slice(0, nextIdIndex);
  const markerPositions = structuredFields
    .slice(3)
    .map((field) => ({ field, index: safeText.indexOf(field) }))
    .filter((item) => item.index !== -1)
    .sort((left, right) => left.index - right.index);

  if (markerPositions.length === 0) {
    return null;
  }

  const nameAndLocation = safeText.slice(0, markerPositions[0].index).trim();
  const name = extractSpotName(nameAndLocation);
  const locationText = nameAndLocation.slice(name.length).trim();
  const values = {};

  for (let index = 0; index < markerPositions.length; index += 1) {
    const current = markerPositions[index];
    const next = markerPositions[index + 1];
    values[current.field] = safeText
      .slice(current.index + current.field.length, next ? next.index : safeText.length)
      .trim();
  }

  return {
    id,
    scenicArea: "灵山胜境",
    name,
    aliases: buildAliases(name),
    locationText,
    parameters: values["建筑/景观参数"] || "",
    coreFunction: values["核心功能"] || "",
    culture: values["文化内涵"] || "",
    detail: values["详细介绍"] || "",
    highlights: values["游玩亮点"] || "",
    openInfo: values["演艺/开放信息"] || "",
    notes: values["备注"] || ""
  };
}

function extractSpotName(text) {
  const knownNames = [
    "灵山大照壁",
    "五明桥",
    "佛足坛",
    "五智门",
    "菩提大道",
    "九龙灌浴",
    "降魔浮雕",
    "阿育王柱",
    "天下第一掌",
    "百子戏弥勒",
    "祥符禅寺",
    "登云道",
    "灵山大佛",
    "灵山梵宫",
    "五印坛城",
    "曼飞龙塔"
  ];

  const found = knownNames.find((name) => text.startsWith(name));
  if (found) {
    return found;
  }

  return text.split(/[，,。；;]/)[0].slice(0, 16);
}

function buildAliases(name) {
  const aliases = new Set([name]);

  if (name === "灵山大佛") {
    aliases.add("大佛");
    aliases.add("佛像");
    aliases.add("抱佛脚");
  }

  if (name === "灵山梵宫") {
    aliases.add("梵宫");
    aliases.add("吉祥颂");
  }

  if (name === "九龙灌浴") {
    aliases.add("九龙喷水");
    aliases.add("花开见佛");
  }

  if (name === "祥符禅寺") {
    aliases.add("古寺");
    aliases.add("禅寺");
  }

  return [...aliases];
}

function matchSpotId(title, content, spots) {
  if (/(路线|贴士|时间|政策|推荐)/.test(title)) {
    return null;
  }

  const text = `${title} ${content}`;
  const spot = spots.find((item) => item.aliases.some((alias) => text.includes(alias)));
  return spot?.id || null;
}

function splitLongText(text, maxLength) {
  const clean = text.trim();
  if (clean.length <= maxLength) {
    return [clean];
  }

  const sentences = clean.split(/(?<=[。！？；])/);
  const parts = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength && current) {
      parts.push(current.trim());
      current = "";
    }
    current += sentence;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function extractKeywords(text) {
  const candidates = [
    "灵山胜境",
    "灵山大佛",
    "九龙灌浴",
    "灵山梵宫",
    "五印坛城",
    "祥符禅寺",
    "佛教文化",
    "祈福",
    "演出",
    "路线",
    "游览路线",
    "历史文化爱好者路线",
    "自然风光爱好者路线",
    "亲子家庭路线",
    "门票",
    "开放",
    "太湖",
    "赵朴初",
    "玄奘",
    "吉祥颂"
  ];

  return candidates.filter((item) => text.includes(item));
}

function containsNianhuaBay(title, content) {
  return `${title} ${content}`.includes("拈花湾");
}

function removeNianhuaBayBlocks(text) {
  return text
    .split("\n")
    .filter((line) => !line.includes("拈花湾"))
    .join("\n")
    .trim();
}

function normalizeText(text) {
  return text.replace(/\r/g, "\n").replace(/\t+/g, "").replace(/[ ]{2,}/g, " ").trim();
}

function assertFile(filePath) {
  if (!existsSync(filePath)) {
    const error = new Error(`Source file not found: ${basename(filePath)}`);
    error.statusCode = 404;
    error.code = "SOURCE_FILE_NOT_FOUND";
    throw error;
  }
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
