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

      <!-- 库存状态 -->
      <div class="status-section">
        <h3 class="section-title">库存状态</h3>
        <div class="status-grid">
          <div class="status-item selling">
            <div class="status-dot"></div>
            <span class="status-name">在售</span>
            <span class="status-count">{{ stats.statusCounts?.selling || 0 }}</span>
          </div>
          <div class="status-item sold">
            <div class="status-dot"></div>
            <span class="status-name">已出</span>
            <span class="status-count">{{ stats.statusCounts?.sold || 0 }}</span>
          </div>
          <div class="status-item holding">
            <div class="status-dot"></div>
            <span class="status-name">囤货</span>
            <span class="status-count">{{ stats.statusCounts?.holding || 0 }}</span>
          </div>
          <div class="status-item pending">
            <div class="status-dot"></div>
            <span class="status-name">待录入</span>
            <span class="status-count">{{ stats.statusCounts?.pending || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 图片库预览 -->
      <div class="gallery-section">
        <div class="section-header">
          <h3 class="section-title">图片库</h3>
          <div class="section-meta">{{ imageStore.imageList.length }} 张</div>
          <el-button size="small" class="refresh-btn" @click="handleScanImages">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <div v-if="imageStore.imageList.length > 0" class="image-grid">
          <div v-for="filename in imageStore.imageList.slice(0, 12)" :key="filename" class="image-item">
            <img :src="getImageUrl(filename)" :alt="filename" />
          </div>
          <div v-if="imageStore.imageList.length > 12" class="image-more">
            <span>+{{ imageStore.imageList.length - 12 }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无图片，请先设置图片目录" />
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { useImageStore } from '@/stores/image'
import { getDashboardStats, type DashboardStats } from '@/db/statistics'

const imageStore = useImageStore()

const stats = ref<DashboardStats>({
  totalCost: 0,
  totalIncome: 0,
  totalProfit: 0,
  avgProfitRate: 0,
  statusCounts: {}
})

function getImageUrl(filename: string): string {
  return imageStore.getImageUrl(filename) || ''
}

async function handleScanImages() {
  await imageStore.selectImageDirectory()
}

onMounted(async () => {
  const [dashboardStats] = await Promise.all([
    getDashboardStats(),
    imageStore.selectImageDirectory()
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

/* 统计卡片网格 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04));
  transition: all var(--transition-normal, 250ms);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
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
  color: var(--gray-500, #71717a);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-card.expense .stat-value { color: #dc2626; }
.stat-card.income .stat-value { color: #16a34a; }
.stat-card.profit .stat-value { color: #2563eb; }
.stat-card.rate .stat-value { color: #d97706; }

/* 库存状态 */
.status-section {
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-800, #27272a);
  margin: 0 0 16px 0;
}

.status-grid {
  display: flex;
  gap: 32px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-item.selling .status-dot { background: #3b82f6; }
.status-item.sold .status-dot { background: #22c55e; }
.status-item.holding .status-dot { background: #f59e0b; }
.status-item.pending .status-dot { background: #6b7280; }

.status-name {
  font-size: 14px;
  color: var(--gray-600, #52525b);
}

.status-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-800, #27272a);
  min-width: 32px;
}

/* 图片库 */
.gallery-section {
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  padding: 24px;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header .section-title {
  margin: 0;
}

.section-meta {
  font-size: 13px;
  color: var(--gray-400, #a1a1aa);
  background: var(--gray-100, #f4f4f5);
  padding: 2px 10px;
  border-radius: 20px;
}

.refresh-btn {
  margin-left: auto;
  border-radius: 8px !important;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.image-item {
  aspect-ratio: 1;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  background: var(--gray-100, #f4f4f5);
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal, 250ms);
}

.image-item:hover img {
  transform: scale(1.05);
}

.image-more {
  aspect-ratio: 1;
  border-radius: var(--radius-md, 10px);
  background: var(--gray-100, #f4f4f5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-500, #71717a);
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>