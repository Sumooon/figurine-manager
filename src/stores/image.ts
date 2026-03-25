import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDB } from '@/db/index'

export const useImageStore = defineStore('image', () => {
  const directoryHandle = ref<FileSystemDirectoryHandle | null>(null)
  const imageFiles = ref<Map<string, File>>(new Map())
  const thumbnailCache = ref<Map<string, Blob>>(new Map())
  const loading = ref(false)

  /**
   * 检查是否支持 File System Access API
   */
  function isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  /**
   * 选择图片目录
   */
  async function selectImageDirectory(): Promise<boolean> {
    try {
      // 优先使用 File System Access API（需要 HTTPS）
      if (isFileSystemAccessSupported()) {
        const handle = await (window as any).showDirectoryPicker()
        directoryHandle.value = handle

        // 保存句柄到 IndexedDB
        const db = await getDB()
        await db.put('directoryHandle', { id: 'imageDirectory', handle })

        // 扫描图片文件
        await scanImages()
        return true
      }

      // 降级方案：使用传统文件选择
      return await selectDirectoryFallback()
    } catch (error) {
      console.error('Failed to select directory:', error)
      return false
    }
  }

  /**
   * 降级方案：使用 input 选择文件夹
   */
  function selectDirectoryFallback(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.webkitdirectory = true
      input.multiple = true
      input.accept = 'image/*'

      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files
        if (!files || files.length === 0) {
          resolve(false)
          return
        }

        loading.value = true
        imageFiles.value.clear()

        for (const file of Array.from(files)) {
          if (isImageFile(file.name)) {
            // 提取文件名（去掉路径前缀）
            const filename = file.name
            imageFiles.value.set(filename, file)
          }
        }

        loading.value = false
        resolve(true)
      }

      input.click()
    })
  }

  /**
   * 扫描目录中的图片文件
   */
  async function scanImages(): Promise<void> {
    if (!directoryHandle.value) return

    loading.value = true
    imageFiles.value.clear()

    try {
      for await (const entry of (directoryHandle.value as any).values()) {
        if (entry.kind === 'file' && isImageFile(entry.name)) {
          const file = await entry.getFile()
          imageFiles.value.set(entry.name, file)
        }
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 解析图片文件名，提取手办序号
   */
  function parseImageName(filename: string): number[] {
    const name = filename.replace(/\.[^.]+$/, '')

    // 匹配 "1" 或 "1-5" 或 "10-15" 格式
    const match = name.match(/^(\d+)(?:-(\d+))?$/)
    if (!match) return []

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : start

    if (start > end) return []

    const indices: number[] = []
    for (let i = start; i <= end; i++) {
      indices.push(i)
    }
    return indices
  }

  /**
   * 获取图片缩略图
   */
  async function getThumbnail(filename: string): Promise<Blob | null> {
    // 检查缓存
    if (thumbnailCache.value.has(filename)) {
      return thumbnailCache.value.get(filename)!
    }

    const file = imageFiles.value.get(filename)
    if (!file) return null

    // 生成缩略图
    const thumbnail = await generateThumbnail(file)
    if (thumbnail) {
      thumbnailCache.value.set(filename, thumbnail)

      // 保存到 IndexedDB
      const db = await getDB()
      await db.put('imageCache', { id: filename, thumbnail, originalSize: file.size })
    }

    return thumbnail
  }

  /**
   * 生成缩略图
   */
  async function generateThumbnail(file: File, size: number = 200): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext('2d')!
        const scale = Math.min(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (size - w) / 2
        const y = (size - h) / 2

        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, x, y, w, h)

        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
      }
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 获取原图 URL
   */
  function getImageUrl(filename: string): string | null {
    const file = imageFiles.value.get(filename)
    return file ? URL.createObjectURL(file) : null
  }

  /**
   * 恢复目录句柄（仅支持 HTTPS 环境）
   */
  async function restoreDirectoryHandle(): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
      return false
    }

    try {
      const db = await getDB()
      const stored = await db.get('directoryHandle', 'imageDirectory')

      if (stored?.handle) {
        // 验证权限
        const permission = await (stored.handle as any).queryPermission()
        if (permission === 'granted') {
          directoryHandle.value = stored.handle
          await scanImages()
          return true
        }
      }
    } catch (error) {
      console.error('Failed to restore directory handle:', error)
    }
    return false
  }

  return {
    directoryHandle,
    imageFiles,
    thumbnailCache,
    loading,
    isFileSystemAccessSupported,
    selectImageDirectory,
    scanImages,
    parseImageName,
    getThumbnail,
    getImageUrl,
    restoreDirectoryHandle
  }
})

function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}