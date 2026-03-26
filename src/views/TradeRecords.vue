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
        <el-button type="primary" @click="showSelectFigurine = true">+ 新增交易</el-button>
      </el-card>

      <!-- 选择手办弹窗 -->
      <el-dialog v-model="showSelectFigurine" title="选择手办" width="400px">
        <el-select v-model="newTradeFigurineId" placeholder="选择要交易的手办" filterable style="width: 100%">
          <el-option
            v-for="f in figurineStore.figurines"
            :key="f.id"
            :label="f.name"
            :value="f.id"
          />
        </el-select>
        <template #footer>
          <el-button @click="showSelectFigurine = false">取消</el-button>
          <el-button type="primary" :disabled="!newTradeFigurineId" @click="handleCreateTrade">
            确定
          </el-button>
        </template>
      </el-dialog>

      <!-- 交易列表 -->
      <el-card>
        <el-table :data="paginatedTrades" style="width: 100%">
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
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button size="small" link @click="handleEdit(row)">详情</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTrades.length"
          :page-sizes="[20, 40, 60]"
          layout="total, sizes, prev, pager, next"
        />
      </div>

      <!-- 交易表单 -->
      <TradeForm
        v-model:visible="showForm"
        :trade="editingTrade"
        :figurine-id="newTradeFigurineId"
        @saved="handleSaved"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const showSelectFigurine = ref(false)
const editingTrade = ref<Trade>()
const newTradeFigurineId = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

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

const paginatedTrades = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTrades.value.slice(start, start + pageSize.value)
})

function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

function handleEdit(trade: Trade) {
  editingTrade.value = trade
  showForm.value = true
}

function handleCreateTrade() {
  if (newTradeFigurineId.value) {
    showSelectFigurine.value = false
    showForm.value = true
  }
}

function handleSaved() {
  editingTrade.value = undefined
  newTradeFigurineId.value = ''
}

async function handleDelete(trade: Trade) {
  try {
    await ElMessageBox.confirm(
      '确定删除该交易记录吗？删除后手办状态将改为"在售"。',
      '确认删除',
      { type: 'warning' }
    )
  } catch {
    // 用户取消
    return
  }

  try {
    await tradeStore.removeTrade(trade.id)

    // 更新手办状态为"在售"
    await figurineStore.updateFigurine(trade.figurineId, { status: 'selling' })

    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除交易失败')
  }
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
  padding-bottom: 70px;
}

.filter-card {
  display: flex;
  gap: 10px;
  align-items: center;
}

.profit-text { color: #67c23a; }
.loss-text { color: #f56c6c; }

.pagination-wrapper {
  position: fixed;
  bottom: 0;
  left: 200px;
  right: 0;
  background: #fff;
  padding: 16px 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  z-index: 100;
}
</style>