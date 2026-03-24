import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Batch, Figurine, Trade, Tag, ImageCache, DirectoryHandleCache } from '@/types'

interface FigurineDBSchema extends DBSchema {
  figurines: {
    key: string
    value: Figurine
    indexes: { 'by-batch': string; 'by-status': string }
  }
  batches: {
    key: string
    value: Batch
  }
  trades: {
    key: string
    value: Trade
    indexes: { 'by-figurine': string }
  }
  tags: {
    key: string
    value: Tag
  }
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
      // 手办表
      if (!db.objectStoreNames.contains('figurines')) {
        const figurineStore = db.createObjectStore('figurines', { keyPath: 'id' })
        figurineStore.createIndex('by-batch', 'batchId')
        figurineStore.createIndex('by-status', 'status')
      }

      // 批次表
      if (!db.objectStoreNames.contains('batches')) {
        db.createObjectStore('batches', { keyPath: 'id' })
      }

      // 交易表
      if (!db.objectStoreNames.contains('trades')) {
        const tradeStore = db.createObjectStore('trades', { keyPath: 'id' })
        tradeStore.createIndex('by-figurine', 'figurineId')
      }

      // 标签表
      if (!db.objectStoreNames.contains('tags')) {
        db.createObjectStore('tags', { keyPath: 'id' })
      }

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