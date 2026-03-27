<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑手办' : '新增手办'"
    width="800px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <!-- 左侧图片 -->
        <el-col :span="8">
          <div class="image-preview">
            <img v-if="imagePreview" :src="imagePreview" />
            <el-icon v-else class="placeholder"><Picture /></el-icon>
          </div>
          <el-form-item label="图片文件">
            <el-select v-model="form.imageFile" @change="handleImageChange">
              <el-option
                v-for="file in imageFiles"
                :key="file"
                :label="file"
                :value="file"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <!-- 右侧表单 -->
        <el-col :span="16">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="手办名称" />
          </el-form-item>

          <el-form-item label="批次">
            <el-select v-model="form.batchId" clearable>
              <el-option
                v-for="b in batchStore.batchOptions"
                :key="b.value"
                :label="b.label"
                :value="b.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="系列/IP">
            <el-select
              v-model="form.series"
              filterable
              allow-create
              clearable
              default-first-option
              placeholder="选择或输入系列"
            >
              <el-option
                v-for="s in seriesOptions"
                :key="s"
                :label="s"
                :value="s"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status">
              <el-option label="待录入" value="pending" />
              <el-option label="在售" value="selling" />
              <el-option label="已出" value="sold" />
              <el-option label="囤货" value="holding" />
            </el-select>
          </el-form-item>

          <el-form-item label="买入价" prop="purchasePrice">
            <el-input-number v-model="form.purchasePrice" :min="0" :precision="2" />
          </el-form-item>

          <el-form-item label="运费分摊">
            <el-input-number v-model="form.shippingShare" :min="0" :precision="2" />
          </el-form-item>

          <el-form-item label="税费分摊">
            <el-input-number v-model="form.taxShare" :min="0" :precision="2" />
          </el-form-item>

          <el-form-item label="总成本">
            <span class="total-cost">¥{{ totalCost.toFixed(2) }}</span>
          </el-form-item>

          <el-form-item label="标签">
            <el-select v-model="form.tagIds" multiple>
              <el-option
                v-for="t in tagStore.tagOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 交易信息折叠面板 -->
    <el-collapse v-model="activeCollapseNames" class="trade-collapse">
      <el-collapse-item :title="tradePanelTitle" name="trade">
        <el-form label-width="100px">
          <el-form-item label="卖出价">
            <el-input-number
              v-model="tradeForm.sellPrice"
              :min="0"
              :precision="2"
              @change="recalculateTrade"
            />
          </el-form-item>

          <el-form-item label="总成本">
            <span>¥{{ totalCost.toFixed(2) }}</span>
          </el-form-item>

          <el-form-item label="咸鱼手续费">
            <span>¥{{ tradeForm.xianyuFee?.toFixed(2) || '0.00' }}</span>
          </el-form-item>

          <el-form-item label="实际收入">
            <span>¥{{ tradeForm.actualIncome?.toFixed(2) || '0.00' }}</span>
          </el-form-item>

          <el-form-item label="利润">
            <span :class="profitClass">
              ¥{{ tradeForm.profit?.toFixed(2) || '0.00' }} ({{ tradeForm.profitRate?.toFixed(1) || 0 }}%)
            </span>
          </el-form-item>

          <el-form-item label="卖出时间">
            <el-date-picker
              v-model="tradeForm.soldAt"
              type="datetime"
              placeholder="选择时间"
              value-format="timestamp"
            />
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="tradeForm.remark" type="textarea" :rows="2" />
          </el-form-item>

          <el-form-item v-if="existingTrade">
            <el-button type="danger" plain @click="handleDeleteTrade">
              删除交易
            </el-button>
          </el-form-item>
        </el-form>
      </el-collapse-item>
    </el-collapse>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Figurine, FigurineStatus, Trade } from '@/types'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'
import { useImageStore } from '@/stores/image'
import { useFigurineStore } from '@/stores/figurine'
import { useTradeStore } from '@/stores/trade'
import { calculateTotalCost, calculateTradeFinancials } from '@/utils/calculator'

