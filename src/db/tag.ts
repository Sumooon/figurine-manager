import { v4 as uuidv4 } from 'uuid'
import { apiGet, apiPost, apiPatch, apiDel, buildQuery, toPlainObject } from './index'
import type { Tag } from '@/types'

function fromDB(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  }
}

function toDB(data: Partial<Tag>): any {
  const result: any = {}
  if (data.name !== undefined) result.name = data.name
  if (data.color !== undefined) result.color = data.color
  return result
}

export async function getAllTags(): Promise<Tag[]> {
  const rows = await apiGet<any[]>('/tags' + buildQuery({ order: 'name.asc' }))
  return rows.map(fromDB)
}

export async function createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
  const id = uuidv4()
  const plainData = toPlainObject(data)
  const row = await apiPost('/tags', {
    id,
    ...toDB(plainData),
  })
  return fromDB(row)
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<void> {
  const plainData = toPlainObject(data)
  await apiPatch('/tags' + buildQuery({ id: `eq.${id}` }), toDB(plainData))
}

export async function deleteTag(id: string): Promise<void> {
  await apiDel('/tags' + buildQuery({ id: `eq.${id}` }))
}

export async function clearAllTags(): Promise<void> {
  await apiDel('/tags')
}

export async function importTag(tag: Tag): Promise<void> {
  const data = toPlainObject(tag)
  await apiPost('/tags', {
    id: data.id,
    ...toDB(data),
  })
}