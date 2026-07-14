<!--
  景点知识管理：景点列表的增删改查（新增 / 编辑 / 停用）。
-->
<template>
  <div class="kn-spots">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span class="title">景点管理</span>
        <div class="ops">
          <ElButton :loading="loading" @click="loadSpots">
            <ElIcon><Refresh /></ElIcon>
            <span>刷新</span>
          </ElButton>
          <ElButton type="primary" @click="openCreate">
            <ElIcon><Plus /></ElIcon>
            <span>新增景点</span>
          </ElButton>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable v-loading="loading" :data="spots" stripe border>
        <ElTableColumn prop="id" label="ID" width="120" show-overflow-tooltip />
        <ElTableColumn prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <ElTableColumn prop="scenicArea" label="所属景区" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="别名" min-width="200">
          <template #default="{ row }">
            <ElTag v-for="alias in row.aliases" :key="alias" size="small" class="alias-tag">
              {{ alias }}
            </ElTag>
            <span v-if="!row.aliases?.length" class="muted">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="openInfo" label="开放信息" min-width="180" show-overflow-tooltip />
        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click="openEdit(row)">
              <ElIcon><Edit /></ElIcon>
              <span>编辑</span>
            </ElButton>
            <ElPopconfirm title="确定停用该景点吗？" confirm-button-text="停用" cancel-button-text="取消" @confirm="handleDisable(row)">
              <template #reference>
                <ElButton type="danger" link>
                  <ElIcon><CircleClose /></ElIcon>
                  <span>停用</span>
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty description="暂无景点数据" />
        </template>
      </ElTable>
    </ElCard>

    <!-- 新增 / 编辑弹窗 -->
    <ElDialog v-model="dialogVisible" :title="isEdit ? '编辑景点' : '新增景点'" width="720px" @closed="resetForm">
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="96px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="名称" prop="name">
              <ElInput v-model="form.name" placeholder="请输入景点名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="所属景区">
              <ElInput v-model="form.scenicArea" placeholder="请输入所属景区" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="别名">
          <ElInput v-model="aliasesText" placeholder="多个别名以逗号分隔" />
        </ElFormItem>
        <ElFormItem label="位置说明">
          <ElInput v-model="form.locationText" placeholder="请输入位置说明" />
        </ElFormItem>
        <ElFormItem label="基本参数">
          <ElInput v-model="form.parameters" type="textarea" :rows="2" placeholder="高度、面积等基本参数" />
        </ElFormItem>
        <ElFormItem label="核心功能">
          <ElInput v-model="form.coreFunction" type="textarea" :rows="2" placeholder="请输入核心功能" />
        </ElFormItem>
        <ElFormItem label="文化背景">
          <ElInput v-model="form.culture" type="textarea" :rows="2" placeholder="请输入文化背景" />
        </ElFormItem>
        <ElFormItem label="详细介绍">
          <ElInput v-model="form.detail" type="textarea" :rows="3" placeholder="请输入详细介绍" />
        </ElFormItem>
        <ElFormItem label="亮点看点">
          <ElInput v-model="form.highlights" type="textarea" :rows="2" placeholder="请输入亮点看点" />
        </ElFormItem>
        <ElFormItem label="开放信息">
          <ElInput v-model="form.openInfo" placeholder="开放时间、票价等" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.notes" type="textarea" :rows="2" placeholder="请输入备注" />
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
  import { CircleClose, Edit, Plus, Refresh } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { createAdminSpot, deleteAdminSpot, getAdminSpots, updateAdminSpot } from '@/api/admin'
  import type { ScenicSpot } from '@/api/guide'

  defineOptions({ name: 'KnowledgeSpots' })

  type SpotForm = Omit<ScenicSpot, 'id' | 'aliases'>

  const spots = ref<ScenicSpot[]>([])
  const loading = ref(false)
  const saving = ref(false)

  const dialogVisible = ref(false)
  const isEdit = ref(false)
  const editingId = ref('')
  const formRef = ref<FormInstance>()
  const aliasesText = ref('')

  function emptyForm(): SpotForm {
    return {
      scenicArea: '',
      name: '',
      locationText: '',
      parameters: '',
      coreFunction: '',
      culture: '',
      detail: '',
      highlights: '',
      openInfo: '',
      notes: ''
    }
  }

  const form = reactive<SpotForm>(emptyForm())

  const rules: FormRules = {
    name: [{ required: true, message: '请输入景点名称', trigger: 'blur' }]
  }

  function parseAliases(text: string): string[] {
    return text
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function loadSpots() {
    loading.value = true
    try {
      spots.value = await getAdminSpots()
    } catch {
      ElMessage.error('景点列表加载失败')
    } finally {
      loading.value = false
    }
  }

  function resetForm() {
    Object.assign(form, emptyForm())
    aliasesText.value = ''
    editingId.value = ''
    formRef.value?.clearValidate()
  }

  function openCreate() {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }

  function openEdit(row: ScenicSpot) {
    isEdit.value = true
    editingId.value = row.id
    Object.assign(form, {
      scenicArea: row.scenicArea,
      name: row.name,
      locationText: row.locationText,
      parameters: row.parameters,
      coreFunction: row.coreFunction,
      culture: row.culture,
      detail: row.detail,
      highlights: row.highlights,
      openInfo: row.openInfo,
      notes: row.notes
    })
    aliasesText.value = (row.aliases || []).join('，')
    dialogVisible.value = true
  }

  async function handleSave() {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    const payload = { ...form, aliases: parseAliases(aliasesText.value) }
    saving.value = true
    try {
      if (isEdit.value) {
        await updateAdminSpot(editingId.value, payload)
        ElMessage.success('景点更新成功')
      } else {
        await createAdminSpot(payload)
        ElMessage.success('景点创建成功')
      }
      dialogVisible.value = false
      await loadSpots()
    } catch {
      ElMessage.error(isEdit.value ? '景点更新失败' : '景点创建失败')
    } finally {
      saving.value = false
    }
  }

  async function handleDisable(row: ScenicSpot) {
    try {
      await deleteAdminSpot(row.id)
      ElMessage.success('景点已停用')
      await loadSpots()
    } catch {
      ElMessage.error('停用失败')
    }
  }

  onMounted(() => {
    loadSpots()
  })
</script>

<style scoped lang="scss">
  .kn-spots {
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

  .alias-tag {
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