const props = defineProps<{
  visible: boolean
  figurine?: Figurine
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const batchStore = useBatchStore()
const tagStore = useTagStore()
const imageStore = useImageStore()
const figurineStore = useFigurineStore()
const tradeStore = useTradeStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

// 交易信息相关（el-collapse v-model 需要数组类型）
const activeCollapseNames = ref<string[]>([])
const existingTrade = ref<Trade | undefined>()

const tradeForm = ref({
  sellPrice: 0,
  xianyuFee: 0,
  actualIncome: 0,
  profit: 0,
  profitRate: 0,
  soldAt: Date.now(),
  remark: ''
})

const isEdit = computed(() => !!props.figurine)

const imageFiles = computed(() => imageStore.imageList)

// 已使用的系列列表（从 store 获取）
const seriesOptions = computed(() => figurineStore.seriesOptions)

const form = ref({
  name: '',
  imageFile: '',
  imageIndex: 1,
  series: '',
  batchId: '',
  status: 'holding' as FigurineStatus,
  purchasePrice: 0,
  shippingShare: 0,
  taxShare: 0,
  tagIds: [] as string[],
  remark: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  purchasePrice: [{ required: true, message: '请输入买入价', trigger: 'blur' }]
}

const totalCost = computed(() =>
  calculateTotalCost(form.value.purchasePrice, form.value.shippingShare || 0, form.value.taxShare || 0)
)

const imagePreview = computed(() =>
  form.value.imageFile ? imageStore.getImageUrl(form.value.imageFile) : null
)

const tradePanelTitle = computed(() => {
  if (existingTrade.value) {
    return `交易信息 - 已售 ¥${existingTrade.value.sellPrice}`
  }
  return '交易信息'
})

const profitClass = computed(() =>
  tradeForm.value.profit >= 0 ? 'profit-positive' : 'profit-negative'
)

// 记录原始状态，用于判断状态是否变化
const originalStatus = ref<FigurineStatus>('holding')

watch([() => props.visible, () => props.figurine], async ([visible, figurine]) => {
  if (visible) {
    // 按需加载必要数据
    const loadPromises: Promise<void>[] = []

    if (figurineStore.figurines.length === 0) {
      loadPromises.push(figurineStore.fetchFigurines())
    }
    if (batchStore.batches.length === 0) {
      loadPromises.push(batchStore.fetchBatches())
    }
    if (tagStore.tags.length === 0) {
      loadPromises.push(tagStore.fetchTags())
    }

    if (loadPromises.length > 0) {
      await Promise.all(loadPromises)
    }

    if (figurine) {
      // 记录原始状态
      originalStatus.value = figurine.status

      form.value = {
        name: figurine.name,
        imageFile: figurine.imageFile,
        imageIndex: figurine.imageIndex,
        series: figurine.series || '',
        batchId: figurine.batchId || '',
        status: figurine.status,
        purchasePrice: figurine.purchasePrice,
        shippingShare: figurine.shippingShare || 0,
        taxShare: figurine.taxShare || 0,
        tagIds: figurine.tagIds || [],
        remark: figurine.remark || ''
      }

      // 如果手办是"已出"状态，预加载交易信息（用于判断状态变更时的处理）
      if (figurine.status === 'sold') {
        await tradeStore.fetchTrades()
        const trade = await tradeStore.getActiveTradeByFigurineId(figurine.id)
        existingTrade.value = trade
      }
    }
  } else if (!visible) {
    resetForm()
  }
}, { immediate: true })

// 监听交易面板展开，加载交易数据
watch(activeCollapseNames, async (names) => {
  if (names.includes('trade') && props.figurine) {
    await tradeStore.fetchTrades()
    const trade = await tradeStore.getActiveTradeByFigurineId(props.figurine.id)
    existingTrade.value = trade

    if (trade) {
      tradeForm.value = {
        sellPrice: trade.sellPrice,
        xianyuFee: trade.xianyuFee || 0,
        actualIncome: trade.actualIncome,
        profit: trade.profit,
        profitRate: trade.profitRate,
        soldAt: trade.soldAt,
        remark: trade.remark || ''
      }
    } else {
      resetTradeForm()
    }
  }
})

// 监听总成本变化，自动重新计算利润
watch(totalCost, () => {
  if (activeCollapseNames.value.includes('trade') && tradeForm.value.sellPrice > 0) {
    recalculateTrade()
  }
})

function resetForm() {
  form.value = {
    name: '',
    imageFile: '',
    imageIndex: 1,
    series: '',
    batchId: '',
    status: 'holding',
    purchasePrice: 0,
    shippingShare: 0,
    taxShare: 0,
    tagIds: [],
    remark: ''
  }
}

function resetTradeForm() {
  tradeForm.value = {
    sellPrice: 0,
    xianyuFee: 0,
    actualIncome: 0,
    profit: 0,
    profitRate: 0,
    soldAt: Date.now(),
    remark: ''
  }
}

function handleImageChange(file: string) {
  form.value.imageFile = file
}

function recalculateTrade() {
  if (tradeForm.value.sellPrice > 0) {
    // 使用当前表单中的 totalCost（可能用户已修改买入价等）
    const financials = calculateTradeFinancials(tradeForm.value.sellPrice, totalCost.value)
    tradeForm.value.xianyuFee = financials.xianyuFee ?? 0
    tradeForm.value.actualIncome = financials.actualIncome
    tradeForm.value.profit = financials.profit
    tradeForm.value.profitRate = financials.profitRate
  }
}

async function handleDeleteTrade() {
  if (!existingTrade.value) return

  try {
    await ElMessageBox.confirm(
      '确定删除该交易记录吗？删除后手办状态将改为"在售"。',
      '确认删除',
      { type: 'warning' }
    )
  } catch {
    // 用户取消
    return
  }

  try {
    await tradeStore.removeTrade(existingTrade.value.id)

    // 更新手办状态为"在售"
    if (props.figurine) {
      await figurineStore.updateFigurine(props.figurine.id, { status: 'selling' })
    }

    existingTrade.value = undefined
    resetTradeForm()

    ElMessage.success('删除成功')
    emit('saved')
  } catch {
    ElMessage.error('删除交易失败')
  }
}

function handleClose() {
  emit('update:visible', false)
  resetForm()
  existingTrade.value = undefined
  resetTradeForm()
  activeCollapseNames.value = []
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    // 状态自动变更逻辑
    // 1. 买入价非0且状态是"待录入"，自动设为"在售"
    if (form.value.purchasePrice > 0 && form.value.status === 'pending') {
      form.value.status = 'selling'
    }

    const data = {
      ...form.value,
      totalCost: totalCost.value
    }

    // 1. 保存手办信息
    if (isEdit.value && props.figurine) {
      await figurineStore.updateFigurine(props.figurine.id, data)
    } else {
      await figurineStore.addFigurine({
        ...data,
        imageIndex: 1
      } as any)
    }

    // 2. 如果交易面板展开且有卖出价，保存交易信息
    if (activeCollapseNames.value.includes('trade') && tradeForm.value.sellPrice > 0 && props.figurine) {
      const tradeData = {
        figurineId: props.figurine.id,
        ...tradeForm.value,
        isActive: true
      }

      try {
        if (existingTrade.value) {
          await tradeStore.updateTrade(existingTrade.value.id, tradeData)
        } else {
          await tradeStore.addTrade(tradeData as Omit<Trade, 'id'>)
        }

        // 有交易信息时，如果用户没有手动修改状态，自动设为"已出"
        if (form.value.status === originalStatus.value) {
          form.value.status = 'sold'
          await figurineStore.updateFigurine(props.figurine.id, { status: 'sold' })
        }
      } catch (error) {
        ElMessage.error('手办保存成功，但交易保存失败')
        emit('saved')
        handleClose()
        return
      }
    }

    // 3. 处理状态变更时的交易记录
    // 如果手办从"已出"变成其他状态，将交易记录设为非活跃
    if (props.figurine && originalStatus.value === 'sold' && form.value.status !== 'sold' && existingTrade.value) {
      await tradeStore.updateTrade(existingTrade.value.id, { isActive: false })
    }

    ElMessage.success('保存成功')
    emit('saved')
    handleClose()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.image-preview {
  width: 100%;
  height: 150px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: var(--radius-md, 10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-sm, 6px);
}

.image-preview .placeholder {
  font-size: 48px;
  color: #cbd5e1;
}

.total-cost {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-500, #4440d6);
}

.trade-collapse {
  margin-top: 16px;
  border-top: 1px solid var(--gray-100, #f4f4f5);
  padding-top: 16px;
}

.profit-positive {
  color: #16a34a;
  font-weight: 700;
}

.profit-negative {
  color: #dc2626;
  font-weight: 700;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>