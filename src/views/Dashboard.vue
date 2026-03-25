<template>
  <Layout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">总投入</div>
              <div class="stat-value expense">¥ {{ totalCost.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">总收益</div>
              <div class="stat-value income">¥ {{ totalIncome.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">总利润</div>
              <div class="stat-value profit">¥ {{ totalProfit.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">平均利润率</div>
              <div class="stat-value rate">{{ avgProfitRate.toFixed(1) }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图片库预览 -->
      <el-card class="image-gallery">
        <template #header>
          <div class="gallery-header">
            <span>图片库 ({{ imageStore.imageList.length }} 张)</span>
            <el-button size="small" @click="handleScanImages">刷新图片</el-button>
          </div>
        </template>
        <div v-if="imageStore.imageList.length > 0" class="image-grid">
          <div v-for="filename in imageStore.imageList.slice(0, 12)" :key="filename" class="image-item">
            <img :src="getImageUrl(filename)" :alt="filename" />
            <div class="image-name">{{ filename }}</div>
          </div>
          <div v-if="imageStore.imageList.length > 12" class="image-more">
            +{{ imageStore.imageList.length - 12 }} 张更多
          </div>
        </div>
        <el-empty v-else description="暂无图片，请先设置图片目录" />
      </el-card>

      <!-- 库存状态 -->
      <el-card class="status-card">
        <template #header>
          <span>库存状态</span>
        </template>
        <div class="status-list">
          <span class="status-item">
            <el-tag type="primary">在售</el-tag>
            <span class="count">{{ figurineStore.statusCounts.selling }}</span>
          </span>
          <span class="status-item">
            <el-tag type="success">已出</el-tag>
            <span class="count">{{ figurineStore.statusCounts.sold }}</span>
          </span>
          <span class="status-item">
            <el-tag type="warning">囤货</el-tag>
            <span class="count">{{ figurineStore.statusCounts.holding }}</span>
          </span>
          <span class="status-item">
            <el-tag type="info">待录入</el-tag>
            <span class="count">{{ figurineStore.statusCounts.pending }}</span>
          </span>
        </div>
      </el-card>

      <!-- 最近交易 -->
      <el-card class="recent-trades">
        <template #header>
          <span>最近交易</span>
        </template>
        <el-table :data="recentTrades" style="width: 100%">
          <el-table-column prop="soldAt" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.soldAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="figurineName" label="手办" />
          <el-table-column prop="sellPrice" label="卖出价" width="120">
            <template #default="{ row }">
              ¥{{ row.sellPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="利润" width="120">
            <template #default="{ row }">
              <span :class="row.profit >= 0 ? 'profit-text' : 'loss-text'">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ row.profit }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import { useFigurineStore } from '@/stores/figurine'
import { useTradeStore } from '@/stores/trade'
import { useImageStore } from '@/stores/image'
import dayjs from 'dayjs'

const figurineStore = useFigurineStore()
const tradeStore = useTradeStore()
const imageStore = useImageStore()

const totalCost = computed(() =>
  figurineStore.figurines.reduce((sum, f) => sum + f.totalCost, 0)
)

const totalIncome = computed(() => tradeStore.totalIncome)
const totalProfit = computed(() => tradeStore.totalProfit)

const avgProfitRate = computed(() => {
  const trades = tradeStore.trades.filter(t => t.isActive)
  if (trades.length === 0) return 0
  return trades.reduce((sum, t) => sum + t.profitRate, 0) / trades.length
})

const recentTrades = computed(() => {
  const trades = [...tradeStore.trades]
    .sort((a, b) => b.soldAt - a.soldAt)
    .slice(0, 10)

  return trades.map(t => {
    const figurine = figurineStore.figurines.find(f => f.id === t.figurineId)
    return {
      ...t,
      figurineName: figurine?.name || '未知'
    }
  })
})

function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

function getImageUrl(filename: string): string {
  return imageStore.getImageUrl(filename) || ''
}

async function handleScanImages() {
  await imageStore.selectImageDirectory()
}

onMounted(async () => {
  await Promise.all([
    figurineStore.fetchFigurines(),
    tradeStore.fetchTrades(),
    imageStore.selectImageDirectory()
  ])
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-cards .stat-card {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-value.expense { color: #f56c6c; }
.stat-value.income { color: #67c23a; }
.stat-value.profit { color: #409eff; }
.stat-value.rate { color: #e6a23c; }

.image-gallery {
  margin-bottom: 0;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.image-item {
  text-align: center;
}

.image-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
}

.image-name {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-more {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  color: #909399;
  font-size: 12px;
  min-height: 100px;
}

.status-card .status-list {
  display: flex;
  gap: 30px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item .count {
  font-size: 18px;
  font-weight: bold;
}

.profit-text { color: #67c23a; }
.loss-text { color: #f56c6c; }
</style>