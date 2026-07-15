<!--
  知识库文档管理：知识库概览统计、重建知识库、上传文档列表与上传控件。
-->
<template>
  <div class="kn-documents">
    <!-- 概览统计 -->
    <ElRow :gutter="16" class="stat-row">
      <ElCol :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="stat-card">
          <p class="stat-value">{{ summary?.documents ?? '-' }}</p>
          <p class="stat-label">{{ $t('app.docsCount') }}</p>
        </ElCard>
      </ElCol>
      <ElCol :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="stat-card">
          <p class="stat-value">{{ summary?.spots ?? '-' }}</p>
          <p class="stat-label">{{ $t('app.docsSpotCount') }}</p>
        </ElCard>
      </ElCol>
      <ElCol :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="stat-card">
          <p class="stat-value">{{ summary?.guideSections ?? '-' }}</p>
          <p class="stat-label">{{ $t('app.docsSections') }}</p>
        </ElCard>
      </ElCol>
      <ElCol :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="stat-card">
          <p class="stat-value">{{ summary?.chunks ?? '-' }}</p>
          <p class="stat-label">{{ $t('app.docsChunks') }}</p>
        </ElCard>
      </ElCol>
      <ElCol :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="stat-card">
          <p class="stat-value stat-text">
            <template v-if="scopeLines.length">
              <span v-for="line in scopeLines" :key="line" class="scope-line">{{ line }}</span>
            </template>
            <template v-else>-</template>
          </p>
          <p class="stat-label">{{ $t('app.docsScope') }}</p>
        </ElCard>
      </ElCol>
      <ElCol :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="stat-card">
          <ElTag :type="summary?.status === 'ready' ? 'success' : 'info'" effect="light">
            {{ summary?.status || '-' }}
          </ElTag>
          <p class="stat-label">{{ $t('app.status') }}</p>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 操作区 -->
    <ElCard shadow="never" class="action-card">
      <div class="action-bar">
        <div class="action-left">
          <ElUpload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="onFileChange"
            accept=".docx,.xlsx,.txt,.md,.pdf"
          >
            <ElButton type="primary" :loading="uploading">
              <ElIcon><UploadFilled /></ElIcon>
              <span>{{ $t('app.docsUpload') }}</span>
            </ElButton>
          </ElUpload>
          <span class="accept-tip">{{ $t('app.docsSupported') }}</span>
        </div>
        <div class="action-right">
          <ElButton :loading="loading" @click="refresh">
            <ElIcon><Refresh /></ElIcon>
            <span>{{ $t('app.refresh') }}</span>
          </ElButton>
          <ElButton type="warning" :loading="rebuilding" @click="handleRebuild">
            <ElIcon><Refresh /></ElIcon>
            <span>{{ $t('app.docsRebuild') }}</span>
          </ElButton>
        </div>
      </div>
    </ElCard>

    <!-- 上传文档列表 -->
    <ElCard shadow="never" class="table-card">
      <ElTable v-loading="loading" :data="uploads" stripe border>
        <ElTableColumn
          prop="fileName"
          :label="$t('app.fileName')"
          min-width="200"
          show-overflow-tooltip
        />
        <ElTableColumn prop="fileType" :label="$t('app.type')" width="110" />
        <ElTableColumn :label="$t('app.size')" width="110">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </ElTableColumn>
        <ElTableColumn :label="$t('app.status')" width="110">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)" effect="light">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="chunkCount"
          :label="$t('app.docsChunkCount')"
          width="100"
          align="center"
        />
        <ElTableColumn prop="createdAt" :label="$t('app.uploadTime')" min-width="180" />
        <template #empty>
          <ElEmpty :description="$t('app.docsEmpty')" />
        </template>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { Refresh, UploadFilled } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import {
    getKnowledgeSummary,
    getUploads,
    rebuildKnowledge,
    uploadDocument,
    type KnowledgeSummary,
    type UploadRecord
  } from '@/api/admin'

  defineOptions({ name: 'KnowledgeDocuments' })

  const { t } = useI18n()

  const summary = ref<KnowledgeSummary | null>(null)
  const uploads = ref<UploadRecord[]>([])

  // 知识范围按空白拆分为多行展示（如「灵山胜境」「拈花湾禅意小镇」各占一行）
  const scopeLines = computed(() => (summary.value?.scope || '').split(/\s+/).filter(Boolean))
  const loading = ref(false)
  const rebuilding = ref(false)
  const uploading = ref(false)

  function formatSize(size: number) {
    if (!size && size !== 0) return '-'
    return `${(size / 1024).toFixed(1)} KB`
  }

  function statusType(status: string) {
    if (status === 'ready' || status === 'done' || status === 'processed') return 'success'
    if (status === 'failed' || status === 'error') return 'danger'
    if (status === 'processing' || status === 'pending') return 'warning'
    return 'info'
  }

  async function loadSummary() {
    try {
      summary.value = await getKnowledgeSummary()
    } catch {
      ElMessage.error(t('app.docsSummaryFailed'))
    }
  }

  async function loadUploads() {
    loading.value = true
    try {
      uploads.value = await getUploads()
    } catch {
      ElMessage.error(t('app.docsListFailed'))
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await Promise.all([loadSummary(), loadUploads()])
  }

  async function handleRebuild() {
    try {
      await ElMessageBox.confirm(t('app.docsRebuildConfirm'), t('app.docsRebuild'), {
        type: 'warning',
        confirmButtonText: t('app.docsConfirmRebuild'),
        cancelButtonText: t('app.cancel')
      })
    } catch {
      return
    }
    rebuilding.value = true
    try {
      await rebuildKnowledge()
      ElMessage.success(t('app.docsRebuildDone'))
      await refresh()
    } catch {
      ElMessage.error(t('app.docsRebuildFailed'))
    } finally {
      rebuilding.value = false
    }
  }

  function readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = String(reader.result || '')
        const comma = result.indexOf(',')
        resolve(comma >= 0 ? result.slice(comma + 1) : result)
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  async function onFileChange(uploadFile: { raw?: File; name?: string }) {
    const raw = uploadFile.raw
    if (!raw) return
    uploading.value = true
    try {
      const contentBase64 = await readAsBase64(raw)
      await uploadDocument({
        fileName: raw.name,
        mimeType: raw.type || 'application/octet-stream',
        contentBase64
      })
      ElMessage.success(t('app.docsUploadDone'))
      await refresh()
    } catch {
      ElMessage.error(t('app.docsUploadFailed'))
    } finally {
      uploading.value = false
    }
  }

  onMounted(() => {
    refresh()
  })
</script>

<style scoped lang="scss">
  .kn-documents {
    padding: 12px;
  }

  .stat-row {
    margin-bottom: 12px;
  }

  .stat-card {
    margin-bottom: 12px;
    text-align: center;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-color-primary);
    }

    .stat-text {
      font-size: 16px;
      line-height: 1.35;
    }

    .scope-line {
      display: block;
    }

    .stat-label {
      margin-top: 6px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .action-card {
    margin-bottom: 12px;
  }

  .action-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .action-left,
  .action-right {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .accept-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .table-card {
    :deep(.el-icon) {
      margin-right: 4px;
      vertical-align: middle;
    }
  }
</style>
