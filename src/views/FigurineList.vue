<template>
  <Layout>
    <div class="figurine-list">
      <!-- 顶部操作栏 -->
      <div class="top-bar">
        <!-- 快捷状态筛选 -->
        <div class="status-tabs">
          <div
            v-for="tab in statusTabs"
            :key="tab.value"
            class="status-tab"
            :class="{ active: filterStatus === tab.value }"
            @click="handleStatusTab(tab.value)"
          >
            {{ tab.label }}
            <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <el-input
            v-model="searchText"
            placeholder="搜索名称..."
            clearable
            style="width: 200px"
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterBatch" placeholder="批次" clearable style="width: 140px" @change="handleFilterChange">
            <el-option
              v-for="b in batchStore.batchOptions"
              :key="b.value"
              :label="b.label"
              :value="b.value"
            />
          </el-select>
          <el-select v-model="filterTag" placeholder="标签" clearable style="width: 140px" @change="handleFilterChange">
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
        </div>
      </div>

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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import FigurineCard from '@/components/FigurineCard.vue'
import FigurineForm from '@/components/FigurineForm.vue'
import type { Figurine, FigurineWithTrade, FigurineStatus } from '@/types'
import { useFigurineStore } from '@/stores/figurine'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'

const route = useRoute()
const router = useRouter()

const figurineStore = useFigurineStore()
const batchStore = useBatchStore()
const tagStore = useTagStore()

// 列表数据
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

// 状态标签
const statusTabs = computed(() => [
  { label: '全部', value: '', count: figurineStore.figurines.length },
  { label: '在售', value: 'selling', count: figurineStore.figurines.filter(f => f.status === 'selling').length },
  { label: '已出', value: 'sold', count: figurineStore.figurines.filter(f => f.status === 'sold').length },
  { label: '囤货', value: 'holding', count: figurineStore.figurines.filter(f => f.status === 'holding').length },
  { label: '待录入', value: 'pending', count: figurineStore.figurines.filter(f => f.status === 'pending').length },
])

// 从 URL 参数初始化筛选
onMounted(async () => {
  // 从 query 读取初始筛选条件
  if (route.query.status) {
    filterStatus.value = route.query.status as string
  }
  if (route.query.batch) {
    filterBatch.value = route.query.batch as string
  }

  await Promise.all([
    batchStore.fetchBatches(),
    tagStore.fetchTags(),
    figurineStore.fetchFigurines()
  ])
  await fetchData()
})

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

// 状态标签切换
function handleStatusTab(status: string) {
  filterStatus.value = status
  currentPage.value = 1
  // 更新 URL（不触发导航）
  router.replace({ query: { ...route.query, status: status || undefined } })
  fetchData()
}

// 搜索（防抖）
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 300)
}

// 筛选变化
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
    if (figurines.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    await fetchData()
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.figurine-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 70px;
}

/* 顶部操作栏 */
.top-bar {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 状态标签 */
.status-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--gray-150);
  padding-bottom: 16px;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.status-tab:hover {
  background: var(--gray-50);
  color: var(--gray-700);
}

.status-tab.active {
  background: var(--primary-50);
  color: var(--primary-600);
}

.tab-count {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: var(--gray-100);
  color: var(--gray-600);
}

.status-tab.active .tab-count {
  background: var(--primary-100);
  color: var(--primary-700);
}

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.add-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

/* 分页 */
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
  border-top: 1px solid var(--gray-100);
}

.pagination-wrapper :deep(.el-pagination) {
  gap: 8px;
}

.pagination-wrapper :deep(.el-pager li) {
  border-radius: var(--radius-sm) !important;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  font-weight: 500;
}

.pagination-wrapper :deep(.el-pager li.is-active) {
  background: var(--primary-500) !important;
}

@media (max-width: 768px) {
  .status-tabs {
    overflow-x: auto;
    padding-bottom: 12px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    margin-left: 0;
  }
}
</style>