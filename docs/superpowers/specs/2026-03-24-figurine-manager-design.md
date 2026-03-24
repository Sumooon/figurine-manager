# 手办管理系统设计文档

> 创建日期：2026-03-24

## 1. 项目概述

### 1.1 背景

用户拥有 400+ 手办，分批次购买，需要一套系统来管理手办的购买、销售、利润计算等全流程信息。

### 1.2 目标

构建一个纯前端的 Web 应用，支持：
- 手办信息录入与管理
- 批次费用分摊计算
- 交易记录与买家管理
- 咸鱼平台集成
- 统计报表与导出

### 1.3 技术选型

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 | 3.4+ |
| 语言 | TypeScript | 5.0+ |
| 构建 | Vite | 5.0+ |
| UI | Element Plus | 2.x |
| 状态管理 | Pinia | 2.x |
| 路由 | Vue Router | 4.x |
| 本地存储 | IndexedDB (idb) | - |
| 导出 | ExcelJS | - |
| 日期 | dayjs | - |

### 1.4 运行环境

- Windows 系统浏览器（Chrome/Edge）
- 纯前端应用，打开即用
- 数据存储在本地 IndexedDB

---

## 2. 数据模型

### 2.1 实体关系图

```
Batch (批次) 1 ──────< N Figurine (手办) 1 ────── 0..1 Trade (交易)
```

### 2.2 Batch 批次

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | UUID |
| name | string | 是 | 批次名称，如"2024-01 日本代购" |
| imageRange | string | 是 | 图片范围，如"1-85" |
| totalShipping | number | 否 | 总运费（元） |
| totalTax | number | 否 | 总税费（元） |
| shareMode | 'average' \| 'custom' | 是 | 分摊方式 |
| createdAt | number | 是 | 创建时间戳 |

### 2.3 Figurine 手办

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | UUID |
| imageFile | string | 是 | 图片文件名，如"4-5.jpg" |
| imageIndex | number | 是 | 图片内序号（1-based） |
| name | string | 是 | 手办名称 |
| series | string | 否 | 系列/IP，如"VOCALOID" |
| tags | string[] | 否 | 标签列表 |
| batchId | string | 否 | 所属批次 ID |
| purchasePrice | number | 是 | 买入价（元） |
| shippingShare | number | 否 | 运费分摊（元） |
| taxShare | number | 否 | 税费分摊（元） |
| shareWeight | number | 否 | 自定义分摊权重 |
| totalCost | number | 是 | 总成本（自动计算） |
| status | 'pending' \| 'selling' \| 'sold' \| 'holding' | 是 | 状态 |
| remark | string | 否 | 备注 |
| createdAt | number | 是 | 创建时间戳 |
| updatedAt | number | 是 | 更新时间戳 |

**状态说明：**
- `pending`: 待录入
- `selling`: 在售
- `sold`: 已出
- `holding`: 囤货

### 2.4 Trade 交易

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | UUID |
| figurineId | string | 是 | 关联手办 ID |
| sellPrice | number | 是 | 卖出价（元） |
| xianyuLink | string | 否 | 咸鱼商品链接 |
| xianyuOrderId | string | 否 | 咸鱼订单号 |
| xianyuStatus | 'unpublished' \| 'selling' \| 'sold' \| 'offline' | 否 | 咸鱼状态 |
| xianyuBuyerId | string | 否 | 买家咸鱼 ID |
| xianyuFee | number | 否 | 咸鱼手续费（元） |
| actualIncome | number | 是 | 实际收入（扣除手续费） |
| profit | number | 是 | 利润（自动计算） |
| profitRate | number | 是 | 利润率（自动计算） |
| buyerName | string | 否 | 买家名称 |
| buyerContact | string | 否 | 买家联系方式 |
| soldAt | number | 是 | 卖出时间戳 |
| remark | string | 否 | 交易备注 |

### 2.5 Tag 标签

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | UUID |
| name | string | 是 | 标签名称 |
| color | string | 否 | 标签颜色 |

---

## 3. 功能设计

### 3.1 页面结构

```
┌─────────────────────────────────────────────────────┐
│ 顶部导航栏：标题 | 设置图片目录 | 导出              │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ 侧边栏   │           内容区域                       │
│          │                                          │
│ - 统计看板│                                          │
│ - 手办列表│                                          │
│ - 批次管理│                                          │
│ - 交易记录│                                          │
│ - 标签管理│                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 3.2 统计看板

**展示内容：**
- 总投入、总收益、总利润、平均利润率（四个统计卡片）
- 库存状态概览（在售/已出/囤货/待录入数量）
- 最近交易记录（快捷入口）

**数据来源：**
- 实时从 IndexedDB 计算
- 使用 Pinia computed 缓存

### 3.3 手办列表

**功能：**
- 筛选：名称搜索、状态、批次、系列
- 卡片展示：图片、名称、批次、系列、成本、状态、利润
- 批量操作：批量编辑状态、批量设置卖出价
- 利润率预警：低于阈值标红显示

**卡片信息：**
```
┌─────────────────┐
│     图片预览     │
├─────────────────┤
│ 初音未来 雪MIKU │
│ 批次1 | VOCALOID│
│ 成本: ¥280      │
│ 已出 ¥450       │
│ 利润: +¥170 (60.7%) │
└─────────────────┘
```

### 3.4 手办编辑表单

**字段分组：**

| 分组 | 字段 |
|------|------|
| 图片信息 | 图片文件、图片内序号 |
| 基本信息 | 名称、批次、系列/IP、状态、标签、备注 |
| 价格信息 | 买入价、运费分摊、税费分摊、总成本 |

**自动计算：**
- 总成本 = 买入价 + 运费分摊 + 税费分摊
- 选择批次后自动填充运费/税费分摊（可手动修改）

### 3.5 批次管理

**批次列表：**
- 表格展示：名称、图片范围、手办数、总运费、总税费、状态统计
- 操作：编辑、费用分摊、详情

**费用分摊功能：**
1. 输入总运费、总税费
2. 选择分摊方式：
   - 按数量均摊：每个手办分摊 = 总费用 / 手办数
   - 自定义比例：为每个手办设置权重，按权重分摊
3. 保存后自动更新所有手办的成本

**分摊计算公式：**
```
均摊模式：
  shippingShare = totalShipping / count

