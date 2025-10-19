import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import CodeBlock from '@tiptap/extension-code-block';
import type { Attributes } from '@tiptap/core';

// Значения отступов по умолчанию, которые пробрасываем в узлы.
type PaddingDefaults = { top: number; bottom: number };

// Вытаскиваем числовое значение из строки вида "12px".
function parsePx(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : 0;
}

// Приводим переданное значение к числу или возвращаем fallback.
function coercePadding(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

// Собираем CSS-строку, сбрасываем margin и добавляем padding.
function buildStyle(styleValue: unknown, top: number, bottom: number) {
  const parts: string[] = [];
  if (typeof styleValue === 'string' && styleValue.trim().length > 0) {
    parts.push(styleValue.trim());
  }
  parts.push('margin:0');
  parts.push('margin-block-start:0');
  parts.push('margin-block-end:0');
  parts.push('margin-inline-start:0');
  parts.push('margin-inline-end:0');
  parts.push(`padding-top:${top}px`);
  parts.push(`padding-bottom:${bottom}px`);
  return parts.join(';');
}

// Удаляем paddingTop/paddingBottom из атрибутов и переносим в style.
function stripPaddingAttributes<T extends Record<string, any>>(HTMLAttributes: T, defaults: PaddingDefaults) {
  const { paddingTop, paddingBottom, style, ...rest } = HTMLAttributes;
  const topValue = coercePadding(paddingTop, defaults.top);
  const bottomValue = coercePadding(paddingBottom, defaults.bottom);
  const mergedStyle = buildStyle(style, topValue, bottomValue);
  return { attrs: rest, style: mergedStyle };
}

// Конфиг атрибутов для Tiptap node (умеет парсить из HTML).
function paddingAttributes(defaults: PaddingDefaults) {
  return {
    paddingTop: {
      default: defaults.top,
      parseHTML: (element: HTMLElement) => {
        const value = parsePx(element.style.paddingTop);
        return Number.isFinite(value) ? value : defaults.top;
      },
    },
    paddingBottom: {
      default: defaults.bottom,
      parseHTML: (element: HTMLElement) => {
        const value = parsePx(element.style.paddingBottom);
        return Number.isFinite(value) ? value : defaults.bottom;
      },
    },
  } satisfies Attributes;
}

const DEFAULT_TEXT_PADDING: PaddingDefaults = { top: 8, bottom: 8 };

// Параграф с управляемым padding.
export const ParagraphWithPadding = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...paddingAttributes(DEFAULT_TEXT_PADDING),
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = stripPaddingAttributes(HTMLAttributes, DEFAULT_TEXT_PADDING);
    return ['p', { ...attrs, style }, 0];
  },
});

// Заголовок с padding.
export const HeadingWithPadding = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...paddingAttributes(DEFAULT_TEXT_PADDING),
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const tag = hasLevel ? `h${node.attrs.level}` : this.options.levels[0];
    const { attrs, style } = stripPaddingAttributes(HTMLAttributes, DEFAULT_TEXT_PADDING);
    const { level, ...rest } = attrs as Record<string, any>;
    return [tag, { ...rest, style }, 0];
  },
});

// Маркированный список с padding.
export const BulletListWithPadding = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...paddingAttributes(DEFAULT_TEXT_PADDING),
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = stripPaddingAttributes(HTMLAttributes, DEFAULT_TEXT_PADDING);
    return ['ul', { ...attrs, style }, 0];
  },
});

// Нумерованный список с padding.
export const OrderedListWithPadding = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...paddingAttributes(DEFAULT_TEXT_PADDING),
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = stripPaddingAttributes(HTMLAttributes, DEFAULT_TEXT_PADDING);
    return ['ol', { ...attrs, style }, 0];
  },
});

// Кодовый блок с padding и поддержкой языка.
export const CodeBlockWithPadding = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...paddingAttributes(DEFAULT_TEXT_PADDING),
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = stripPaddingAttributes(HTMLAttributes, DEFAULT_TEXT_PADDING);
    const { language, class: className, ...rest } = attrs as Record<string, any>;
    const preAttrs: Record<string, any> = { ...rest, style };
    if (className) preAttrs.class = className;
    if (language) preAttrs['data-language'] = language;
    const codeAttrs = language ? { class: `language-${language}` } : {};
    return ['pre', preAttrs, ['code', codeAttrs, 0]];
  },
});

export function applyPaddingToNodeHTMLAttributes(HTMLAttributes: Record<string, any>, defaults: PaddingDefaults) {
  const { attrs, style } = stripPaddingAttributes(HTMLAttributes, defaults);
  return { attrs, style };
}

// Вспомогательная функция для других расширений.
export function paddingAttributeConfig(defaultTop = 8, defaultBottom = 8): Attributes {
  return paddingAttributes({ top: defaultTop, bottom: defaultBottom });
}
