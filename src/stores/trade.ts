import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Trade } from '@/types'
import * as tradeDb from '@/db/trade'

export const useTradeStore = defineStore('trade', () => {
  const trades = ref<Trade[]>([])
  const loading = ref(false)

  // 统计
  const totalProfit = computed(() =>
    trades.value.reduce((sum, t) => sum + t.profit, 0)
  )

  const totalIncome = computed(() =>
    trades.value.reduce((sum, t) => sum + t.actualIncome, 0)
  )

  async function fetchTrades() {
    loading.value = true
    try {
      trades.value = await tradeDb.getAllTrades()
    } finally {
      loading.value = false
    }
  }

  async function addTrade(data: Omit<Trade, 'id'>) {
    const trade = await tradeDb.createTrade(data)
    if (data.isActive) {
      await tradeDb.deactivateOtherTrades(data.figurineId, trade.id)
    }
    trades.value.push(trade)
    return trade
  }

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

  async function removeTrade(id: string) {
    await tradeDb.deleteTrade(id)
    trades.value = trades.value.filter(t => t.id !== id)
  }

  return {
    trades,
    loading,
    totalProfit,
    totalIncome,
    fetchTrades,
    addTrade,
    updateTrade,
    removeTrade
  }
})