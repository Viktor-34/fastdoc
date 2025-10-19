import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

/* Конфигурация одной карточки: заголовок, значение и необязательный бейдж. */
interface SectionCard {
  title: string
  value: string
  badge?: {
    label: string
    icon?: LucideIcon
  }
}

/* Пропсы коллекции карточек: передаём массив и доп. классы. */
interface SectionCardsProps {
  cards: SectionCard[]
  className?: string
}

// Сетка карточек с ключевыми показателями и небольшим бейджем статуса.
export function SectionCards({ cards, className }: SectionCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {/* Рисуем карточку для каждого элемента массива. */}
      {cards.map(({ title, value, badge }) => (
        <Card
          key={title}
          className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
        >
          <div className="space-y-3">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{value}</p>
          </div>
          {badge ? (
            <Badge
              variant="outline"
              className="w-fit gap-1 rounded-full border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700"
            >
              {/* Если есть иконка, показываем её рядом с подписью бейджа. */}
              {badge.icon ? <badge.icon className="size-3.5" /> : null}
              {badge.label}
            </Badge>
          ) : null}
        </Card>
      ))}
    </div>
  )
}
