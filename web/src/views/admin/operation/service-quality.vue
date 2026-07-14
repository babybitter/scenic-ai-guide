<!--
  服务质量报告：KPI 概览 + 常见问题 + 优化建议。
-->
<template>
  <div v-loading="loading" class="service-quality-page">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">服务质量报告</span>
          <ElTag v-if="report" type="info" effect="plain" round>
            生成于 {{ formatTime(report.generatedAt) }}
          </ElTag>
        </div>
        <ElButton type="primary" :icon="Refresh" :loading="loading" @click="loadReport">
          刷新报告
        </ElButton>
      </div>
    </ElCard>

    <template v-if="report">
      <!-- KPI -->
      <ElRow :gutter="16" class="kpi-row">
        <ElCol :xs="12" :sm="6">
          <ElCard shadow="hover" class="kpi-card">
            <ElStatistic title="会话总数" :value="report.conversationCount" />
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="6">
          <ElCard shadow="hover" class="kpi-card">
            <ElStatistic title="低满意度会话" :value="report.lowSatisfactionCount" />
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="6">
          <ElCard shadow="hover" class="kpi-card">
            <ElStatistic title="平均满意度" :value="report.averageSatisfaction" :precision="2" />
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="6">
          <ElCard shadow="hover" class="kpi-card">
            <ElStatistic title="错误回答数" :value="report.wrongAnswerCount" />
          </ElCard>
        </ElCol>
      </ElRow>

      <ElRow :gutter="16">
        <!-- 常见问题 -->
        <ElCol :xs="24" :lg="12">
          <ElCard shadow="never" class="section-card">
            <template #header>
              <span class="section-title">常见问题</span>
            </template>
            <ElEmpty v-if="!report.commonIssues?.length" :image-size="80" description="暂无常见问题" />
            <ul v-else class="issue-list">
              <li v-for="(issue, i) in report.commonIssues" :key="i" class="issue-item">
                <div class="issue-main">
                  <ElTag type="info" effect="plain" round class="issue-rank">{{ i + 1 }}</ElTag>
                  <span class="issue-label">{{ issue.label }}</span>
                </div>
                <ElTag type="danger" effect="light">{{ issue.count }} 次</ElTag>
              </li>
            </ul>
          </ElCard>
        </ElCol>

        <!-- 优化建议 -->
        <ElCol :xs="24" :lg="12">
          <ElCard shadow="never" class="section-card">
            <template #header>
              <span class="section-title">优化建议</span>
            </template>
            <ElEmpty
              v-if="!report.optimizationSuggestions?.length"
              :image-size="80"
              description="暂无优化建议"
            />
            <ElTimeline v-else class="suggestion-timeline">
              <ElTimelineItem
                v-for="(tip, i) in report.optimizationSuggestions"
                :key="i"
                type="primary"
                :hollow="true"
              >
                {{ tip }}
              </ElTimelineItem>
            </ElTimeline>
          </ElCard>
        </ElCol>
      </ElRow>
    </template>

    <ElEmpty v-else-if="!loading" description="暂无服务质量报告" />
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { getServiceQualityReport, type ServiceQualityReport } from '@/api/admin'

  defineOptions({ name: 'OperationServiceQuality' })

  const loading = ref(false)
  const report = ref<ServiceQualityReport | null>(null)

  function formatTime(value?: string) {
    if (!value) return '-'
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
  }

  async function loadReport() {
    loading.value = true
    try {
      report.value = await getServiceQualityReport()
    } catch (e) {
      ElMessage.error('加载服务质量报告失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(loadReport)
</script>

<style lang="scss" scoped>
  .service-quality-page {
    display: flex;
    flex-direction: column;
    gap: 16px;

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
    }

    .kpi-row {
      margin-bottom: 0;
    }

    .kpi-card {
      margin-bottom: 16px;
      text-align: center;

      :deep(.el-statistic__head) {
        margin-bottom: 6px;
        color: var(--el-text-color-secondary);
      }
    }

    .section-card {
      margin-bottom: 16px;

      .section-title {
        font-size: 15px;
        font-weight: 600;
      }
    }

    .issue-list {
      margin: 0;
      padding: 0;
      list-style: none;

      .issue-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px dashed var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .issue-main {
          display: flex;
          align-items: center;
          gap: 10px;

          .issue-rank {
            min-width: 24px;
            text-align: center;
          }

          .issue-label {
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .suggestion-timeline {
      padding-top: 4px;
      padding-left: 4px;
    }
  }
</style>
