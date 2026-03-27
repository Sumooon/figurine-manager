// 批次
export interface Batch {
  id: string
  name: string
  imageRange: string
  totalShipping?: number
  totalTax?: number
  shareMode: 'average' | 'custom'
  createdAt: number
}

// 批次（带手办数量）
export interface BatchWithCount extends Batch {
  figurineCount: number
}

// 手办状态
export type FigurineStatus = 'pending' | 'selling' | 'sold' | 'holding'

// 手办
export interface Figurine {
  id: string
  imageFile: string
  imageIndex: number
  name: string
  series?: string
  tagIds: string[]
  batchId?: string
  purchasePrice: number
  shippingShare?: number
  taxShare?: number
  shareWeight?: number
  totalCost: number
  status: FigurineStatus
  remark?: string
  createdAt: number
  updatedAt: number
}

// 咸鱼状态
export type XianyuStatus = 'unpublished' | 'selling' | 'sold' | 'offline'

// 交易
export interface Trade {
  id: string
  figurineId: string
  sellPrice: number
  xianyuLink?: string
  xianyuOrderId?: string
  xianyuStatus?: XianyuStatus
  xianyuBuyerId?: string
  xianyuFee?: number
  actualIncome: number
  profit: number
  profitRate: number
  buyerName?: string
  buyerContact?: string
  soldAt: number
  remark?: string
  isActive: boolean
}

// 活跃交易摘要（用于列表展示）
export interface ActiveTradeSummary {
  sellPrice: number
  profit: number
  profitRate: number
}

// 手办 + 活跃交易（用于列表展示）
export interface FigurineWithTrade extends Figurine {
  activeTrade?: ActiveTradeSummary
}

// 标签
export interface Tag {
  id: string
  name: string
  color?: string
}

// 图片缓存
export interface ImageCache {
  id: string              // 图片文件名
  thumbnail: Blob         // 缩略图
  originalSize: number    // 原图大小
}

// 目录句柄存储
export interface DirectoryHandleCache {
  id: 'imageDirectory'
  handle: FileSystemDirectoryHandle
}