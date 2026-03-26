-- 手办管理数据库表结构

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建角色（PostgREST 需要）
CREATE ROLE web_anon NOLOGIN;
GRANT web_anon TO dev;

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 批次表
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  image_range VARCHAR(100) NOT NULL,
  total_shipping DECIMAL(10, 2) DEFAULT 0,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  share_mode VARCHAR(20) DEFAULT 'average',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 手办表
CREATE TABLE IF NOT EXISTS figurines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_file VARCHAR(500) NOT NULL,
  image_index INTEGER NOT NULL,
  name VARCHAR(200) NOT NULL,
  series VARCHAR(200),
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping_share DECIMAL(10, 2) DEFAULT 0,
  tax_share DECIMAL(10, 2) DEFAULT 0,
  share_weight INTEGER DEFAULT 1,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 手办标签关联表（多对多）
CREATE TABLE IF NOT EXISTS figurine_tags (
  figurine_id UUID REFERENCES figurines(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (figurine_id, tag_id)
);

-- 交易表
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  figurine_id UUID NOT NULL REFERENCES figurines(id) ON DELETE CASCADE,
  sell_price DECIMAL(10, 2) NOT NULL,
  xianyu_link VARCHAR(500),
  xianyu_order_id VARCHAR(100),
  xianyu_status VARCHAR(20),
  xianyu_buyer_id VARCHAR(100),
  xianyu_fee DECIMAL(10, 2) DEFAULT 0,
  actual_income DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  profit_rate DECIMAL(10, 2) NOT NULL,
  buyer_name VARCHAR(100),
  buyer_contact VARCHAR(200),
  sold_at TIMESTAMPTZ DEFAULT NOW(),
  remark TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_figurines_batch_id ON figurines(batch_id);
CREATE INDEX IF NOT EXISTS idx_figurines_status ON figurines(status);
CREATE INDEX IF NOT EXISTS idx_trades_figurine_id ON trades(figurine_id);
CREATE INDEX IF NOT EXISTS idx_figurine_tags_figurine_id ON figurine_tags(figurine_id);
CREATE INDEX IF NOT EXISTS idx_figurine_tags_tag_id ON figurine_tags(tag_id);

-- 授权
GRANT ALL ON ALL TABLES IN SCHEMA public TO web_anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO web_anon;
GRANT USAGE ON SCHEMA public TO web_anon;