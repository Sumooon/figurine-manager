import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getDB } from '@/db/index'

// 图片源类型
export type ImageSourceType = 'nas' | 'local'

export const useImageStore = defineStore('image', () => {
  const directoryHandle = ref<FileSystemDirectoryHandle | null>(null)
  const imageFiles = ref<Map<string, File>>(new Map())
  const imageUrls = ref<Set<string>>(new Set()) // NAS 图片 URL 列表
  const thumbnailCache = ref<Map<string, Blob>>(new Map())
  const loading = ref(false)

  // 图片源配置
  const sourceType = ref<ImageSourceType>('nas')
  const nasImageDirectory = ref<string>('/images') // NAS 图片目录路径

  /**
   * 检查是否支持 File System Access API
   */
  function isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window
  }

  /**
   * 设置图片源类型
   */
  function setSourceType(type: ImageSourceType) {
    sourceType.value = type
    imageFiles.value.clear()
    imageUrls.value.clear()
  }

  /**
   * 扫描 NAS 图片目录
   */
  async function scanNasImages(): Promise<boolean> {
    loading.value = true
    imageUrls.value.clear()

    try {
      // 获取图片列表
      const response = await fetch(nasImageDirectory.value + '/')
      if (!response.ok) {
        throw new Error('Failed to fetch image directory')
      }

      const html = await response.text()
      // 解析 nginx autoindex 的 HTML，提取图片文件名
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const links = doc.querySelectorAll('a')

      links.forEach(link => {
        const href = link.getAttribute('href')
        if (href && isImageFile(href)) {
          imageUrls.value.add(href)
        }
      })

      loading.value = false
      return imageUrls.value.size > 0
    } catch (error) {
      console.error('Failed to scan NAS images:', error)
      loading.value = false
      return false
    }
  }

  /**
   * 选择图片目录
   */
  async function selectImageDirectory(): Promise<boolean> {
    // NAS 模式：扫描目录
    if (sourceType.value === 'nas') {
      return await scanNasImages()
    }

    // 本地模式
    try {
      if (isFileSystemAccessSupported()) {
        const handle = await (window as any).showDirectoryPicker()
        directoryHandle.value = handle

        const db = await getDB()
        await db.put('directoryHandle', { id: 'imageDirectory', handle })

        await scanImages()
        return true
      }

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
            imageFiles.value.set(file.name, file)
          }
        }

        loading.value = false
        resolve(true)
      }

      input.click()
    })
  }

  /**
   * 扫描本地目录中的图片文件
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
    if (thumbnailCache.value.has(filename)) {
      return thumbnailCache.value.get(filename)!
    }

    // NAS 模式：从 URL 加载
    if (sourceType.value === 'nas') {
      const thumbnail = await generateThumbnailFromUrl(nasImageDirectory.value + '/' + filename)
      if (thumbnail) {
        thumbnailCache.value.set(filename, thumbnail)
      }
      return thumbnail
    }

    // 本地模式
    const file = imageFiles.value.get(filename)
    if (!file) return null

    const thumbnail = await generateThumbnail(file)
    if (thumbnail) {
      thumbnailCache.value.set(filename, thumbnail)

      const db = await getDB()
      await db.put('imageCache', { id: filename, thumbnail, originalSize: file.size })
    }

    return thumbnail
  }

  /**
   * 从 URL 生成缩略图
   */
  async function generateThumbnailFromUrl(url: string, size: number = 200): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
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
      img.src = url
    })
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
    // NAS 模式
    if (sourceType.value === 'nas') {
      return nasImageDirectory.value + '/' + filename
    }

    // 本地模式
    const file = imageFiles.value.get(filename)
    return file ? URL.createObjectURL(file) : null
  }

  /**
   * 获取所有图片文件名列表
   */
  const imageList = computed(() => {
    if (sourceType.value === 'nas') {
      return Array.from(imageUrls.value)
    }
    return Array.from(imageFiles.value.keys())
  })

  /**
   * 恢复目录句柄（仅支持 HTTPS 环境）
   */
  async function restoreDirectoryHandle(): Promise<boolean> {
    if (sourceType.value === 'nas') {
      return await scanNasImages()
    }

    if (!isFileSystemAccessSupported()) {
      return false
    }

    try {
      const db = await getDB()
      const stored = await db.get('directoryHandle', 'imageDirectory')

      if (stored?.handle) {
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
    imageUrls,
    thumbnailCache,
    loading,
    sourceType,
    nasImageDirectory,
    imageList,
    isFileSystemAccessSupported,
    setSourceType,
    scanNasImages,
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