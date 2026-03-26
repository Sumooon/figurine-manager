import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { ImageCache, DirectoryHandleCache } from '@/types'

/**
 * 将数据转换为可存入 IndexedDB 的纯对象
 * 解决 Vue 响应式对象无法序列化的问题
 */
export function toPlainObject<T>(data: T): T {
  if (data === null || data === undefined) return data
  if (typeof data !== 'object') return data
  return JSON.parse(JSON.stringify(data))
}

// API 配置
export const API_BASE = 'http://192.168.31.18:3000'

// 通用请求方法
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

// GET 请求
export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path)
}

// POST 请求
export async function apiPost<T>(path: string, data: any): Promise<T> {
  const result = await request<T[]>(path, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return result[0]
}

// PATCH 请求
export async function apiPatch<T>(path: string, data: any): Promise<T> {
  const result = await request<T[]>(path, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return result[0]
}

// DELETE 请求
export async function apiDel(path: string): Promise<void> {
  await request(path, { method: 'DELETE' })
}

// 查询参数构建
export function buildQuery(params: Record<string, string>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value)
  })
  return searchParams.toString() ? '?' + searchParams.toString() : ''
}

// ========== 以下保留 IndexedDB 用于图片缓存 ==========

interface FigurineDBSchema extends DBSchema {
  imageCache: {
    key: string
    value: ImageCache
  }
  directoryHandle: {
    key: string
    value: DirectoryHandleCache
  }
}

const DB_NAME = 'figurine-manager'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<FigurineDBSchema> | null = null

export async function getDB(): Promise<IDBPDatabase<FigurineDBSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FigurineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 图片缓存表
      if (!db.objectStoreNames.contains('imageCache')) {
        db.createObjectStore('imageCache', { keyPath: 'id' })
      }

      // 目录句柄表
      if (!db.objectStoreNames.contains('directoryHandle')) {
        db.createObjectStore('directoryHandle', { keyPath: 'id' })
      }
    }
  })

  return dbInstance
}