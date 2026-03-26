<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'
import { useImageStore } from '@/stores/image'
import { migrateData } from '@/utils/migrate'

const batchStore = useBatchStore()
const tagStore = useTagStore()
const imageStore = useImageStore()

onMounted(async () => {
  // 并行加载基础数据
  await Promise.all([
    batchStore.fetchBatches(),
    tagStore.fetchTags()
  ])

  // 恢复图片目录句柄
  await imageStore.restoreDirectoryHandle()

  // 数据迁移（修复老数据）
  await migrateData()
})
</script>