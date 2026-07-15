<!-- 系统用户管理（产品闭环）：管理员/运营账号的增删改与角色、状态维护。 -->
<template>
  <div class="user-admin">
    <div class="toolbar">
      <ElButton type="primary" @click="openCreate">{{ $t('app.usersAdd') }}</ElButton>
      <ElButton @click="load">{{ $t('app.refresh') }}</ElButton>
    </div>

    <ElTable :data="users" v-loading="loading" border>
      <ElTableColumn prop="username" :label="$t('app.usersLoginName')" min-width="140" />
      <ElTableColumn prop="displayName" :label="$t('app.usersDisplayName')" min-width="140" />
      <ElTableColumn :label="$t('app.usersRole')" width="130">
        <template #default="{ row }">
          <ElTag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? $t('app.usersAdmin') : $t('app.usersOperator') }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn :label="$t('app.status')" width="100">
        <template #default="{ row }">
          <ElTag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? $t('app.usersActive') : $t('app.disable') }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" :label="$t('app.createdAt')" min-width="180" />
      <ElTableColumn :label="$t('app.actions')" width="230" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" text type="primary" @click="openEdit(row)">{{
            $t('app.edit')
          }}</ElButton>
          <ElButton
            size="small"
            text
            :type="row.status === 'active' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'active' ? $t('app.disable') : $t('app.enabled') }}
          </ElButton>
          <ElPopconfirm :title="$t('app.usersDeleteConfirm')" @confirm="remove(row)">
            <template #reference>
              <ElButton size="small" text type="danger" :disabled="row.username === 'admin'">
                {{ $t('app.usersDelete') }}
              </ElButton>
            </template>
          </ElPopconfirm>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog
      v-model="dialogVisible"
      :title="editing ? $t('app.usersEdit') : $t('app.usersAdd')"
      width="480px"
    >
      <ElForm :model="form" label-width="90px">
        <ElFormItem :label="$t('app.usersLoginName')" required>
          <ElInput
            v-model="form.username"
            :disabled="editing"
            :placeholder="$t('app.usersUsernamePlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.usersDisplayName')">
          <ElInput v-model="form.displayName" />
        </ElFormItem>
        <ElFormItem
          :label="editing ? $t('app.usersResetPassword') : $t('app.usersPassword')"
          :required="!editing"
        >
          <ElInput
            v-model="form.password"
            type="password"
            show-password
            :placeholder="
              editing ? $t('app.usersKeepPassword') : $t('app.usersPasswordPlaceholder')
            "
          />
        </ElFormItem>
        <ElFormItem :label="$t('app.usersRole')">
          <ElSelect v-model="form.role">
            <ElOption :label="$t('app.usersAdmin')" value="admin" />
            <ElOption :label="$t('app.usersOperator')" value="operator" />
          </ElSelect>
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
  import { useI18n } from 'vue-i18n'
  import { onMounted, reactive, ref } from 'vue'
  import {
    getAdminUsers,
    createAdminUser2,
    updateAdminUser,
    deleteAdminUser,
    type AdminUser
  } from '@/api/admin'

  defineOptions({ name: 'SystemUsers' })

  const { t } = useI18n()

  const users = ref<AdminUser[]>([])
  const loading = ref(false)
  const dialogVisible = ref(false)
  const editing = ref(false)
  const saving = ref(false)
  const editingId = ref('')

  const emptyForm = () => ({ username: '', displayName: '', password: '', role: 'operator' })
  const form = reactive(emptyForm())

  async function load() {
    loading.value = true
    try {
      users.value = await getAdminUsers()
    } catch {
      ElMessage.error(t('app.usersListFailed'))
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    Object.assign(form, emptyForm())
    editing.value = false
    editingId.value = ''
    dialogVisible.value = true
  }

  function openEdit(row: AdminUser) {
    Object.assign(form, {
      username: row.username,
      displayName: row.displayName,
      password: '',
      role: row.role
    })
    editing.value = true
    editingId.value = row.id
    dialogVisible.value = true
  }

  async function save() {
    if (!form.username.trim() || (!editing.value && !form.password)) {
      ElMessage.warning(t('app.usersRequired'))
      return
    }
    saving.value = true
    try {
      if (editing.value) {
        await updateAdminUser(editingId.value, {
          displayName: form.displayName,
          role: form.role as AdminUser['role'],
          ...(form.password ? { password: form.password } : {})
        })
      } else {
        await createAdminUser2({ ...form })
      }
      ElMessage.success(t('app.dhSaved'))
      dialogVisible.value = false
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || t('app.dhSaveFailed'))
    } finally {
      saving.value = false
    }
  }

  async function toggleStatus(row: AdminUser) {
    try {
      await updateAdminUser(row.id, { status: row.status === 'active' ? 'disabled' : 'active' })
      await load()
    } catch {
      ElMessage.error(t('app.usersActionFailed'))
    }
  }

  async function remove(row: AdminUser) {
    try {
      await deleteAdminUser(row.id)
      ElMessage.success(t('app.usersDeleted'))
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || t('app.usersDeleteFailed'))
    }
  }

  onMounted(load)
</script>

<style scoped lang="scss">
  .user-admin {
    padding: 12px;
  }

  .toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }
</style>
