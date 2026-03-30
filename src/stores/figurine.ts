import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Figurine, FigurineStatus, FigurineWithTrade } from '@/types'
import * as figurineDb from '@/db/figurine'

export const useFigurineStore = defineStore('figurine', () => {
  // 全部数据（用于 Dashboard 统计、表单选项等）
  const figurines = ref<Figurine[]>([])
  const loading = ref(false)

  // 统计
  const statusCounts = computed(() => {
    const counts: Record<FigurineStatus, number> = {
      pending: 0,
      selling: 0,
      sold: 0,
      holding: 0
    }
    figurines.value.forEach(f => counts[f.status]++)
    return counts
  })

  // 已使用的系列列表（去重）
  const seriesOptions = computed(() => {
    const seriesSet = new Set<string>()
    figurines.value.forEach(f => {
      if (f.series) seriesSet.add(f.series)
    })
    return Array.from(seriesSet).sort()
  })

  // 获取全部数据（用于 Dashboard、表单选项等）
  async function fetchFigurines() {
    loading.value = true
    try {
      figurines.value = await figurineDb.getAllFigurines()
    } finally {
      loading.value = false
    }
  }

  // 分页查询（用于列表页）
  async function fetchFigurinesPaginated(
    page: number,
    pageSize: number,
    filter?: figurineDb.FigurineFilter
  ): Promise<{ data: FigurineWithTrade[]; total: number }> {
    const result = await figurineDb.getFigurinesPaginated(
      { page, pageSize },
      filter
    )
    return result
  }

  // 根据ID获取手办（从缓存中）
  function getFigurineById(id: string): Figurine | undefined {
    return figurines.value.find(f => f.id === id)
  }

  // 添加手办（同时更新缓存）
  async function addFigurine(data: Omit<Figurine, 'id' | 'createdAt' | 'updatedAt'>) {
    const figurine = await figurineDb.createFigurine(data)
    figurines.value.push(figurine)
    return figurine
  }

  // 更新手办
  async function updateFigurine(id: string, data: Partial<Figurine>) {
    // 处理空字符串 batchId
    const normalizedData = { ...data }
    if (normalizedData.batchId === '' || normalizedData.batchId === null) {
      normalizedData.batchId = undefined
    }

    await figurineDb.updateFigurine(id, normalizedData)
    const index = figurines.value.findIndex(f => f.id === id)
    if (index !== -1) {
      figurines.value[index] = {
        ...figurines.value[index],
        ...normalizedData,
        updatedAt: Date.now()
      }
    }
  }

  // 删除手办
  async function removeFigurine(id: string) {
    await figurineDb.deleteFigurine(id)
    figurines.value = figurines.value.filter(f => f.id !== id)
  }

  // 批量更新
  async function batchUpdate(ids: string[], data: Partial<Figurine>) {
    await figurineDb.batchUpdateFigurines(ids, data)
    const now = Date.now()
    figurines.value = figurines.value.map(f =>
      ids.includes(f.id) ? { ...f, ...data, updatedAt: now } : f
    )
  }

  // 导入数据
  async function replaceAll(data: Figurine[]) {
    await figurineDb.clearAllFigurines()
    for (const item of data) {
      await figurineDb.importFigurine(item)
    }
    figurines.value = data
  }

  return {
    figurines,
    loading,
    statusCounts,
    seriesOptions,
    fetchFigurines,
    fetchFigurinesPaginated,
    getFigurineById,
    addFigurine,
    updateFigurine,
    removeFigurine,
    batchUpdate,
    replaceAll
  }
})