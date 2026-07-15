<!--
  常见问题（FAQ）管理：列表增改、关键词标签、优先级、启用状态开关。
-->
<template>
  <div class="kn-faq">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span class="title">{{ $t('app.faqTitle') }}</span>
        <div class="ops">
          <ElButton :loading="loading" @click="loadFaqs">
            <ElIcon><Refresh /></ElIcon>
            <span>{{ $t('app.refresh') }}</span>
          </ElButton>
          <ElButton type="primary" @click="openCreate">
            <ElIcon><Plus /></ElIcon>
            <span>{{ $t('app.add') }}</span>
          </ElButton>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable v-loading="loading" :data="faqs" stripe border>
        <ElTableColumn
          prop="question"
          :label="$t('app.faqQuestion')"
          min-width="200"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="answer"
          :label="$t('app.faqAnswer')"
          min-width="240"
          show-overflow-tooltip
        />
        <ElTableColumn :label="$t('app.faqKeywords')" min-width="180">
          <template #default="{ row }">
            <ElTag v-for="kw in row.keywords" :key="kw" size="small" type="info" class="kw-tag">{{
              kw
            }}</ElTag>
            <span v-if="!row.keywords?.length" class="muted">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="priority"
          :label="$t('app.faqPriority')"
          width="100"
          align="center"
          sortable
        />
        <ElTableColumn :label="$t('app.enabled')" width="90" align="center">
          <template #default="{ row }">
            <ElSwitch
              v-model="row.enabled"
              :loading="row.__toggling"
              @change="(val) => handleToggle(row, Boolean(val))"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn :label="$t('app.actions')" width="120" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click="openEdit(row)">
              <ElIcon><Edit /></ElIcon>
              <span>{{ $t('app.edit') }}</span>
            </ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty :description="$t('app.faqEmpty')" />
        </template>
      </ElTable>
    </ElCard>

    <!-- 新增 / 编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="isEdit ? $t('app.faqEdit') : $t('app.faqAdd')"
      width="620px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="88px">
        <ElFormItem :label="$t('app.faqQuestion')" prop="question">
          <ElInput v-model="form.question" :placeholder="$t('app.faqQuestionPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.faqAnswer')" prop="answer">
          <ElInput
            v-model="form.answer"
            type="textarea"
            :rows="4"
            :placeholder="$t('app.faqAnswerPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.faqKeywords')">
          <ElInput v-model="keywordsText" :placeholder="$t('app.faqKeywordsPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.faqPriority')">
          <ElInputNumber v-model="form.priority" :min="0" :max="999" />
        </ElFormItem>
        <ElFormItem :label="$t('app.enabled')">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">{{ $t('app.cancel') }}</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">{{
          $t('app.save')
        }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { Edit, Plus, Refresh } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { createAdminFaq, getAdminFaqs, updateAdminFaq, type AdminFaq } from '@/api/admin'

  defineOptions({ name: 'KnowledgeFaq' })

  const { t } = useI18n()

  type FaqRow = AdminFaq & { __toggling?: boolean }

  interface FaqForm {
    question: string
    answer: string
    priority: number
    enabled: boolean
  }

  const faqs = ref<FaqRow[]>([])
  const loading = ref(false)
  const saving = ref(false)

  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const editingId = ref('')
  const formRef = ref<FormInstance>()
  const keywordsText = ref('')

  function emptyForm(): FaqForm {
    return { question: '', answer: '', priority: 50, enabled: true }
  }

  const form = reactive<FaqForm>(emptyForm())

  const rules: FormRules = {
    question: [{ required: true, message: t('app.faqQuestionPlaceholder'), trigger: 'blur' }],
    answer: [{ required: true, message: t('app.faqAnswerPlaceholder'), trigger: 'blur' }]
  }

  function parseKeywords(text: string): string[] {
    return text
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function loadFaqs() {
    loading.value = true
    try {
      const data = await getAdminFaqs()
      faqs.value = (data || []).map((item) => ({ ...item, __toggling: false }))
    } catch {
      ElMessage.error(t('app.faqListFailed'))
    } finally {
      loading.value = false
    }
  }

  function resetForm() {
    Object.assign(form, emptyForm())
    keywordsText.value = ''
    editingId.value = ''
    formRef.value?.clearValidate()
  }

  function openCreate() {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }

  function openEdit(row: FaqRow) {
    isEdit.value = true
    editingId.value = row.id
    Object.assign(form, {
      question: row.question,
      answer: row.answer,
      priority: row.priority,
      enabled: row.enabled
    })
    keywordsText.value = (row.keywords || []).join('，')
    dialogVisible.value = true
  }

  async function handleSave() {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    const payload = { ...form, keywords: parseKeywords(keywordsText.value) }
    saving.value = true
    try {
      if (isEdit.value) {
        await updateAdminFaq(editingId.value, payload)
        ElMessage.success(t('app.faqUpdated'))
      } else {
        await createAdminFaq(payload)
        ElMessage.success(t('app.faqCreated'))
      }
      dialogVisible.value = false
      await loadFaqs()
    } catch {
      ElMessage.error(isEdit.value ? t('app.faqUpdateFailed') : t('app.faqCreateFailed'))
    } finally {
      saving.value = false
    }
  }

  async function handleToggle(row: FaqRow, val: boolean) {
    row.__toggling = true
    try {
      await updateAdminFaq(row.id, { enabled: val })
      ElMessage.success(val ? t('app.statusEnabled') : t('app.statusDisabled'))
    } catch {
      row.enabled = !val
      ElMessage.error(t('app.statusUpdateFailed'))
    } finally {
      row.__toggling = false
    }
  }

  onMounted(() => {
    loadFaqs()
  })
</script>

<style scoped lang="scss">
  .kn-faq {
    padding: 12px;
  }

  .toolbar-card {
    margin-bottom: 12px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .ops {
      display: flex;
      gap: 10px;
    }
  }

  .kw-tag {
    margin: 2px 4px 2px 0;
  }

  .muted {
    color: var(--el-text-color-secondary);
  }

  :deep(.el-icon) {
    margin-right: 4px;
    vertical-align: middle;
  }
</style>
