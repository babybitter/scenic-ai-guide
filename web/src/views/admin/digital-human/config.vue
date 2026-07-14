<!-- 数字人配置：形象(avatar_id)、音色(vcn)、欢迎语、情绪风格、服务状态；启用项下发到游客端。 -->
<template>
  <div class="dh-config">
    <ElCard shadow="never" class="hint-card">
      <p class="hint">
        管理数字人的引擎、形象、音色与服务状态。启用的配置会实时下发到游客导览端，
        首页随之切换。讯飞云端引擎的形象 ID(avatar_id) 与音色(vcn) 需在讯飞交互平台申请；
        Live2D 本地引擎直接选择内置模型，作为讯飞的冗余备选，二者可随时切换。
      </p>
    </ElCard>

    <div class="toolbar">
      <ElButton type="primary" @click="openCreate">新增数字人</ElButton>
      <ElButton @click="load">刷新</ElButton>
    </div>

    <ElTable :data="configs" v-loading="loading" border>
      <ElTableColumn prop="name" label="名称" min-width="140" />
      <ElTableColumn label="引擎" width="120">
        <template #default="{ row }">
          <ElTag :type="row.engine === 'live2d' ? 'warning' : 'primary'" effect="light">
            {{ row.engine === 'live2d' ? 'Live2D 本地' : '讯飞云端' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="形象 / 模型" min-width="150">
        <template #default="{ row }">
          <span>{{ row.engine === 'live2d' ? row.modelId : row.avatarId }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="vcn" label="音色 (vcn)" min-width="150" />
      <ElTableColumn label="服务状态" width="120">
        <template #default="{ row }">
          <ElTag :type="statusType(row.serviceStatus)">{{ statusLabel(row.serviceStatus) }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="启用" width="90">
        <template #default="{ row }">
          <ElTag v-if="row.enabled" type="success">当前启用</ElTag>
          <span v-else class="muted">—</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" text type="primary" @click="openEdit(row)">编辑</ElButton>
          <ElButton size="small" text type="success" :disabled="row.enabled" @click="enable(row)">
            设为启用
          </ElButton>
          <ElButton size="small" text @click="preview(row)">试听</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="dialogVisible" :title="editing ? '编辑数字人' : '新增数字人'" width="560px">
      <ElForm :model="form" label-width="96px">
        <ElFormItem label="名称" required>
          <ElInput v-model="form.name" placeholder="如：灵灵" />
        </ElFormItem>
        <ElFormItem label="渲染引擎">
          <ElRadioGroup v-model="form.engine">
            <ElRadioButton value="xfyun">讯飞云端</ElRadioButton>
            <ElRadioButton value="live2d">Live2D 本地</ElRadioButton>
          </ElRadioGroup>
          <p class="engine-hint">
            {{
              form.engine === 'live2d'
                ? '本地 Live2D 画布渲染，声音由后端 TTS 合成，无需云端凭证；与讯飞互为冗余。'
                : '讯飞交互平台云端流式数字人，需填写形象 ID 与音色。'
            }}
          </p>
        </ElFormItem>
        <!-- 讯飞：形象 ID -->
        <ElFormItem v-if="form.engine === 'xfyun'" label="形象 ID">
          <ElInput v-model="form.avatarId" placeholder="讯飞交互平台形象 avatar_id" />
        </ElFormItem>
        <!-- Live2D：模型选择 -->
        <ElFormItem v-else label="Live2D 模型">
          <ElSelect v-model="form.modelId" placeholder="选择内置模型">
            <ElOption v-for="m in live2dModels" :key="m.value" :label="m.label" :value="m.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="form.engine === 'live2d' ? '音色 vcn (TTS)' : '音色 vcn'">
          <ElInput v-model="form.vcn" placeholder="如：x5_lingxiaoyue_flow" />
        </ElFormItem>
        <ElFormItem label="欢迎语">
          <ElInput v-model="form.welcomeText" type="textarea" :rows="2" />
        </ElFormItem>
        <ElFormItem label="语速">
          <ElSlider v-model="form.speechRate" :min="0.5" :max="2" :step="0.1" show-input />
        </ElFormItem>
        <ElFormItem label="情绪风格">
          <ElSelect v-model="form.emotionStyle">
            <ElOption label="亲切温柔" value="warm" />
            <ElOption label="积极正向" value="happy" />
            <ElOption label="平静专业" value="neutral" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="服务状态">
          <ElSelect v-model="form.serviceStatus">
            <ElOption label="在线" value="online" />
            <ElOption label="维护中" value="maintenance" />
            <ElOption label="仅文本模式" value="text_only" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="设为启用">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="save">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import {
    fetchDigitalHumanConfigs,
    saveDigitalHumanConfig,
    type DigitalHumanConfig
  } from '@/api/digital-human'

  defineOptions({ name: 'DigitalHumanConfig' })

  const configs = ref<DigitalHumanConfig[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const editing = ref(false)
  const saving = ref(false)

  // 内置 Live2D 模型（与 public/live2d/characters 及后端目录名一致）；
  // 性别仅供选择参考，两男两女，作为讯飞数字人的本地兜底形象。
  const live2dModels = [
    { value: 'Haru', label: '春 Haru（女）' },
    { value: 'Hiyori', label: '日和 Hiyori（女）' },
    { value: 'Kei', label: '圭 Kei（男）' },
    { value: 'Hibiki', label: '响 Hibiki（男）' }
  ]

  const emptyForm = () => ({
    id: '',
    name: '',
    engine: 'xfyun' as DigitalHumanConfig['engine'],
    avatarId: '',
    modelId: 'Haru',
    vcn: 'x5_lingxiaoyue_flow',
    welcomeText: '您好，我是灵山胜境 AI 导游，很高兴为您服务。',
    speechRate: 1,
    emotionStyle: 'warm',
    serviceStatus: 'online' as DigitalHumanConfig['serviceStatus'],
    enabled: false
  })
  const form = reactive(emptyForm())

  function statusLabel(s: string) {
    return s === 'online' ? '在线' : s === 'maintenance' ? '维护中' : '仅文本模式'
  }
  function statusType(s: string) {
    return s === 'online' ? 'success' : s === 'maintenance' ? 'warning' : 'info'
  }

  async function load() {
    loading.value = true
    try {
      configs.value = await fetchDigitalHumanConfigs()
    } catch {
      ElMessage.error('数字人配置加载失败')
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    Object.assign(form, emptyForm(), { id: `dh_${Date.now()}` })
    editing.value = false
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
    dialogVisible.value = true
  }

  async function save() {
    if (!form.name.trim()) {
      ElMessage.warning('请填写名称')
      return
    }
    saving.value = true
    try {
      await saveDigitalHumanConfig({ ...form })
      ElMessage.success('已保存')
      dialogVisible.value = false
      await load()
    } catch {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  }

  async function enable(row: DigitalHumanConfig) {
    try {
      await saveDigitalHumanConfig({ id: row.id, enabled: true })
      ElMessage.success(`已启用「${row.name}」`)
      await load()
    } catch {
      ElMessage.error('启用失败')
    }
  }

  // 轻量试听：使用浏览器语音合成朗读欢迎语（真实音色以游客端数字人为准）
  function preview(row: DigitalHumanConfig) {
    const synth = window.speechSynthesis
    if (!synth) {
      ElMessage.warning('当前浏览器不支持语音试听')
      return
    }
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(row.welcomeText || '您好，欢迎来到灵山胜境。')
    utter.lang = 'zh-CN'
    utter.rate = row.speechRate || 1
    synth.speak(utter)
    ElMessage.info('正在试听欢迎语（真实音色以游客端数字人为准）')
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
</style>
