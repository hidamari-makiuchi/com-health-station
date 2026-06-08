'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import BookingDetailModal from './BookingDetailModal'
import { BOOKING_STATUS_CONFIG, type Booking, type BookingStatus } from '@/lib/types'
import { formatJP } from '@/lib/date-utils'
import { Search, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  bookings: Booking[]
}

export default function BookingTable({ bookings: initial }: Props) {
  const [bookings, setBookings] = useState(initial)
  const [filter, setFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const filtered = bookings.filter((b) => {
    const q = filter.toLowerCase()
    return (
      b.user_name.toLowerCase().includes(q) ||
      b.contact.toLowerCase().includes(q) ||
      b.slot_date.includes(q) ||
      BOOKING_STATUS_CONFIG[b.status]?.label.includes(q)
    )
  })

  const handleUpdate = (id: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
    if (selectedBooking?.id === id) {
      setSelectedBooking((prev) => prev ? { ...prev, ...updates } : prev)
    }
  }

  return (
    <div>
      {/* 検索 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="名前・連絡先・日付・状態で検索"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {filter ? '条件に一致する予約が見つかりません' : '予約はまだありません'}
        </div>
      ) : (
        <>
          {/* Desktop テーブル */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">日時</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">お名前</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">連絡先</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">状態</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">備考</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">受付日</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatJP(b.slot_date)} {b.slot_time.substring(0, 5)}
                    </td>
                    <td className="px-4 py-3 font-medium">{b.user_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.contact_type === 'phone' ? '📞' : '📧'} {b.contact}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      <span className="line-clamp-1 text-xs">
                        {b.notes ? b.notes.substring(0, 50) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedBooking(b)}
                        className="h-7 w-7 p-0"
                        aria-label="詳細・編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile カード */}
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm">{b.user_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatJP(b.slot_date)} {b.slot_time.substring(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedBooking(b)}
                      className="h-7 w-7 p-0"
                      aria-label="詳細・編集"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {b.contact_type === 'phone' ? '📞' : '📧'} {b.contact}
                </p>
                {b.notes && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 bg-muted/40 rounded-md px-2 py-1">
                    {b.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground mt-3 text-right">
        {filtered.length} 件表示
      </p>

      <BookingDetailModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdate={(updates) => {
          if (selectedBooking) handleUpdate(selectedBooking.id, updates)
        }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CONFIG[status]
  return (
    <Badge
      variant={cfg.badgeVariant}
      className={cn('text-xs whitespace-nowrap', cfg.badgeVariant === 'outline' && cfg.color)}
    >
      {cfg.label}
    </Badge>
  )
}
