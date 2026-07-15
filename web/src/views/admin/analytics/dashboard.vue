<!--
  运营数据大屏：筛选条件 + KPI 指标卡 + 多维 ECharts 图表 + 运营建议。
  数据来源 getDashboard，可按性别 / 年龄段 / 最低满意度筛选，并支持重新导入 Excel 数据。
-->
<template>
  <div v-loading="loading" class="analytics-dashboard">
    <!-- 筛选条件 -->
    <ElCard shadow="never" class="filter-card">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="filter-item">
            <span class="filter-label">{{ $t('app.analyticsGender') }}</span>
            <ElSelect v-model="filters.gender" class="filter-select" @change="reload">
              <ElOption :label="$t('app.analyticsAll')" value="all" />
              <ElOption :label="$t('app.analyticsMale')" value="male" />
              <ElOption :label="$t('app.analyticsFemale')" value="female" />
            </ElSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">{{ $t('app.analyticsAge') }}</span>
            <ElSelect v-model="filters.ageBand" class="filter-select" @change="reload">
              <ElOption :label="$t('app.analyticsAll')" value="all" />
              <ElOption label="18-24" value="18-24" />
              <ElOption label="25-34" value="25-34" />
              <ElOption label="35-44" value="35-44" />
              <ElOption label="45-59" value="45-59" />
              <ElOption label="60+" value="60+" />
            </ElSelect>
          </div>
          <div class="filter-item">
            <span class="filter-label">{{ $t('app.analyticsMinSatisfaction') }}</span>
            <ElSelect v-model="filters.minSatisfaction" class="filter-select" @change="reload">
              <ElOption :label="$t('app.analyticsAll')" value="all" />
              <ElOption :label="$t('app.analyticsThreePlus')" value="3" />
              <ElOption :label="$t('app.analyticsFourPlus')" value="4" />
              <ElOption :label="$t('app.analyticsFive')" value="5" />
            </ElSelect>
          </div>
        </div>
        <div class="filter-right">
          <span v-if="dashboard?.generatedAt" class="generated-at">
            {{ $t('app.analyticsUpdated', { time: dashboard.generatedAt }) }}
          </span>
          <ElButton :loading="loading" @click="reload">{{ $t('app.analyticsRefresh') }}</ElButton>
          <ElButton type="primary" :loading="importing" @click="handleImport">
            {{ $t('app.analyticsImport') }}
          </ElButton>
        </div>
      </div>
    </ElCard>

    <!-- KPI 指标卡 -->
    <ElRow :gutter="16" class="kpi-row">
      <ElCol v-for="kpi in kpiCards" :key="kpi.label" :xs="12" :sm="8" :md="4">
        <ElCard shadow="hover" class="kpi-card">
          <p class="kpi-value"
            >{{ kpi.value }}<span v-if="kpi.suffix" class="kpi-suffix">{{ kpi.suffix }}</span></p
          >
          <p class="kpi-label">{{ kpi.label }}</p>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 图表区 -->
    <ElRow :gutter="16" class="chart-row">
      <ElCol :xs="24" :md="12" :lg="8">
        <ElCard shadow="never" class="chart-card">
          <template #header
            ><span class="chart-title">{{ $t('app.analyticsHotQuestions') }}</span></template
          >
          <ElEmpty
            v-if="!dashboard?.hotQuestions?.length"
            :description="$t('app.noData')"
            :image-size="80"
          />
          <div
            v-show="dashboard?.hotQuestions?.length"
            ref="hotQuestionsEl"
            class="chart-box"
          ></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="12" :lg="8">
        <ElCard shadow="never" class="chart-card">
          <template #header
            ><span class="chart-title">{{ $t('app.analyticsSpotFocus') }}</span></template
          >
          <ElEmpty
            v-if="!dashboard?.spotFocus?.length"
            :description="$t('app.noData')"
            :image-size="80"
          />
          <div v-show="dashboard?.spotFocus?.length" ref="spotFocusEl" class="chart-box"></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="12" :lg="8">
        <ElCard shadow="never" class="chart-card">
          <template #header
            ><span class="chart-title">{{ $t('app.analyticsEmotion') }}</span></template
          >
          <ElEmpty
            v-if="!dashboard?.emotionTrend?.length"
            :description="$t('app.noData')"
            :image-size="80"
          />
          <div v-show="dashboard?.emotionTrend?.length" ref="emotionEl" class="chart-box"></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="12" :lg="8">
        <ElCard shadow="never" class="chart-card">
          <template #header
            ><span class="chart-title">{{ $t('app.analyticsConsumption') }}</span></template
          >
          <ElEmpty v-if="!hasConsumption" :description="$t('app.noData')" :image-size="80" />
          <div v-show="hasConsumption" ref="consumptionEl" class="chart-box"></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="12" :lg="8">
        <ElCard shadow="never" class="chart-card">
          <template #header
            ><span class="chart-title">{{ $t('app.analyticsAgeDistribution') }}</span></template
          >
          <ElEmpty
            v-if="!dashboard?.persona?.ageBands?.length"
            :description="$t('app.noData')"
            :image-size="80"
          />
          <div
            v-show="dashboard?.persona?.ageBands?.length"
            ref="ageBandsEl"
            class="chart-box"
          ></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="12" :lg="8">
        <ElCard shadow="never" class="chart-card">
          <template #header
            ><span class="chart-title">{{ $t('app.analyticsGenderDistribution') }}</span></template
          >
          <ElEmpty
            v-if="!dashboard?.persona?.genders?.length"
            :description="$t('app.noData')"
            :image-size="80"
          />
          <div v-show="dashboard?.persona?.genders?.length" ref="gendersEl" class="chart-box"></div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 运营建议 -->
    <ElCard shadow="never" class="suggestion-card">
      <template #header
        ><span class="chart-title">{{ $t('app.analyticsSuggestions') }}</span></template
      >
      <ElEmpty
        v-if="!dashboard?.suggestions?.length"
        :description="$t('app.analyticsNoSuggestions')"
        :image-size="80"
      />
      <ul v-else class="suggestion-list">
        <li v-for="(item, index) in dashboard.suggestions" :key="index" class="suggestion-item">
          <span class="suggestion-dot"></span>
          <span class="suggestion-text">{{ item }}</span>
        </li>
      </ul>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import * as echarts from 'echarts'
  import { useI18n } from 'vue-i18n'
  import { getDashboard, importAnalytics, type DashboardData } from '@/api/admin'

  defineOptions({ name: 'AnalyticsDashboard' })

  const { t } = useI18n()

  // 景区 / 禅意主题配色
  const PALETTE = ['#135158', '#1c6b6b', '#d4af37', '#3dcd9f', '#8bb8a0', '#c98f2e']
  const AXIS_COLOR = '#7a8c8c'
  const SPLIT_COLOR = 'rgba(19, 81, 88, 0.08)'

  const loading = ref(false)
  const importing = ref(false)
  const dashboard = ref<DashboardData | null>(null)

  const filters = reactive({
    gender: 'all',
    ageBand: 'all',
    minSatisfaction: 'all'
  })

  // ---- KPI 指标卡 ----
  const kpiCards = computed(() => {
    const m = dashboard.value?.metrics
    return [
      { label: t('app.analyticsToday'), value: m?.todayServiceCount ?? 0, suffix: '' },
      { label: t('app.analyticsWeek'), value: m?.weekServiceCount ?? 0, suffix: '' },
      { label: t('app.analyticsQuestions'), value: m?.totalQuestions ?? 0, suffix: '' },
      {
        label: t('app.analyticsAverageSatisfaction'),
        value: (m?.averageSatisfaction ?? 0).toFixed(1),
        suffix: ''
      },
      {
        label: t('app.analyticsLatency'),
        value: Math.round(m?.averageLatencyMs ?? 0),
        suffix: 'ms'
      },
      { label: t('app.analyticsSamples'), value: m?.behaviorRows ?? 0, suffix: '' }
    ]
  })

  const hasConsumption = computed(() => {
    const c = dashboard.value?.consumption
    if (!c) return false
    return Object.values(c).some((v) => Number(v) > 0)
  })

  // ---- 图表 DOM 引用与实例 ----
  const hotQuestionsEl = ref<HTMLElement>()
  const spotFocusEl = ref<HTMLElement>()
  const emotionEl = ref<HTMLElement>()
  const consumptionEl = ref<HTMLElement>()
  const ageBandsEl = ref<HTMLElement>()
  const gendersEl = ref<HTMLElement>()

  const charts: Record<string, echarts.ECharts | null> = {
    hotQuestions: null,
    spotFocus: null,
    emotion: null,
    consumption: null,
    ageBands: null,
    genders: null
  }

  function ensureChart(key: keyof typeof charts, el?: HTMLElement) {
    if (!el) return null
    if (!charts[key] || charts[key]!.isDisposed()) {
      charts[key] = echarts.init(el)
    }
    return charts[key]
  }

  const baseGrid = { left: 12, right: 20, top: 24, bottom: 12, containLabel: true }
  const axisLabelStyle = { color: AXIS_COLOR, fontSize: 12 }

  // ---- 各图表 option 构建 ----
  function barOption(items: { label: string; value: number }[]) {
    return {
      color: [PALETTE[0]],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true },
      grid: baseGrid,
      xAxis: {
        type: 'category',
        data: items.map((i) => i.label),
        axisLabel: { ...axisLabelStyle, interval: 0, rotate: items.length > 4 ? 30 : 0 },
        axisLine: { lineStyle: { color: AXIS_COLOR } }
      },
      yAxis: {
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: { lineStyle: { color: SPLIT_COLOR } }
      },
      series: [
        {
          type: 'bar',
          data: items.map((i) => i.value),
          barMaxWidth: 36,
          itemStyle: { borderRadius: [4, 4, 0, 0], color: PALETTE[1] }
        }
      ]
    }
  }

  function horizontalBarOption(items: { label: string; value: number }[]) {
    // 从上到下由高到低，故数据倒序放入
    const sorted = [...items].sort((a, b) => a.value - b.value)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true },
      grid: { ...baseGrid, left: 12 },
      xAxis: {
        type: 'value',
        axisLabel: axisLabelStyle,
        splitLine: { lineStyle: { color: SPLIT_COLOR } }
      },
      yAxis: {
        type: 'category',
        data: sorted.map((i) => i.label),
        axisLabel: axisLabelStyle,
        axisLine: { lineStyle: { color: AXIS_COLOR } }
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((i) => i.value),
          barMaxWidth: 24,
          itemStyle: { borderRadius: [0, 4, 4, 0], color: PALETTE[0] }
        }
      ]
    }
  }

  function pieOption(
    items: { label: string; value: number }[],
    radius: [string, string] = ['40%', '68%']
  ) {
    return {
      color: PALETTE,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', confine: true },
      legend: { bottom: 0, textStyle: { color: AXIS_COLOR, fontSize: 12 }, type: 'scroll' },
      series: [
        {
          type: 'pie',
          radius,
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { color: AXIS_COLOR, fontSize: 12 },
          data: items.map((i) => ({ name: i.label, value: i.value }))
        }
      ]
    }
  }

  function consumptionItems(): { label: string; value: number }[] {
    const c = dashboard.value?.consumption ?? {}
    return [
      { label: t('app.analyticsTickets'), value: Number(c.ticketCost) || 0 },
      { label: t('app.analyticsFood'), value: Number(c.foodCost) || 0 },
      { label: t('app.analyticsShopping'), value: Number(c.shoppingCost) || 0 },
      { label: t('app.analyticsTransport'), value: Number(c.transportCost) || 0 },
      { label: t('app.analyticsEntertainment'), value: Number(c.entertainmentCost) || 0 }
    ].filter((i) => i.value > 0)
  }

  // ---- 渲染全部图表 ----
  function renderCharts() {
    const d = dashboard.value
    if (!d) return

    if (d.hotQuestions?.length) {
      ensureChart('hotQuestions', hotQuestionsEl.value)?.setOption(barOption(d.hotQuestions), true)
    }
    if (d.spotFocus?.length) {
      ensureChart('spotFocus', spotFocusEl.value)?.setOption(horizontalBarOption(d.spotFocus), true)
    }
    if (d.emotionTrend?.length) {
      ensureChart('emotion', emotionEl.value)?.setOption(pieOption(d.emotionTrend), true)
    }
    if (hasConsumption.value) {
      ensureChart('consumption', consumptionEl.value)?.setOption(
        pieOption(consumptionItems()),
        true
      )
    }
    if (d.persona?.ageBands?.length) {
      ensureChart('ageBands', ageBandsEl.value)?.setOption(barOption(d.persona.ageBands), true)
    }
    if (d.persona?.genders?.length) {
      ensureChart('genders', gendersEl.value)?.setOption(
        pieOption(d.persona.genders, ['0%', '62%']),
        true
      )
    }
  }

  // ---- 数据拉取 ----
  function buildParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {}
    if (filters.gender !== 'all') params.gender = filters.gender
    if (filters.ageBand !== 'all') params.ageBand = filters.ageBand
    if (filters.minSatisfaction !== 'all') params.minSatisfaction = Number(filters.minSatisfaction)
    return params
  }

  async function reload() {
    loading.value = true
    try {
      dashboard.value = await getDashboard(buildParams())
      await nextTick()
      renderCharts()
    } catch {
      ElMessage.error(t('app.analyticsLoadFailed'))
    } finally {
      loading.value = false
    }
  }

  async function handleImport() {
    importing.value = true
    try {
      await importAnalytics()
      ElMessage.success(t('app.analyticsImportDone'))
      await reload()
    } catch {
      ElMessage.error(t('app.analyticsImportFailed'))
    } finally {
      importing.value = false
    }
  }

  function handleResize() {
    Object.values(charts).forEach((c) => {
      if (c && !c.isDisposed()) c.resize()
    })
  }

  onMounted(async () => {
    window.addEventListener('resize', handleResize)
    await reload()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    Object.keys(charts).forEach((key) => {
      const c = charts[key]
      if (c && !c.isDisposed()) c.dispose()
      charts[key] = null
    })
  })
