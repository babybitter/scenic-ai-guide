import { randomBytes, randomInt } from "node:crypto";
import { getDb } from "../db/database.mjs";
import { invalidateBehaviorDatasetCache } from "./behaviorAnalytics.mjs";

const ATTRACTIONS = [
  "灵山胜境",
  "灵山大佛",
  "九龙灌浴",
  "灵山梵宫",
  "五印坛城",
  "祥符禅寺",
  "菩提大道",
  "佛教文化博览馆"
];

const ROUTES = [
  {
    id: "quick_30",
    name: "30分钟核心打卡路线",
    type: "quick",
    minutes: 30,
    nodes: ["gate_south", "zhaobi", "jiulong", "exit"],
    tags: ["short", "photo", "landmark"]
  },
  {
    id: "one_hour_core",
    name: "1小时速览路线",
    type: "one_hour",
    minutes: 60,
    nodes: ["gate_south", "zhaobi", "wuzhi_gate", "jiulong", "buddha", "exit"],
    tags: ["short", "landmark", "classic"]
  },
  {
    id: "classic_150",
    name: "2-3小时经典路线",
    type: "classic",
    minutes: 150,
    nodes: ["gate_south", "zhaobi", "puti_road", "jiulong", "buddha", "fangong", "exit"],
    tags: ["classic", "show", "buddhist", "art"]
  },
  {
    id: "culture_half_day",
    name: "半日深度文化路线",
    type: "half_day_culture",
    minutes: 360,
    nodes: ["gate_south", "xiangfu", "museum", "buddha", "fangong", "wuyin", "exit"],
    tags: ["history", "culture", "buddhist", "deep"]
  },
  {
    id: "family_light",
    name: "亲子轻松路线",
    type: "family",
    minutes: 240,
    nodes: ["gate_south", "jiulong", "baizi", "fangong", "wuyin", "exit"],
    tags: ["family", "easy", "show", "indoor"]
  },
  {
    id: "buddhist_culture",
    name: "佛教文化深度路线",
    type: "buddhist",
    minutes: 300,
    nodes: ["gate_south", "fozu_tan", "xiangfu", "buddha", "museum", "wuyin", "exit"],
    tags: ["buddhist", "culture", "history", "deep"]
  },
  {
    id: "photo_checkin",
    name: "摄影打卡路线",
    type: "photo",
    minutes: 180,
    nodes: ["gate_south", "zhaobi", "jiulong", "ashoka", "buddha", "fangong", "exit"],
    tags: ["photo", "landmark", "nature"]
  }
];

