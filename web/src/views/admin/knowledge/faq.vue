<!--
  常见问题（FAQ）管理：列表增改、关键词标签、优先级、启用状态开关。
-->
<template>
  <div class="kn-faq">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span class="title">FAQ 管理</span>
        <div class="ops">
          <ElButton :loading="loading" @click="loadFaqs">
            <ElIcon><Refresh /></ElIcon>
            <span>刷新</span>
          </ElButton>
          <ElButton type="primary" @click="openCreate">
            <ElIcon><Plus /></ElIcon>
            <span>新增</span>
          </ElButton>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable v-loading="loading" :data="faqs" stripe border>
        <ElTableColumn prop="question" label="问题" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="answer" label="答案" min-width="240" show-overflow-tooltip />
        <ElTableColumn label="关键词" min-width="180">
          <template #default="{ row }">
            <ElTag v-for="kw in row.keywords" :key="kw" size="small" type="info" class="kw-tag">{{ kw }}</ElTag>
            <span v-if="!row.keywords?.length" class="muted">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="priority" label="优先级" width="100" align="center" sortable />
        <ElTableColumn label="启用" width="90" align="center">
          <template #default="{ row }">
            <ElSwitch v-model="row.enabled" :loading="row.__toggling" @change="(val) => handleToggle(row, Boolean(val))" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click="openEdit(row)">
              <ElIcon><Edit /></ElIcon>
              <span>编辑</span>
            </ElButton>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无 FAQ 数据" />
        </template>
      </ElTable>
    </ElCard>

    <!-- 新增 / 编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="isEdit ? '编辑 FAQ' : '新增 FAQ'" width="620px" @closed="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="88px">
        <ElFormItem label="问题" prop="question">
          <ElInput v-model="form.question" placeholder="请输入问题" />
        </ElFormItem>
        <ElFormItem label="答案" prop="answer">
          <ElInput v-model="form.answer" type="textarea" :rows="4" placeholder="请输入答案" />
        </ElFormItem>
        <ElFormItem label="关键词">
          <ElInput v-model="keywordsText" placeholder="多个关键词以逗号分隔" />
        </ElFormItem>
        <ElFormItem label="优先级">
          <ElInputNumber v-model="form.priority" :min="0" :max="999" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Edit, Plus, Refresh } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { createAdminFaq, getAdminFaqs, updateAdminFaq, type AdminFaq } from '@/api/admin'

  defineOptions({ name: 'KnowledgeFaq' })

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
    question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
    answer: [{ required: true, message: '请输入答案', trigger: 'blur' }]
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
      ElMessage.error('FAQ 列表加载失败')
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
        ElMessage.success('FAQ 更新成功')
      } else {
        await createAdminFaq(payload)
        ElMessage.success('FAQ 创建成功')
      }
      dialogVisible.value = false
      await loadFaqs()
    } catch {
      ElMessage.error(isEdit.value ? 'FAQ 更新失败' : 'FAQ 创建失败')
    } finally {
      saving.value = false
    }
  }

  async function handleToggle(row: FaqRow, val: boolean) {
    row.__toggling = true
    try {
      await updateAdminFaq(row.id, { enabled: val })
      ElMessage.success(val ? '已启用' : '已停用')
    } catch {
      row.enabled = !val
      ElMessage.error('状态更新失败')
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
