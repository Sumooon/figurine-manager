import type { Figurine } from '@/types'

/**
 * 生成咸鱼发布文案
 */
export function generateXianyuDescription(figurine: Figurine): string {
  const lines: string[] = []

  lines.push(`【${figurine.name}】`)
  lines.push('📦 状态：全新未拆，盒况良好')

  if (figurine.series) {
    lines.push(`✨ 系列：${figurine.series}`)
  }

  lines.push(`💰 入手价${figurine.totalCost}元，现特价出！`)
  lines.push('📍 发货：包全国包邮')

  return lines.join('\n')
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * 打开链接
 */
export function openLink(url: string): void {
  if (url) {
    window.open(url, '_blank')
  }
}

/**
 * 验证咸鱼链接
 */
export function isValidXianyuLink(url: string): boolean {
  return url.includes('goofish.com') || url.includes('2.taobao.com')
}