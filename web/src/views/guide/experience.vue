<!--
  游客导览主页面：数字人 + 智能问答 + 语音交互 + 景点讲解 + 路线推荐 + 满意度反馈。
  数字人由后端回答文本驱动播报，并根据情绪标签变化表情。
-->
<template>
  <div class="guide-page">
    <!-- 左：数字人展示区 -->
    <section class="dh-column">
      <div class="dh-box">
        <DigitalHumanAvatar ref="avatarRef" @ready="onAvatarReady" @error="onAvatarError" />
      </div>
      <div class="dh-caption">
        <ElTag v-if="lastLabel" size="small" effect="dark" round>{{ lastLabel }}</ElTag>
        <span class="dh-tip">{{ statusTip }}</span>
      </div>
    </section>

    <!-- 右：交互区 -->
    <section class="panel-column">
      <ElTabs v-model="activeTab" class="guide-tabs">
        <!-- 对话 -->
        <ElTabPane label="智能问答" name="chat">
          <div class="chat-wrap">
            <ElScrollbar ref="scrollRef" class="chat-body">
              <div v-if="!messages.length" class="chat-empty">
                <ElEmpty description="向 AI 导游提问吧，例如“灵山大佛多高”" />
              </div>
              <div
                v-for="(m, i) in messages"
                :key="i"
                class="msg-row"
                :class="m.role"
              >
                <div class="bubble">
                  <p class="bubble-text">{{ m.content }}</p>
                  <div v-if="m.role === 'assistant' && m.meta" class="bubble-meta">
                    <ElTag v-if="m.meta.label" size="small" type="info" effect="plain">{{ m.meta.label }}</ElTag>
                    <span v-if="m.meta.latency" class="latency">响应 {{ m.meta.latency }}ms</span>
                    <span v-if="m.meta.sources?.length" class="sources">
                      来源：{{ m.meta.sources.map((s) => s.sectionTitle || s.documentName).filter(Boolean).join('、') }}
                    </span>
                  </div>
                </div>
              </div>
            </ElScrollbar>

            <!-- 快捷问题 -->
            <div class="quick-row">
              <ElButton
                v-for="q in quickQuestions"
                :key="q"
                size="small"
                round
                :disabled="asking"
                @click="ask(q)"
              >
                {{ q }}
              </ElButton>
            </div>

            <!-- 输入区 -->
            <div class="input-row">
              <ElInput
                v-model="input"
                placeholder="输入问题，回车发送"
                :disabled="asking"
                @keyup.enter="ask()"
              >
                <template #append>
                  <ElButton :loading="asking" @click="ask()">发送</ElButton>
                </template>
              </ElInput>
              <ElButton
                class="voice-btn"
                :type="recording ? 'danger' : 'primary'"
                :disabled="asking || !voiceSupported"
                circle
                @click="toggleVoice"
              >
                <ElIcon><Microphone /></ElIcon>
              </ElButton>
            </div>

            <!-- 情感快捷反馈 -->
            <div class="feedback-row">
              <span class="fb-label">本次讲解满意吗：</span>
              <ElButton size="small" text type="success" @click="react('up', '开心')">满意</ElButton>
              <ElButton size="small" text type="info" @click="react('down', '失望')">一般</ElButton>
              <ElRate v-model="rating" size="small" @change="onRate" />
            </div>
          </div>
        </ElTabPane>

        <!-- 景点 -->
        <ElTabPane label="景点讲解" name="spots">
          <ElScrollbar class="spots-body" v-loading="spotsLoading">
            <div class="spot-grid">
              <ElCard
                v-for="spot in spots"
                :key="spot.id"
                class="spot-card"
                shadow="hover"
                @click="narrate(spot)"
              >
                <p class="spot-name">{{ spot.name }}</p>
                <p class="spot-loc">{{ spot.locationText }}</p>
                <p class="spot-hl">{{ spot.highlights }}</p>
                <ElButton size="small" type="primary" text>让数字人讲解 →</ElButton>
              </ElCard>
            </div>
          </ElScrollbar>
        </ElTabPane>

        <!-- 路线 -->
        <ElTabPane label="路线推荐" name="routes">
          <div class="routes-body">
            <ElForm inline class="route-form">
              <ElFormItem label="游玩时长">
                <ElSelect v-model="pref.durationMinutes" style="width: 180px">
                  <ElOption label="30 分钟以内 · 核心打卡" :value="30" />
                  <ElOption label="约 1 小时 · 速览" :value="60" />
                  <ElOption label="1-2 小时 · 精选" :value="90" />
                  <ElOption label="2-3 小时 · 经典" :value="150" />
                  <ElOption label="3-4 小时 · 深度" :value="240" />
                  <ElOption label="半日及以上 · 文化深度" :value="360" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="兴趣">
                <ElSelect v-model="pref.interests" multiple collapse-tags style="width: 220px">
                  <ElOption label="历史文化" value="history" />
                  <ElOption label="佛教朝圣" value="buddhist" />
                  <ElOption label="亲子友好" value="parentChild" />
                  <ElOption label="拍照打卡" value="photo" />
                  <ElOption label="演艺体验" value="show" />
                </ElSelect>
              </ElFormItem>
              <ElButton type="primary" :loading="routeLoading" @click="recommend">生成路线</ElButton>
            </ElForm>

            <div v-if="route" class="route-result">
              <h4>{{ route.recommendation.name }}（约 {{ route.recommendation.durationMinutes }} 分钟）</h4>
              <p class="route-reason">{{ route.recommendation.explanation }}</p>
              <ElTimeline>
                <ElTimelineItem
                  v-for="node in route.recommendation.nodes"
                  :key="node.id"
                  :timestamp="`约 ${node.minutes} 分钟`"
                  placement="top"
                >
                  <span class="node-name">{{ node.name }}</span>
                  <ElButton
                    v-if="node.spotId"
                    size="small"
                    text
                    type="primary"
                    @click="narrateNode(node)"
                  >
                    讲解
                  </ElButton>
                </ElTimelineItem>
              </ElTimeline>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, reactive, ref } from 'vue'
  import { Microphone } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import DigitalHumanAvatar from '@/components/digital-human/DigitalHumanAvatar.vue'
  import {
    askQuestion,
    createVisitorSession,
    fetchHistory,
    fetchScenicSpots,
    narrateRouteNode,
    narrateSpot,
    recommendRoute,
    submitFeedback,
    type ChatAnswer,
    type ChatSource,
    type RouteNode,
    type RouteRecommendResult,
    type ScenicSpot
  } from '@/api/guide'

  defineOptions({ name: 'GuideExperience' })

  interface UiMessage {
    role: 'user' | 'assistant'
    content: string
    meta?: { label?: string; latency?: number; sources?: ChatSource[]; emotion?: string }
  }

  const SESSION_KEY = 'scenic_visitor_session'

  const avatarRef = ref<InstanceType<typeof DigitalHumanAvatar> | null>(null)
  const scrollRef = ref<{ setScrollTop: (n: number) => void; wrapRef?: HTMLElement } | null>(null)

  const sessionId = ref('')
  const activeTab = ref('chat')
  const messages = ref<UiMessage[]>([])
  const input = ref('')
  const asking = ref(false)
  const statusTip = ref('数字人接入中…')
  const lastLabel = ref('')
  const rating = ref(0)
  const lastMessageId = ref('')

  const quickQuestions = [
    '灵山大佛有多高',
    '九龙灌浴几点开始',
    '灵山梵宫有什么看点',
    '景区开放时间',
    '推荐一条经典路线'
  ]

  const spots = ref<ScenicSpot[]>([])
  const spotsLoading = ref(false)

  const pref = reactive<{ durationMinutes: number; interests: string[] }>({
    durationMinutes: 150,
    interests: ['history']
  })
  const route = ref<RouteRecommendResult | null>(null)
  const routeLoading = ref(false)

  // ---- 会话初始化 ----
  async function initSession() {
    sessionId.value = localStorage.getItem(SESSION_KEY) || ''
    if (!sessionId.value) {
      try {
        const s = await createVisitorSession()
        sessionId.value = s.id
        localStorage.setItem(SESSION_KEY, s.id)
      } catch {
        sessionId.value = `local_${Date.now()}`
      }
    } else {
      // 恢复历史
      try {
        const history = await fetchHistory(sessionId.value)
        messages.value = (history || []).map((m) => ({ role: m.role, content: m.content }))
        scrollToBottom()
      } catch {
        /* ignore */
      }
    }
  }

  // ---- 数字人事件 ----
  function onAvatarReady() {
    statusTip.value = '数字人已就绪，请开始提问'
  }
  function onAvatarError(msg: string) {
    statusTip.value = msg || '数字人不可用，已切换为文本模式'
  }

  function speak(answer: ChatAnswer) {
    const emotion = answer.digitalHuman?.ttsEmotion || 'neutral'
    avatarRef.value?.speak(answer.answer, emotion)
  }

  // ---- 问答 ----
  async function ask(preset?: string) {
    const question = (preset ?? input.value).trim()
    if (!question || asking.value) return
    // 在用户手势中解锁数字人音频（规避浏览器自动播放限制）
    avatarRef.value?.enableAudio()
    input.value = ''
    messages.value.push({ role: 'user', content: question })
    scrollToBottom()
    asking.value = true
    statusTip.value = '正在查询资料并生成讲解…'
    try {
      const answer = await askQuestion({ question, sessionId: sessionId.value })
      messages.value.push({
        role: 'assistant',
        content: answer.answer,
        meta: {
          label: answer.label,
          latency: answer.latency?.totalMs,
          sources: answer.sources,
          emotion: answer.digitalHuman?.ttsEmotion
        }
      })
      lastLabel.value = answer.label || ''
      statusTip.value = '数字人正在讲解…'
      speak(answer)
    } catch {
      messages.value.push({ role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' })
      ElMessage.error('请求失败，请重试')
    } finally {
      asking.value = false
      scrollToBottom()
    }
  }

  // ---- 景点讲解 ----
  async function loadSpots() {
    if (spots.value.length) return
    spotsLoading.value = true
    try {
      spots.value = await fetchScenicSpots()
    } catch {
      ElMessage.error('景点列表加载失败')
    } finally {
      spotsLoading.value = false
    }
  }

  async function narrate(spot: ScenicSpot) {
    avatarRef.value?.enableAudio()
    activeTab.value = 'chat'
    messages.value.push({ role: 'user', content: `请讲解 ${spot.name}` })
    scrollToBottom()
    statusTip.value = '正在生成讲解词…'
    try {
      const res = await narrateSpot({ spotId: spot.id, spotName: spot.name })
      messages.value.push({ role: 'assistant', content: res.narration, meta: { label: '景点讲解' } })
      avatarRef.value?.speak(res.narration, 'warm')
    } catch {
      ElMessage.error('讲解生成失败')
    } finally {
      scrollToBottom()
    }
  }

  // ---- 路线 ----
  async function recommend() {
    routeLoading.value = true
    try {
      route.value = await recommendRoute({ ...pref })
    } catch {
      ElMessage.error('路线生成失败')
    } finally {
      routeLoading.value = false
    }
  }

  async function narrateNode(node: RouteNode) {
    avatarRef.value?.enableAudio()
    activeTab.value = 'chat'
    statusTip.value = '正在讲解路线节点…'
    try {
      const res = await narrateRouteNode({ nodeId: node.id, spotId: node.spotId || undefined, spotName: node.name })
      messages.value.push({ role: 'assistant', content: res.narration, meta: { label: '路线讲解' } })
      avatarRef.value?.speak(res.narration, 'warm')
      scrollToBottom()
    } catch {
      ElMessage.error('节点讲解失败')
    }
  }

  // ---- 反馈 ----
  async function react(vote: 'up' | 'down', emotion: string) {
    try {
      await submitFeedback({ sessionId: sessionId.value, messageId: lastMessageId.value, vote, emotion })
      ElMessage.success('感谢您的反馈')
      avatarRef.value?.speak(vote === 'up' ? '感谢您的认可，祝您游览愉快！' : '抱歉没能帮到您，我会继续改进。', vote === 'up' ? 'happy' : 'sorry')
    } catch {
      /* ignore */
    }
  }
  async function onRate(value: number) {
    try {
      await submitFeedback({ sessionId: sessionId.value, rating: value })
      ElMessage.success('评分已提交')
    } catch {
      /* ignore */
    }
  }

  // ---- 语音输入（浏览器 Web Speech API）----
  const recording = ref(false)
  const voiceSupported = ref(false)
  let recognition: any = null

  function setupVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    voiceSupported.value = true
    recognition = new SR()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript
      if (transcript) ask(transcript)
    }
    recognition.onend = () => (recording.value = false)
    recognition.onerror = () => {
      recording.value = false
      ElMessage.warning('语音识别失败，请改用文字输入')
    }
  }
  function toggleVoice() {
    if (!recognition) return
    if (recording.value) {
      recognition.stop()
      recording.value = false
    } else {
      try {
        recognition.start()
        recording.value = true
      } catch {
        recording.value = false
      }
    }
  }

  function scrollToBottom() {
    nextTick(() => {
      const wrap = scrollRef.value?.wrapRef
      if (wrap) scrollRef.value?.setScrollTop(wrap.scrollHeight)
    })
  }

  // ---- tab 懒加载 ----
  import { watch } from 'vue'
  watch(activeTab, (tab) => {
    if (tab === 'spots') loadSpots()
  })

  onMounted(() => {
    initSession()
    setupVoice()
  })
