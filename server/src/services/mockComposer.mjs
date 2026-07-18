// Deterministic offline answer composer for the mock LLM provider.
// It turns structured retrieval grounding (meta) into a concise, guide-style
// answer. This keeps the full RAG loop demonstrable without any cloud key.
// AI2-03/04/05/08/09 behaviors are realized here for the mock path; the real
// provider realizes the same behaviors through the system prompt.

const INTENT_PATTERNS = {
  height: /(通高\s*)?\d+(\.\d+)?\s*(米|m|meters?|미터|メートル|公尺)|总高|通高|高度|height|높이|高さ/i,
  ticket: /\d+\s*(元|cny|위안)|成人票|半价|免票|门票|票价|ticket|admission|price|입장권|요금|入場券|料金|門票|票價/i,
  open_time: /\d{1,2}:\d{2}|全天|开放时间|闭馆|opening|closing|last admission|운영 시간|개장|폐장|営業時間|開園|閉園|開放時間/i,
  performance_time: /\d{1,2}:\d{2}|每场|时长|演出|表演|吉祥颂|show|performance|start times?|공연|시작|上演|開始|表演/i,
  highlight: /亮点|特色|看点|体验|不可错过|值得|highlight|important|feature|experience|볼거리|특징|見どころ|特徴|看點|亮點/i,
  history: /玄奘|小灵山|灵鹫山|唐贞观|渊源|历史|始建|history|xuanzang|역사|현장|歴史|歷史|年/i,
  route: /路线|入园|出口|建议|小时|先|再|最后|route|enter|continue|finish|경로|입장|이동|ルート|入園|巡り|路線/i
};

// Structured field labels from the source data that should not surface in a
// natural guide answer.
const FIELD_LABEL = /(建筑\/景观参数|演艺\/开放信息|核心功能|文化内涵|详细介绍|游玩亮点|备注|建築\/景觀參數|表演\/開放資訊|核心功能|文化內涵|詳細介紹|遊玩亮點|備註)[：:]/g;

