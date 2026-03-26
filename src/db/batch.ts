import { v4 as uuidv4 } from 'uuid'
import { apiGet, apiPost, apiPatch, apiDel, buildQuery, toPlainObject } from './index'
import type { Batch } from '@/types'

function fromDB(row: any): Batch {
  return {
    id: row.id,
    name: row.name,
    imageRange: row.image_range,
    totalShipping: parseFloat(row.total_shipping) || 0,
    totalTax: parseFloat(row.total_tax) || 0,
    shareMode: row.share_mode || 'average',
    createdAt: new Date(row.created_at).getTime(),
  }
}

function toDB(data: Partial<Batch>): any {
  const result: any = {}
  if (data.name !== undefined) result.name = data.name
  if (data.imageRange !== undefined) result.image_range = data.imageRange
  if (data.totalShipping !== undefined) result.total_shipping = data.totalShipping
  if (data.totalTax !== undefined) result.total_tax = data.totalTax
  if (data.shareMode !== undefined) result.share_mode = data.shareMode
  return result
}

export async function getAllBatches(): Promise<Batch[]> {
  const rows = await apiGet<any[]>('/batches' + buildQuery({ order: 'created_at.desc' }))
  return rows.map(fromDB)
}

export async function getBatchById(id: string): Promise<Batch | undefined> {
  const rows = await apiGet<any[]>('/batches' + buildQuery({ id: `eq.${id}` }))
  return rows[0] ? fromDB(rows[0]) : undefined
}

export async function createBatch(data: Omit<Batch, 'id' | 'createdAt'>): Promise<Batch> {
  const id = uuidv4()
  const plainData = toPlainObject(data)
  const row = await apiPost('/batches', {
    id,
    ...toDB(plainData),
    created_at: new Date().toISOString(),
  })
  return fromDB(row)
}

export async function updateBatch(id: string, data: Partial<Batch>): Promise<void> {
  const plainData = toPlainObject(data)
  await apiPatch('/batches' + buildQuery({ id: `eq.${id}` }), toDB(plainData))
}

export async function deleteBatch(id: string): Promise<void> {
  await apiDel('/batches' + buildQuery({ id: `eq.${id}` }))
}

export async function clearAllBatches(): Promise<void> {
  await apiDel('/batches')
}

export async function importBatch(batch: Batch): Promise<void> {
  const data = toPlainObject(batch)
  await apiPost('/batches', {
    id: data.id,
    ...toDB(data),
    created_at: new Date(data.createdAt).toISOString(),
  })
}