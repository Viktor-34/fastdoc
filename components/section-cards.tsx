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
          className="flex flex-col gap-4 rounded-xl border-0 bg-white px-[21px] py-[17px] shadow-[0_1px_1px_0_rgba(0,0,0,0.06),_0_0_1px_0_rgba(0,0,0,0.3)]"
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium tracking-tight text-[#737373]">{title}</p>
            <p className="text-2xl font-semibold leading-[1.33] text-[#0F172B] tabular-nums">{value}</p>
          </div>
          {badge ? (
            <Badge
              variant="outline"
              className="w-fit items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-[13px] py-[5px] text-[11px] font-medium leading-[1.33] text-[#404040]"
            >
              {/* Если есть иконка, показываем её рядом с подписью бейджа. */}
              {badge.icon ? <badge.icon className="size-3 text-[#FF5929]" /> : null}
              {badge.label}
            </Badge>
          ) : null}
        </Card>
      ))}
    </div>
  )
}