const CONVERSATION_SCENARIOS = [
  {
    question: "灵山大佛一共有多高？",
    answer: "灵山大佛佛体高88米，其中佛像主体79米、莲花瓣9米，是灵山胜境的核心地标。",
    intent: "事实问答",
    emotion: "满意",
    rating: 5,
    vote: "up",
    comment: "大佛高度和组成讲得很清楚，回答很专业。",
    annotation: "correct"
  },
  {
    question: "九龙灌浴今天几点开始表演？",
    answer: "九龙灌浴的场次会随季节和客流调整，请以景区当日公告为准，并建议提前到场。",
    intent: "开放时间",
    emotion: "疑惑",
    rating: 2,
    vote: "down",
    comment: "演出时间不清楚，希望直接展示九龙灌浴当天的准确场次。",
    annotation: "needs_knowledge"
  },
  {
    question: "带老人游览，推荐一条轻松一点的路线。",
    answer: "建议选择南门、九龙灌浴、梵宫、五印坛城的平缓路线，减少登高并预留休息时间。",
    intent: "路线推荐",
    emotion: "平静",
    rating: 2,
    vote: "down",
    comment: "路线还是太长，老人走不动，希望增加接驳车和休息点提示。",
    annotation: "wrong"
  },
  {
    question: "门票包含梵宫和九龙灌浴吗？",
    answer: "常规景区门票通常覆盖主要景点，特殊演出或活动以当天票务说明为准。",
    intent: "票务咨询",
    emotion: "疑惑",
    rating: 3,
    vote: "",
    comment: "门票价格和收费项目可以再写得更具体一些。",
    annotation: "needs_knowledge"
  },
  {
    question: "灵山梵宫最值得看的是什么？",
    answer: "梵宫以华藏塔、穹顶艺术、东阳木雕和大型文化演出著称，适合安排约45分钟参观。",
    intent: "景点讲解",
    emotion: "微笑",
    rating: 5,
    vote: "up",
    comment: "梵宫亮点介绍完整，讲解节奏也很好。",
    annotation: "correct"
  },
  {
    question: "五印坛城适合拍照吗？",
    answer: "五印坛城建筑色彩鲜明，外广场和回廊都是热门机位，建议避开正午强光。",
    intent: "游览建议",
    emotion: "期待",
    rating: 4,
    vote: "up",
    comment: "拍照机位建议很实用，希望再增加最佳时间提示。",
    annotation: "correct"
  },
  {
    question: "祥符禅寺有什么历史故事？",
    answer: "祥符禅寺历史悠久，是灵山佛教文化脉络中的重要节点，适合结合碑刻与殿堂参观。",
    intent: "文化讲解",
    emotion: "平静",
    rating: 4,
    vote: "up",
    comment: "历史文化介绍易懂，内容很有帮助。",
    annotation: "correct"
  },
  {
    question: "轮椅游客去大佛脚下方便吗？",
    answer: "景区设有无障碍通道，但部分区域可能需要绕行，建议入园后向服务台确认实时路线。",
    intent: "无障碍服务",
    emotion: "抱歉",
    rating: 1,
    vote: "down",
    comment: "无障碍路线回答不准确，缺少电梯位置和坡道入口。",
    annotation: "needs_knowledge"
  },
  {
    question: "从停车场到南门怎么走？",
    answer: "可按照停车场导视步行前往南门，也可关注现场接驳服务，客流高峰建议预留时间。",
    intent: "交通咨询",
    emotion: "平静",
    rating: 3,
    vote: "",
    comment: "交通说明基本够用，如果能显示预计步行时间会更好。",
    annotation: "correct"
  },
  {
    question: "景区里有哪些适合亲子的餐饮？",
    answer: "梵宫、五印坛城周边设有餐饮服务点，亲子游客可优先选择清淡套餐并错峰用餐。",
    intent: "餐饮服务",
    emotion: "满意",
    rating: 5,
    vote: "up",
    comment: "餐饮建议贴合亲子需求，推荐得很细致。",
    annotation: "correct"
  },
  {
    question: "数字人讲解可以调慢一点吗？",
    answer: "可以在形象与音色设置中调整语速，也可以直接告诉我希望采用较慢的讲解速度。",
    intent: "功能咨询",
    emotion: "疑惑",
    rating: 2,
    vote: "down",
    comment: "讲解语速偏快，有些内容听不懂，希望记住我的语速偏好。",
    annotation: "wrong"
  },
  {
    question: "景区今天几点停止入园？",
    answer: "停止入园时间可能因季节、节假日调整，请以景区当天公告和售票页面为准。",
    intent: "开放时间",
    emotion: "平静",
    rating: 4,
    vote: "up",
    comment: "开放时间提醒比较稳妥，希望能同步当天公告。",
    annotation: "needs_knowledge"
  }
];

