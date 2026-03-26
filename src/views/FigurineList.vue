<template>
  <Layout>
    <div class="figurine-list">
      <!-- 筛选栏 -->
      <el-card class="filter-card">
        <el-input v-model="searchText" placeholder="搜索名称..." clearable style="width: 200px" @change="handleSearch" />
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="handleFilterChange">
          <el-option label="在售" value="selling" />
          <el-option label="已出" value="sold" />
          <el-option label="囤货" value="holding" />
          <el-option label="待录入" value="pending" />
        </el-select>
        <el-select v-model="filterBatch" placeholder="批次" clearable style="width: 150px" @change="handleFilterChange">
          <el-option
            v-for="b in batchStore.batchOptions"
            :key="b.value"
            :label="b.label"
            :value="b.value"
          />
        </el-select>
        <el-select v-model="filterTag" placeholder="标签" clearable style="width: 150px" @change="handleFilterChange">
          <el-option
            v-for="t in tagStore.tagOptions"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          />
        </el-select>
        <el-button type="primary" class="add-btn" @click="showForm = true">
          <el-icon><Plus /></el-icon>
          新增手办
        </el-button>
      </el-card>

      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="4" animated />

      <!-- 卡片列表 -->
      <div v-else class="card-grid">
        <FigurineCard
          v-for="figurine in figurines"
          :key="figurine.id"
          :figurine="figurine"
          @click="handleEdit(figurine)"
          @delete="handleDelete(figurine)"
        />
        <el-empty v-if="figurines.length === 0" description="暂无数据" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 40, 60]"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchData"
          @size-change="handleSizeChange"
        />
      </div>

      <!-- 编辑弹窗 -->
      <FigurineForm
        v-model:visible="showForm"
        :figurine="editingFigurine"
        @saved="handleSaved"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import FigurineCard from '@/components/FigurineCard.vue'
import FigurineForm from '@/components/FigurineForm.vue'
import type { Figurine, FigurineWithTrade, FigurineStatus } from '@/types'
import { useFigurineStore } from '@/stores/figurine'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'

const figurineStore = useFigurineStore()
const batchStore = useBatchStore()
const tagStore = useTagStore()

// 列表数据（本地状态）
const figurines = ref<FigurineWithTrade[]>([])
const total = ref(0)
const loading = ref(false)

// 筛选状态
const searchText = ref('')
const filterStatus = ref('')
const filterBatch = ref('')
const filterTag = ref('')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 弹窗状态
const showForm = ref(false)
const editingFigurine = ref<Figurine>()

// 获取列表数据
async function fetchData() {
  loading.value = true
  try {
    const result = await figurineStore.fetchFigurinesPaginated(
      currentPage.value,
      pageSize.value,
      {
        status: filterStatus.value as FigurineStatus || undefined,
        batchId: filterBatch.value || undefined,
        tagId: filterTag.value || undefined,
        search: searchText.value || undefined,
      }
    )
    figurines.value = result.data
    total.value = result.total
  } finally {
    loading.value = false
  }
}

// 搜索（防抖，重置到第一页）
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 300)
}

// 筛选变化（重置到第一页）
function handleFilterChange() {
  currentPage.value = 1
  fetchData()
}

// 分页大小变化
function handleSizeChange() {
  currentPage.value = 1
  fetchData()
}

function handleEdit(figurine: FigurineWithTrade) {
  editingFigurine.value = figurine
  showForm.value = true
}

async function handleSaved() {
  editingFigurine.value = undefined
  await fetchData()
}

async function handleDelete(figurine: FigurineWithTrade) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${figurine.name}」吗？`,
      '确认删除',
      { type: 'warning' }
    )
    await figurineStore.removeFigurine(figurine.id)
    ElMessage.success('删除成功')
    // 如果当前页删除后为空，回到上一页
    if (figurines.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    await fetchData()
  } catch {
    // 用户取消
  }
}

onMounted(async () => {
  // 加载筛选选项数据
  await Promise.all([
    batchStore.fetchBatches(),
    tagStore.fetchTags(),
  ])
  // 加载列表数据
  await fetchData()
})
</script>

<style scoped>
.figurine-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 70px;
}

.filter-card {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  background: #fff !important;
  border-radius: var(--radius-md, 10px) !important;
  padding: 16px 20px !important;
}

.filter-card :deep(.el-input__wrapper),
.filter-card :deep(.el-select .el-input__wrapper) {
  border-radius: 8px !important;
  box-shadow: 0 0 0 1px var(--gray-200, #e4e4e7) !important;
  transition: all var(--transition-fast, 150ms) !important;
}

.filter-card :deep(.el-input__wrapper:hover),
.filter-card :deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--gray-300, #d4d4d8) !important;
}

.filter-card :deep(.el-input__wrapper.is-focus),
.filter-card :deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--primary-500, #4440d6) !important;
}

.add-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.pagination-wrapper {
  position: fixed;
  bottom: 0;
  left: 200px;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 16px 24px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  z-index: 100;
  border-top: 1px solid var(--gray-100, #f4f4f5);
}

.pagination-wrapper :deep(.el-pagination) {
  gap: 8px;
}

.pagination-wrapper :deep(.el-pager li) {
  border-radius: 8px !important;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  font-weight: 500;
}

.pagination-wrapper :deep(.el-pager li.is-active) {
  background: var(--primary-500, #4440d6) !important;
}

.pagination-wrapper :deep(.btn-prev),
.pagination-wrapper :deep(.btn-next) {
  border-radius: 8px !important;
}
</style>