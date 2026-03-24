<template>
  <Layout>
    <div class="tag-manage">
      <!-- 顶部操作栏 -->
      <el-card class="toolbar">
        <el-button type="primary" @click="handleAdd">+ 新增标签</el-button>
      </el-card>

      <!-- 标签列表 -->
      <el-card>
        <div class="tag-list">
          <div v-for="tag in tagStore.tags" :key="tag.id" class="tag-item">
            <el-tag :color="tag.color" effect="dark" class="tag-display">
              {{ tag.name }}
            </el-tag>
            <div class="tag-actions">
              <el-button size="small" @click="handleEdit(tag)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(tag)">删除</el-button>
            </div>
          </div>
          <el-empty v-if="tagStore.tags.length === 0" description="暂无标签" />
        </div>
      </el-card>

      <!-- 编辑弹窗 -->
      <el-dialog
        v-model="showForm"
        :title="isEdit ? '编辑标签' : '新增标签'"
        width="400px"
      >
        <el-form :model="form" label-width="80px">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" placeholder="标签名称" />
          </el-form-item>
          <el-form-item label="颜色">
            <el-color-picker v-model="form.color" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showForm = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            保存
          </el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { Tag } from '@/types'
import { useTagStore } from '@/stores/tag'

const tagStore = useTagStore()

const showForm = ref(false)
const editingTag = ref<Tag>()
const saving = ref(false)

const form = ref({
  name: '',
  color: '#409EFF'
})

const isEdit = computed(() => !!editingTag.value)

function handleAdd() {
  editingTag.value = undefined
  form.value = { name: '', color: '#409EFF' }
  showForm.value = true
}

function handleEdit(tag: Tag) {
  editingTag.value = tag
  form.value = {
    name: tag.name,
    color: tag.color || '#409EFF'
  }
  showForm.value = true
}

async function handleDelete(tag: Tag) {
  try {
    await ElMessageBox.confirm(
      `确定删除标签"${tag.name}"吗？`,
      '确认删除',
      { type: 'warning' }
    )
    await tagStore.removeTag(tag.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }

  saving.value = true
  try {
    if (isEdit.value && editingTag.value) {
      await tagStore.updateTag(editingTag.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await tagStore.addTag(form.value)
      ElMessage.success('添加成功')
    }
    showForm.value = false
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  tagStore.fetchTags()
})
</script>

<style scoped>
.tag-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.tag-display {
  min-width: 60px;
  text-align: center;
}

.tag-actions {
  display: flex;
  gap: 8px;
}
</style>