</script>

<style scoped lang="scss">
  .guide-page {
    display: flex;
    gap: 16px;
    height: calc(100vh - 130px);
    padding: 12px;
  }

  .dh-column {
    display: flex;
    flex: 0 0 42%;
    flex-direction: column;
    max-width: 520px;
  }

  .dh-box {
    flex: 1;
    min-height: 0;
  }

  .dh-caption {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 4px 0;
  }

  .dh-tip {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .panel-column {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
  }

  .guide-tabs {
    display: flex;
    flex-direction: column;
    height: 100%;

    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  .chat-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .chat-body {
    flex: 1;
    min-height: 0;
    padding: 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
  }

  .chat-empty {
    padding-top: 40px;
  }

  .msg-row {
    display: flex;
    margin-bottom: 12px;

    &.user {
      justify-content: flex-end;
    }
  }

  .bubble {
    max-width: 78%;
    padding: 9px 12px;
    background: var(--el-bg-color);
    border-radius: 10px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  }

  .msg-row.user .bubble {
    color: #fff;
    background: var(--el-color-primary);
  }

  .bubble-text {
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .bubble-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .quick-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 0 6px;
  }

  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .feedback-row {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-top: 8px;
    font-size: 13px;
  }

  .fb-label {
    color: var(--el-text-color-secondary);
  }

  .spots-body,
  .routes-body {
    height: 100%;
  }

  .spot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    padding: 4px;
  }

  .spot-card {
    cursor: pointer;
  }

  .spot-name {
    font-size: 15px;
    font-weight: 600;
  }

  .spot-loc,
  .spot-hl {
    margin-top: 4px;
    overflow: hidden;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .route-result {
    padding: 12px 4px;
  }

  .route-reason {
    margin: 8px 0 14px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .node-name {
    margin-right: 8px;
    font-weight: 500;
  }

  @media (max-width: 900px) {
    .guide-page {
      flex-direction: column;
      height: auto;
    }

    .dh-column {
      flex: none;
      max-width: none;
      height: 46vh;
    }
  }
</style>