</script>

<style scoped lang="scss">
  .analytics-dashboard {
    padding: 12px;
  }

  .filter-card {
    margin-bottom: 12px;

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
    }

    .filter-left {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }

    .filter-right {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .filter-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .filter-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .filter-select {
      width: 130px;
    }

    .generated-at {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .kpi-row {
    margin-bottom: 4px;
  }

  .kpi-card {
    margin-bottom: 12px;
    text-align: center;
    background: linear-gradient(135deg, #135158 0%, #1c6b6b 100%);
    border: none;

    :deep(.el-card__body) {
      padding: 18px 12px;
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }

    .kpi-suffix {
      margin-left: 2px;
      font-size: 14px;
      font-weight: 500;
      color: #d4af37;
    }

    .kpi-label {
      margin-top: 8px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.78);
    }
  }

  .chart-row {
    margin-top: 4px;
  }

  .chart-card {
    margin-bottom: 16px;

    .chart-title {
      font-size: 15px;
      font-weight: 600;
      color: #135158;
    }

    .chart-box {
      width: 100%;
      height: 300px;
    }
  }

  .suggestion-card {
    margin-bottom: 12px;

    .chart-title {
      font-size: 15px;
      font-weight: 600;
      color: #135158;
    }

    .suggestion-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .suggestion-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 8px 0;
      border-bottom: 1px dashed var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }
    }

    .suggestion-dot {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      margin-top: 7px;
      border-radius: 50%;
      background: #d4af37;
    }

    .suggestion-text {
      font-size: 14px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
    }
  }
</style>
