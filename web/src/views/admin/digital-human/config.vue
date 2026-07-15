<!-- 数字人配置：形象(avatar_id)、音色(vcn)、欢迎语、情绪风格、服务状态；启用项下发到游客端。 -->
<template>
  <div class="dh-config">
    <ElCard shadow="never" class="hint-card">
      <p class="hint">
        {{ $t('app.dhHint') }}
      </p>
    </ElCard>

    <div class="toolbar">
      <ElButton type="primary" @click="openCreate">{{ $t('app.dhCreate') }}</ElButton>
      <ElButton @click="load">{{ $t('app.refresh') }}</ElButton>
    </div>

    <ElTable :data="configs" v-loading="loading" border>
      <ElTableColumn prop="name" :label="$t('app.name')" min-width="140" />
      <ElTableColumn :label="$t('app.dhEngine')" width="130">
        <template #default="{ row }">
          <ElTag :type="row.engine === 'live2d' ? 'warning' : 'primary'" effect="light">
            {{ row.engine === 'live2d' ? $t('app.dhLive2d') : $t('app.dhXfyun') }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn :label="$t('app.dhAppearanceModel')" min-width="170">
        <template #default="{ row }">
          <span>{{ row.engine === 'live2d' ? row.modelId : row.avatarId }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="vcn" :label="$t('app.dhVoice')" min-width="200" />
      <ElTableColumn :label="$t('app.dhServiceStatus')" width="130">
        <template #default="{ row }">
          <ElTag :type="statusType(row.serviceStatus)">{{ statusLabel(row.serviceStatus) }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn :label="$t('app.enabled')" width="100">
        <template #default="{ row }">
          <ElTag v-if="row.enabled" type="success">{{ $t('app.dhCurrent') }}</ElTag>
          <span v-else class="muted">—</span>
        </template>
      </ElTableColumn>
      <ElTableColumn :label="$t('app.actions')" width="250" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" text type="primary" @click="openEdit(row)">
            {{ $t('app.edit') }}
          </ElButton>
          <ElButton size="small" text type="success" :disabled="row.enabled" @click="enable(row)">
            {{ $t('app.dhSetActive') }}
          </ElButton>
          <ElButton size="small" text @click="preview(row)">{{ $t('app.dhPreview') }}</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog
      v-model="dialogVisible"
      :title="editing ? $t('app.dhEdit') : $t('app.dhCreate')"
      width="min(880px, 92vw)"
    >
      <div class="picker-heading">
        <div>
          <h3>{{ $t('app.dhPickerTitle') }}</h3>
          <p>{{ $t('app.dhPickerHint') }}</p>
        </div>
      </div>
      <ElCollapse v-model="pickerPanels" class="catalog-collapse">
        <ElCollapseItem name="avatar">
          <template #title>
            <span class="collapse-title">{{ $t('app.dhChooseAvatar') }}</span>
          </template>
          <div class="option-grid avatar-grid">
            <button
              v-for="option in avatarOptions"
              :key="option.id"
              type="button"
              class="option-card avatar-card"
              :class="{ selected: selectedAvatarId === option.id }"
              @click="selectAvatar(option)"
            >
              <div class="avatar-preview">
                <ElImage v-if="option.preview" :src="option.preview" fit="contain" lazy />
                <ArtSvgIcon v-else icon="ri:user-smile-line" />
              </div>
              <div class="option-copy">
                <strong>{{ $t(option.labelKey) }}</strong>
                <span>
                  {{
                    option.engine === 'live2d' ? $t('app.dhLocalAvatar') : $t('app.dhCloudAvatar')
                  }}
                </span>
                <code>{{ option.modelId || option.avatarId }}</code>
              </div>
              <ElTag v-if="selectedAvatarId === option.id" size="small" type="success">
                {{ $t('app.dhSelected') }}
              </ElTag>
            </button>
          </div>
        </ElCollapseItem>
        <ElCollapseItem name="voice">
          <template #title>
            <span class="collapse-title">{{ $t('app.dhChooseVoice') }}</span>
          </template>
          <div class="option-grid voice-grid">
            <button
              v-for="option in voiceOptions"
              :key="option.parameter"
              type="button"
              class="option-card voice-card"
              :class="{ selected: form.vcn === option.parameter }"
              @click="selectVoice(option)"
            >
              <span class="voice-icon"><ArtSvgIcon icon="ri:voiceprint-line" /></span>
              <div class="option-copy">
                <strong>{{ $t(option.labelKey) }}</strong>
                <span>{{ $t('app.dhVoiceLanguage', { language: $t(option.languageKey) }) }}</span>
                <code>{{ $t('app.dhVoiceParameter', { parameter: option.parameter }) }}</code>
              </div>
              <ElTag v-if="form.vcn === option.parameter" size="small" type="success">
                {{ $t('app.dhSelected') }}
              </ElTag>
            </button>
          </div>
        </ElCollapseItem>
      </ElCollapse>

      <ElDivider />
      <ElForm :model="form" label-width="96px">
        <ElFormItem :label="$t('app.name')" required>
          <ElInput v-model="form.name" :placeholder="$t('app.dhNamePlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.dhEngineLabel')">
          <ElRadioGroup v-model="form.engine">
            <ElRadioButton value="xfyun">{{ $t('app.dhXfyun') }}</ElRadioButton>
            <ElRadioButton value="live2d">{{ $t('app.dhLive2d') }}</ElRadioButton>
          </ElRadioGroup>
          <p class="engine-hint">
            {{ form.engine === 'live2d' ? $t('app.dhLive2dHint') : $t('app.dhXfyunHint') }}
          </p>
        </ElFormItem>
        <!-- 讯飞：形象 ID -->
        <ElFormItem v-if="form.engine === 'xfyun'" :label="$t('app.dhAvatarId')">
          <ElInput v-model="form.avatarId" :placeholder="$t('app.dhAvatarPlaceholder')" />
        </ElFormItem>
        <!-- Live2D：模型选择 -->
        <ElFormItem v-else :label="$t('app.dhLive2dModel')">
          <ElSelect v-model="form.modelId" :placeholder="$t('app.dhSelectModel')">
            <ElOption v-for="m in live2dModels" :key="m.value" :label="m.label" :value="m.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('app.dhVoice')">
          <ElInput v-model="form.vcn" :placeholder="$t('app.dhVoicePlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.dhWelcome')">
          <ElInput v-model="form.welcomeText" type="textarea" :rows="2" />
        </ElFormItem>
        <ElFormItem :label="$t('app.dhSpeechRate')">
          <ElSlider v-model="form.speechRate" :min="0.5" :max="2" :step="0.1" show-input />
        </ElFormItem>
        <ElFormItem :label="$t('app.dhEmotion')">
          <ElSelect v-model="form.emotionStyle">
            <ElOption :label="$t('app.dhEmotionWarm')" value="warm" />
            <ElOption :label="$t('app.dhEmotionHappy')" value="happy" />
            <ElOption :label="$t('app.dhEmotionNeutral')" value="neutral" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('app.dhServiceStatus')">
          <ElSelect v-model="form.serviceStatus">
            <ElOption :label="$t('app.dhOnline')" value="online" />
            <ElOption :label="$t('app.dhMaintenance')" value="maintenance" />
            <ElOption :label="$t('app.dhTextOnly')" value="text_only" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('app.dhSetActive')">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('app.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">{{ $t('app.save') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import {
    fetchDigitalHumanConfigs,
    saveDigitalHumanConfig,
    type DigitalHumanConfig
  } from '@/api/digital-human'
  import { avatarOptions, voiceOptions, type AvatarOption, type VoiceOption } from './catalog'

  defineOptions({ name: 'DigitalHumanConfig' })

  const { t, locale } = useI18n()

  const configs = ref<DigitalHumanConfig[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const editing = ref(false)
  const saving = ref(false)
  const pickerPanels = ref<string[]>([])

  // 内置 Live2D 模型（与 public/live2d/characters 及后端目录名一致）；
  // 性别仅供选择参考，两男两女，作为讯飞数字人的本地兜底形象。
  const live2dModels = computed(() =>
    avatarOptions
      .filter((option) => option.engine === 'live2d')
      .map((option) => ({ value: option.modelId, label: t(option.labelKey) }))
  )

  const emptyForm = () => ({
    id: '',
    name: '',
    engine: 'xfyun' as DigitalHumanConfig['engine'],
    avatarId: '',
    modelId: 'Haru',
    vcn: 'x5_lingxiaoyue_flow',
    welcomeText: t('app.dhWelcomeDefault'),
    speechRate: 1,
    emotionStyle: 'warm',
    serviceStatus: 'online' as DigitalHumanConfig['serviceStatus'],
    enabled: false
  })
  const form = reactive(emptyForm())

  const selectedAvatarId = computed(
    () =>
      avatarOptions.find((option) =>
        form.engine === 'live2d'
          ? option.engine === 'live2d' && option.modelId === form.modelId
          : option.engine === 'xfyun' && option.avatarId === form.avatarId
      )?.id || ''
  )

  function statusLabel(s: string) {
    return s === 'online'
      ? t('app.dhOnline')
      : s === 'maintenance'
        ? t('app.dhMaintenance')
        : t('app.dhTextOnly')
  }
  function statusType(s: string) {
    return s === 'online' ? 'success' : s === 'maintenance' ? 'warning' : 'info'
  }

  async function load() {
    loading.value = true
    try {
      configs.value = await fetchDigitalHumanConfigs()
    } catch {
      ElMessage.error(t('app.dhLoadFailed'))
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    Object.assign(form, emptyForm(), { id: `dh_${Date.now()}` })
    editing.value = false
    pickerPanels.value = ['avatar', 'voice']
    dialogVisible.value = true
  }

  function openEdit(row: DigitalHumanConfig) {
    Object.assign(form, {
      id: row.id,
      name: row.name,
      engine: row.engine || 'xfyun',
      avatarId: row.avatarId,
      modelId: row.modelId || 'Haru',
      vcn: row.vcn,
      welcomeText: row.welcomeText,
      speechRate: row.speechRate || 1,
      emotionStyle: row.emotionStyle || 'warm',
      serviceStatus: row.serviceStatus,
      enabled: row.enabled
    })
    editing.value = true
    pickerPanels.value = []
    dialogVisible.value = true
  }

  function selectAvatar(option: AvatarOption) {
    form.engine = option.engine
    form.avatarId = option.avatarId
    form.modelId = option.modelId || form.modelId
  }

  function selectVoice(option: VoiceOption) {
    form.vcn = option.parameter
  }

  async function save() {
    if (!form.name.trim()) {
      ElMessage.warning(t('app.dhNameRequired'))
      return
    }
    saving.value = true
    try {
      await saveDigitalHumanConfig({ ...form })
      ElMessage.success(t('app.dhSaved'))
      dialogVisible.value = false
      await load()
    } catch {
      ElMessage.error(t('app.dhSaveFailed'))
    } finally {
      saving.value = false
    }
  }

  async function enable(row: DigitalHumanConfig) {
    try {
      await saveDigitalHumanConfig({ id: row.id, enabled: true })
      ElMessage.success(t('app.dhActivated', { name: row.name }))
      await load()
    } catch {
      ElMessage.error(t('app.dhActivateFailed'))
    }
  }

  // 轻量试听：使用浏览器语音合成朗读欢迎语（真实音色以游客端数字人为准）
  function preview(row: DigitalHumanConfig) {
    const synth = window.speechSynthesis
    if (!synth) {
      ElMessage.warning(t('app.dhPreviewUnsupported'))
      return
    }
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(row.welcomeText || t('app.dhWelcomeDefault'))
    utter.lang =
      { zh: 'zh-CN', en: 'en-US', ko: 'ko-KR', 'zh-TW': 'zh-TW', ja: 'ja-JP' }[locale.value] ||
      'zh-CN'
    utter.rate = row.speechRate || 1
    synth.speak(utter)
    ElMessage.info(t('app.dhPreviewPlaying'))
  }

  onMounted(load)
</script>

<style scoped lang="scss">
  .dh-config {
    padding: 12px;
  }

  .hint-card {
    margin-bottom: 12px;
  }

  .hint {
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .muted {
    color: var(--el-text-color-placeholder);
  }

  .engine-hint {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }

  .picker-heading {
    margin-bottom: 8px;

    h3 {
      margin: 0;
      font-size: 15px;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 5px 0 0;
      font-size: 12px;
      line-height: 1.55;
      color: var(--el-text-color-secondary);
    }
  }

  .catalog-collapse {
    --el-collapse-header-height: 44px;

    .collapse-title {
      font-weight: 600;
    }
  }

  .option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    padding: 2px 2px 10px;
  }

  .option-card {
    position: relative;
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    padding: 10px;
    color: var(--el-text-color-primary);
    text-align: left;
    cursor: pointer;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-light);
    border-radius: 9px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--el-color-primary-light-5);
      outline: none;
      box-shadow: 0 4px 14px rgb(0 0 0 / 7%);
      transform: translateY(-1px);
    }

    &.selected {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
    }

    > .el-tag {
      position: absolute;
      top: 7px;
      right: 7px;
    }
  }

  .avatar-preview,
  .voice-icon {
    display: flex;
    flex: 0 0 54px;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    overflow: hidden;
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
    border-radius: 8px;

    .el-image {
      width: 100%;
      height: 100%;
    }

    .art-svg-icon {
      font-size: 28px;
    }
  }

  .voice-icon {
    flex-basis: 44px;
    width: 44px;
    height: 44px;
  }

  .option-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;

    strong {
      padding-right: 52px;
      overflow: hidden;
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span,
    code {
      overflow: hidden;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      color: var(--el-text-color-regular);
    }
  }

  @media (width <= 640px) {
    .option-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
