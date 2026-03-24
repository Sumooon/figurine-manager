<template>
  <Layout>
    <div class="trade-records">
      <!-- 筛选栏 -->
      <el-card class="filter-card">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="timestamp"
        />
        <el-input v-model="searchText" placeholder="搜索手办名称..." clearable style="width: 200px" />
        <el-button type="primary" @click="showForm = true">+ 新增交易</el-button>
      </el-card>

      <!-- 交易列表 -->
      <el-card>
        <el-table :data="filteredTrades" style="width: 100%">
          <el-table-column prop="soldAt" label="卖出时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.soldAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="figurineName" label="手办" />
          <el-table-column prop="sellPrice" label="卖出价" width="100">
            <template #default="{ row }">
              ¥{{ row.sellPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="xianyuFee" label="咸鱼手续费" width="100">
            <template #default="{ row }">
              ¥{{ row.xianyuFee || 0 }}
            </template>
          </el-table-column>
          <el-table-column prop="actualIncome" label="实际收入" width="100">
            <template #default="{ row }">
              ¥{{ row.actualIncome }}
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="利润" width="100">
            <template #default="{ row }">
              <span :class="row.profit >= 0 ? 'profit-text' : 'loss-text'">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ row.profit }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="profitRate" label="利润率" width="80">
            <template #default="{ row }">
              {{ row.profitRate.toFixed(1) }}%
            </template>
          </el-table-column>
          <el-table-column prop="buyerName" label="买家" width="100" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" @click="handleEdit(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 交易表单 -->
      <TradeForm
        v-model:visible="showForm"
        :trade="editingTrade"
        @saved="handleSaved"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import TradeForm from '@/components/TradeForm.vue'
import type { Trade } from '@/types'
import { useTradeStore } from '@/stores/trade'
import { useFigurineStore } from '@/stores/figurine'
import dayjs from 'dayjs'

const tradeStore = useTradeStore()
const figurineStore = useFigurineStore()

const dateRange = ref<[number, number] | null>(null)
const searchText = ref('')
const showForm = ref(false)
const editingTrade = ref<Trade>()

const tradesWithFigurine = computed(() => {
  return tradeStore.trades.map(t => {
    const figurine = figurineStore.figurines.find(f => f.id === t.figurineId)
    return {
      ...t,
      figurineName: figurine?.name || '未知'
    }
  })
})

const filteredTrades = computed(() => {
  let trades = tradesWithFigurine.value

  if (dateRange.value) {
    const [start, end] = dateRange.value
    trades = trades.filter(t => t.soldAt >= start && t.soldAt <= end)
  }

  if (searchText.value) {
    trades = trades.filter(t =>
      t.figurineName.includes(searchText.value)
    )
  }

  return trades.sort((a, b) => b.soldAt - a.soldAt)
})

function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

function handleEdit(trade: Trade) {
  editingTrade.value = trade
  showForm.value = true
}

function handleSaved() {
  editingTrade.value = undefined
}

onMounted(async () => {
  await Promise.all([
    tradeStore.fetchTrades(),
    figurineStore.fetchFigurines()
  ])
})
</script>

<style scoped>
.trade-records {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  display: flex;
  gap: 10px;
  align-items: center;
}

.profit-text { color: #67c23a; }
.loss-text { color: #f56c6c; }
</style>