const COPY = {
  zh: {
    about: (subject) => `关于${subject},`,
    routeIntro: "为您推荐一条游览路线,按顺序游玩更顺畅:",
    routeTail: "沿途我可以在每个节点为您做讲解。",
    noData: (topic) => `抱歉,当前灵山胜境的资料还没有覆盖${topic}的内容,我不能凭空作答。您可以换个问法,或者问我灵山大佛、九龙灌浴、灵山梵宫的介绍、开放时间和游览路线。`,
    outOfScope: (place) => `我是灵山胜境的专属导游,${place}不在我的服务范围内。不过您可以问我灵山大佛、九龙灌浴、灵山梵宫或游览路线。`,
    sensitive: "这个话题不在我的导览服务范围内。我很乐意继续为您介绍灵山胜境的景点、演出和游览路线。",
    hello: "您好,我是灵山胜境 AI 导游。您可以问我灵山大佛有多高、九龙灌浴几点表演、灵山梵宫有什么看点,或者让我推荐游览路线。",
    thanks: "不客气,祝您在灵山胜境游览愉快,有任何导览问题随时问我。",
    chitchat: "我是灵山胜境的导游,擅长景点介绍、演出时间和路线推荐。您想先了解哪个景点?"
  },
  en: {
    about: (subject) => `${subject}: `,
    routeIntro: "Here is a suggested route in an efficient visiting order:",
    routeTail: "I can also explain each stop along the way.",
    noData: (topic) => `Sorry, the current Lingshan knowledge base does not cover ${topic}, so I should not guess. Try asking about the Grand Buddha, Nine Dragons Bathing, the Brahma Palace, opening information, or suggested routes.`,
    outOfScope: (place) => `I am the dedicated guide for Lingshan Grand Scenic Area, so ${place} is outside my service scope. I can help with Lingshan attractions, performances, and routes.`,
    sensitive: "That topic is outside my visitor-guide service. I can still help with Lingshan attractions, performances, and suggested routes.",
    hello: "Hello, I am the AI guide for Lingshan Grand Scenic Area. Ask about the Grand Buddha, Nine Dragons Bathing, the Brahma Palace, opening information, or a suggested route.",
    thanks: "You are welcome. I hope you enjoy your visit to Lingshan, and you can ask me another guide question at any time.",
    chitchat: "I am the Lingshan visitor guide. I can introduce attractions, check performance information, and suggest a route. What would you like to explore first?"
  },
  ko: {
    about: (subject) => `${subject}에 대해 안내드리면, `,
    routeIntro: "이동하기 편한 순서로 대표 관람 경로를 추천해 드릴게요:",
    routeTail: "원하시면 각 지점의 해설도 이어서 들려드릴 수 있습니다.",
    noData: (topic) => `죄송하지만 현재 링산승경 지식 자료에는 ${topic}에 관한 내용이 없어 추측해서 답할 수 없습니다. 링산대불, 구룡관욕, 링산 범궁, 운영 정보나 추천 경로를 물어보세요.`,
    outOfScope: (place) => `저는 링산승경 전용 가이드이므로 ${place}은 안내 범위 밖입니다. 링산의 명소, 공연과 관람 경로는 도와드릴 수 있습니다.`,
    sensitive: "해당 주제는 관광 안내 서비스 범위 밖입니다. 링산승경의 명소, 공연과 관람 경로에 대해서는 계속 도와드릴 수 있습니다.",
    hello: "안녕하세요. 링산승경 AI 가이드입니다. 링산대불, 구룡관욕, 링산 범궁, 운영 정보 또는 추천 경로를 질문해 주세요.",
    thanks: "별말씀을요. 링산승경에서 즐거운 시간 보내시고, 궁금한 안내가 있으면 언제든 질문해 주세요.",
    chitchat: "저는 링산승경 관광 가이드입니다. 명소 소개, 공연 정보와 관람 경로를 안내할 수 있습니다. 어디부터 알아볼까요?"
  },
  "zh-TW": {
    about: (subject) => `關於${subject}，`,
    routeIntro: "為您推薦一條依序遊覽較順暢的路線：",
    routeTail: "沿途每個節點我也可以繼續為您講解。",
    noData: (topic) => `抱歉，目前靈山勝境知識資料尚未涵蓋${topic}，我不能憑空作答。您可以詢問靈山大佛、九龍灌浴、靈山梵宮、開放資訊或推薦路線。`,
    outOfScope: (place) => `我是靈山勝境專屬導遊，${place}不在服務範圍內。我可以協助介紹靈山景點、表演及遊覽路線。`,
    sensitive: "這個主題不在我的導覽服務範圍內。我仍可協助介紹靈山勝境的景點、表演及遊覽路線。",
    hello: "您好，我是靈山勝境 AI 導遊。您可以詢問靈山大佛、九龍灌浴、靈山梵宮、開放資訊或推薦路線。",
    thanks: "不客氣，祝您在靈山勝境遊覽愉快，有任何導覽問題都可以繼續問我。",
    chitchat: "我是靈山勝境導遊，可以介紹景點、表演時間及推薦路線。您想先了解哪個景點？"
  },
  ja: {
    about: (subject) => `${subject}について、`,
    routeIntro: "移動しやすい順に定番ルートをご案内します:",
    routeTail: "ご希望なら、各スポットでも続けて解説できます。",
    noData: (topic) => `申し訳ありません。現在の霊山勝境ナレッジには${topic}の情報がなく、推測ではお答えできません。霊山大仏、九龍灌浴、霊山梵宮、営業時間、またはおすすめルートについてお尋ねください。`,
    outOfScope: (place) => `私は霊山勝境専属のガイドのため、${place}は案内範囲外です。霊山の見どころ、上演情報、観光ルートはご案内できます。`,
    sensitive: "その話題は観光案内サービスの範囲外です。霊山勝境の見どころ、上演情報、観光ルートについては引き続きご案内できます。",
    hello: "こんにちは。霊山勝境のAIガイドです。霊山大仏、九龍灌浴、霊山梵宮、営業時間、またはおすすめルートについてお尋ねください。",
    thanks: "どういたしまして。霊山勝境で楽しい時間をお過ごしください。ほかのご案内もいつでもお尋ねいただけます。",
    chitchat: "霊山勝境の観光ガイドです。見どころ、上演情報、おすすめルートをご案内できます。どこから知りたいですか？"
  }
};

function copyFor(meta) {
  return COPY[meta.locale] || COPY.zh;
}

