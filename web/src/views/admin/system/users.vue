<!-- 系统用户管理（产品闭环）：管理员/运营账号的增删改与角色、状态维护。 -->
<template>
  <div class="user-admin">
    <div class="toolbar">
      <ElButton type="primary" @click="openCreate">新增账号</ElButton>
      <ElButton @click="load">刷新</ElButton>
    </div>

    <ElTable :data="users" v-loading="loading" border>
      <ElTableColumn prop="username" label="登录名" min-width="140" />
      <ElTableColumn prop="displayName" label="显示名称" min-width="140" />
      <ElTableColumn label="角色" width="120">
        <template #default="{ row }">
          <ElTag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '运营' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '正常' : '停用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="创建时间" min-width="180" />
      <ElTableColumn label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <ElButton size="small" text type="primary" @click="openEdit(row)">编辑</ElButton>
          <ElButton
            size="small"
            text
            :type="row.status === 'active' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'active' ? '停用' : '启用' }}
          </ElButton>
          <ElPopconfirm title="确认删除该账号？" @confirm="remove(row)">
            <template #reference>
              <ElButton size="small" text type="danger" :disabled="row.username === 'admin'">删除</ElButton>
            </template>
          </ElPopconfirm>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="dialogVisible" :title="editing ? '编辑账号' : '新增账号'" width="480px">
      <ElForm :model="form" label-width="90px">
        <ElFormItem label="登录名" required>
          <ElInput v-model="form.username" :disabled="editing" placeholder="用于登录的用户名" />
        </ElFormItem>
        <ElFormItem label="显示名称">
          <ElInput v-model="form.displayName" />
        </ElFormItem>
        <ElFormItem :label="editing ? '重置密码' : '密码'" :required="!editing">
          <ElInput v-model="form.password" type="password" show-password :placeholder="editing ? '留空则不修改' : '设置登录密码'" />
        </ElFormItem>
        <ElFormItem label="角色">
          <ElSelect v-model="form.role">
            <ElOption label="管理员" value="admin" />
            <ElOption label="运营" value="operator" />
          </ElSelect>
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
    getAdminUsers,
    createAdminUser2,
    updateAdminUser,
    deleteAdminUser,
    type AdminUser
  } from '@/api/admin'

  defineOptions({ name: 'SystemUsers' })

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
      ElMessage.error('用户列表加载失败')
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
    Object.assign(form, { username: row.username, displayName: row.displayName, password: '', role: row.role })
    editing.value = true
    editingId.value = row.id
    dialogVisible.value = true
  }

  async function save() {
    if (!form.username.trim() || (!editing.value && !form.password)) {
      ElMessage.warning('请填写登录名和密码')
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
      ElMessage.success('已保存')
      dialogVisible.value = false
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      saving.value = false
    }
  }

  async function toggleStatus(row: AdminUser) {
    try {
      await updateAdminUser(row.id, { status: row.status === 'active' ? 'disabled' : 'active' })
      await load()
    } catch {
      ElMessage.error('操作失败')
    }
  }

  async function remove(row: AdminUser) {
    try {
      await deleteAdminUser(row.id)
      ElMessage.success('已删除')
      await load()
    } catch (e: any) {
      ElMessage.error(e?.message || '删除失败')
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
