<!--
  会话记录：会话列表 + 会话详情（聊天气泡）+ 消息标注 + 生成知识草稿。
-->
<template>
  <div class="conversations-page">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">会话记录</span>
          <ElTag type="info" effect="plain" round>共 {{ list.length }} 条</ElTag>
        </div>
        <div class="toolbar-right">
          <span class="switch-label">只看低满意度</span>
          <ElSwitch v-model="lowOnly" @change="loadList" />
          <ElButton :icon="Refresh" @click="loadList">刷新</ElButton>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never" class="table-card">
      <ElTable
        v-loading="loading"
        :data="list"
        border
        stripe
        highlight-current-row
        @row-click="openDetail"
      >
        <ElTableColumn prop="sessionId" label="会话 ID" min-width="180" show-overflow-tooltip />
        <ElTableColumn label="开始时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="messageCount" label="消息数" width="90" align="center" />
        <ElTableColumn prop="userQuestionCount" label="提问数" width="90" align="center" />
        <ElTableColumn label="平均评分" width="120" align="center">
          <template #default="{ row }">
            <ElRate
              v-if="row.averageRating !== null"
              :model-value="row.averageRating"
              disabled
              :max="5"
              size="small"
            />
            <span v-else class="muted">暂无</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="mainFocus" label="关注点" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="满意度" width="110" align="center">
          <template #default="{ row }">
            <ElTag :type="row.lowSatisfaction ? 'danger' : 'success'" effect="light">
              {{ row.lowSatisfaction ? '低满意度' : '正常' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="feedbackCount" label="反馈数" width="90" align="center" />
        <ElTableColumn label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click.stop="openDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 会话详情 -->
    <ElDialog
      v-model="dialogVisible"
      title="会话详情"
      width="760px"
      top="6vh"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-wrap">
        <template v-if="detail">
          <ElDescriptions :column="3" size="small" border class="detail-summary">
            <ElDescriptionsItem label="会话 ID">{{ detail.sessionId }}</ElDescriptionsItem>
            <ElDescriptionsItem label="消息数">{{ detail.summary?.messageCount ?? '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="关注点">{{ detail.summary?.mainFocus || '-' }}</ElDescriptionsItem>
          </ElDescriptions>

          <ElScrollbar class="chat-body" height="52vh">
            <ElEmpty v-if="!detail.messages?.length" description="暂无消息" />
            <div
              v-for="msg in detail.messages"
              :key="msg.id"
              class="msg-row"
              :class="msg.role"
            >
              <div class="bubble">
                <p class="bubble-text">{{ msg.content }}</p>

                <div class="bubble-meta">
                  <ElTag v-if="msg.intentLabel" size="small" type="info" effect="plain">
                    意图：{{ msg.intentLabel }}
                  </ElTag>
                  <ElTag v-if="msg.emotionLabel" size="small" type="warning" effect="plain">
                    情绪：{{ msg.emotionLabel }}
                  </ElTag>
                  <span v-if="msg.latencyMs != null" class="latency">响应 {{ msg.latencyMs }}ms</span>
                </div>

                <div v-if="msg.role === 'assistant'" class="bubble-actions">
                  <div v-if="msg.annotation" class="annotation-tip">
                    <ElTag :type="annotationTagType(msg.annotation.label)" size="small" effect="dark">
                      {{ annotationText(msg.annotation.label) }}
                    </ElTag>
                    <span v-if="msg.annotation.note" class="annotation-note">{{ msg.annotation.note }}</span>
                  </div>
                  <div class="action-buttons">
                    <ElButton
                      size="small"
                      type="success"
                      plain
                      :loading="busyId === msg.id"
                      @click="annotate(msg, 'correct')"
                    >
                      标记正确
                    </ElButton>
                    <ElButton
                      size="small"
                      type="danger"
                      plain
                      :loading="busyId === msg.id"
                      @click="annotate(msg, 'wrong')"
                    >
                      标记错误
                    </ElButton>
                    <ElButton
                      size="small"
                      type="warning"
                      plain
                      :loading="busyId === msg.id"
                      @click="annotate(msg, 'needs_knowledge')"
                    >
                      需补充知识
                    </ElButton>
                    <ElButton
                      size="small"
                      type="primary"
                      :loading="draftId === msg.id"
                      @click="genDraft(msg)"
                    >
                      生成知识草稿
                    </ElButton>
                  </div>
                </div>
              </div>
            </div>
          </ElScrollbar>
        </template>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import {
    getConversations,
    getConversationDetail,
    annotateMessage,
    createKnowledgeDraft,
    type ConversationSummary
  } from '@/api/admin'

  defineOptions({ name: 'OperationConversations' })

  type AnnotationLabel = 'correct' | 'wrong' | 'needs_knowledge'

  const loading = ref(false)
  const list = ref<ConversationSummary[]>([])
  const lowOnly = ref(false)

  const dialogVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<{ sessionId: string; messages: any[]; feedback: any[]; summary: ConversationSummary } | null>(null)
  const busyId = ref<string | null>(null)
  const draftId = ref<string | null>(null)

  function formatTime(value?: string) {
    if (!value) return '-'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
  }

  function annotationText(label: string) {
    const map: Record<string, string> = {
      correct: '已标记正确',
      wrong: '已标记错误',
      needs_knowledge: '需补充知识'
    }
    return map[label] || label
  }

  function annotationTagType(label: string): 'success' | 'danger' | 'warning' | 'info' {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      correct: 'success',
      wrong: 'danger',
      needs_knowledge: 'warning'
    }
    return map[label] || 'info'
  }

  async function loadList() {
    loading.value = true
    try {
      list.value = await getConversations(lowOnly.value ? { lowSatisfactionOnly: true } : {})
    } catch (e) {
      ElMessage.error('加载会话列表失败')
    } finally {
      loading.value = false
    }
  }

  async function openDetail(row: ConversationSummary) {
    if (!row?.sessionId) return
    dialogVisible.value = true
    detailLoading.value = true
    detail.value = null
    try {
      detail.value = await getConversationDetail(row.sessionId)
    } catch (e) {
      ElMessage.error('加载会话详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  async function annotate(msg: any, label: AnnotationLabel) {
    busyId.value = msg.id
    try {
      await annotateMessage(msg.id, { label })
      msg.annotation = { label, note: msg.annotation?.note }
      ElMessage.success('标注成功')
    } catch (e) {
      ElMessage.error('标注失败')
    } finally {
      busyId.value = null
    }
  }

  async function genDraft(msg: any) {
    draftId.value = msg.id
    try {
      const draft = await createKnowledgeDraft(msg.id)
      const html = [
        draft?.title ? `<p><strong>标题：</strong>${draft.title}</p>` : '',
        draft?.question ? `<p><strong>问题：</strong>${draft.question}</p>` : '',
        draft?.suggestedAnswer ? `<p><strong>建议答案：</strong>${draft.suggestedAnswer}</p>` : ''
      ]
        .filter(Boolean)
        .join('')
      ElMessageBox.alert(html || '未生成有效草稿内容', '知识草稿', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '知道了'
      })
    } catch (e) {
      ElMessage.error('生成知识草稿失败')
    } finally {
      draftId.value = null
    }
  }

  onMounted(loadList)
</script>

<style lang="scss" scoped>
  .conversations-page {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .toolbar-card :deep(.el-card__body) {
      padding: 14px 18px;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .toolbar-title {
          font-size: 16px;
          font-weight: 600;
        }
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;

        .switch-label {
          color: var(--el-text-color-regular);
          font-size: 14px;
        }
      }
    }

    .muted {
      color: var(--el-text-color-placeholder);
    }
  }

  .detail-wrap {
    min-height: 200px;

    .detail-summary {
      margin-bottom: 12px;
    }

    .chat-body {
      padding-right: 8px;
    }

    .msg-row {
      display: flex;
      margin-bottom: 14px;

      &.user {
        justify-content: flex-end;

        .bubble {
          background: var(--el-color-primary-light-9);
          border-color: var(--el-color-primary-light-7);
        }
      }

      &.assistant {
        justify-content: flex-start;

        .bubble {
          background: var(--el-fill-color-light);
        }
      }
    }

    .bubble {
      max-width: 78%;
      padding: 10px 12px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 10px;

      .bubble-text {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.6;
      }

      .bubble-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;

        .latency {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
      }

      .bubble-actions {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px dashed var(--el-border-color);

        .annotation-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .annotation-note {
            color: var(--el-text-color-secondary);
            font-size: 12px;
          }
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
      }
    }
  }
</style>
