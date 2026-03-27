<template>
  <el-dialog
    :model-value="visible"
    title="费用分摊"
    width="680px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="share-content">
      <!-- 批次信息 -->
      <div class="batch-info">
        <div class="info-item">
          <span class="info-label">批次</span>
          <span class="info-value">{{ batch?.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">手办数</span>
          <span class="info-value">{{ figurines.length }} 件</span>
        </div>
        <div class="info-item">
          <span class="info-label">总运费</span>
          <span class="info-value expense">¥{{ batch?.totalShipping || 0 }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">总税费</span>
          <span class="info-value expense">¥{{ batch?.totalTax || 0 }}</span>
        </div>
      </div>

      <!-- 分摊方式 -->
      <div class="share-mode">
        <div class="mode-label">分摊方式</div>
        <el-radio-group v-model="shareMode" class="mode-radio">
          <el-radio-button label="average">按数量均摊</el-radio-button>
          <el-radio-button label="weight">按权重分摊</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 按数量均摊 -->
      <div v-if="shareMode === 'average' && figurines.length > 0" class="share-result">
        <div class="result-title">分摊结果</div>
        <div class="result-values">
          <div class="result-item">
            <span class="result-label">每件运费分摊</span>
            <span class="result-value">¥{{ averageShipping.toFixed(2) }}</span>
          </div>
          <div class="result-item">
            <span class="result-label">每件税费分摊</span>
            <span class="result-value">¥{{ averageTax.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 按权重分摊 -->
      <div v-if="shareMode === 'weight'" class="weight-section">
        <div class="weight-header">
          <span>设置分摊权重</span>
          <el-button size="small" @click="handleBatchSetWeight">批量设置</el-button>
        </div>
        <el-table :data="figurineWeights" max-height="280px">
          <el-table-column prop="name" label="手办名称" />
          <el-table-column label="权重" width="100">
            <template #default="{ row }">
              <el-input-number
                v-model="row.weight"
                :min="0"
                :max="100"
                size="small"
                controls-position="right"
              />
            </template>
          </el-table-column>
          <el-table-column label="运费" width="100">
            <template #default="{ row }">
              ¥{{ row.shippingShare.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="税费" width="100">
            <template #default="{ row }">
              ¥{{ row.taxShare.toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

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
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Batch, Figurine } from '@/types'
import { useFigurineStore } from '@/stores/figurine'
import { useBatchStore } from '@/stores/batch'
import { calculateAverageShare, calculateWeightedShare, calculateTotalCost } from '@/utils/calculator'

const props = defineProps<{
  visible: boolean
  batch?: Batch
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const figurineStore = useFigurineStore()
const batchStore = useBatchStore()

type ShareMode = 'average' | 'weight'
const shareMode = ref<ShareMode>('average')
const saving = ref(false)

interface FigurineWeight {
  id: string
  name: string
  weight: number
  shippingShare: number
  taxShare: number
}

const figurines = computed(() =>
  figurineStore.figurines.filter(f => f.batchId === props.batch?.id)
)

const figurineWeights = ref<FigurineWeight[]>([])

const averageShipping = computed(() => {
  if (!props.batch || figurines.value.length === 0) return 0
  return calculateAverageShare(props.batch.totalShipping || 0, figurines.value.length)
})

const averageTax = computed(() => {
  if (!props.batch || figurines.value.length === 0) return 0
  return calculateAverageShare(props.batch.totalTax || 0, figurines.value.length)
})

watch([() => props.batch, figurines], ([batch, figs]) => {
  if (saving.value) return

  if (batch && figs.length > 0) {
    shareMode.value = batch.shareMode === 'custom' ? 'weight' : batch.shareMode as ShareMode || 'average'

    figurineWeights.value = figs.map(f => ({
      id: f.id,
      name: f.name,
      weight: f.shareWeight ?? 1,
      shippingShare: 0,
      taxShare: 0
    }))

    updateWeightShares()
  }
}, { immediate: true })

watch(figurineWeights, () => {
  if (shareMode.value === 'weight') {
    updateWeightShares()
  }
}, { deep: true })

function updateWeightShares() {
  if (!props.batch || figurineWeights.value.length === 0) return

  const totalShipping = props.batch.totalShipping || 0
  const totalTax = props.batch.totalTax || 0
  const weights = figurineWeights.value.map(fw => fw.weight)

  const shippingShares = calculateWeightedShare(totalShipping, weights)
  const taxShares = calculateWeightedShare(totalTax, weights)

  figurineWeights.value.forEach((fw, index) => {
    fw.shippingShare = shippingShares[index]
    fw.taxShare = taxShares[index]
  })
}

async function handleBatchSetWeight() {
  try {
    const { value } = await ElMessageBox.prompt('请输入权重值（0-100）', '批量设置权重', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^(100|[0-9]{1,2})$/,
      inputErrorMessage: '请输入 0-100 之间的整数'
    })
    const weight = parseInt(value)
    figurineWeights.value.forEach(fw => { fw.weight = weight })
    ElMessage.success(`已将所有手办权重设置为 ${weight}`)
  } catch {
    // 用户取消
  }
}

async function handleSubmit() {
  if (!props.batch) return

  if (figurines.value.length === 0) {
    ElMessage.warning('该批次没有手办，无法进行费用分摊')
    return
  }

  saving.value = true
  try {
    const modeToSave = shareMode.value === 'weight' ? 'custom' : shareMode.value
    await batchStore.updateBatch(props.batch.id, { shareMode: modeToSave as 'average' | 'custom' })

    const updates: Array<{ id: string; data: Partial<Figurine> }> = []

    if (shareMode.value === 'average') {
      for (const figurine of figurines.value) {
        const totalCost = calculateTotalCost(
          figurine.purchasePrice || 0,
          averageShipping.value,
          averageTax.value
        )
        updates.push({
          id: figurine.id,
          data: {
            shippingShare: averageShipping.value,
            taxShare: averageTax.value,
            shareWeight: 1,
            totalCost
          }
        })
      }
    } else {
      for (const item of figurineWeights.value) {
        const figurine = figurines.value.find(f => f.id === item.id)
        const totalCost = calculateTotalCost(
          figurine?.purchasePrice || 0,
          item.shippingShare,
          item.taxShare
        )
        updates.push({
          id: item.id,
          data: {
            shippingShare: item.shippingShare,
            taxShare: item.taxShare,
            shareWeight: item.weight,
            totalCost
          }
        })
      }
    }

    await Promise.all(
      updates.map(update => figurineStore.updateFigurine(update.id, update.data))
    )

    ElMessage.success('费用分摊已应用')
    emit('update:visible', false)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.share-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 批次信息 */
.batch-info {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--gray-500);
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-800);
}

.info-value.expense {
  color: #dc2626;
}

/* 分摊方式 */
.share-mode {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
}

/* 均摊结果 */
.share-result {
  padding: 16px;
  background: var(--primary-50);
  border-radius: var(--radius-sm);
}

.result-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-700);
  margin-bottom: 12px;
}

.result-values {
  display: flex;
  gap: 32px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 12px;
  color: var(--gray-600);
}

.result-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-600);
}

/* 权重分摊 */
.weight-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
}
</style>