<!-- 顶部快速入口面板 -->
<template>
  <ElPopover
    ref="popoverRef"
    :width="700"
    :offset="0"
    :show-arrow="false"
    trigger="hover"
    placement="bottom-start"
    popper-class="fast-enter-popover"
    :popper-style="{
      border: '1px solid var(--default-border)',
      borderRadius: 'calc(var(--custom-radius) / 2 + 4px)'
    }"
  >
    <template #reference>
      <div class="flex-c gap-2">
        <slot />
      </div>
    </template>

    <div class="grid grid-cols-[2fr_0.8fr]">
      <div>
        <div class="grid grid-cols-2 gap-1.5">
          <!-- 应用列表 -->
          <div
            v-for="application in enabledApplications"
            :key="application.name"
            class="mr-3 c-p flex-c gap-3 rounded-lg p-2 hover:bg-g-200/70 dark:hover:bg-g-200/90 hover:[&_.app-icon]:!bg-transparent"
            :class="{
              'pointer-events-none opacity-60':
                generatingDemoData && application.action === 'generateDemoData'
            }"
            @click="handleApplicationClick(application)"
          >
            <div class="app-icon size-12 flex-cc rounded-lg bg-g-200/80 dark:bg-g-300/30">
              <ArtSvgIcon
                class="text-xl"
                :class="{
                  'animate-spin': generatingDemoData && application.action === 'generateDemoData'
                }"
                :icon="
                  generatingDemoData && application.action === 'generateDemoData'
                    ? 'ri:loader-4-line'
                    : application.icon
                "
                :style="{ color: application.iconColor }"
              />
            </div>
            <div>
              <h3 class="m-0 text-sm font-medium text-g-800">
                {{ getApplicationName(application) }}
              </h3>
              <p class="mt-1 text-xs text-g-600">
                {{ getApplicationDescription(application) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="border-l-d pl-6 pt-2">
        <h3 class="mb-2.5 text-base font-medium text-g-800">快速链接</h3>
        <ul>
          <li
            v-for="quickLink in enabledQuickLinks"
            :key="quickLink.name"
            class="c-p py-2 hover:[&_span]:text-theme"
            @click="handleQuickLinkClick(quickLink)"
          >
            <span class="text-g-600 no-underline">{{ quickLink.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { generateDemoData, type DemoDataGenerationResult } from '@/api/admin'
  import { formatDateTime } from '@/utils/date'
  import { useCommon } from '@/hooks/core/useCommon'
  import { useFastEnter } from '@/hooks/core/useFastEnter'
  import type { FastEnterApplication, FastEnterQuickLink } from '@/types/config'

  defineOptions({ name: 'ArtFastEnter' })

  const router = useRouter()
  const popoverRef = ref()
  const { t, locale } = useI18n()
  const { refresh } = useCommon()
  const generatingDemoData = ref(false)

  // 使用快速入口配置
  const { enabledApplications, enabledQuickLinks } = useFastEnter()

  const getApplicationName = (application: FastEnterApplication): string => {
    return application.nameI18nKey ? t(application.nameI18nKey) : application.name
  }

  const getApplicationDescription = (application: FastEnterApplication): string => {
    return application.descriptionI18nKey
      ? t(application.descriptionI18nKey)
      : application.description
  }

  const formatGeneratedAt = (generatedAt?: string): string => {
    if (!generatedAt) return ''
    return formatDateTime(generatedAt, locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const buildDemoDataSummary = (result: DemoDataGenerationResult) => {
    const counts = result.counts || {}
    const rows = [
      [t('app.demoDataSessions'), counts.visitorSessions],
      [t('app.demoDataMessages'), counts.messages],
      [t('app.demoDataFeedback'), counts.feedback],
      [t('app.demoDataBehavior'), counts.touristBehavior],
      [t('app.demoDataRoutes'), counts.routeSelections],
      [t('app.demoDataAnnotations'), counts.messageAnnotations],
      [t('app.demoDataTotal'), counts.total]
    ].filter(([, value]) => typeof value === 'number')

    const metadata = [
      result.batchId ? `${t('app.demoDataBatch')}: ${result.batchId}` : '',
      result.generatedAt
        ? `${t('app.demoDataGeneratedAt')}: ${formatGeneratedAt(result.generatedAt)}`
        : ''
    ].filter(Boolean)

    return h('div', { style: { lineHeight: '1.8' } }, [
      h('p', { style: { margin: '0 0 10px' } }, t('app.demoDataSummaryIntro')),
      ...rows.map(([label, value]) =>
        h(
          'div',
          {
            key: label,
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              gap: '32px'
            }
          },
          [
            h('span', { style: { color: 'var(--el-text-color-regular)' } }, `${label}`),
            h('strong', { style: { color: 'var(--el-color-primary)' } }, `${value}`)
          ]
        )
      ),
      ...metadata.map((line) =>
        h(
          'div',
          {
            key: line,
            style: {
              marginTop: '8px',
              color: 'var(--el-text-color-secondary)',
              fontSize: '12px'
            }
          },
          line
        )
      )
    ])
  }

  const handleGenerateDemoData = async (): Promise<void> => {
    if (generatingDemoData.value) return

    try {
      await ElMessageBox.confirm(t('app.demoDataConfirmMessage'), t('app.demoDataConfirmTitle'), {
        type: 'warning',
        confirmButtonText: t('app.demoDataConfirmAction'),
        cancelButtonText: t('app.cancel')
      })
    } catch {
      return
    }

    generatingDemoData.value = true
    popoverRef.value?.hide()
    const loading = ElLoading.service({
      lock: true,
      text: t('app.demoDataGenerating')
    })

    try {
      const result = await generateDemoData()
      loading.close()
      await ElMessageBox.alert(buildDemoDataSummary(result), t('app.demoDataGeneratedTitle'), {
        type: 'success',
        confirmButtonText: t('common.confirm'),
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false
      })
      refresh()
    } catch {
      ElMessage.error(t('app.demoDataGenerateFailed'))
    } finally {
      loading.close()
      generatingDemoData.value = false
    }
  }

  /**
   * 处理导航跳转
   * @param routeName 路由名称
   * @param link 外部链接
   */
  const handleNavigate = (routeName?: string, link?: string): void => {
    const targetPath = routeName || link

    if (!targetPath) {
      console.warn('导航配置无效：缺少路由名称或链接')
      return
    }

    if (targetPath.startsWith('http')) {
      window.open(targetPath, '_blank')
    } else {
      router.push({ name: targetPath })
    }

    popoverRef.value?.hide()
  }

  /**
   * 处理应用项点击
   * @param application 应用配置对象
   */
  const handleApplicationClick = async (application: FastEnterApplication): Promise<void> => {
    if (application.action === 'generateDemoData') {
      await handleGenerateDemoData()
      return
    }

    handleNavigate(application.routeName, application.link)
  }

  /**
   * 处理快速链接点击
   * @param quickLink 快速链接配置对象
   */
  const handleQuickLinkClick = (quickLink: FastEnterQuickLink): void => {
    handleNavigate(quickLink.routeName, quickLink.link)
  }
</script>
