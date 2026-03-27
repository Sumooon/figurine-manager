import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Trade } from '@/types'
import * as tradeDb from '@/db/trade'

export const useTradeStore = defineStore('trade', () => {
  // 全部数据（用于 Dashboard 统计等）
  const trades = ref<Trade[]>([])
  const loading = ref(false)

  // 统计
  const totalProfit = computed(() =>
    trades.value.reduce((sum, t) => sum + t.profit, 0)
  )

  const totalIncome = computed(() =>
    trades.value.reduce((sum, t) => sum + t.actualIncome, 0)
  )

  // 获取全部数据（用于 Dashboard 统计等）
  async function fetchTrades() {
    loading.value = true
    try {
      trades.value = await tradeDb.getAllTrades()
    } finally {
      loading.value = false
    }
  }

  // 分页查询（用于列表页）
  async function fetchTradesPaginated(
    page: number,
    pageSize: number,
    filter?: tradeDb.TradeFilter
  ) {
    const result = await tradeDb.getTradesPaginated(
      { page, pageSize },
      filter
    )
    return result
  }

  // 获取手办的活跃交易
  async function getActiveTradeByFigurineId(figurineId: string): Promise<Trade | undefined> {
    // 优先从缓存获取
    const cached = trades.value.find(t => t.figurineId === figurineId && t.isActive)
    if (cached) return cached

    // 缓存中没有则从数据库获取
    return await tradeDb.getActiveTradeByFigurine(figurineId)
  }

  // 添加交易
  async function addTrade(data: Omit<Trade, 'id'>) {
    const trade = await tradeDb.createTrade(data)
    if (data.isActive) {
      await tradeDb.deactivateOtherTrades(data.figurineId, trade.id)
    }
    trades.value.push(trade)
    return trade
  }

  // 更新交易
  async function updateTrade(id: string, data: Partial<Trade>) {
    const existing = trades.value.find(t => t.id === id)
    await tradeDb.updateTrade(id, data)

    if (data.isActive && existing) {
      await tradeDb.deactivateOtherTrades(existing.figurineId, id)
    }

    const index = trades.value.findIndex(t => t.id === id)
    if (index !== -1) {
      trades.value[index] = { ...trades.value[index], ...data }
    }
  }

  // 删除交易
  async function removeTrade(id: string) {
    await tradeDb.deleteTrade(id)
    trades.value = trades.value.filter(t => t.id !== id)
  }

  // 导入数据
  async function replaceAll(data: Trade[]) {
    await tradeDb.clearAllTrades()
    for (const item of data) {
      await tradeDb.importTrade(item)
    }
    trades.value = data
  }

  // 搜索手办（异步）
  async function searchFigurines(keyword: string) {
    return await tradeDb.searchFigurines(keyword)
  }

  return {
    trades,
    loading,
    totalProfit,
    totalIncome,
    fetchTrades,
    fetchTradesPaginated,
    getActiveTradeByFigurineId,
    addTrade,
    updateTrade,
    removeTrade,
    replaceAll,
    searchFigurines
  }
})