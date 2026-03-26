<template>
  <Layout>
    <div class="batch-manage">
      <!-- 顶部操作栏 -->
      <el-card class="toolbar">
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增批次
        </el-button>
      </el-card>

      <!-- 批次列表 -->
      <el-card>
        <el-table :data="batchStore.batches" style="width: 100%">
          <el-table-column prop="name" label="批次名称" />
          <el-table-column prop="imageRange" label="图片范围" width="120" />
          <el-table-column label="手办数" width="100">
            <template #default="{ row }">
              {{ getFigurineCount(row.id) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalShipping" label="总运费" width="120">
            <template #default="{ row }">
              {{ row.totalShipping ? `¥${row.totalShipping}` : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalTax" label="总税费" width="120">
            <template #default="{ row }">
              {{ row.totalTax ? `¥${row.totalTax}` : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="shareMode" label="分摊方式" width="100">
            <template #default="{ row }">
              {{ row.shareMode === 'average' ? '均摊' : '自定义' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" @click="handleEdit(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" @click="handleCostShare(row)">
                  <el-icon><Coin /></el-icon>
                  分摊
                </el-button>
                <el-button size="small" type="danger" plain @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 批次表单 -->
      <BatchForm
        v-model:visible="showForm"
        :batch="editingBatch"
        @saved="handleSaved"
      />

      <!-- 费用分摊弹窗 -->
      <CostShareDialog
        v-model:visible="showCostShare"
        :batch="costShareBatch"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Coin, Delete } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import BatchForm from '@/components/BatchForm.vue'
import CostShareDialog from '@/components/CostShareDialog.vue'
import type { Batch } from '@/types'
import { useBatchStore } from '@/stores/batch'
import { useFigurineStore } from '@/stores/figurine'

const batchStore = useBatchStore()
const figurineStore = useFigurineStore()

const showForm = ref(false)
const editingBatch = ref<Batch>()
const showCostShare = ref(false)
const costShareBatch = ref<Batch>()

function getFigurineCount(batchId: string): number {
  return figurineStore.figurines.filter(f => f.batchId === batchId).length
}

function handleAdd() {
  editingBatch.value = undefined
  showForm.value = true
}

function handleEdit(batch: Batch) {
  editingBatch.value = batch
  showForm.value = true
}

function handleCostShare(batch: Batch) {
  costShareBatch.value = batch
  showCostShare.value = true
}

async function handleDelete(batch: Batch) {
  const count = getFigurineCount(batch.id)
  try {
    await ElMessageBox.confirm(
      `该批次有 ${count} 个手办，删除后手办将解除关联，确定删除？`,
      '确认删除',
      { type: 'warning' }
    )
    await batchStore.removeBatch(batch.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

function handleSaved() {
  editingBatch.value = undefined
}

onMounted(async () => {
  await Promise.all([
    batchStore.fetchBatches(),
    figurineStore.fetchFigurines()
  ])
})
</script>

<style scoped>
.batch-manage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  gap: 10px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.action-buttons .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>