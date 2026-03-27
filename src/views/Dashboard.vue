<template>
  <Layout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <div class="stat-grid">
        <div class="stat-card expense">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">总投入</div>
            <div class="stat-value">¥ {{ stats.totalCost.toFixed(2) }}</div>
          </div>
        </div>
        <div class="stat-card income">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">总收益</div>
            <div class="stat-value">¥ {{ stats.totalIncome.toFixed(2) }}</div>
          </div>
        </div>
        <div class="stat-card profit">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 8l-4 4-4-4M8 16l4-4 4 4"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">总利润</div>
            <div class="stat-value">¥ {{ stats.totalProfit.toFixed(2) }}</div>
          </div>
        </div>
        <div class="stat-card rate">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">平均利润率</div>
            <div class="stat-value">{{ stats.avgProfitRate.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <!-- 两列布局 -->
      <div class="main-grid">
        <!-- 左侧：库存状态 + 快捷操作 -->
        <div class="left-section">
          <!-- 库存状态（可点击跳转） -->
          <div class="status-section">
            <h3 class="section-title">库存状态</h3>
            <div class="status-grid">
              <div class="status-item selling" @click="navigateToFigurines('selling')">
                <div class="status-dot"></div>
                <div class="status-info">
                  <span class="status-name">在售</span>
                  <span class="status-count">{{ stats.statusCounts?.selling || 0 }}</span>
                </div>
                <el-icon class="status-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="status-item sold" @click="navigateToFigurines('sold')">
                <div class="status-dot"></div>
                <div class="status-info">
                  <span class="status-name">已出</span>
                  <span class="status-count">{{ stats.statusCounts?.sold || 0 }}</span>
                </div>
                <el-icon class="status-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="status-item holding" @click="navigateToFigurines('holding')">
                <div class="status-dot"></div>
                <div class="status-info">
                  <span class="status-name">囤货</span>
                  <span class="status-count">{{ stats.statusCounts?.holding || 0 }}</span>
                </div>
                <el-icon class="status-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="status-item pending" @click="navigateToFigurines('pending')">
                <div class="status-dot"></div>
                <div class="status-info">
                  <span class="status-name">待录入</span>
                  <span class="status-count">{{ stats.statusCounts?.pending || 0 }}</span>
                </div>
                <el-icon class="status-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <h3 class="section-title">快捷操作</h3>
            <div class="action-grid">
              <div class="action-item" @click="$router.push('/figurines')">
                <div class="action-icon add">
                  <el-icon><Plus /></el-icon>
                </div>
                <span>新增手办</span>
              </div>
              <div class="action-item" @click="$router.push('/batches')">
                <div class="action-icon batch">
                  <el-icon><Box /></el-icon>
                </div>
                <span>批次管理</span>
              </div>
              <div class="action-item" @click="$router.push('/trades')">
                <div class="action-icon trade">
                  <el-icon><Money /></el-icon>
                </div>
                <span>交易记录</span>
              </div>
              <div class="action-item" @click="handleSelectImageDir">
                <div class="action-icon folder">
                  <el-icon><FolderOpened /></el-icon>
                </div>
                <span>图片目录</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：批次概览 -->
        <div class="right-section">
          <div class="batch-overview">
            <div class="section-header">
              <h3 class="section-title">批次概览</h3>
              <el-button size="small" link @click="$router.push('/batches')">
                查看全部
              </el-button>
            </div>
            <div v-if="batchStore.batches.length > 0" class="batch-list">
              <div
                v-for="batch in batchStore.batches.slice(0, 5)"
                :key="batch.id"
                class="batch-item"
                @click="navigateToBatch(batch.id)"
              >
                <div class="batch-info">
                  <span class="batch-name">{{ batch.name }}</span>
                  <span class="batch-meta">
                    {{ getFigurineCount(batch.id) }} 件
                    <template v-if="batch.totalShipping || batch.totalTax">
                      · 运费 ¥{{ batch.totalShipping || 0 }}
                    </template>
                  </span>
                </div>
                <el-tag
                  v-if="!batch.totalShipping && !batch.totalTax"
                  size="small"
                  type="warning"
                >
                  待分摊
                </el-tag>
                <el-tag v-else size="small" type="success">
                  已分摊
                </el-tag>
              </div>
            </div>
            <el-empty v-else description="暂无批次" :image-size="60" />
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Box, Money, FolderOpened, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { useImageStore } from '@/stores/image'
import { useBatchStore } from '@/stores/batch'
import { useFigurineStore } from '@/stores/figurine'
import { getDashboardStats, type DashboardStats } from '@/db/statistics'

const router = useRouter()
const imageStore = useImageStore()
const batchStore = useBatchStore()
const figurineStore = useFigurineStore()

const stats = ref<DashboardStats>({
  totalCost: 0,
  totalIncome: 0,
  totalProfit: 0,
  avgProfitRate: 0,
  statusCounts: {}
})

function getFigurineCount(batchId: string): number {
  return figurineStore.figurines.filter(f => f.batchId === batchId).length
}

function navigateToFigurines(status: string) {
  router.push({ path: '/figurines', query: { status } })
}

function navigateToBatch(batchId: string) {
  router.push({ path: '/figurines', query: { batch: batchId } })
}

async function handleSelectImageDir() {
  const success = await imageStore.selectImageDirectory()
  if (success) {
    const count = imageStore.imageList.length
    ElMessage.success(`已加载 ${count} 张图片`)
  } else {
    ElMessage.error('加载图片失败')
  }
}

onMounted(async () => {
  const [dashboardStats] = await Promise.all([
    getDashboardStats(),
    imageStore.selectImageDirectory(),
    batchStore.fetchBatches(),
    figurineStore.fetchFigurines()
  ])

  stats.value = dashboardStats
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
}

/* 统计卡片 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-md, 12px);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-card.expense .stat-icon {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #ef4444;
}

.stat-card.income .stat-icon {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #22c55e;
}

.stat-card.profit .stat-icon {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #3b82f6;
}

.stat-card.rate .stat-icon {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #f59e0b;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-card.expense .stat-value { color: #dc2626; }
.stat-card.income .stat-value { color: #16a34a; }
.stat-card.profit .stat-value { color: #2563eb; }
.stat-card.rate .stat-value { color: #d97706; }

/* 两列布局 */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* 左侧 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 库存状态 */
.status-section {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0 0 16px 0;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.status-item:hover {
  background: var(--gray-50);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-item.selling .status-dot { background: #3b82f6; }
.status-item.sold .status-dot { background: #22c55e; }
.status-item.holding .status-dot { background: #f59e0b; }
.status-item.pending .status-dot { background: #6b7280; }

.status-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-name {
  font-size: 14px;
  color: var(--gray-600);
}

.status-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-800);
}

.status-arrow {
  color: var(--gray-400);
  transition: transform var(--transition-fast);
}

.status-item:hover .status-arrow {
  transform: translateX(4px);
  color: var(--primary-500);
}

/* 快捷操作 */
.quick-actions {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-item:hover {
  background: var(--gray-50);
}

.action-item:hover .action-icon {
  transform: scale(1.05);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: transform var(--transition-fast);
}

.action-icon.add {
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
  color: var(--primary-600);
}

.action-icon.batch {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.action-icon.trade {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
}

.action-icon.folder {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.action-item span {
  font-size: 13px;
  color: var(--gray-600);
  font-weight: 500;
}

/* 右侧 */
.right-section {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header .section-title {
  margin: 0;
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.batch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.batch-item:hover {
  background: var(--gray-50);
}

.batch-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-800);
}

.batch-meta {
  font-size: 12px;
  color: var(--gray-500);
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>