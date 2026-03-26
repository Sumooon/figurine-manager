<template>
  <el-dialog
    :model-value="visible"
    title="交易详情"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="手办">
        <span>{{ selectedFigurine?.name }}</span>
      </el-form-item>

      <el-form-item label="卖出价" prop="sellPrice">
        <el-input-number v-model="form.sellPrice" :min="0" :precision="2" @change="recalculate" />
      </el-form-item>

      <el-form-item label="总成本">
        <span>¥{{ selectedFigurine?.totalCost || 0 }}</span>
      </el-form-item>

      <el-form-item label="咸鱼手续费">
        <span>¥{{ form.xianyuFee?.toFixed(2) || '0.00' }}</span>
      </el-form-item>

      <el-form-item label="实际收入">
        <span>¥{{ form.actualIncome?.toFixed(2) || '0.00' }}</span>
      </el-form-item>

      <el-form-item label="利润">
        <span :class="profitClass">¥{{ form.profit?.toFixed(2) || '0.00' }} ({{ form.profitRate?.toFixed(1) || 0 }}%)</span>
      </el-form-item>

      <el-form-item label="卖出时间">
        <el-date-picker
          v-model="form.soldAt"
          type="datetime"
          placeholder="选择时间"
          value-format="timestamp"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Trade } from '@/types'
import { useTradeStore } from '@/stores/trade'
import { useFigurineStore } from '@/stores/figurine'
import { calculateTradeFinancials } from '@/utils/calculator'

const props = defineProps<{
  visible: boolean
  trade?: Trade
  figurineId?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const tradeStore = useTradeStore()
const figurineStore = useFigurineStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

const form = ref({
  figurineId: '',
  sellPrice: 0,
  xianyuFee: 0,
  actualIncome: 0,
  profit: 0,
  profitRate: 0,
  soldAt: Date.now(),
  remark: ''
})

const rules: FormRules = {
  sellPrice: [{ required: true, message: '请输入卖出价', trigger: 'blur' }]
}

const selectedFigurine = computed(() =>
  figurineStore.figurines.find(f => f.id === form.value.figurineId)
)

const profitClass = computed(() =>
  form.value.profit >= 0 ? 'profit-positive' : 'profit-negative'
)

function recalculate() {
  if (selectedFigurine.value && form.value.sellPrice > 0) {
    const financials = calculateTradeFinancials(form.value.sellPrice, selectedFigurine.value.totalCost)
    form.value.xianyuFee = financials.xianyuFee ?? 0
    form.value.actualIncome = financials.actualIncome
    form.value.profit = financials.profit
    form.value.profitRate = financials.profitRate
  }
}

watch([() => props.visible, () => props.trade, () => props.figurineId], ([visible, trade, figurineId]) => {
  if (visible) {
    if (trade) {
      form.value = {
        figurineId: trade.figurineId,
        sellPrice: trade.sellPrice,
        xianyuFee: trade.xianyuFee || 0,
        actualIncome: trade.actualIncome,
        profit: trade.profit,
        profitRate: trade.profitRate,
        soldAt: trade.soldAt,
        remark: trade.remark || ''
      }
    } else if (figurineId) {
      form.value = {
        figurineId: figurineId,
        sellPrice: 0,
        xianyuFee: 0,
        actualIncome: 0,
        profit: 0,
        profitRate: 0,
        soldAt: Date.now(),
        remark: ''
      }
    }
    recalculate()
  }
}, { immediate: true })

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    if (props.trade) {
      await tradeStore.updateTrade(props.trade.id, form.value)
    } else {
      await tradeStore.addTrade({
        ...form.value,
        isActive: true
      } as Omit<Trade, 'id'>)
    }

    // 有交易记录 = 已售出
    await figurineStore.updateFigurine(form.value.figurineId, { status: 'sold' })

    ElMessage.success('保存成功')
    emit('saved')
    handleClose()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profit-positive { color: #67c23a; font-weight: bold; }
.profit-negative { color: #f56c6c; font-weight: bold; }
</style>