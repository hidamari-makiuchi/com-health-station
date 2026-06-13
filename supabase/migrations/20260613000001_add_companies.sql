-- ============================================================
-- 会社（テナント）テーブル
-- ============================================================
CREATE TABLE companies (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text    NOT NULL,
  token      text    NOT NULL UNIQUE,  -- 公開URL用トークン（32文字乱数）
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_public_read" ON companies FOR SELECT USING (true);
CREATE POLICY "companies_admin_all"   ON companies FOR ALL    USING (auth.role() = 'authenticated');

-- ============================================================
-- 既存テーブルに company_id を追加
-- ============================================================
ALTER TABLE bookings        ADD COLUMN company_id uuid REFERENCES companies(id);
ALTER TABLE system_settings ADD COLUMN company_id uuid REFERENCES companies(id);
ALTER TABLE available_slots ADD COLUMN company_id uuid REFERENCES companies(id);
