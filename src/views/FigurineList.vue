<template>
  <Layout>
    <div class="figurine-list">
      <!-- 筛选栏 -->
      <el-card class="filter-card">
        <el-input v-model="searchText" placeholder="搜索名称..." clearable style="width: 200px" />
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px">
          <el-option label="在售" value="selling" />
          <el-option label="已出" value="sold" />
          <el-option label="囤货" value="holding" />
          <el-option label="待录入" value="pending" />
        </el-select>
        <el-select v-model="filterBatch" placeholder="批次" clearable style="width: 150px">
          <el-option
            v-for="b in batchStore.batchOptions"
            :key="b.value"
            :label="b.label"
            :value="b.value"
          />
        </el-select>
        <el-select v-model="filterTag" placeholder="标签" clearable style="width: 150px">
          <el-option
            v-for="t in tagStore.tagOptions"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          />
        </el-select>
        <el-button type="primary" @click="showForm = true">+ 新增手办</el-button>
      </el-card>

      <!-- 卡片列表 -->
      <div class="card-grid">
        <FigurineCard
          v-for="figurine in paginatedFigurines"
          :key="figurine.id"
          :figurine="figurine"
          @click="handleEdit(figurine)"
        />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredFigurines.length"
          :page-sizes="[20, 40, 60]"
          layout="total, sizes, prev, pager, next"
        />
      </div>

      <!-- 编辑弹窗 -->
      <FigurineForm
        v-model:visible="showForm"
        :figurine="editingFigurine"
        @saved="handleSaved"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import FigurineCard from '@/components/FigurineCard.vue'
import FigurineForm from '@/components/FigurineForm.vue'
import type { Figurine } from '@/types'
import { useFigurineStore } from '@/stores/figurine'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'

const figurineStore = useFigurineStore()
const batchStore = useBatchStore()
const tagStore = useTagStore()

const searchText = ref('')
const filterStatus = ref('')
const filterBatch = ref('')
const filterTag = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const showForm = ref(false)
const editingFigurine = ref<Figurine>()

const filteredFigurines = computed(() => {
  return figurineStore.figurines.filter(f => {
    if (searchText.value && !f.name.includes(searchText.value)) return false
    if (filterStatus.value && f.status !== filterStatus.value) return false
    if (filterBatch.value && f.batchId !== filterBatch.value) return false
    if (filterTag.value && !f.tagIds?.includes(filterTag.value)) return false
    return true
  })
})

const paginatedFigurines = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredFigurines.value.slice(start, start + pageSize.value)
})

function handleEdit(figurine: Figurine) {
  editingFigurine.value = figurine
  showForm.value = true
}

function handleSaved() {
  editingFigurine.value = undefined
}

onMounted(async () => {
  await Promise.all([
    figurineStore.fetchFigurines(),
    batchStore.fetchBatches(),
    tagStore.fetchTags()
  ])
})
</script>

<style scoped>
.figurine-list {
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

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