-- ステータスに completed / no_show を追加
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- メモ欄を追加
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes text;
