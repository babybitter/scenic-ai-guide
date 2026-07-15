<!--
  会话记录：会话列表 + 会话详情（聊天气泡）+ 消息标注 + 生成知识草稿。
-->
<template>
  <div class="conversations-page">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">{{ $t('app.conversationsTitle') }}</span>
          <ElTag type="info" effect="plain" round>
            {{ $t('app.conversationsCount', { count: list.length }) }}
          </ElTag>
        </div>
        <div class="toolbar-right">
          <span class="switch-label">{{ $t('app.conversationsLowOnly') }}</span>
          <ElSwitch v-model="lowOnly" @change="loadList" />
          <ElButton :icon="Refresh" @click="loadList">{{ $t('app.refresh') }}</ElButton>
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
        <ElTableColumn
          prop="sessionId"
          :label="$t('app.conversationsId')"
          min-width="180"
          show-overflow-tooltip
        />
        <ElTableColumn :label="$t('app.conversationsStart')" min-width="170">
          <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
        </ElTableColumn>
        <ElTableColumn
          prop="messageCount"
          :label="$t('app.conversationsMessages')"
          width="100"
          align="center"
        />
        <ElTableColumn
          prop="userQuestionCount"
          :label="$t('app.conversationsQuestions')"
          width="100"
          align="center"
        />
        <ElTableColumn :label="$t('app.conversationsAverage')" width="130" align="center">
          <template #default="{ row }">
            <ElRate
              v-if="row.averageRating !== null"
              :model-value="row.averageRating"
              disabled
              :max="5"
              size="small"
            />
            <span v-else class="muted">{{ $t('app.conversationsNone') }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="mainFocus"
          :label="$t('app.conversationsFocus')"
          min-width="140"
          show-overflow-tooltip
        />
        <ElTableColumn :label="$t('app.conversationsSatisfaction')" width="120" align="center">
          <template #default="{ row }">
            <ElTag :type="row.lowSatisfaction ? 'danger' : 'success'" effect="light">
              {{ row.lowSatisfaction ? $t('app.conversationsLow') : $t('app.conversationsNormal') }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="feedbackCount"
          :label="$t('app.conversationsFeedbackCount')"
          width="100"
          align="center"
        />
        <ElTableColumn :label="$t('app.actions')" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click.stop="openDetail(row)">{{
              $t('app.conversationsDetail')
            }}</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 会话详情 -->
    <ElDialog
      v-model="dialogVisible"
      :title="$t('app.conversationsDetailTitle')"
      width="760px"
      top="6vh"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-wrap">
        <template v-if="detail">
          <ElDescriptions :column="3" size="small" border class="detail-summary">
            <ElDescriptionsItem :label="$t('app.conversationsId')">{{
              detail.sessionId
            }}</ElDescriptionsItem>
            <ElDescriptionsItem :label="$t('app.conversationsMessages')">{{
              detail.summary?.messageCount ?? '-'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem :label="$t('app.conversationsFocus')">{{
              detail.summary?.mainFocus || '-'
            }}</ElDescriptionsItem>
          </ElDescriptions>

          <ElScrollbar class="chat-body" height="52vh">
            <ElEmpty
              v-if="!detail.messages?.length"
              :description="$t('app.conversationsNoMessages')"
            />
            <div v-for="msg in detail.messages" :key="msg.id" class="msg-row" :class="msg.role">
              <div class="bubble">
                <p class="bubble-text">{{ msg.content }}</p>

                <div class="bubble-meta">
                  <ElTag v-if="msg.intentLabel" size="small" type="info" effect="plain">
                    {{ $t('app.conversationsIntent', { label: msg.intentLabel }) }}
                  </ElTag>
                  <ElTag v-if="msg.emotionLabel" size="small" type="warning" effect="plain">
                    {{ $t('app.conversationsEmotion', { label: msg.emotionLabel }) }}
                  </ElTag>
                  <span v-if="msg.latencyMs != null" class="latency">
                    {{ $t('app.conversationsResponse', { latency: msg.latencyMs }) }}
                  </span>
                </div>

                <div v-if="msg.role === 'assistant'" class="bubble-actions">
                  <div v-if="msg.annotation" class="annotation-tip">
                    <ElTag
                      :type="annotationTagType(msg.annotation.label)"
                      size="small"
                      effect="dark"
                    >
                      {{ annotationText(msg.annotation.label) }}
                    </ElTag>
                    <span v-if="msg.annotation.note" class="annotation-note">{{
                      msg.annotation.note
                    }}</span>
                  </div>
                  <div class="action-buttons">
                    <ElButton
                      size="small"
                      type="success"
                      plain
                      :loading="busyId === msg.id"
                      @click="annotate(msg, 'correct')"
                    >
                      {{ $t('app.conversationsMarkCorrect') }}
                    </ElButton>
                    <ElButton
                      size="small"
                      type="danger"
                      plain
                      :loading="busyId === msg.id"
                      @click="annotate(msg, 'wrong')"
                    >
                      {{ $t('app.conversationsMarkWrong') }}
                    </ElButton>
                    <ElButton
                      size="small"
                      type="warning"
                      plain
                      :loading="busyId === msg.id"
                      @click="annotate(msg, 'needs_knowledge')"
                    >
                      {{ $t('app.conversationsNeedsKnowledge') }}
                    </ElButton>
                    <ElButton
                      size="small"
                      type="primary"
                      :loading="draftId === msg.id"
                      @click="genDraft(msg)"
                    >
                      {{ $t('app.conversationsDraft') }}
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
  import { useI18n } from 'vue-i18n'
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

  const { t } = useI18n()

  type AnnotationLabel = 'correct' | 'wrong' | 'needs_knowledge'

  const loading = ref(false)
  const list = ref<ConversationSummary[]>([])
  const lowOnly = ref(false)

  const dialogVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<{
    sessionId: string
    messages: any[]
    feedback: any[]
    summary: ConversationSummary
  } | null>(null)
  const busyId = ref<string | null>(null)
  const draftId = ref<string | null>(null)

  function formatTime(value?: string) {
    if (!value) return '-'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
  }

  function annotationText(label: string) {
    const map: Record<string, string> = {
      correct: t('app.conversationsMarkedCorrect'),
      wrong: t('app.conversationsMarkedWrong'),
      needs_knowledge: t('app.conversationsNeedsKnowledge')
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
    } catch {
      ElMessage.error(t('app.conversationsListFailed'))
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
    } catch {
      ElMessage.error(t('app.conversationsDetailFailed'))
    } finally {
      detailLoading.value = false
    }
  }

  async function annotate(msg: any, label: AnnotationLabel) {
    busyId.value = msg.id
    try {
      await annotateMessage(msg.id, { label })
      msg.annotation = { label, note: msg.annotation?.note }
      ElMessage.success(t('app.conversationsMarked'))
    } catch {
      ElMessage.error(t('app.conversationsMarkFailed'))
    } finally {
      busyId.value = null
    }
  }

  async function genDraft(msg: any) {
    draftId.value = msg.id
    try {
      const draft = await createKnowledgeDraft(msg.id)
      const html = [
        draft?.title
          ? `<p><strong>${t('app.conversationsDraftTitle')}</strong>${draft.title}</p>`
          : '',
        draft?.question
          ? `<p><strong>${t('app.conversationsDraftQuestion')}</strong>${draft.question}</p>`
          : '',
        draft?.suggestedAnswer
          ? `<p><strong>${t('app.conversationsDraftAnswer')}</strong>${draft.suggestedAnswer}</p>`
          : ''
      ]
        .filter(Boolean)
        .join('')
      ElMessageBox.alert(
        html || t('app.conversationsDraftEmpty'),
        t('app.conversationsDraftDialog'),
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: t('app.understood')
        }
      )
    } catch {
      ElMessage.error(t('app.conversationsDraftFailed'))
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
