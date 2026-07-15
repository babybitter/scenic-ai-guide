<!--
  景点知识管理：景点列表的增删改查（新增 / 编辑 / 停用）。
-->
<template>
  <div class="kn-spots">
    <ElCard shadow="never" class="toolbar-card">
      <div class="toolbar">
        <span class="title">{{ $t('app.spotsTitle') }}</span>
        <div class="ops">
          <ElButton :loading="loading" @click="loadSpots">
            <ElIcon><Refresh /></ElIcon>
            <span>{{ $t('app.refresh') }}</span>
          </ElButton>
          <ElButton type="primary" @click="openCreate">
            <ElIcon><Plus /></ElIcon>
            <span>{{ $t('app.spotsAdd') }}</span>
          </ElButton>
        </div>
      </div>
    </ElCard>

    <ElCard shadow="never">
      <ElTable v-loading="loading" :data="spots" stripe border>
        <ElTableColumn prop="id" label="ID" width="120" show-overflow-tooltip />
        <ElTableColumn prop="name" :label="$t('app.name')" min-width="140" show-overflow-tooltip />
        <ElTableColumn
          prop="scenicArea"
          :label="$t('app.spotsArea')"
          min-width="140"
          show-overflow-tooltip
        />
        <ElTableColumn :label="$t('app.spotsAliases')" min-width="200">
          <template #default="{ row }">
            <ElTag v-for="alias in row.aliases" :key="alias" size="small" class="alias-tag">
              {{ alias }}
            </ElTag>
            <span v-if="!row.aliases?.length" class="muted">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="openInfo"
          :label="$t('app.spotsOpenInfo')"
          min-width="180"
          show-overflow-tooltip
        />
        <ElTableColumn :label="$t('app.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click="openEdit(row)">
              <ElIcon><Edit /></ElIcon>
              <span>{{ $t('app.edit') }}</span>
            </ElButton>
            <ElPopconfirm
              :title="$t('app.spotsDisableConfirm')"
              :confirm-button-text="$t('app.disable')"
              :cancel-button-text="$t('app.cancel')"
              @confirm="handleDisable(row)"
            >
              <template #reference>
                <ElButton type="danger" link>
                  <ElIcon><CircleClose /></ElIcon>
                  <span>{{ $t('app.disable') }}</span>
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
        <template #empty>
          <ElEmpty :description="$t('app.spotsEmpty')" />
        </template>
      </ElTable>
    </ElCard>

    <!-- 新增 / 编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="isEdit ? $t('app.spotsEdit') : $t('app.spotsAdd')"
      width="720px"
      @closed="resetForm"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="96px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem :label="$t('app.name')" prop="name">
              <ElInput v-model="form.name" :placeholder="$t('app.spotsNamePlaceholder')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('app.spotsArea')">
              <ElInput v-model="form.scenicArea" :placeholder="$t('app.spotsAreaPlaceholder')" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem :label="$t('app.spotsAliases')">
          <ElInput v-model="aliasesText" :placeholder="$t('app.spotsAliasesPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsLocation')">
          <ElInput v-model="form.locationText" :placeholder="$t('app.spotsLocationPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsParameters')">
          <ElInput
            v-model="form.parameters"
            type="textarea"
            :rows="2"
            :placeholder="$t('app.spotsParametersPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsCore')">
          <ElInput
            v-model="form.coreFunction"
            type="textarea"
            :rows="2"
            :placeholder="$t('app.spotsCorePlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsCulture')">
          <ElInput
            v-model="form.culture"
            type="textarea"
            :rows="2"
            :placeholder="$t('app.spotsCulturePlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsDetail')">
          <ElInput
            v-model="form.detail"
            type="textarea"
            :rows="3"
            :placeholder="$t('app.spotsDetailPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsHighlights')">
          <ElInput
            v-model="form.highlights"
            type="textarea"
            :rows="2"
            :placeholder="$t('app.spotsHighlightsPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsOpenInfo')">
          <ElInput v-model="form.openInfo" :placeholder="$t('app.spotsOpenPlaceholder')" />
        </ElFormItem>
        <ElFormItem :label="$t('app.spotsNotes')">
          <ElInput
            v-model="form.notes"
            type="textarea"
            :rows="2"
            :placeholder="$t('app.spotsNotesPlaceholder')"
          />
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
  import { CircleClose, Edit, Plus, Refresh } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { createAdminSpot, deleteAdminSpot, getAdminSpots, updateAdminSpot } from '@/api/admin'
  import type { ScenicSpot } from '@/api/guide'

  defineOptions({ name: 'KnowledgeSpots' })

  const { t } = useI18n()

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
    name: [{ required: true, message: t('app.spotsNamePlaceholder'), trigger: 'blur' }]
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
      ElMessage.error(t('app.spotsListFailed'))
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
        ElMessage.success(t('app.spotsUpdated'))
      } else {
        await createAdminSpot(payload)
        ElMessage.success(t('app.spotsCreated'))
      }
      dialogVisible.value = false
      await loadSpots()
    } catch {
      ElMessage.error(isEdit.value ? t('app.spotsUpdateFailed') : t('app.spotsCreateFailed'))
    } finally {
      saving.value = false
    }
  }

  async function handleDisable(row: ScenicSpot) {
    try {
      await deleteAdminSpot(row.id)
      ElMessage.success(t('app.spotsDisabled'))
      await loadSpots()
    } catch {
      ElMessage.error(t('app.disableFailed'))
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
