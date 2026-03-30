import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Batch } from '@/types'
import type { BatchWithCount } from '@/db/batch'
import * as batchDb from '@/db/batch'

export const useBatchStore = defineStore('batch', () => {
  const batches = ref<BatchWithCount[]>([])
  const loading = ref(false)

  const batchOptions = computed(() =>
    batches.value.map(b => ({ label: b.name, value: b.id }))
  )

  async function fetchBatches() {
    loading.value = true
    try {
      batches.value = await batchDb.getAllBatches()
    } finally {
      loading.value = false
    }
  }

  async function addBatch(data: Omit<Batch, 'id' | 'createdAt'>) {
    const batch = await batchDb.createBatch(data)
    return batch
  }

  async function updateBatch(id: string, data: Partial<Batch>) {
    await batchDb.updateBatch(id, data)
    const index = batches.value.findIndex(b => b.id === id)
    if (index !== -1) {
      batches.value[index] = { ...batches.value[index], ...data }
    }
  }

  async function removeBatch(id: string) {
    await batchDb.deleteBatch(id)
    batches.value = batches.value.filter(b => b.id !== id)
  }

  async function replaceAll(data: Batch[]) {
    await batchDb.clearAllBatches()
    for (const item of data) {
      await batchDb.importBatch(item)
    }
    await fetchBatches()
  }

  return {
    batches,
    loading,
    batchOptions,
    fetchBatches,
    addBatch,
    updateBatch,
    removeBatch,
    replaceAll
  }
})