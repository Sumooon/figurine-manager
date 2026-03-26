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
      <el-tag :type="statusType" class="status-tag">{{ statusText }}</el-tag>
      <el-button
        class="delete-btn"
        type="danger"
        size="small"
        circle
        @click.stop="$emit('delete')"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
      <!-- 批次和标签（图片底部） -->
      <div v-if="batchName || tags.length" class="image-tags">
        <el-tag v-if="batchName" size="small" class="batch-tag">
          {{ batchName }}
        </el-tag>
        <el-tag
          v-for="tag in tags"
          :key="tag.id"
          size="small"
          :color="tag.color"
          :style="{ color: tag.color ? '#fff' : undefined }"
          class="info-tag"
        >
          {{ tag.name }}
        </el-tag>
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="card-content">
      <h4 class="name">{{ figurine.name }}</h4>
      <p v-if="figurine.series" class="meta">{{ figurine.series }}</p>
      <p class="cost">成本: ¥{{ figurine.totalCost.toFixed(2) }}</p>

      <!-- 利润信息（如果有交易） -->
      <template v-if="activeTrade">
        <p class="price" :class="priceClass">
          {{ statusText }} ¥{{ activeTrade.sellPrice }}
        </p>
        <p class="profit" :class="profitClass">
          利润: {{ activeTrade.profit >= 0 ? '+' : '' }}¥{{ activeTrade.profit.toFixed(2) }}
          ({{ activeTrade.profitRate.toFixed(1) }}%)
        </p>
      </template>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture, Delete } from '@element-plus/icons-vue'
import type { FigurineWithTrade, FigurineStatus } from '@/types'
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

import type { Tag } from '@/types'

const tags = computed(() =>
  props.figurine.tagIds
    .map(id => tagStore.tags.find(t => t.id === id))
    .filter((t): t is Tag => t !== undefined)
)

// 直接从 figurine 获取活跃交易信息
const activeTrade = computed(() => props.figurine.activeTrade)

const imageUrl = computed(() =>
  imageStore.getImageUrl(props.figurine.imageFile)
)

const statusType = computed(() => {
  const types: Record<FigurineStatus, string> = {
    pending: 'info',
    selling: 'primary',
    sold: 'success',
    holding: 'warning'
  }
  return types[props.figurine.status]
})

const statusText = computed(() => {
  const texts: Record<FigurineStatus, string> = {
    pending: '待录入',
    selling: '在售',
    sold: '已出',
    holding: '囤货'
  }
  return texts[props.figurine.status]
})

const priceClass = computed(() =>
  props.figurine.status === 'sold' ? 'sold' : 'selling'
)

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
  transition: all var(--transition-normal, 250ms);
  overflow: hidden;
  border-radius: var(--radius-md, 10px) !important;
}

.figurine-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.12)) !important;
}

.figurine-card.low-profit {
  border: 2px solid #ef4444 !important;
}

.card-image {
  position: relative;
  height: 180px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal, 250ms);
}

.figurine-card:hover .card-image img {
  transform: scale(1.05);
}

.image-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #cbd5e1;
}

.status-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 20px !important;
  font-weight: 600 !important;
  padding: 4px 12px !important;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.delete-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--transition-fast, 150ms);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.figurine-card:hover .delete-btn {
  opacity: 1;
  transform: scale(1);
}

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

.image-tags .batch-tag,
.image-tags .info-tag {
  border-radius: 4px !important;
  font-size: 11px !important;
  padding: 2px 8px !important;
}

.image-tags .batch-tag {
  background: rgba(59, 130, 246, 0.9) !important;
  border: none !important;
  color: #fff !important;
}

.image-tags .info-tag {
  border: none !important;
}

.card-content {
  padding: 14px;
  background: #fff;
}

.name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800, #27272a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--gray-500, #71717a);
}

.cost {
  margin: 0;
  font-size: 13px;
  color: var(--gray-600, #52525b);
  background: var(--gray-50, #fafafa);
  padding: 6px 10px;
  border-radius: 6px;
  display: inline-block;
}

.price {
  margin: 10px 0 4px;
  font-size: 15px;
  font-weight: 700;
}

.price.sold { color: #16a34a; }
.price.selling { color: #2563eb; }

.profit {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
}

.profit.positive { color: #16a34a; }
.profit.negative { color: #dc2626; }
</style>