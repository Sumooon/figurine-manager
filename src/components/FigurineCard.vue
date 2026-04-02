<template>
  <el-card
    class="figurine-card"
    :class="{ 'low-profit': isLowProfit }"
    :body-style="{ padding: '0' }"
    @click="$emit('click')"
  >
    <!-- 图片区域 -->
    <div class="card-image">
      <img v-if="imageUrl" :src="imageUrl" :alt="figurine.name" />
      <div v-else class="image-placeholder">
        <el-icon><Picture /></el-icon>
      </div>

      <!-- 状态标签 -->
      <div class="status-badge" :class="figurine.status">
        {{ statusText }}
      </div>

      <!-- 删除按钮 -->
      <el-button
        class="delete-btn"
        type="danger"
        size="small"
        circle
        @click.stop="$emit('delete')"
      >
        <el-icon><Delete /></el-icon>
      </el-button>

      <!-- 批次和标签 -->
      <div v-if="batchName || tags.length" class="image-tags">
        <span v-if="batchName" class="batch-tag">
          {{ batchName }}
        </span>
        <span
          v-for="tag in tags.slice(0, 2)"
          :key="tag.id"
          class="info-tag"
          :style="{ backgroundColor: tag.color || '#6b7280' }"
        >
          {{ tag.name }}
        </span>
        <span v-if="tags.length > 2" class="more-tag">
          +{{ tags.length - 2 }}
        </span>
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="card-content">
      <div class="card-header">
        <h4 class="name">{{ figurine.name }}</h4>
        <p v-if="figurine.series" class="series">{{ figurine.series }}</p>
      </div>

      <div class="card-stats">
        <div class="stat-row">
          <span class="stat-label">成本</span>
          <span class="stat-value cost">¥{{ figurine.totalCost.toFixed(2) }}</span>
        </div>

        <!-- 交易信息 -->
        <template v-if="activeTrade">
          <div class="stat-row">
            <span class="stat-label">售价</span>
            <span class="stat-value price">¥{{ activeTrade.sellPrice }}</span>
          </div>
          <div class="stat-row profit-row">
            <span class="stat-label">利润</span>
            <span class="stat-value" :class="profitClass">
              {{ activeTrade.profit >= 0 ? '+' : '' }}¥{{ activeTrade.profit.toFixed(2) }}
              <span class="profit-rate">({{ activeTrade.profitRate.toFixed(1) }}%)</span>
            </span>
          </div>
        </template>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture, Delete } from '@element-plus/icons-vue'
import type { FigurineWithTrade, FigurineStatus, Tag } from '@/types'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'
import { useImageStore } from '@/stores/image'
import { isProfitBelowThreshold } from '@/utils/calculator'

const props = defineProps<{
  figurine: FigurineWithTrade
}>()

defineEmits<{
  click: []
  delete: []
}>()

const batchStore = useBatchStore()
const tagStore = useTagStore()
const imageStore = useImageStore()

const batchName = computed(() =>
  batchStore.batches.find(b => b.id === props.figurine.batchId)?.name
)

const tags = computed(() =>
  props.figurine.tagIds
    .map(id => tagStore.tags.find(t => t.id === id))
    .filter((t): t is Tag => t !== undefined)
)

const activeTrade = computed(() => props.figurine.activeTrade)

const imageUrl = computed(() =>
  imageStore.getImageUrl(props.figurine.imageFile)
)

const statusText = computed(() => {
  const texts: Record<FigurineStatus, string> = {
    pending: '待录入',
    selling: '在售',
    sold: '已出',
    holding: '囤货'
  }
  return texts[props.figurine.status]
})

const profitClass = computed(() =>
  activeTrade.value && activeTrade.value.profit >= 0 ? 'positive' : 'negative'
)

const isLowProfit = computed(() =>
  activeTrade.value && isProfitBelowThreshold(activeTrade.value.profitRate, 10)
)
</script>

<style scoped>
.figurine-card {
  cursor: pointer;
  transition: all var(--transition-normal);
  overflow: hidden;
  border-radius: var(--radius-md) !important;
}

.figurine-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg) !important;
}

.figurine-card.low-profit {
  border: 2px solid #ef4444 !important;
}

.card-image {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.figurine-card:hover .card-image img {
  transform: scale(1.08);
}

.image-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #cbd5e1;
}

/* 状态徽章 */
.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.status-badge.selling {
  background: rgba(59, 130, 246, 0.9);
  color: #fff;
}

.status-badge.sold {
  background: rgba(34, 197, 94, 0.9);
  color: #fff;
}

.status-badge.holding {
  background: rgba(245, 158, 11, 0.9);
  color: #fff;
}

.status-badge.pending {
  background: rgba(107, 114, 128, 0.9);
  color: #fff;
}

/* 删除按钮 */
.delete-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.figurine-card:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
}

/* 底部标签 */
.image-tags {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.batch-tag,
.info-tag,
.more-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}

.batch-tag {
  background: rgba(59, 130, 246, 0.9);
  color: #fff;
}

.info-tag {
  color: #fff;
}

.more-tag {
  background: rgba(107, 114, 128, 0.8);
  color: #fff;
}

/* 内容区域 */
.card-content {
  padding: 14px;
  background: #fff;
}

.card-header {
  margin-bottom: 12px;
}

.name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series {
  margin: 0;
  font-size: 12px;
  color: var(--gray-500);
}

/* 统计行 */
.card-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
}

.stat-value.cost {
  color: var(--gray-700);
}

.stat-value.price {
  color: #2563eb;
}

.stat-value.positive {
  color: #16a34a;
}

.stat-value.negative {
  color: #dc2626;
}

.profit-rate {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.8;
}

.profit-row {
  padding-top: 8px;
  border-top: 1px solid var(--gray-100);
}
</style>