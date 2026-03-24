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
    </div>

    <!-- 信息区域 -->
    <div class="card-content">
      <h4 class="name">{{ figurine.name }}</h4>
      <p class="meta">
        <span v-if="batchName">{{ batchName }}</span>
        <span v-if="figurine.series"> | {{ figurine.series }}</span>
      </p>
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
import { Picture } from '@element-plus/icons-vue'
import type { Figurine, FigurineStatus, Trade } from '@/types'
import { useBatchStore } from '@/stores/batch'
import { useTradeStore } from '@/stores/trade'
import { useImageStore } from '@/stores/image'
import { isProfitBelowThreshold } from '@/utils/calculator'

const props = defineProps<{
  figurine: Figurine
}>()

defineEmits<{
  click: []
}>()

const batchStore = useBatchStore()
const tradeStore = useTradeStore()
const imageStore = useImageStore()

const batchName = computed(() =>
  batchStore.batches.find(b => b.id === props.figurine.batchId)?.name
)

const activeTrade = computed(() =>
  tradeStore.trades.find(t => t.figurineId === props.figurine.id && t.isActive)
)

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
  transition: all 0.3s;
}

.figurine-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.figurine-card.low-profit {
  border: 2px solid #f56c6c;
}

.card-image {
  position: relative;
  height: 180px;
  background: #f5f5f5;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #ccc;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-content {
  padding: 12px;
}

.name {
  margin: 0 0 4px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin: 0 0 8px;
  font-size: 12px;
  color: #909399;
}

.cost {
  margin: 0 0 4px;
  font-size: 13px;
  color: #606266;
}

.price {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: bold;
}

.price.sold { color: #67c23a; }
.price.selling { color: #409eff; }

.profit {
  margin: 0;
  font-size: 12px;
}

.profit.positive { color: #67c23a; }
.profit.negative { color: #f56c6c; }
</style>