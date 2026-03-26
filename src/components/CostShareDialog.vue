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
          <el-radio label="manual">手动输入</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 按权重分摊时显示权重设置 -->
      <template v-if="shareMode === 'weight'">
        <el-divider>
          <div class="divider-header">
            <span>设置分摊权重</span>
            <el-button size="small" @click="handleBatchSetWeight">批量设置权重</el-button>
          </div>
        </el-divider>
        <el-table :data="figurineWeights" max-height="250px">
          <el-table-column prop="name" label="手办名称" />
          <el-table-column label="权重" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.weight" :min="0" :max="100" size="small" />
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 手动输入时显示金额编辑 -->
      <template v-if="shareMode === 'manual'">
        <el-divider>手动设置分摊金额</el-divider>
        <div class="manual-summary">
          <span>运费剩余: ¥{{ remainingShipping.toFixed(2) }}</span>
          <span>税费剩余: ¥{{ remainingTax.toFixed(2) }}</span>
        </div>
        <el-table :data="manualShares" max-height="250px">
          <el-table-column prop="name" label="手办名称" />
          <el-table-column label="运费分摊" width="140">
            <template #default="{ row }">
              <el-input-number
                v-model="row.shippingShare"
                :min="0"
                :precision="2"
                size="small"
                @change="updateRemaining"
              />
            </template>
          </el-table-column>
          <el-table-column label="税费分摊" width="140">
            <template #default="{ row }">
              <el-input-number
                v-model="row.taxShare"
                :min="0"
                :precision="2"
                size="small"
                @change="updateRemaining"
              />
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 预览 -->
      <el-divider>分摊预览</el-divider>
      <el-table :data="sharePreview" max-height="250px">
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
import { ElMessage, ElMessageBox } from 'element-plus'
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

type ShareMode = 'average' | 'weight' | 'manual'
const shareMode = ref<ShareMode>('average')
const saving = ref(false)

interface FigurineWeight {
  id: string
  name: string
  weight: number
}

interface ManualShare {
  id: string
  name: string
  shippingShare: number
  taxShare: number
}

const figurines = computed(() =>
  figurineStore.figurines.filter(f => f.batchId === props.batch?.id)
)

const figurineWeights = ref<FigurineWeight[]>([])
const manualShares = ref<ManualShare[]>([])

// 剩余金额
const remainingShipping = ref(0)
const remainingTax = ref(0)

// 监听 batch 和 figurines 变化
watch([() => props.batch, figurines], ([batch, figs]) => {
  if (batch && figs.length > 0) {
    // 兼容旧的 shareMode
    shareMode.value = batch.shareMode === 'custom' ? 'weight' : batch.shareMode as ShareMode || 'average'

    figurineWeights.value = figs.map(f => ({
      id: f.id,
      name: f.name,
      weight: f.shareWeight ?? 1
    }))

    manualShares.value = figs.map(f => ({
      id: f.id,
      name: f.name,
      shippingShare: f.shippingShare || 0,
      taxShare: f.taxShare || 0
    }))

    updateRemaining()
  }
}, { immediate: true })

function updateRemaining() {
  if (!props.batch) return
  const totalShipping = props.batch.totalShipping || 0
  const totalTax = props.batch.totalTax || 0

  remainingShipping.value = totalShipping - manualShares.value.reduce((sum, m) => sum + m.shippingShare, 0)
  remainingTax.value = totalTax - manualShares.value.reduce((sum, m) => sum + m.taxShare, 0)
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
  } else if (shareMode.value === 'weight') {
    const weights = figurineWeights.value.map(fw => fw.weight)
    const shippingShares = calculateWeightedShare(totalShipping, weights)
    const taxShares = calculateWeightedShare(totalTax, weights)

    return figurines.value.map((f, index) => ({
      id: f.id,
      name: f.name,
      shippingShare: shippingShares[index],
      taxShare: taxShares[index]
    }))
  } else {
    // manual
    return manualShares.value.map(m => ({
      id: m.id,
      name: m.name,
      shippingShare: m.shippingShare,
      taxShare: m.taxShare
    }))
  }
})

async function handleSubmit() {
  if (!props.batch) return

  // 手动模式下检查剩余金额
  if (shareMode.value === 'manual') {
    if (Math.abs(remainingShipping.value) > 0.01 || Math.abs(remainingTax.value) > 0.01) {
      ElMessage.warning('请确保分摊金额与总金额一致')
      return
    }
  }

  saving.value = true
  try {
    // 更新批次分摊方式
    const modeToSave = shareMode.value === 'weight' ? 'custom' : shareMode.value
    await batchStore.updateBatch(props.batch.id, { shareMode: modeToSave as 'average' | 'custom' })

    // 更新手办费用分摊和权重
    for (const item of sharePreview.value) {
      const weightItem = figurineWeights.value.find(fw => fw.id === item.id)
      await figurineStore.updateFigurine(item.id, {
        shippingShare: item.shippingShare,
        taxShare: item.taxShare,
        shareWeight: weightItem?.weight ?? 1
      })
    }

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

.manual-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.manual-summary span {
  padding: 4px 8px;
  background: #f4f4f5;
  border-radius: 4px;
}
</style>