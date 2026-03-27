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
          @change="handleDateChange"
        />
        <el-input v-model="searchText" placeholder="搜索手办名称..." clearable style="width: 200px" @change="handleSearch" />
        <el-button type="primary" class="add-btn" @click="showSelectFigurine = true">
          <el-icon><Plus /></el-icon>
          新增交易
        </el-button>
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

      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="6" animated />

      <!-- 交易列表 -->
      <el-card v-else>
        <el-table :data="displayedTrades" style="width: 100%">
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
              <div class="action-buttons">
                <el-button size="small" link @click="handleEdit(row)">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button size="small" link type="danger" @click="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

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
import { Plus, View, Delete } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import TradeForm from '@/components/TradeForm.vue'
import type { Trade } from '@/types'
import { useTradeStore } from '@/stores/trade'
import { useFigurineStore } from '@/stores/figurine'
import dayjs from 'dayjs'

const tradeStore = useTradeStore()
const figurineStore = useFigurineStore()

// 列表数据（本地状态）
const trades = ref<Trade[]>([])
const total = ref(0)
const loading = ref(false)

// 筛选状态
const dateRange = ref<[number, number] | null>(null)
const searchText = ref('')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 弹窗状态
const showForm = ref(false)
const showSelectFigurine = ref(false)
const editingTrade = ref<Trade>()
const newTradeFigurineId = ref('')

// 关联手办名称
const tradesWithFigurine = computed(() => {
  return trades.value.map(t => {
    const figurine = figurineStore.getFigurineById(t.figurineId)
    return {
      ...t,
      figurineName: figurine?.name || '未知'
    }
  })
})

// 名称搜索过滤（客户端）
const displayedTrades = computed(() => {
  if (!searchText.value) {
    return tradesWithFigurine.value
  }
  return tradesWithFigurine.value.filter(t =>
    t.figurineName.includes(searchText.value)
  )
})

// 获取列表数据
async function fetchData() {
  loading.value = true
  try {
    const result = await tradeStore.fetchTradesPaginated(
      currentPage.value,
      pageSize.value,
      {
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
      }
    )
    trades.value = result.data
    total.value = result.total
  } finally {
    loading.value = false
  }
}

// 日期变化（重置到第一页）
function handleDateChange() {
  currentPage.value = 1
  fetchData()
}

// 名称搜索（客户端过滤，不影响分页）
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  // 名称搜索是客户端过滤，不需要重新请求
  // 这里只是为了清空搜索时刷新
  if (!searchText.value && searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
}

// 分页大小变化
function handleSizeChange() {
  currentPage.value = 1
  fetchData()
}

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

async function handleSaved() {
  editingTrade.value = undefined
  newTradeFigurineId.value = ''
  await fetchData()
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

    // 如果当前页删除后为空，回到上一页
    if (trades.value.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    await fetchData()
  } catch {
    ElMessage.error('删除交易失败')
  }
}

onMounted(async () => {
  // 加载手办数据（用于名称查找和选择手办弹窗）
  await figurineStore.fetchFigurines()
  // 加载交易列表
  await fetchData()
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
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.profit-text {
  color: #16a34a;
  font-weight: 600;
}

.loss-text {
  color: #dc2626;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.action-buttons .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  position: fixed;
  bottom: 0;
  left: 220px;
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
</style>