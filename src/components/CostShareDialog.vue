<template>
  <el-dialog
    :model-value="visible"
    title="费用分摊"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-width="100px">
      <el-form-item label="批次">
        <span>{{ batch?.name }}</span>
      </el-form-item>

      <el-form-item label="总运费">
        <span>¥{{ batch?.totalShipping || 0 }}</span>
      </el-form-item>

      <el-form-item label="总税费">
        <span>¥{{ batch?.totalTax || 0 }}</span>
      </el-form-item>

      <el-form-item label="手办数量">
        <span>{{ figurines.length }}</span>
      </el-form-item>

      <el-form-item label="分摊方式">
        <el-radio-group v-model="shareMode">
          <el-radio label="average">按数量均摊</el-radio>
          <el-radio label="custom">自定义比例</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 自定义比例时显示权重设置 -->
      <template v-if="shareMode === 'custom'">
        <el-divider>设置分摊权重</el-divider>
        <el-table :data="figurineWeights" max-height="300px">
          <el-table-column prop="name" label="手办名称" />
          <el-table-column label="权重" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.weight" :min="1" :max="10" size="small" />
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 预览 -->
      <el-divider>分摊预览</el-divider>
      <el-table :data="sharePreview" max-height="300px">
        <el-table-column prop="name" label="手办名称" />
        <el-table-column label="运费分摊" width="120">
          <template #default="{ row }">
            ¥{{ row.shippingShare.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="税费分摊" width="120">
          <template #default="{ row }">
            ¥{{ row.taxShare.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        应用分摊
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Batch } from '@/types'
import { useFigurineStore } from '@/stores/figurine'
import { useBatchStore } from '@/stores/batch'
import { calculateAverageShare, calculateWeightedShare } from '@/utils/calculator'

const props = defineProps<{
  visible: boolean
  batch?: Batch
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const figurineStore = useFigurineStore()
const batchStore = useBatchStore()

const shareMode = ref<'average' | 'custom'>('average')
const saving = ref(false)

interface FigurineWeight {
  id: string
  name: string
  weight: number
}

const figurines = computed(() =>
  figurineStore.figurines.filter(f => f.batchId === props.batch?.id)
)

const figurineWeights = ref<FigurineWeight[]>([])

watch(() => props.batch, (val) => {
  if (val) {
    shareMode.value = val.shareMode
    figurineWeights.value = figurines.value.map(f => ({
      id: f.id,
      name: f.name,
      weight: f.shareWeight || 1
    }))
  }
}, { immediate: true })

const sharePreview = computed(() => {
  if (!props.batch) return []

  const totalShipping = props.batch.totalShipping || 0
  const totalTax = props.batch.totalTax || 0
  const count = figurines.value.length

  if (count === 0) return []

  if (shareMode.value === 'average') {
    const shippingPerItem = calculateAverageShare(totalShipping, count)
    const taxPerItem = calculateAverageShare(totalTax, count)

    return figurines.value.map(f => ({
      id: f.id,
      name: f.name,
      shippingShare: shippingPerItem,
      taxShare: taxPerItem
    }))
  } else {
    const weights = figurineWeights.value.map(fw => fw.weight)
    const shippingShares = calculateWeightedShare(totalShipping, weights)
    const taxShares = calculateWeightedShare(totalTax, weights)

    return figurines.value.map((f, index) => ({
      id: f.id,
      name: f.name,
      shippingShare: shippingShares[index],
      taxShare: taxShares[index]
    }))
  }
})

async function handleSubmit() {
  if (!props.batch) return

  saving.value = true
  try {
    // 更新批次分摊方式
    await batchStore.updateBatch(props.batch.id, { shareMode: shareMode.value })

    // 更新手办费用分摊
    for (const item of sharePreview.value) {
      await figurineStore.updateFigurine(item.id, {
        shippingShare: item.shippingShare,
        taxShare: item.taxShare
      })
    }

    ElMessage.success('费用分摊已应用')
    emit('update:visible', false)
  } finally {
    saving.value = false
  }
}
</script>