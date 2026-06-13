'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  updateBookingStatus,
  updateBookingDateTime,
  updateBookingNotes,
  getAvailableTimesForDate,
} from '@/lib/actions/booking'
import {
  BOOKING_STATUS_CONFIG,
  type Booking,
  type BookingStatus,
} from '@/lib/types'
import { formatJP } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface Props {
  booking: Booking | null
  open: boolean
  onClose: () => void
  onUpdate: (updated: Partial<Booking>) => void
}

const STATUSES = Object.entries(BOOKING_STATUS_CONFIG) as [BookingStatus, (typeof BOOKING_STATUS_CONFIG)[BookingStatus]][]

export default function BookingDetailModal({ booking, open, onClose, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition()

  const [status, setStatus] = useState<BookingStatus>('pending')
  const [notes, setNotes] = useState('')
  const [slotDate, setSlotDate] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)

  useEffect(() => {
    if (booking) {
      setStatus(booking.status)
      setNotes(booking.notes ?? '')
      setSlotDate(booking.slot_date)
      setSlotTime(booking.slot_time.substring(0, 5))
      setAvailableTimes([])
    }
  }, [booking])

  const canChangeDateTime = booking?.status === 'pending'

  const handleDateChange = async (date: string) => {
    setSlotDate(date)
    setSlotTime('')
    if (!date || !booking) return
    setLoadingTimes(true)
    try {
      const times = await getAvailableTimesForDate(date, booking.company_id ?? undefined, booking.id)
      setAvailableTimes(times)
    } finally {
      setLoadingTimes(false)
    }
  }

  const handleSaveStatus = () => {
    if (!booking || status === booking.status) return
    startTransition(async () => {
      const result = await updateBookingStatus(booking.id, status)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('ステータスを更新しました')
      onUpdate({ status })
    })
  }

  const handleSaveDateTime = () => {
    if (!booking || !slotDate || !slotTime) return
    if (slotDate === booking.slot_date && slotTime === booking.slot_time.substring(0, 5)) return
    startTransition(async () => {
      const result = await updateBookingDateTime(booking.id, slotDate, slotTime)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('日時を更新しました')
      onUpdate({ slot_date: slotDate, slot_time: slotTime })
    })
  }

  const handleSaveNotes = () => {
    if (!booking) return
    startTransition(async () => {
      const result = await updateBookingNotes(booking.id, notes)
      if ('error' in result) { toast.error(result.error); return }
      toast.success('メモを保存しました')
      onUpdate({ notes })
    })
  }

  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">予約詳細</DialogTitle>
        </DialogHeader>

        {/* 基本情報 */}
        <div className="bg-muted/40 rounded-xl p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">お名前</span>
            <span className="font-medium">{booking.user_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">連絡先</span>
            <span>{booking.contact_type === 'phone' ? '📞' : '📧'} {booking.contact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">受付日</span>
            <span className="text-muted-foreground">{new Date(booking.created_at).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        <Separator />

        {/* ステータス変更 */}
        <div>
          <Label className="text-sm font-semibold block mb-2">ステータス</Label>
          <div className="grid grid-cols-1 gap-1.5">
            {STATUSES.map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-all',
                  status === key
                    ? 'border-primary bg-accent font-medium'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  status === key ? 'bg-primary' : 'bg-muted-foreground/40'
                )} />
                {cfg.label}
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-2"
            size="sm"
            onClick={handleSaveStatus}
            disabled={isPending || status === booking.status}
          >
            ステータスを更新
          </Button>
        </div>

        <Separator />

        {/* 日時変更 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">日時</Label>
            {!canChangeDateTime && (
              <span className="text-xs text-muted-foreground">仮予約のみ変更可</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">日付</Label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={!canChangeDateTime}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">時刻</Label>
              {canChangeDateTime && availableTimes.length > 0 ? (
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="">選択</option>
                  {availableTimes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="time"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  disabled={!canChangeDateTime}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
              {loadingTimes && (
                <p className="text-xs text-muted-foreground mt-0.5">読込中...</p>
              )}
            </div>
          </div>
          {canChangeDateTime && (
            <Button
              className="w-full"
              size="sm"
              onClick={handleSaveDateTime}
              disabled={
                isPending ||
                !slotDate ||
                !slotTime ||
                (slotDate === booking.slot_date && slotTime === booking.slot_time.substring(0, 5))
              }
            >
              日時を更新
            </Button>
          )}
          {!canChangeDateTime && (
            <p className="text-sm text-foreground font-medium">
              {formatJP(booking.slot_date)} {booking.slot_time.substring(0, 5)}
            </p>
          )}
        </div>

        <Separator />

        {/* メモ */}
        <div>
          <Label className="text-sm font-semibold block mb-2">メモ</Label>
          <p className="text-xs text-muted-foreground mb-2">
            連絡内容・相談結果などを記録します。一覧の備考欄に先頭50文字が表示されます。
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="連絡をとった結果、相談内容のメモなど..."
            className="min-h-[120px] text-base resize-none"
          />
          <Button
            className="w-full mt-2"
            size="sm"
            onClick={handleSaveNotes}
            disabled={isPending || notes === (booking.notes ?? '')}
          >
            メモを保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