function clean(text) {
  return String(text || "")
    .replace(FIELD_LABEL, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  return clean(text)
    .split(/(?<=[。！？；])|(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickSentences(text, pattern, max = 2) {
  const sentences = splitSentences(text);
  const hits = sentences.filter((sentence) => pattern.test(sentence));
  const chosen = (hits.length > 0 ? hits : sentences).slice(0, max);
  const separator = chosen.some((sentence) => /[.!?]$/.test(sentence)) ? " " : "";
  return chosen.join(separator);
}

function primaryIntent(intents = []) {
  const order = ["ticket", "open_time", "performance_time", "height", "route", "highlight", "history"];
  for (const key of order) {
    if (intents.some((intent) => intent.intent === key)) {
      return key;
    }
  }
  return null;
}

function patternFromQuestion(question) {
  const text = String(question || "");
  if (/(nine dragons bathing|구룡관욕|九龍灌浴).*(when|time|start|몇 시|시작|何時|いつ|幾點|開始)|(when|몇 시|何時|幾點).*(nine dragons bathing|구룡관욕|九龍灌浴)/i.test(text)) {
    return /four to five|fixed all-season|exact start|하루 4|고정 시각|정확한 시작|1日4|固定時刻|当日の開始|每日演出 4|全年固定|當日景區/i;
  }
  if (/吉祥颂.*(几点|时间|开始|场次)|几点.*吉祥颂/.test(text)) {
    return /10:35|11:30|14:00|16:00|20分钟|吉祥颂/;
  }
  if (/九龙喷水|九龙灌浴.*看点|花开见佛/.test(text)) {
    return /花开见佛|释迦牟尼|动态景观|太子佛|佛陀诞生|九龙/;
  }
  if (/梵宫.*(好看|看点|特色|亮点)|吉祥颂/.test(text)) {
    return /东阳木雕|琉璃|油画|景泰蓝|玉雕|漆画|佛教艺术|吉祥颂|旋转舞台/;
  }
  if (/钟|钟声|禅钟/.test(text)) {
    return /祥符禅钟|江南第一钟|12\.8吨|钟楼|撞钟/;
  }
  if (/五明/.test(text)) {
    return /声明|因明|内明|医方明|工巧明|五种核心智慧/;
  }
  if (/落成开光/.test(text)) {
    return /1997年11月15日|落成开光/;
  }
  if (/五方五佛|赵朴初/.test(text)) {
    return /赵朴初|五方五佛|东方空缺/;
  }
  return null;
}

function subjectName(meta) {
  return meta.results?.[0]?.title || meta.spotMatches?.[0]?.alias || meta.spotMatches?.[0]?.name || "";
}

function trimTo(text, max) {
  const value = clean(text);
  if (value.length <= max) {
    return value;
  }
  const cut = value.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"));
  return lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : `${cut}…`;
}

function composeGrounded(meta) {
  const results = meta.results || [];
  if (results.length === 0) {
    return composeNoData(meta);
  }

  const intent = primaryIntent(meta.intents);
  const subject = subjectName(meta);
  const top = results[0];
  const pattern = patternFromQuestion(meta.question) || (intent ? INTENT_PATTERNS[intent] : null);

  let core = "";
  if (pattern) {
    for (const item of results.slice(0, 3)) {
      const picked = pickSentences(item.content, pattern, 2);
      if (picked && pattern.test(picked)) {
        core = picked;
        break;
      }
    }
  }
  if (!core) {
    core = pickSentences(top.content, /./, 2);
  }

  const mode = meta.mode || "qa";
  let body;

  if (mode === "explain") {
    // 200-400 字讲解模式:多取几句,给出更完整的讲解。
    const extra = pickSentences(top.content, INTENT_PATTERNS.highlight, 2);
    body = trimTo(`${core}${extra && !core.includes(extra) ? extra : ""}`, 400);
    if (body.length < 200 && results[1]) {
      body = trimTo(`${body}${pickSentences(results[1].content, /./, 2)}`, 400);
    }
  } else {
    // 普通问答 80-180 字。
    body = trimTo(core, 180);
  }

  const opener = subject ? copyFor(meta).about(subject) : "";
  const answer = `${opener}${body}`;
  return trimTo(answer, mode === "explain" ? 400 : 190);
}

function composeRoute(meta) {
  const results = meta.results || [];
  const routeChunk = results.find((item) => /路线|贴士|时间|推荐/.test(item.title)) || results[0];
  const source = routeChunk ? routeChunk.content : "";
  const sentences = splitSentences(source).slice(0, 6);

  const steps = sentences.length > 0
    ? sentences.map((sentence, index) => `${index + 1}. ${trimTo(sentence, 60)}`)
    : fallbackRoute(meta.locale);

  const copy = copyFor(meta);
  return `${copy.routeIntro}\n${steps.join("\n")}\n${copy.routeTail}`;
}

function fallbackRoute(locale) {
  const routes = {
    zh: [
      "1. 从景区入口出发,沿五明桥、菩提大道步行前行。",
      "2. 观看九龙灌浴表演,再前往灵山大佛。",
      "3. 最后参观灵山梵宫与五印坛城。"
    ],
    en: [
      "1. Enter through the south gate and follow Bodhi Avenue.",
      "2. Watch Nine Dragons Bathing, then visit the Grand Buddha.",
      "3. Finish at the Brahma Palace and Five Mudra Mandala."
    ],
    ko: [
      "1. 남문으로 입장해 보리대도를 따라 이동합니다.",
      "2. 구룡관욕을 관람한 뒤 링산대불을 방문합니다.",
      "3. 링산 범궁과 오인단성에서 일정을 마칩니다."
    ],
    "zh-TW": [
      "1. 由南門入園，沿菩提大道前行。",
      "2. 觀賞九龍灌浴，再前往靈山大佛。",
      "3. 最後參觀靈山梵宮及五印壇城。"
    ],
    ja: [
      "1. 南門から入園し、菩提大道を進みます。",
      "2. 九龍灌浴を鑑賞してから霊山大仏へ向かいます。",
      "3. 霊山梵宮と五印壇城で締めくくります。"
    ]
  };
  return routes[locale] || routes.zh;
}

function composeNoData(meta) {
  // Reference the visitor's own question, not a loosely-retrieved spot, so the
  // honest "not covered" reply never appears to be about the wrong thing.
  const topic = meta.question ? `“${trimTo(meta.question, 28)}”` : "this topic";
  return copyFor(meta).noData(topic);
}

function composeOutOfScope(meta) {
  const other = meta.otherPlace ? `“${meta.otherPlace}”` : "that destination";
  return copyFor(meta).outOfScope(other);
}

function composeSensitive(meta) {
  if (meta.locale && meta.locale !== "zh") {
    return copyFor(meta).sensitive;
  }
  const category = meta.sensitiveCategory;
  const map = {
    abuse: "咱们好好聊,我更希望把灵山胜境的美好介绍给您。",
    politics: "这类话题我不太方便讨论。",
    medical: "医疗健康问题请咨询专业医生,我不能提供相关建议。",
    investment: "投资理财这类建议我无法提供,请咨询专业人士。",
    danger: "涉及危险行为的内容我不能提供帮助,请注意安全。"
  };
  const lead = map[category] || "这个话题不在我的服务范围内。";
  return `${lead}我是灵山胜境 AI 导游,很乐意为您介绍景点、演出和游览路线,有需要随时问我。`;
}

function composeNarration(meta) {
  const spot = meta.spot || {};
  const name = spot.name || subjectName(meta) || "这处景点";
  const parts = [
    spot.detail || spot.culture || "",
    spot.highlights ? `游玩亮点:${spot.highlights}` : "",
    spot.openInfo ? `${spot.openInfo}` : ""
  ].filter(Boolean).join("");

  const source = parts || (meta.results?.[0]?.content || "");
  const core = trimTo(clean(source), 360);
  const opener = `各位游客,我们现在来到的是${name}。`;
  const closer = "更多细节,欢迎随时向我提问。";
  return trimTo(`${opener}${core}${closer}`, 400);
}

function composeAccompany(meta) {
  const name = meta.spot?.name || subjectName(meta) || "当前位置";
  const interest = meta.interests?.length ? meta.interests.join("、") : "";
  const base = meta.spot?.highlights || meta.spot?.detail || meta.results?.[0]?.content || "";
  const focus = interest ? `考虑到您对${interest}的兴趣,` : "";
  return trimTo(`您已到达${name}。${focus}${clean(base)}建议放慢脚步细细感受,需要讲解随时叫我。`, 300);
}

function composeChitchat(meta) {
  const question = clean(meta.question);
  const copy = copyFor(meta);
  if (/你好|您好|hi|hello|hey|在吗|在么|안녕|こんにちは|こんばんは/i.test(question)) {
    return copy.hello;
  }
  if (/谢谢|感谢|多谢|thank|감사|ありがとう|謝謝/i.test(question)) {
    return copy.thanks;
  }
  return copy.chitchat;
}

export function composeMockAnswer(meta) {
  switch (meta.scenario) {
    case "sensitive":
      return composeSensitive(meta);
    case "out_of_scope":
      return composeOutOfScope(meta);
    case "no_data":
      return composeNoData(meta);
    case "narration":
      return composeNarration(meta);
    case "accompany":
      return composeAccompany(meta);
    case "chitchat":
      return composeChitchat(meta);
    case "grounded":
    default:
      if (meta.mode === "route") {
        return composeRoute(meta);
      }
      return composeGrounded(meta);
  }
}
