-- 固定時間帯モードに曜日設定を追加（0=日, 1=月, ..., 6=土）
-- デフォルトは平日（月〜金）
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS fixed_days int[] NOT NULL DEFAULT ARRAY[1,2,3,4,5];
