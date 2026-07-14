// AI2-04 & AI2-13: input classification for out-of-scope and sensitive content.
// Deterministic, dependency-free keyword rules. Runs before retrieval so we can
// short-circuit refusals and topic redirects.

const SENSITIVE_RULES = [
  {
    category: "abuse",
    terms: ["傻", "笨蛋", "白痴", "滚", "垃圾", "废物", "去死", "神经病", "shit", "fuck"]
  },
  {
    category: "politics",
    terms: ["政治", "选举", "政府", "领导人", "主席", "总统", "政党", "示威", "游行"]
  },
  {
    category: "medical",
    terms: ["吃什么药", "怎么治疗", "确诊", "病情", "诊断", "药方", "手术", "抑郁症", "怎么减肥"]
  },
  {
    category: "investment",
    terms: ["股票", "基金", "买房", "理财", "炒币", "比特币", "投资", "涨停", "买什么赚钱"]
  },
  {
    category: "danger",
    terms: ["自杀", "炸药", "制毒", "怎么翻墙", "攀爬大佛", "翻越围栏", "危险动作"]
  }
];

// Other well-known scenic areas / cities that are explicitly out of scope.
const OTHER_PLACES = [
  "拈花湾",
  "鼋头渚",
  "灵山小镇",
  "西湖",
  "故宫",
  "黄山",
  "泰山",
  "峨眉山",
  "普陀山",
  "九华山",
  "少林寺",
  "兵马俑",
  "长城",
  "迪士尼",
  "环球影城"
];

// Signals that the question is actually about Lingshan (so mentioning another
// place in a comparison still counts as in-scope).
const LINGSHAN_SIGNALS = [
  "灵山",
  "大佛",
  "九龙灌浴",
  "梵宫",
  "五印坛城",
  "祥符禅寺",
  "胜境",
  "吉祥颂",
  "花开见佛",
  "抱佛脚"
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

export function detectSensitive(question) {
  const text = normalize(question);
  for (const rule of SENSITIVE_RULES) {
    if (rule.terms.some((term) => text.includes(normalize(term)))) {
      return { sensitive: true, category: rule.category };
    }
  }
  return { sensitive: false, category: null };
}

export function detectOutOfScope(question) {
  const text = String(question || "");
  const mentionsLingshan = LINGSHAN_SIGNALS.some((signal) => text.includes(signal));
  if (mentionsLingshan) {
    return { outOfScope: false, place: null };
  }

  const place = OTHER_PLACES.find((item) => text.includes(item));
  if (place) {
    return { outOfScope: true, place };
  }

  return { outOfScope: false, place: null };
}

// AI2 emotional-comfort detection (feeds quality label + digital-human emotion).
const EMOTION_RULES = [
  { emotion: "negative", terms: ["失望", "太差", "不好玩", "坑", "浪费", "生气", "投诉", "退票"] },
  { emotion: "confused", terms: ["看不懂", "不明白", "怎么走", "迷路", "找不到", "搞不清"] },
  { emotion: "tired", terms: ["好累", "走不动", "太热", "累了", "腿疼"] },
  { emotion: "happy", terms: ["太美了", "好看", "喜欢", "开心", "震撼", "值得"] }
];

export function detectEmotion(question) {
  const text = normalize(question);
  for (const rule of EMOTION_RULES) {
    if (rule.terms.some((term) => text.includes(normalize(term)))) {
      return rule.emotion;
    }
  }
  return null;
}
