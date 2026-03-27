<template>
  <el-dialog
    :model-value="visible"
    title="费用分摊"
    width="700px"
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
          <el-radio label="weight">按权重分摊</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 按数量均摊 -->
      <template v-if="shareMode === 'average'">
        <el-divider>分摊结果</el-divider>
        <el-table :data="averageShares" max-height="300px">
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
      </template>

      <!-- 按权重分摊 -->
      <template v-if="shareMode === 'weight'">
        <el-divider>
          <div class="divider-header">
            <span>设置分摊权重</span>
            <el-button size="small" @click="handleBatchSetWeight">批量设置权重</el-button>
          </div>
        </el-divider>
        <el-table :data="figurineWeights" max-height="300px">
          <el-table-column prop="name" label="手办名称" />
          <el-table-column label="权重" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.weight" :min="0" :max="100" size="small" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="运费分摊" width="110">
            <template #default="{ row }">
              ¥{{ row.shippingShare.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="税费分摊" width="110">
            <template #default="{ row }">
              ¥{{ row.taxShare.toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
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

// 按数量均摊的结果
const averageShares = computed(() => {
  if (!props.batch || figurines.value.length === 0) return []

  const totalShipping = props.batch.totalShipping || 0
  const totalTax = props.batch.totalTax || 0
  const count = figurines.value.length

  const shippingPerItem = calculateAverageShare(totalShipping, count)
  const taxPerItem = calculateAverageShare(totalTax, count)

  return figurines.value.map(f => ({
    id: f.id,
    name: f.name,
    shippingShare: shippingPerItem,
    taxShare: taxPerItem
  }))
})

// 监听 batch 和 figurines 变化
watch([() => props.batch, figurines], ([batch, figs]) => {
  // 保存期间不重新初始化，避免覆盖用户设置
  if (saving.value) return

  if (batch && figs.length > 0) {
    // 兼容旧的 shareMode
    shareMode.value = batch.shareMode === 'custom' ? 'weight' : batch.shareMode as ShareMode || 'average'

    // 初始化权重数据
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

// 监听权重变化，实时更新分摊金额
watch(figurineWeights, () => {
  if (shareMode.value === 'weight') {
    updateWeightShares()
  }
}, { deep: true })

// 更新权重分摊金额
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

// 批量设置权重
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

  // 检查是否有手办
  if (figurines.value.length === 0) {
    ElMessage.warning('该批次没有手办，无法进行费用分摊')
    return
  }

  saving.value = true
  try {
    // 更新批次分摊方式
    const modeToSave = shareMode.value === 'weight' ? 'custom' : shareMode.value
    await batchStore.updateBatch(props.batch.id, { shareMode: modeToSave as 'average' | 'custom' })

    // 获取分摊数据
    const shares = shareMode.value === 'average' ? averageShares.value : figurineWeights.value

    // 收集所有更新数据
    const updates: Array<{ id: string; data: Partial<Figurine> }> = []

    for (const item of shares) {
      const figurine = figurines.value.find(f => f.id === item.id)
      const weightItem = figurineWeights.value.find(fw => fw.id === item.id)

      // 重新计算总成本
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
          shareWeight: weightItem?.weight ?? 1,
          totalCost
        }
      })
    }

    // 批量更新所有手办（并行执行）
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
.divider-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>