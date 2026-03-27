<template>
  <Layout>
    <div class="batch-manage">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">批次管理</h2>
        <p class="page-desc">管理手办批次，设置费用分摊</p>
      </div>

      <!-- 统计概览 -->
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-value">{{ batchStore.batches.length }}</span>
          <span class="stat-label">批次总数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalFigurines }}</span>
          <span class="stat-label">手办总数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalShipping }}</span>
          <span class="stat-label">总运费</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalTax }}</span>
          <span class="stat-label">总税费</span>
        </div>
      </div>

      <!-- 批次列表 -->
      <div class="batch-list">
        <div class="list-header">
          <h3 class="list-title">批次列表</h3>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增批次
          </el-button>
        </div>

        <div v-if="batchStore.batches.length > 0" class="batch-grid">
          <div
            v-for="batch in batchStore.batches"
            :key="batch.id"
            class="batch-card"
          >
            <div class="batch-header">
              <h4 class="batch-name">{{ batch.name }}</h4>
              <el-tag v-if="batch.imageRange" size="small" type="info">
                图片 {{ batch.imageRange }}
              </el-tag>
            </div>

            <div class="batch-stats">
              <div class="batch-stat">
                <span class="stat-num">{{ batch.figurineCount }}</span>
                <span class="stat-text">件手办</span>
              </div>
              <div class="batch-stat">
                <span class="stat-num">{{ batch.totalShipping ? `¥${batch.totalShipping}` : '-' }}</span>
                <span class="stat-text">运费</span>
              </div>
              <div class="batch-stat">
                <span class="stat-num">{{ batch.totalTax ? `¥${batch.totalTax}` : '-' }}</span>
                <span class="stat-text">税费</span>
              </div>
            </div>

            <div class="batch-footer">
              <el-tag
                :type="batch.totalShipping || batch.totalTax ? 'success' : 'warning'"
                size="small"
              >
                {{ batch.totalShipping || batch.totalTax ? '已设置费用' : '待设置费用' }}
              </el-tag>

              <div class="batch-actions">
                <el-button size="small" link @click="handleEdit(batch)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" link @click="handleCostShare(batch)">
                  <el-icon><Coin /></el-icon>
                  分摊
                </el-button>
                <el-button size="small" link type="danger" @click="handleDelete(batch)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无批次，点击右上角添加" />
      </div>

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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Coin, Delete } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import BatchForm from '@/components/BatchForm.vue'
import CostShareDialog from '@/components/CostShareDialog.vue'
import type { Batch, BatchWithCount } from '@/types'
import { useBatchStore } from '@/stores/batch'

const batchStore = useBatchStore()

const showForm = ref(false)
const editingBatch = ref<Batch>()
const showCostShare = ref(false)
const costShareBatch = ref<Batch>()

// 统计数据（从批次数据聚合）
const totalFigurines = computed(() =>
  batchStore.batches.reduce((sum, b) => sum + b.figurineCount, 0)
)

const totalShipping = computed(() => {
  const total = batchStore.batches.reduce((sum, b) => sum + (b.totalShipping || 0), 0)
  return `¥${total.toFixed(2)}`
})

const totalTax = computed(() => {
  const total = batchStore.batches.reduce((sum, b) => sum + (b.totalTax || 0), 0)
  return `¥${total.toFixed(2)}`
})

function handleAdd() {
  editingBatch.value = undefined
  showForm.value = true
}

function handleEdit(batch: BatchWithCount) {
  editingBatch.value = batch
  showForm.value = true
}

function handleCostShare(batch: BatchWithCount) {
  costShareBatch.value = batch
  showCostShare.value = true
}

async function handleDelete(batch: BatchWithCount) {
  try {
    await ElMessageBox.confirm(
      batch.figurineCount > 0
        ? `该批次有 ${batch.figurineCount} 个手办，删除后手办将解除关联，确定删除？`
        : '确定删除该批次？',
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
  await batchStore.fetchBatches()
})
</script>

<style scoped>
.batch-manage {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 8px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--gray-800);
}

.page-desc {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--gray-500);
}

/* 统计行 */
.stat-row {
  display: flex;
  gap: 24px;
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-800);
}

.stat-item .stat-label {
  font-size: 13px;
  color: var(--gray-500);
}

/* 批次列表 */
.batch-list {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
}

/* 批次卡片网格 */
.batch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.batch-card {
  border: 1px solid var(--gray-150);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: all var(--transition-fast);
}

.batch-card:hover {
  border-color: var(--primary-200);
  box-shadow: var(--shadow-sm);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.batch-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
}

.batch-stats {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid var(--gray-100);
  border-bottom: 1px solid var(--gray-100);
  margin-bottom: 12px;
}

.batch-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-num {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-800);
}

.stat-text {
  font-size: 11px;
  color: var(--gray-500);
}

.batch-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-actions {
  display: flex;
  gap: 4px;
}

.batch-actions .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>