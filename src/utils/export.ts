import ExcelJS from 'exceljs'
import type { Figurine, Trade, Batch } from '@/types'

/**
 * 导出为 Excel
 */
export async function exportToExcel(
  data: {
    figurines?: Figurine[]
    trades?: Trade[]
    batches?: Batch[]
  },
  filename: string = 'figurine-export'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()

  // 手办列表 Sheet
  if (data.figurines?.length) {
    const sheet = workbook.addWorksheet('手办列表')
    sheet.columns = [
      { header: '名称', key: 'name' },
      { header: '图片文件', key: 'imageFile' },
      { header: '系列', key: 'series' },
      { header: '状态', key: 'status' },
      { header: '买入价', key: 'purchasePrice' },
      { header: '运费分摊', key: 'shippingShare' },
      { header: '税费分摊', key: 'taxShare' },
      { header: '总成本', key: 'totalCost' },
      { header: '备注', key: 'remark' }
    ]
    sheet.addRows(data.figurines)
  }

  // 交易记录 Sheet
  if (data.trades?.length) {
    const sheet = workbook.addWorksheet('交易记录')
    sheet.columns = [
      { header: '手办ID', key: 'figurineId' },
      { header: '卖出价', key: 'sellPrice' },
      { header: '咸鱼手续费', key: 'xianyuFee' },
      { header: '实际收入', key: 'actualIncome' },
      { header: '利润', key: 'profit' },
      { header: '利润率', key: 'profitRate' },
      { header: '买家', key: 'buyerName' },
      { header: '卖出时间', key: 'soldAt' }
    ]
    sheet.addRows(data.trades)
  }

  // 批次 Sheet
  if (data.batches?.length) {
    const sheet = workbook.addWorksheet('批次')
    sheet.columns = [
      { header: '名称', key: 'name' },
      { header: '图片范围', key: 'imageRange' },
      { header: '总运费', key: 'totalShipping' },
      { header: '总税费', key: 'totalTax' }
    ]
    sheet.addRows(data.batches)
  }

  // 下载文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `${filename}.xlsx`)
}

/**
 * 导出为 JSON
 */
export function exportToJSON(
  data: object,
  filename: string = 'figurine-backup'
): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${filename}.json`)
}

/**
 * 导出为 CSV
 */
export function exportToCSV(
  items: object[],
  filename: string = 'figurine-export'
): void {
  if (!items.length) return

  const headers = Object.keys(items[0])
  const rows = [
    headers.join(','),
    ...items.map(item =>
      headers.map(h => {
        const val = (item as any)[h]
        return typeof val === 'string' && val.includes(',')
          ? `"${val}"`
          : val ?? ''
      }).join(',')
    )
  ]

  const csv = '\uFEFF' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * 下载 Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}