export function generateDemoData() {
  const db = getDb();
  const generatedAt = new Date().toISOString();
  const batchId = `demo_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const payload = buildBatch({ batchId, generatedAt });

  const insertSession = db.prepare(
    `INSERT INTO visitor_sessions
       (id, started_at, ended_at, channel, satisfaction_score, message_count)
     VALUES
       (@id, @started_at, @ended_at, @channel, @satisfaction_score, @message_count)`
  );
  const insertMessage = db.prepare(
    `INSERT INTO messages
       (id, session_id, role, content, intent_label, emotion_label, latency_ms, created_at)
     VALUES
       (@id, @session_id, @role, @content, @intent_label, @emotion_label, @latency_ms, @created_at)`
  );
  const insertFeedback = db.prepare(
    `INSERT INTO feedback
       (id, session_id, message_id, rating, vote, emotion, comment, created_at)
     VALUES
       (@id, @session_id, @message_id, @rating, @vote, @emotion, @comment, @created_at)`
  );
  const insertBehavior = db.prepare(
    `INSERT INTO tourist_behavior
       (id, tourist_id, age, gender, attraction_name, visit_date, stay_duration,
        ticket_cost, food_cost, shopping_cost, transport_cost, entertainment_cost,
        total_cost, group_size, satisfaction)
     VALUES
       (@id, @tourist_id, @age, @gender, @attraction_name, @visit_date, @stay_duration,
        @ticket_cost, @food_cost, @shopping_cost, @transport_cost, @entertainment_cost,
        @total_cost, @group_size, @satisfaction)`
  );
  const insertRoute = db.prepare(
    `INSERT INTO route_selections
       (id, session_id, route_id, route_name, route_type, duration_minutes, node_ids, tags, preferences, created_at)
     VALUES
       (@id, @session_id, @route_id, @route_name, @route_type, @duration_minutes, @node_ids, @tags, @preferences, @created_at)`
  );
  const insertAnnotation = db.prepare(
    `INSERT INTO message_annotations
       (message_id, label, note, created_at, updated_at)
     VALUES
       (@message_id, @label, @note, @created_at, @updated_at)`
  );
  const clearPreviousDemoRows = [
    db.prepare("DELETE FROM message_annotations WHERE message_id LIKE 'demo\\_%' ESCAPE '\\'"),
    db.prepare("DELETE FROM feedback WHERE id LIKE 'demo\\_%' ESCAPE '\\'"),
    db.prepare("DELETE FROM messages WHERE id LIKE 'demo\\_%' ESCAPE '\\'"),
    db.prepare("DELETE FROM route_selections WHERE id LIKE 'demo\\_%' ESCAPE '\\'"),
    db.prepare("DELETE FROM visitor_sessions WHERE id LIKE 'demo\\_%' ESCAPE '\\'"),
    db.prepare("DELETE FROM tourist_behavior WHERE id LIKE 'demo\\_%' ESCAPE '\\'")
  ];

  const writeBatch = db.transaction((data) => {
    // A new click replaces only rows owned by this feature. Real visitor and
    // imported analytics data never use the demo_ prefix and remain untouched.
    for (const statement of clearPreviousDemoRows) statement.run();
    for (const row of data.sessions) insertSession.run(row);
    for (const row of data.messages) insertMessage.run(row);
    for (const row of data.feedback) insertFeedback.run(row);
    for (const row of data.behavior) insertBehavior.run(row);
    for (const row of data.routes) insertRoute.run(row);
    for (const row of data.annotations) insertAnnotation.run(row);
  });

  writeBatch(payload);
  invalidateBehaviorDatasetCache();

  const counts = {
    visitorSessions: payload.sessions.length,
    messages: payload.messages.length,
    feedback: payload.feedback.length,
    touristBehavior: payload.behavior.length,
    routeSelections: payload.routes.length,
    messageAnnotations: payload.annotations.length,
    total: 0
  };
  counts.total = Object.entries(counts)
    .filter(([key]) => key !== "total")
    .reduce((sum, [, value]) => sum + value, 0);

  return { batchId, generatedAt, counts };
}

function buildBatch({ batchId, generatedAt }) {
  const now = new Date(generatedAt).getTime();
  const sessionCount = randomInt(36, 45);
  const behaviorCount = randomInt(240, 281);
  const scenarioOrder = shuffle(CONVERSATION_SCENARIOS);
  const routeOrder = shuffle(ROUTES);
  const sessions = [];
  const messages = [];
  const feedback = [];
  const routes = [];
  const annotations = [];

  for (let index = 0; index < sessionCount; index += 1) {
    const scenario = scenarioOrder[index % scenarioOrder.length];
    const route = routeOrder[index % routeOrder.length];
    const sessionId = `${batchId}_session_${index + 1}`;
    const startOffsetMinutes = randomInt(5, 14 * 24 * 60);
    const startedAt = new Date(now - startOffsetMinutes * 60_000);
    const userMessageId = `${batchId}_message_${index + 1}_user`;
    const assistantMessageId = `${batchId}_message_${index + 1}_assistant`;
    const sessionMessages = [
      {
        id: userMessageId,
        session_id: sessionId,
        role: "user",
        content: scenario.question,
        intent_label: scenario.intent,
        emotion_label: scenario.emotion,
        latency_ms: null,
        created_at: addMinutes(startedAt, 1)
      },
      {
        id: assistantMessageId,
        session_id: sessionId,
        role: "assistant",
        content: scenario.answer,
        intent_label: scenario.intent,
        emotion_label: scenario.rating >= 4 ? "微笑" : scenario.rating <= 2 ? "抱歉" : "平静",
        latency_ms: randomInt(260, 1801),
        created_at: addMinutes(startedAt, 2)
      }
    ];

    if (index % 4 === 0) {
      sessionMessages.push(
        {
          id: `${batchId}_message_${index + 1}_followup_user`,
          session_id: sessionId,
          role: "user",
          content: "还有哪些适合拍照和休息的点位？",
          intent_label: "游览建议",
          emotion_label: "期待",
          latency_ms: null,
          created_at: addMinutes(startedAt, 4)
        },
        {
          id: `${batchId}_message_${index + 1}_followup_assistant`,
          session_id: sessionId,
          role: "assistant",
          content: "可在菩提大道、九龙灌浴广场和梵宫外广场拍照，沿线服务点适合短暂休息。",
          intent_label: "游览建议",
          emotion_label: "微笑",
          latency_ms: randomInt(260, 1801),
          created_at: addMinutes(startedAt, 5)
        }
      );
    }
    messages.push(...sessionMessages);

    const endedAt = new Date(startedAt.getTime() + randomInt(8, 31) * 60_000);
    sessions.push({
      id: sessionId,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      channel: ["web", "mobile", "touchscreen"][index % 3],
      satisfaction_score: scenario.rating,
      message_count: sessionMessages.length
    });

    feedback.push({
      id: `${batchId}_feedback_${index + 1}`,
      session_id: sessionId,
      message_id: assistantMessageId,
      rating: scenario.rating,
      vote: scenario.vote,
      emotion: scenario.emotion,
      comment: scenario.comment,
      created_at: addMinutes(startedAt, sessionMessages.length + 4)
    });

    routes.push({
      id: `${batchId}_route_${index + 1}`,
      session_id: sessionId,
      route_id: route.id,
      route_name: route.name,
      route_type: route.type,
      duration_minutes: route.minutes + randomInt(-10, 11),
      node_ids: JSON.stringify(route.nodes),
      tags: JSON.stringify(route.tags),
      preferences: JSON.stringify({
        groupType: index % 4 === 0 ? "family" : index % 4 === 1 ? "senior" : "friends",
        pace: index % 3 === 0 ? "slow" : "normal",
        interests: route.tags.slice(0, 2)
      }),
      created_at: addMinutes(startedAt, 3)
    });

    annotations.push({
      message_id: assistantMessageId,
      label: scenario.annotation,
      note: annotationNote(scenario.annotation, scenario.intent),
      created_at: addMinutes(startedAt, 6),
      updated_at: addMinutes(startedAt, 6)
    });
  }

  const behavior = Array.from({ length: behaviorCount }, (_, index) => buildBehaviorRow({
    batchId,
    index,
    now
  }));

  return { sessions, messages, feedback, behavior, routes, annotations };
}

function buildBehaviorRow({ batchId, index, now }) {
  const ageCenters = [21, 29, 39, 52, 66];
  const stayDurations = [45, 90, 180, 300];
  const satisfactionScores = [5, 4, 3, 2, 1];
  const ticketCost = 180 + [0, 20, 40][index % 3];
  const foodCost = randomInt(25, 96);
  const shoppingCost = randomInt(10, 181);
  const transportCost = randomInt(10, 81);
  const entertainmentCost = randomInt(0, 121);
  const visitDate = new Date(now - (index % 14) * 86_400_000).toISOString().slice(0, 10);

  return {
    id: `${batchId}_behavior_${index + 1}`,
    tourist_id: `${batchId}_tourist_${index + 1}`,
    age: ageCenters[index % ageCenters.length] + randomInt(-2, 3),
    gender: index % 2 === 0 ? "female" : "male",
    attraction_name: ATTRACTIONS[index % ATTRACTIONS.length],
    visit_date: visitDate,
    stay_duration: stayDurations[index % stayDurations.length] + randomInt(-10, 11),
    ticket_cost: ticketCost,
    food_cost: foodCost,
    shopping_cost: shoppingCost,
    transport_cost: transportCost,
    entertainment_cost: entertainmentCost,
    total_cost: ticketCost + foodCost + shoppingCost + transportCost + entertainmentCost,
    group_size: 1 + (index % 7),
    satisfaction: satisfactionScores[index % satisfactionScores.length]
  };
}

function annotationNote(label, intent) {
  if (label === "correct") return `${intent}回答已核验，可作为优质讲解样例。`;
  if (label === "wrong") return `${intent}回答需要复核，并优化个性化条件匹配。`;
  return `${intent}缺少实时或精确数据，建议补充知识库与当天公告来源。`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000).toISOString();
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
