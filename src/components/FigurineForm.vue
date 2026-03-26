<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑手办' : '新增手办'"
    width="600px"
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
            <el-input v-model="form.series" placeholder="如: VOCALOID" />
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
import { Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Figurine, FigurineStatus } from '@/types'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'
import { useImageStore } from '@/stores/image'
import { useFigurineStore } from '@/stores/figurine'
import { calculateTotalCost } from '@/utils/calculator'

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

const formRef = ref<FormInstance>()
const saving = ref(false)

const isEdit = computed(() => !!props.figurine)

const imageFiles = computed(() => imageStore.imageList)

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

watch([() => props.visible, () => props.figurine], ([visible, figurine]) => {
  if (visible && figurine) {
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
  } else if (!visible) {
    resetForm()
  }
}, { immediate: true })

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

function handleImageChange(file: string) {
  form.value.imageFile = file
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
    const data = {
      ...form.value,
      totalCost: totalCost.value
    }

    if (isEdit.value && props.figurine) {
      await figurineStore.updateFigurine(props.figurine.id, data)
      ElMessage.success('保存成功')
    } else {
      await figurineStore.addFigurine({
        ...data,
        imageIndex: 1
      } as any)
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
.image-preview {
  width: 100%;
  height: 150px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-preview .placeholder {
  font-size: 48px;
  color: #ccc;
}

.total-cost {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}
</style>