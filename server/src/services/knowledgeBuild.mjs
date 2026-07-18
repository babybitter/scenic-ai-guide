import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
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

// Scenic areas covered by the structured dataset. Each area's records start
// with the area name on its own line, followed by a spot-ID line matching the
// area's ID pattern. 拈花湾 was originally excluded; it is now a sub-area.
const SCENIC_AREAS = [
  { area: "灵山胜境", idPattern: /^LS-\d{3}$/ },
  { area: "拈花湾禅意小镇", idPattern: /^NH-\d{3}$/ }
];

function areaForId(id) {
  return SCENIC_AREAS.find((entry) => entry.idPattern.test(id))?.area || null;
}

// Table/section header lines that must not bleed into a spot's trailing fields.
function isTableBoundary(line) {
  return /景点数据集/.test(line) || /^(子表|表\d|景区名称|数据集说明|字段规范|核心构成)/.test(line);
}

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

export function buildKnowledge({ sourceDir = resolve(process.cwd(), "..", "docs", "scenic-materials") } = {}) {
  const structuredPath = join(sourceDir, STRUCTURED_DOC);
  const guidePath = join(sourceDir, GUIDE_DOC);
  const existingKnowledge = loadKnowledge();
  const uploadedDocuments = (existingKnowledge?.documents || []).filter((document) =>
    String(document.id || "").startsWith("upload_")
  );
  const uploadedDocumentIds = new Set(uploadedDocuments.map((document) => document.id));
  const uploadedChunks = (existingKnowledge?.chunks || []).filter((chunk) =>
    uploadedDocumentIds.has(chunk.documentId)
  );

  assertFile(structuredPath);
  assertFile(guidePath);

  const generatedDir = join(config.dataDir, "generated");
  mkdirSync(generatedDir, { recursive: true });

  const structuredText = extractDocxText(structuredPath);
  const guideText = extractDocxText(guidePath);
  const spots = parseStructuredSpots(structuredText);
  const guideSections = parseGuideSections(guideText);
  const baseChunks = buildChunks(spots, guideSections);
  const supplementalDocuments = loadSupplementalMarkdown(sourceDir, spots);
  const chunks = [
    ...baseChunks,
    ...supplementalDocuments.flatMap((document) => document.chunks),
    ...uploadedChunks
  ];

  const documents = [
    {
      id: "doc_structured_lingshan_spots",
      fileName: STRUCTURED_DOC,
      fileType: "docx",
      language: "zh",
      status: "processed",
      chunkCount: chunks.filter((chunk) => chunk.documentId === "doc_structured_lingshan_spots").length,
      createdAt: new Date().toISOString()
    },
    {
      id: "doc_lingshan_guide",
      fileName: GUIDE_DOC,
      fileType: "docx",
      language: "zh",
      status: "processed",
      chunkCount: chunks.filter((chunk) => chunk.documentId === "doc_lingshan_guide").length,
      createdAt: new Date().toISOString()
    },
    ...supplementalDocuments.map(({ chunks: documentChunks, ...document }) => ({
      ...document,
      status: "processed",
      chunkCount: documentChunks.length,
      createdAt: new Date().toISOString()
    })),
    ...uploadedDocuments
  ];

  const result = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    scope: "灵山胜境 拈花湾禅意小镇",
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

export function buildTextDocumentChunks({
  documentId,
  fileName,
  text,
  fileType = extname(fileName).replace(".", "") || "txt",
  spots = []
}) {
  const sections = parseTextSections(text, fileName);
  const language = inferDocumentLanguage(fileName, text);
  const chunks = [];

  for (const section of sections) {
    const parts = splitLongText(section.content, 700);
    for (let index = 0; index < parts.length; index += 1) {
      const content = parts[index];
      chunks.push({
        id: `${documentId}_chunk_${String(chunks.length + 1).padStart(3, "0")}`,
        documentId,
        scenicSpotId: matchLocalizedSpotId(section.title, spots),
        title: section.title,
        content,
        keywords: extractDocumentKeywords(`${section.title} ${content}`, spots),
        source: fileName,
        language,
        fileType
      });
    }
  }

  return chunks;
}

export function indexTextKnowledgeDocument({ documentId, fileName, text, fileType }) {
  const knowledge = loadKnowledge();
  if (!knowledge) {
    const error = new Error("Knowledge base has not been built.");
    error.statusCode = 409;
    error.code = "KNOWLEDGE_NOT_BUILT";
    throw error;
  }

  const chunks = buildTextDocumentChunks({
    documentId,
    fileName,
    text,
    fileType,
    spots: knowledge.spots || []
  });
  if (chunks.length === 0) {
    const error = new Error("The uploaded document does not contain indexable text.");
    error.statusCode = 422;
    error.code = "KNOWLEDGE_DOCUMENT_EMPTY";
    throw error;
  }

  const createdAt = new Date().toISOString();
  const document = {
    id: documentId,
    fileName,
    fileType,
    language: inferDocumentLanguage(fileName, text),
    status: "processed",
    chunkCount: chunks.length,
    createdAt
  };
  const next = {
    ...knowledge,
    generatedAt: createdAt,
    documents: [
      ...(knowledge.documents || []).filter((item) => item.id !== documentId),
      document
    ],
    chunks: [
      ...(knowledge.chunks || []).filter((item) => item.documentId !== documentId),
      ...chunks
    ]
  };
  const generatedDir = join(config.dataDir, "generated");
  mkdirSync(generatedDir, { recursive: true });
  writeJson(join(generatedDir, "knowledge.json"), next);
  writeJson(join(generatedDir, "knowledge-chunks.json"), next.chunks);

  return document;
}

export function parseStructuredSpots(text) {
  const lineSpots = parseStructuredSpotsByLines(text);
  if (lineSpots.length > 0) {
    return lineSpots;
  }

  const normalized = normalizeText(text);
  const matches = [...normalized.matchAll(/(灵山胜境|拈花湾禅意小镇)\s+((?:LS|NH)-\d{3})/g)];
  const spots = [];

  for (let index = 0; index < matches.length; index += 1) {
    const id = matches[index][2];
    const start = matches[index].index;
    const next = matches[index + 1]?.index ?? normalized.length;
    const recordText = normalized.slice(start, next).trim();
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

  const areaNames = new Set(SCENIC_AREAS.map((entry) => entry.area));
  const recordStarts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const idLine = lines[index + 1] || "";
    if (areaNames.has(lines[index]) && areaForId(idLine) === lines[index]) {
      recordStarts.push(index);
    }
  }

  const spots = [];

  for (let startIndex = 0; startIndex < recordStarts.length; startIndex += 1) {
    const start = recordStarts[startIndex];
    let end = recordStarts[startIndex + 1] ?? lines.length;
    // Stop before the next table header so section headers between two tables
    // (e.g. "表2：拈花湾禅意小镇 景点数据集") never leak into the last record.
    for (let cursor = start + 1; cursor < end; cursor += 1) {
      if (isTableBoundary(lines[cursor])) {
        end = cursor;
        break;
      }
    }

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

    if (!id || !name || areaForId(id) !== scenicArea) {
      continue;
    }

    spots.push({
      id,
      scenicArea,
      name,
      aliases: buildAliases(name, scenicArea),
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

    if (content) {
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
      content: normalized,
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
      source: STRUCTURED_DOC,
      language: "zh"
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
        source: GUIDE_DOC,
        language: "zh"
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

  const scenicArea = areaForId(id) || "灵山胜境";

  return {
    id,
    scenicArea,
    name,
    aliases: buildAliases(name, scenicArea),
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
    "曼飞龙塔",
    "拈花广场",
    "梵天花海",
    "香月花街",
    "拈花堂",
    "五灯湖",
    "鹿鸣谷"
  ];

  const found = knownNames.find((name) => text.startsWith(name));
  if (found) {
    return found;
  }

  return text.split(/[，,。；;]/)[0].slice(0, 16);
}

function buildAliases(name, scenicArea) {
  const aliases = new Set([name]);

  // 拈花湾 spots share the area name as an alias so retrieval and scope checks
  // triggered by "拈花湾" / "禅意小镇" reach every sub-spot.
  if (scenicArea === "拈花湾禅意小镇") {
    aliases.add("拈花湾");
    aliases.add("拈花湾禅意小镇");
    aliases.add("禅意小镇");
  }

  const spotAliases = {
    拈花广场: ["拈花微笑", "广场"],
    梵天花海: ["花海"],
    香月花街: ["花街", "禅意商业街"],
    拈花堂: ["禅堂", "抄经"],
    五灯湖: ["灯光秀", "禅行"],
    鹿鸣谷: ["山谷", "鹿鸣"],
    灵山大佛: ["Lingshan Grand Buddha", "Lingshan Buddha", "링산대불", "靈山大佛", "霊山大仏"],
    九龙灌浴: ["Nine Dragons Bathing", "Nine Dragons Bathing show", "구룡관욕", "九龍灌浴"],
    灵山梵宫: ["Lingshan Brahma Palace", "Brahma Palace", "Fan Gong", "링산 범궁", "靈山梵宮", "霊山梵宮"],
    五印坛城: ["Five Mudra Mandala", "Five-Seal Mandala", "오인단성", "五印壇城"],
    祥符禅寺: ["Xiangfu Chan Temple", "Xiangfu Temple", "상부선사", "祥符禪寺", "祥符禅寺"],
    百子戏弥勒: ["Hundred Children Playing with Maitreya", "백자희미륵", "百子戲彌勒", "百子戯弥勒"],
    菩提大道: ["Bodhi Avenue", "보리대도", "菩提大道"],
    曼飞龙塔: ["Manfeilong Pagoda", "만비룡탑", "曼飛龍塔"]
  };
  for (const alias of spotAliases[name] || []) {
    aliases.add(alias);
  }

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

function loadSupplementalMarkdown(sourceDir, spots) {
  return readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const fileName = entry.name;
      const documentId = documentIdForFile(fileName);
      const text = readFileSync(join(sourceDir, fileName), "utf8");
      return {
        id: documentId,
        fileName,
        fileType: "md",
        language: inferDocumentLanguage(fileName, text),
        chunks: buildTextDocumentChunks({
          documentId,
          fileName,
          text,
          fileType: "md",
          spots
        })
      };
    });
}

function parseTextSections(text, fileName) {
  const fallbackTitle = basename(fileName, extname(fileName));
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const sections = [];
  let documentTitle = fallbackTitle;
  let currentTitle = fallbackTitle;
  let content = [];

  const flush = () => {
    const value = content.join("\n").trim();
    if (value) {
      sections.push({ title: currentTitle || documentTitle, content: value });
    }
    content = [];
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (!heading) {
      content.push(line);
      continue;
    }

    flush();
    const level = line.match(/^#+/)?.[0].length || 1;
    const title = heading[1].trim();
    if (level === 1) {
      documentTitle = title;
    }
    currentTitle = title || documentTitle;
  }
  flush();

  if (sections.length === 0) {
    const value = String(text || "").trim();
    return value ? [{ title: documentTitle, content: value }] : [];
  }
  return sections;
}

function matchLocalizedSpotId(title, spots) {
  const normalizedTitle = normalizeSearchText(title);
  const spot = spots.find((item) =>
    (item.aliases || [item.name]).some((alias) => normalizedTitle.includes(normalizeSearchText(alias)))
  );
  return spot?.id || null;
}

function extractDocumentKeywords(text, spots) {
  const normalizedText = normalizeSearchText(text);
  const aliases = spots
    .flatMap((spot) => spot.aliases || [spot.name])
    .filter((alias) => normalizedText.includes(normalizeSearchText(alias)));
  const lexical = String(text || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}-]{1,}/gu) || [];
  return [...new Set([...aliases, ...lexical])].slice(0, 40);
}

function documentIdForFile(fileName) {
  const stem = basename(fileName, extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `doc_${stem || "supplemental"}`;
}

function inferDocumentLanguage(fileName, text = "") {
  const normalized = String(fileName || "").toLowerCase();
  if (/(^|[._-])zh[-_]?tw([._-]|$)/.test(normalized)) return "zh-TW";
  if (/(^|[._-])en([._-]|$)/.test(normalized)) return "en";
  if (/(^|[._-])ko([._-]|$)/.test(normalized)) return "ko";
  if (/(^|[._-])ja([._-]|$)/.test(normalized)) return "ja";

  const content = String(text || "");
  if (/[\uac00-\ud7af]/u.test(content)) return "ko";
  if (/[\u3040-\u30ff]/u.test(content)) return "ja";
  if (/[靈灣點開間覽價線體與於臺龍門歷]/u.test(content)) return "zh-TW";
  const latinCount = (content.match(/[a-z]/giu) || []).length;
  const cjkCount = (content.match(/[\u3400-\u9fff]/gu) || []).length;
  if (latinCount >= 20 && latinCount > cjkCount * 2) return "en";
  if (cjkCount > 0) return "zh";
  return "und";
}

function normalizeSearchText(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
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

  const sentences = clean.split(/(?<=[。！？；])|(?<=[.!?])\s+/);
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
    "吉祥颂",
    "拈花湾",
    "禅意小镇",
    "拈花广场",
    "梵天花海",
    "香月花街",
    "拈花堂",
    "五灯湖",
    "鹿鸣谷",
    "禅行",
    "拈花微笑"
  ];

  return candidates.filter((item) => text.includes(item));
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