自定义比例模式：
  shippingShare = totalShipping × (weight / totalWeight)
```

### 3.6 交易记录

**列表展示：**
- 手办、批次、成本、卖出价、利润、利润率、买家、卖出时间
- 支持日期范围筛选

**交易详情弹窗：**
- 手办信息、成本明细
- 卖出价、咸鱼手续费、实际收入
- 利润、利润率
- 买家信息、咸鱼信息

### 3.7 咸鱼集成

**咸鱼字段：**
- 商品链接、订单号
- 发布价、手续费（自动计算约 0.6%）
- 咸鱼状态（未发布/在售中/已售出/已下架）
- 买家咸鱼 ID

**利润计算更新：**
```
咸鱼手续费 = 成交价 × 0.6% (最低 0.1 元)
实际收入 = 卖出价 - 咸鱼手续费
实际利润 = 实际收入 - 总成本
实际利润率 = 实际利润 / 总成本 × 100%
```

**快捷功能：**
- 复制商品链接
- 打开咸鱼链接
- 批量发布（生成发布文案）
- 批量下架

**发布文案生成：**
根据手办信息自动生成咸鱼发布文案模板：
```
【手办名称】
📦 状态：全新未拆，盒况良好
✨ 系列：系列名
💰 入手价xxx，现特价出！
📍 发货：包全国包邮
```

### 3.8 导出功能

**导出内容：**
- 手办列表
- 交易记录
- 批次汇总
- 统计报表

**导出格式：**
- Excel (.xlsx)
- CSV
- JSON（数据备份）

---

## 4. 图片处理方案

### 4.1 图片访问流程

```
1. 用户点击"设置图片目录"
2. 调用 File System Access API showDirectoryPicker()
3. 用户选择图片文件夹
4. 系统扫描文件夹，解析图片命名
5. 存储目录句柄到 IndexedDB
6. 后续通过句柄访问图片
```

### 4.2 图片命名解析规则

| 命名格式 | 解析结果 |
|----------|----------|
| `1.jpg` | 1 个手办，序号 1 |
| `4-5.jpg` | 2 个手办，序号 4 和 5 |
| `100-102.jpg` | 3 个手办，序号 100、101、102 |

### 4.3 图片预览

- 使用 `URL.createObjectURL()` 创建预览 URL
- 卡片使用缩略图（CSS 缩放）
- 详情页展示原图

---

## 5. 项目结构

```
figurine-manager/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── views/
│   │   ├── Dashboard.vue          # 统计看板
│   │   ├── FigurineList.vue       # 手办列表
│   │   ├── BatchManage.vue        # 批次管理
│   │   ├── TradeRecords.vue       # 交易记录
│   │   └── TagManage.vue          # 标签管理
│   ├── components/
│   │   ├── FigurineCard.vue       # 手办卡片
│   │   ├── FigurineForm.vue       # 手办编辑表单
│   │   ├── BatchForm.vue          # 批次表单
│   │   ├── TradeForm.vue          # 交易表单
│   │   ├── CostShareDialog.vue    # 费用分摊弹窗
│   │   └── ExportDialog.vue       # 导出弹窗
│   ├── stores/
│   │   ├── figurine.ts            # 手办状态
│   │   ├── batch.ts               # 批次状态
│   │   ├── trade.ts               # 交易状态
│   │   └── image.ts               # 图片目录状态
│   ├── db/
│   │   ├── index.ts               # IndexedDB 初始化
│   │   ├── figurine.ts            # 手办 CRUD
│   │   ├── batch.ts               # 批次 CRUD
│   │   └── trade.ts               # 交易 CRUD
│   ├── utils/
│   │   ├── export.ts              # 导出工具
│   │   ├── xianyu.ts              # 咸鱼相关
│   │   └── calculator.ts          # 利润计算
│   └── types/
│       └── index.ts               # 类型定义
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-03-24-figurine-manager-design.md
```

---

## 6. 开发计划

### Phase 1: 基础框架
- 项目初始化（Vite + Vue 3 + TypeScript）
- 路由配置
- Element Plus 集成
- IndexedDB 初始化

### Phase 2: 核心功能
- 手办 CRUD
- 批次 CRUD
- 图片目录选择与解析
- 手办列表页面

### Phase 3: 费用分摊
- 批次费用设置
- 分摊计算逻辑
- 批量更新成本

### Phase 4: 交易管理
- 交易记录 CRUD
- 咸鱼字段集成
- 利润计算

### Phase 5: 统计与导出
- 统计看板
- 导出功能
- 发布文案生成

---

## 7. 后续扩展

以下功能暂不实现，预留后续扩展：

1. **Excel 导入** - 支持从现有 Excel 表格导入数据
2. **数据云同步** - 支持数据云端备份
3. **多设备访问** - 支持多设备数据同步
4. **图片压缩** - 支持图片压缩存储
5. **价格趋势** - 记录价格变化，展示趋势图