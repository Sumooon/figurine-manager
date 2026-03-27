import { v4 as uuidv4 } from 'uuid'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDel, buildQuery, toPlainObject, type PaginatedResult } from './index'
import type { Figurine, FigurineStatus, FigurineWithTrade } from '@/types'

// 筛选参数
export interface FigurineFilter {
  status?: FigurineStatus
  batchId?: string
  tagId?: string
  search?: string
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 数据库字段 -> 前端字段
function fromDB(row: any): Figurine {
  return {
    id: row.id,
    imageFile: row.image_file,
    imageIndex: row.image_index,
    name: row.name,
    series: row.series,
    tagIds: row.tag_ids || [],
    batchId: row.batch_id,
    purchasePrice: parseFloat(row.purchase_price) || 0,
    shippingShare: parseFloat(row.shipping_share) || 0,
    taxShare: parseFloat(row.tax_share) || 0,
    shareWeight: row.share_weight ?? 1,
    totalCost: parseFloat(row.total_cost) || 0,
    status: row.status,
    remark: row.remark,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

// 数据库字段 -> 前端字段（带活跃交易）
function fromDBWithTrade(row: any): FigurineWithTrade {
  const figurine = fromDB(row)
  const trade = row.trades?.[0] || row.active_trade
  if (trade) {
    return {
      ...figurine,
      activeTrade: {
        sellPrice: parseFloat(trade.sell_price) || 0,
        profit: parseFloat(trade.profit) || 0,
        profitRate: parseFloat(trade.profit_rate) || 0,
      }
    }
  }
  return figurine
}

// 前端字段 -> 数据库字段
function toDB(data: Partial<Figurine>): any {
  const result: any = {}
  if (data.imageFile !== undefined) result.image_file = data.imageFile
  if (data.imageIndex !== undefined) result.image_index = data.imageIndex
  if (data.name !== undefined) result.name = data.name
  if (data.series !== undefined) result.series = data.series || null
  // 空字符串转为 null
  if (data.batchId !== undefined) result.batch_id = data.batchId || null
  if (data.purchasePrice !== undefined) result.purchase_price = data.purchasePrice
  if (data.shippingShare !== undefined) result.shipping_share = data.shippingShare
  if (data.taxShare !== undefined) result.tax_share = data.taxShare
  if (data.shareWeight !== undefined) result.share_weight = data.shareWeight
  if (data.totalCost !== undefined) result.total_cost = data.totalCost
  if (data.status !== undefined) result.status = data.status
  if (data.remark !== undefined) result.remark = data.remark || null
  // 确保 tag_ids 是数组
  if (data.tagIds !== undefined) result.tag_ids = data.tagIds || []
  return result
}

export async function getAllFigurines(): Promise<Figurine[]> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ order: 'image_index.asc' }))
  return rows.map(fromDB)
}

// 分页查询手办（带活跃交易）
export async function getFigurinesPaginated(
  pagination: PaginationParams,
  filter?: FigurineFilter
): Promise<PaginatedResult<FigurineWithTrade>> {
  const { page, pageSize } = pagination
  const offset = (page - 1) * pageSize

  // PostgREST 关联查询：获取手办及其活跃交易
  // select=*,trades(...) 获取关联的 trades 表数据
  // trades.is_active=eq.true 过滤只获取活跃交易
  const params: Record<string, string> = {
    select: '*,trades(sell_price,profit,profit_rate)',
    order: 'image_index.asc',
    limit: String(pageSize),
    offset: String(offset),
    'trades.is_active': 'eq.true',
  }

  // 筛选条件
  if (filter?.status) {
    params.status = `eq.${filter.status}`
  }
  if (filter?.batchId) {
    params.batch_id = `eq.${filter.batchId}`
  }
  if (filter?.tagId) {
    // tag_ids 是 jsonb 数组，使用 cs (contains) 操作符配合 JSON 数组格式
    // PostgREST: tag_ids=cs.["uuid"] 转换为 tag_ids @> '["uuid"]'::jsonb
    params['tag_ids'] = `cs.["${filter.tagId}"]`
  }
  if (filter?.search) {
    // 模糊搜索名称
    params.name = `ilike.%${filter.search}%`
  }

  const result = await apiGetPaginated<any[]>('/figurines' + buildQuery(params))
  return {
    data: result.data.map(fromDBWithTrade),
    total: result.total,
  }
}

export async function getFigurinesByBatch(batchId: string): Promise<Figurine[]> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ batch_id: `eq.${batchId}` }))
  return rows.map(fromDB)
}

// 根据 ID 获取单个手办（从数据库获取最新数据）
export async function getFigurineById(id: string): Promise<Figurine | undefined> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ id: `eq.${id}` }))
  return rows[0] ? fromDB(rows[0]) : undefined
}

export async function createFigurine(data: Omit<Figurine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Figurine> {
  const id = uuidv4()
  const now = new Date().toISOString()
  const plainData = toPlainObject(data)
  const row = await apiPost('/figurines', {
    id,
    ...toDB(plainData),
    created_at: now,
    updated_at: now,
  })
  return fromDB(row)
}

export async function updateFigurine(id: string, data: Partial<Figurine>): Promise<void> {
  const plainData = toPlainObject(data)
  await apiPatch('/figurines' + buildQuery({ id: `eq.${id}` }), {
    ...toDB(plainData),
    updated_at: new Date().toISOString(),
  })
}

export async function deleteFigurine(id: string): Promise<void> {
  await apiDel('/figurines' + buildQuery({ id: `eq.${id}` }))
}

export async function batchUpdateFigurines(ids: string[], data: Partial<Figurine>): Promise<void> {
  if (ids.length === 0) return
  const plainData = toPlainObject(data)
  const now = new Date().toISOString()
  // PostgREST 批量更新：使用 id=in.(...) 一次更新多条记录
  await apiPatch('/figurines' + buildQuery({ id: `in.(${ids.join(',')})` }), {
    ...toDB(plainData),
    updated_at: now,
  })
}

export async function clearAllFigurines(): Promise<void> {
  await apiDel('/figurines')
}

export async function importFigurine(figurine: Figurine): Promise<void> {
  const data = toPlainObject(figurine)
  await apiPost('/figurines', {
    id: data.id,
    ...toDB(data),
    created_at: new Date(data.createdAt).toISOString(),
    updated_at: new Date(data.updatedAt).toISOString(),
  })
}