'use client';

import { useEffect, useState } from 'react';

/* Свойства поля заголовка: стартовое значение и обработчик изменения. */
interface TitleInputProps {
  initialTitle?: string;
  onChange: (value: string) => void;
}

// Поле ввода заголовка документа в редакторе.
export default function TitleInput({ initialTitle = '', onChange }: TitleInputProps) {
  const [value, setValue] = useState(initialTitle);

  // Следим за обновлением внешнего значения и синхронизируем стейт.
  useEffect(() => setValue(initialTitle), [initialTitle]);

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => {
        // Обновляем локальный стейт и уведомляем родителя о новом заголовке.
        setValue(event.target.value);
        onChange(event.target.value);
      }}
      placeholder="Название предложения"
      className="w-full rounded-xl border border-[var(--field-border)] bg-white px-4 py-2 text-lg font-semibold text-slate-800 shadow-sm transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
    />
  );
}
