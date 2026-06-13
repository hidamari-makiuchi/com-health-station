'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addSlot, deleteSlot } from '@/lib/actions/slots'
import type { AvailableSlot } from '@/lib/types'
import { formatJP } from '@/lib/date-utils'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  initialSlots: AvailableSlot[]
  companyId?: string
}

export default function SlotManager({ initialSlots, companyId }: Props) {
  const [slots, setSlots] = useState(initialSlots)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!date || !time) return
    startTransition(async () => {
      const result = await addSlot(date, time, companyId || undefined)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      const newSlot: AvailableSlot = {
        id: crypto.randomUUID(),
        slot_date: date,
        slot_time: time,
        is_active: true,
        created_at: new Date().toISOString(),
      }
      setSlots((prev) =>
        [...prev, newSlot].sort((a, b) => {
          const d = a.slot_date.localeCompare(b.slot_date)
          return d !== 0 ? d : a.slot_time.localeCompare(b.slot_time)
        })
      )
      toast.success('スロットを追加しました')
      setDate('')
      setTime('')
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteSlot(id)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setSlots((prev) => prev.filter((s) => s.id !== id))
      toast.success('スロットを削除しました')
    })
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-sm mb-3">スロットを追加</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label htmlFor="slot-date" className="text-xs mb-1 block">日付</Label>
            <Input
              id="slot-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div>
            <Label htmlFor="slot-time" className="text-xs mb-1 block">時刻</Label>
            <Input
              id="slot-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11 text-base"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!date || !time || isPending}
          className="w-full gap-1"
        >
          <Plus className="w-4 h-4" />
          追加
        </Button>
      </div>

      {/* Slot list */}
      <div>
        <h2 className="font-semibold text-sm mb-3">登録済みスロット（{slots.length}件）</h2>
        {slots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            スロットがまだ登録されていません
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm">
                  {formatJP(slot.slot_date)}{' '}
                  <span className="font-medium">{slot.slot_time.substring(0, 5)}</span>
                </span>
                <button
                  onClick={() => handleDelete(slot.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  aria-label="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
