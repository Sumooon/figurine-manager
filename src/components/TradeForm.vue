<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '交易详情' : '新增交易'"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="手办" prop="figurineId">
        <el-select v-model="form.figurineId" placeholder="选择手办" :disabled="isEdit">
          <el-option
            v-for="f in availableFigurines"
            :key="f.id"
            :label="f.name"
            :value="f.id"
          />
        </el-select>
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

      <el-divider>咸鱼信息</el-divider>

      <el-form-item label="咸鱼链接">
        <el-input v-model="form.xianyuLink" placeholder="咸鱼商品链接" />
      </el-form-item>

      <el-form-item label="订单号">
        <el-input v-model="form.xianyuOrderId" placeholder="咸鱼订单号" />
      </el-form-item>

      <el-form-item label="咸鱼状态">
        <el-select v-model="form.xianyuStatus">
          <el-option label="未发布" value="unpublished" />
          <el-option label="在售中" value="selling" />
          <el-option label="已售出" value="sold" />
          <el-option label="已下架" value="offline" />
        </el-select>
      </el-form-item>

      <el-form-item label="买家ID">
        <el-input v-model="form.xianyuBuyerId" placeholder="买家咸鱼ID" />
      </el-form-item>

      <el-divider>买家信息</el-divider>

      <el-form-item label="买家名称">
        <el-input v-model="form.buyerName" placeholder="买家名称" />
      </el-form-item>

      <el-form-item label="联系方式">
        <el-input v-model="form.buyerContact" placeholder="买家联系方式" />
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
import type { Trade, XianyuStatus } from '@/types'
import { useTradeStore } from '@/stores/trade'
import { useFigurineStore } from '@/stores/figurine'
import { calculateTradeFinancials } from '@/utils/calculator'

const props = defineProps<{
  visible: boolean
  trade?: Trade
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const tradeStore = useTradeStore()
const figurineStore = useFigurineStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

const isEdit = computed(() => !!props.trade)

const availableFigurines = computed(() => figurineStore.figurines)

const form = ref({
  figurineId: '',
  sellPrice: 0,
  xianyuLink: '',
  xianyuOrderId: '',
  xianyuStatus: 'unpublished' as XianyuStatus,
  xianyuBuyerId: '',
  xianyuFee: 0,
  actualIncome: 0,
  profit: 0,
  profitRate: 0,
  buyerName: '',
  buyerContact: '',
  soldAt: Date.now(),
  remark: '',
  isActive: true
})

const rules: FormRules = {
  figurineId: [{ required: true, message: '请选择手办', trigger: 'change' }],
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
    form.value.xianyuFee = financials.xianyuFee
    form.value.actualIncome = financials.actualIncome
    form.value.profit = financials.profit
    form.value.profitRate = financials.profitRate
  }
}

watch(() => props.trade, (val) => {
  if (val) {
    form.value = {
      figurineId: val.figurineId,
      sellPrice: val.sellPrice,
      xianyuLink: val.xianyuLink || '',
      xianyuOrderId: val.xianyuOrderId || '',
      xianyuStatus: val.xianyuStatus || 'unpublished',
      xianyuBuyerId: val.xianyuBuyerId || '',
      xianyuFee: val.xianyuFee || 0,
      actualIncome: val.actualIncome,
      profit: val.profit,
      profitRate: val.profitRate,
      buyerName: val.buyerName || '',
      buyerContact: val.buyerContact || '',
      soldAt: val.soldAt,
      remark: val.remark || '',
      isActive: val.isActive
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => form.value.figurineId, () => {
  recalculate()
})

function resetForm() {
  form.value = {
    figurineId: '',
    sellPrice: 0,
    xianyuLink: '',
    xianyuOrderId: '',
    xianyuStatus: 'unpublished',
    xianyuBuyerId: '',
    xianyuFee: 0,
    actualIncome: 0,
    profit: 0,
    profitRate: 0,
    buyerName: '',
    buyerContact: '',
    soldAt: Date.now(),
    remark: '',
    isActive: true
  }
}

function handleClose() {
  emit('update:visible', false)
  resetForm()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value && props.trade) {
      await tradeStore.updateTrade(props.trade.id, form.value)
      ElMessage.success('保存成功')
    } else {
      await tradeStore.addTrade(form.value as Omit<Trade, 'id'>)
      ElMessage.success('添加成功')
    }

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