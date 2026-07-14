<!--
  反馈分析：按反馈聚类展示（标签、数量、平均评分、样本评论）。
-->
<template>
  <div class="feedback-page">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">反馈分析</span>
          <ElTag type="info" effect="plain" round>共 {{ clusters.length }} 类</ElTag>
        </div>
        <ElButton :icon="Refresh" @click="loadClusters">刷新</ElButton>
      </div>
    </ElCard>

    <div v-loading="loading" class="content">
      <ElEmpty v-if="!loading && !clusters.length" description="暂无反馈数据" />

      <ElRow v-else :gutter="16">
        <ElCol v-for="(cluster, i) in clusters" :key="i" :xs="24" :sm="12" :lg="8">
          <ElCard shadow="hover" class="cluster-card">
            <div class="cluster-head">
              <span class="cluster-label">{{ cluster.label }}</span>
              <ElTag type="primary" effect="dark" round>{{ cluster.count }} 条</ElTag>
            </div>

            <div class="cluster-rating">
              <ElRate :model-value="cluster.averageRating" disabled :max="5" size="small" />
              <span class="rating-value">{{ cluster.averageRating?.toFixed(1) ?? '-' }}</span>
            </div>

            <div class="cluster-samples">
              <p class="samples-title">样本反馈</p>
              <ElEmpty v-if="!cluster.samples?.length" :image-size="60" description="暂无样本" />
              <ul v-else class="samples-list">
                <li v-for="(s, si) in cluster.samples" :key="si" class="sample-item">
                  <div class="sample-tags">
                    <ElTag v-if="s.rating != null" size="small" type="warning" effect="plain">
                      评分 {{ s.rating }}
                    </ElTag>
                    <ElTag v-if="s.vote" size="small" :type="voteType(s.vote)" effect="plain">
                      {{ voteText(s.vote) }}
                    </ElTag>
                  </div>
                  <span class="sample-comment">{{ s.comment || '（无文字评论）' }}</span>
                </li>
              </ul>
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { getFeedbackClusters, type FeedbackCluster } from '@/api/admin'

  defineOptions({ name: 'OperationFeedback' })

  const loading = ref(false)
  const clusters = ref<FeedbackCluster[]>([])

  function voteText(vote?: string) {
    const map: Record<string, string> = { up: '点赞', down: '点踩' }
    return (vote && map[vote]) || vote || ''
  }

  function voteType(vote?: string) {
    return vote === 'up' ? 'success' : 'danger'
  }

  async function loadClusters() {
    loading.value = true
    try {
      clusters.value = await getFeedbackClusters()
    } catch (e) {
      ElMessage.error('加载反馈聚类失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(loadClusters)
</script>

<style lang="scss" scoped>
  .feedback-page {
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
    }

    .content {
      min-height: 200px;
    }

    .cluster-card {
      margin-bottom: 16px;

      .cluster-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .cluster-label {
          font-size: 15px;
          font-weight: 600;
        }
      }

      .cluster-rating {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        .rating-value {
          color: var(--el-color-warning);
          font-weight: 600;
        }
      }

      .cluster-samples {
        .samples-title {
          margin: 0 0 6px;
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }

        .samples-list {
          margin: 0;
          padding: 0;
          list-style: none;

          .sample-item {
            padding: 8px 0;
            border-top: 1px dashed var(--el-border-color-lighter);

            &:first-child {
              border-top: none;
            }

            .sample-tags {
              display: flex;
              gap: 6px;
              margin-bottom: 4px;
            }

            .sample-comment {
              color: var(--el-text-color-regular);
              font-size: 13px;
              line-height: 1.5;
              word-break: break-word;
            }
          }
        }
      }
    }
  }
</style>
