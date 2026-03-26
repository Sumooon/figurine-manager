import { v4 as uuidv4 } from 'uuid'
import { apiGet, apiPost, apiPatch, apiDel, buildQuery, toPlainObject } from './index'
import type { Figurine, FigurineStatus } from '@/types'

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
    shareWeight: row.share_weight || 1,
    totalCost: parseFloat(row.total_cost) || 0,
    status: row.status,
    remark: row.remark,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

// 前端字段 -> 数据库字段
function toDB(data: Partial<Figurine>): any {
  const result: any = {}
  if (data.imageFile !== undefined) result.image_file = data.imageFile
  if (data.imageIndex !== undefined) result.image_index = data.imageIndex
  if (data.name !== undefined) result.name = data.name
  if (data.series !== undefined) result.series = data.series
  if (data.batchId !== undefined) result.batch_id = data.batchId
  if (data.purchasePrice !== undefined) result.purchase_price = data.purchasePrice
  if (data.shippingShare !== undefined) result.shipping_share = data.shippingShare
  if (data.taxShare !== undefined) result.tax_share = data.taxShare
  if (data.shareWeight !== undefined) result.share_weight = data.shareWeight
  if (data.totalCost !== undefined) result.total_cost = data.totalCost
  if (data.status !== undefined) result.status = data.status
  if (data.remark !== undefined) result.remark = data.remark
  if (data.tagIds !== undefined) result.tag_ids = data.tagIds
  return result
}

export async function getAllFigurines(): Promise<Figurine[]> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ order: 'created_at.desc' }))
  return rows.map(fromDB)
}

export async function getFigurineById(id: string): Promise<Figurine | undefined> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ id: `eq.${id}` }))
  return rows[0] ? fromDB(rows[0]) : undefined
}

export async function getFigurinesByBatch(batchId: string): Promise<Figurine[]> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ batch_id: `eq.${batchId}` }))
  return rows.map(fromDB)
}

export async function getFigurinesByStatus(status: FigurineStatus): Promise<Figurine[]> {
  const rows = await apiGet<any[]>('/figurines' + buildQuery({ status: `eq.${status}` }))
  return rows.map(fromDB)
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
  const plainData = toPlainObject(data)
  const now = new Date().toISOString()
  for (const id of ids) {
    await apiPatch('/figurines' + buildQuery({ id: `eq.${id}` }), {
      ...toDB(plainData),
      updated_at: now,
    })
  }
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