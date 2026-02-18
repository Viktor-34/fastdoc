import { ReactNode, useState } from 'react';
import { GripVertical, Plus, Copy, Trash2 } from 'lucide-react';

interface BlockChromeProps {
  children: ReactNode;
  isSelected?: boolean;
  isDragging?: boolean;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  className?: string;
  showControls?: boolean;
}

/**
 * Унифицированная обертка для всех блоков редактора
 * Предоставляет кнопки добавления, дублирования, удаления и drag handle
 */
export function BlockChrome({
  children,
  isSelected = false,
  isDragging = false,
  onAddAbove,
  onAddBelow,
  onDuplicate,
  onDelete,
  onDragStart,
  className = '',
  showControls = true,
}: BlockChromeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Показывать контролы при наведении или выделении
  const shouldShowControls = showControls && (isHovered || isSelected);

  return (
    <div
      className={`block-chrome relative ${isSelected ? 'block-chrome--selected' : ''} ${isDragging ? 'block-chrome--dragging' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Контролы слева: Drag handle */}
      {shouldShowControls && onDragStart && (
        <div className="block-chrome__drag-handle">
          <button
            type="button"
            className="block-chrome__button block-chrome__button--drag"
            onMouseDown={onDragStart}
            aria-label="Переместить блок"
            title="Переместить блок"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Контролы справа: Дублировать и Удалить */}
      {shouldShowControls && (onDuplicate || onDelete) && (
        <div className="block-chrome__actions">
          {onDuplicate && (
            <button
              type="button"
              className="block-chrome__button block-chrome__button--action"
              onClick={onDuplicate}
              aria-label="Дублировать блок"
              title="Дублировать блок"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="block-chrome__button block-chrome__button--action block-chrome__button--danger"
              onClick={onDelete}
              aria-label="Удалить блок"
              title="Удалить блок"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Кнопка добавления блока сверху */}
      {shouldShowControls && onAddAbove && (
        <button
          type="button"
          className="block-chrome__add-button block-chrome__add-button--top"
          onClick={onAddAbove}
          aria-label="Добавить блок выше"
          title="Добавить блок выше"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      {/* Основной контент блока */}
      <div className="block-chrome__content">
        {children}
      </div>

      {/* Кнопка добавления блока снизу */}
      {shouldShowControls && onAddBelow && (
        <button
          type="button"
          className="block-chrome__add-button block-chrome__add-button--bottom"
          onClick={onAddBelow}
          aria-label="Добавить блок ниже"
          title="Добавить блок ниже"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}



