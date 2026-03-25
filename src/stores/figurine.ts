import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Figurine, FigurineStatus } from '@/types'
import * as figurineDb from '@/db/figurine'

export const useFigurineStore = defineStore('figurine', () => {
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

  async function fetchFigurines() {
    loading.value = true
    try {
      figurines.value = await figurineDb.getAllFigurines()
    } finally {
      loading.value = false
    }
  }

  async function addFigurine(data: Omit<Figurine, 'id' | 'createdAt' | 'updatedAt'>) {
    const figurine = await figurineDb.createFigurine(data)
    figurines.value.push(figurine)
    return figurine
  }

  async function updateFigurine(id: string, data: Partial<Figurine>) {
    await figurineDb.updateFigurine(id, data)
    const index = figurines.value.findIndex(f => f.id === id)
    if (index !== -1) {
      figurines.value[index] = { ...figurines.value[index], ...data, updatedAt: Date.now() }
    }
  }

  async function removeFigurine(id: string) {
    await figurineDb.deleteFigurine(id)
    figurines.value = figurines.value.filter(f => f.id !== id)
  }

  async function batchUpdate(ids: string[], data: Partial<Figurine>) {
    await figurineDb.batchUpdateFigurines(ids, data)
    const now = Date.now()
    figurines.value = figurines.value.map(f =>
      ids.includes(f.id) ? { ...f, ...data, updatedAt: now } : f
    )
  }

  async function replaceAll(data: Figurine[]) {
    await figurineDb.clearAllFigurines()
    for (const item of data) {
      await figurineDb.createFigurine(item)
    }
    figurines.value = data
  }

  return {
    figurines,
    loading,
    statusCounts,
    fetchFigurines,
    addFigurine,
    updateFigurine,
    removeFigurine,
    batchUpdate,
    replaceAll
  }
})