-- ============================================================
-- みんなの保健室ひだまり - 相談予約システム初期スキーマ
-- ============================================================

-- system_settings: 予約システムの設定（常に1行）
CREATE TABLE IF NOT EXISTS system_settings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  advance_days int         NOT NULL DEFAULT 5,
  slot_mode   text        NOT NULL DEFAULT 'fixed'
                          CHECK (slot_mode IN ('fixed', 'custom')),
  fixed_times text[]      NOT NULL DEFAULT ARRAY['10:00', '11:00', '14:00', '15:00'],
  updated_at  timestamptz DEFAULT now()
);

INSERT INTO system_settings (advance_days, slot_mode, fixed_times)
VALUES (5, 'fixed', ARRAY['10:00', '11:00', '14:00', '15:00'])
ON CONFLICT DO NOTHING;

-- available_slots: カスタムモード時の個別スロット
CREATE TABLE IF NOT EXISTS available_slots (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date  date        NOT NULL,
  slot_time  time        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (slot_date, slot_time)
);

-- bookings: 予約データ
CREATE TABLE IF NOT EXISTS bookings (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date    date        NOT NULL,
  slot_time    time        NOT NULL,
  user_name    text        NOT NULL,
  contact      text        NOT NULL,
  contact_type text        NOT NULL CHECK (contact_type IN ('phone', 'email')),
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE system_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;

-- system_settings: 誰でも読める、管理者のみ更新
CREATE POLICY "system_settings_read"   ON system_settings FOR SELECT USING (true);
CREATE POLICY "system_settings_update" ON system_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- available_slots: 誰でも読める、管理者のみ変更
CREATE POLICY "available_slots_read"   ON available_slots FOR SELECT USING (true);
CREATE POLICY "available_slots_admin"  ON available_slots FOR ALL    USING (auth.role() = 'authenticated');

-- bookings: 誰でも作成可、閲覧・変更は管理者のみ
CREATE POLICY "bookings_insert"        ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_admin_select"  ON bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "bookings_admin_update"  ON bookings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "bookings_admin_delete"  ON bookings FOR DELETE USING (auth.role() = 'authenticated');
