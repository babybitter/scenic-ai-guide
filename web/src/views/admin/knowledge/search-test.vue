<!--
  检索与问答测试：知识检索预览（混合 / 关键词）与问答测试（调用问答接口）。
-->
<template>
  <div class="kn-search-test">
    <ElRow :gutter="16">
      <!-- 知识检索预览 -->
      <ElCol :xs="24" :md="12">
        <ElCard shadow="never" class="section-card">
          <template #header>
            <span class="section-title">知识检索预览</span>
          </template>
          <div class="query-bar">
            <ElInput
              v-model="searchQuery"
              placeholder="输入检索内容，回车检索"
              clearable
              @keyup.enter="handleSearch"
            />
            <ElSelect v-model="searchMode" class="mode-select">
              <ElOption label="混合检索" value="hybrid" />
              <ElOption label="关键词检索" value="keyword" />
            </ElSelect>
            <ElButton type="primary" :loading="searching" @click="handleSearch">
              <ElIcon><Search /></ElIcon>
              <span>检索</span>
            </ElButton>
          </div>

          <div v-loading="searching" class="result-area">
            <ElEmpty v-if="!searchResults.length" description="暂无检索结果" />
            <ElScrollbar v-else class="result-scroll">
              <ElCard
                v-for="(hit, i) in searchResults"
                :key="hit.id || i"
                shadow="hover"
                class="hit-card"
              >
                <div class="hit-head">
                  <span class="hit-title">{{ hit.title || hit.scenicSpotName || hit.documentName || '未命名结果' }}</span>
                  <ElTag v-if="hit.score !== undefined" size="small" type="success" effect="light">
                    {{ hit.score.toFixed(3) }}
                  </ElTag>
                </div>
                <p v-if="hit.scenicSpotName || hit.documentName" class="hit-meta">
                  {{ [hit.scenicSpotName, hit.documentName].filter(Boolean).join(' · ') }}
                </p>
                <p class="hit-content">{{ hit.content }}</p>
              </ElCard>
            </ElScrollbar>
          </div>
        </ElCard>
      </ElCol>

      <!-- 问答测试 -->
      <ElCol :xs="24" :md="12">
        <ElCard shadow="never" class="section-card">
          <template #header>
            <span class="section-title">问答测试</span>
          </template>
          <div class="query-bar">
            <ElInput
              v-model="question"
              placeholder="输入问题，回车提问"
              clearable
              @keyup.enter="handleAsk"
            />
            <ElButton type="primary" :loading="asking" @click="handleAsk">
              <ElIcon><ChatDotRound /></ElIcon>
              <span>提问</span>
            </ElButton>
          </div>

          <div v-loading="asking" class="result-area">
            <ElEmpty v-if="!answer" description="暂无问答结果" />
            <div v-else class="answer-block">
              <div class="answer-head">
                <ElTag v-if="answer.label" type="info" effect="light">{{ answer.label }}</ElTag>
                <ElTag v-if="answer.scenario" effect="plain">{{ answer.scenario }}</ElTag>
                <span v-if="answer.latency?.totalMs !== undefined" class="latency">
                  响应 {{ answer.latency.totalMs }} ms
                </span>
              </div>
              <p class="answer-text">{{ answer.answer }}</p>
              <div v-if="answer.sources?.length" class="sources">
                <p class="sources-label">来源：</p>
                <ElTag
                  v-for="(src, i) in answer.sources"
                  :key="i"
                  size="small"
                  class="source-tag"
                >
                  {{ src.sectionTitle || src.scenicSpotName || src.documentName || '未知来源' }}
                </ElTag>
              </div>
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { ChatDotRound, Search } from '@element-plus/icons-vue'
  import { searchKnowledge, type KnowledgeHit } from '@/api/admin'
  import { askQuestion, type ChatAnswer } from '@/api/guide'

  defineOptions({ name: 'KnowledgeSearchTest' })

  // 知识检索
  const searchQuery = ref('')
  const searchMode = ref<'hybrid' | 'keyword'>('hybrid')
  const searching = ref(false)
  const searchResults = ref<KnowledgeHit[]>([])

  async function handleSearch() {
    const query = searchQuery.value.trim()
    if (!query) {
      ElMessage.warning('请输入检索内容')
      return
    }
    searching.value = true
    try {
      const res = await searchKnowledge({ query, mode: searchMode.value })
      searchResults.value = res.results || []
      if (!searchResults.value.length) ElMessage.info('未检索到相关内容')
    } catch {
      ElMessage.error('检索失败')
    } finally {
      searching.value = false
    }
  }

  // 问答测试
  const question = ref('')
  const asking = ref(false)
  const answer = ref<ChatAnswer | null>(null)

  async function handleAsk() {
    const q = question.value.trim()
    if (!q) {
      ElMessage.warning('请输入问题')
      return
    }
    asking.value = true
    try {
      answer.value = await askQuestion({ question: q })
    } catch {
      ElMessage.error('问答请求失败')
    } finally {
      asking.value = false
    }
  }
</script>

<style scoped lang="scss">
  .kn-search-test {
    padding: 12px;
  }

  .section-card {
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
  }

  .query-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;

    .mode-select {
      width: 140px;
      flex: 0 0 auto;
    }
  }

  .result-area {
    min-height: 200px;
  }

  .result-scroll {
    max-height: 460px;
  }

  .hit-card {
    margin-bottom: 10px;
  }

  .hit-head {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .hit-title {
    font-weight: 600;
  }

  .hit-meta {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .hit-content {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .answer-block {
    padding: 4px 2px;
  }

  .answer-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 10px;

    .latency {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .answer-text {
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .sources {
    margin-top: 12px;

    .sources-label {
      margin-bottom: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .source-tag {
      margin: 2px 4px 2px 0;
    }
  }
</style>
