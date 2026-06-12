-- weekly モード用: 曜日ごとの時刻テンプレート
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS weekly_times jsonb NOT NULL DEFAULT '{}';

-- slot_mode の CHECK 制約に 'weekly' を追加
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_slot_mode_check;
ALTER TABLE system_settings ADD CONSTRAINT system_settings_slot_mode_check
  CHECK (slot_mode IN ('fixed', 'custom', 'weekly'));
